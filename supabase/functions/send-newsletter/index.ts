import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNewsletterRequest {
  subject: string;
  content: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-newsletter] RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("[send-newsletter] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin or editor role
    const { data: hasRole } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    const { data: hasEditorRole } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "editor"
    });

    if (!hasRole && !hasEditorRole) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, content }: SendNewsletterRequest = await req.json();

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "Subject and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-newsletter] Fetching active subscribers...");

    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("is_active", true);

    if (fetchError) {
      console.error("[send-newsletter] Error fetching subscribers:", fetchError);
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("[send-newsletter] No active subscribers found");
      return new Response(
        JSON.stringify({ message: "No active subscribers", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-newsletter] Sending to ${subscribers.length} subscribers`);

    let sentCount = 0;
    let errors: string[] = [];

    // Get the site URL for unsubscribe links
    const siteUrl = Deno.env.get("SITE_URL") || "https://vozdofato.lovable.app";

    // Send emails in batches to avoid rate limits
    for (const subscriber of subscribers) {
      try {
        const personalizedContent = content.replace(
          "{{name}}",
          subscriber.name || "Leitor"
        );

        // Create unsubscribe token (base64 encoded email)
        const unsubscribeToken = btoa(subscriber.email);
        const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

        await resend.emails.send({
          from: "Newsletter <onboarding@resend.dev>",
          to: [subscriber.email],
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Voz do Fato</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Newsletter</p>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none;">
                <h2 style="color: #dc2626; margin-top: 0;">${subject}</h2>
                <div style="color: #444;">
                  ${personalizedContent}
                </div>
              </div>
              <div style="background: #f9f9f9; padding: 20px; text-align: center; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
                  Você está recebendo este email porque se inscreveu em nossa newsletter.
                </p>
                <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} Voz do Fato. Todos os direitos reservados.
                </p>
                <p style="margin: 15px 0 0 0;">
                  <a href="${unsubscribeUrl}" style="color: #999; font-size: 11px; text-decoration: underline;">
                    Cancelar inscrição na newsletter
                  </a>
                </p>
              </div>
            </body>
            </html>
          `,
        });

        sentCount++;
        console.log(`[send-newsletter] Sent to ${subscriber.email}`);
      } catch (emailError: any) {
        console.error(`[send-newsletter] Failed to send to ${subscriber.email}:`, emailError);
        errors.push(subscriber.email);
      }
    }

    // Save campaign record
    const { error: campaignError } = await supabase
      .from("newsletter_campaigns")
      .insert({
        subject,
        content,
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        recipients_count: sentCount,
      });

    if (campaignError) {
      console.error("[send-newsletter] Error saving campaign:", campaignError);
    }

    console.log(`[send-newsletter] Complete. Sent: ${sentCount}, Failed: ${errors.length}`);

    return new Response(
      JSON.stringify({
        message: `Newsletter sent to ${sentCount} subscribers`,
        sent: sentCount,
        failed: errors.length,
        failedEmails: errors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-newsletter] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
