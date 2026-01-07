import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmSubscriptionRequest {
  email: string;
  name?: string;
}

// Generate a random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[confirm-newsletter-subscription] RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { email, name }: ConfirmSubscriptionRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[confirm-newsletter-subscription] Processing subscription for: ${email}`);

    // Check if already subscribed and confirmed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, name, is_confirmed, is_active")
      .eq("email", email)
      .single();

    if (existing) {
      if (existing.is_confirmed && existing.is_active) {
        return new Response(
          JSON.stringify({ error: "already_subscribed", message: "Este e-mail já está inscrito" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If exists but not confirmed, update with new token
      const confirmationToken = generateToken();
      
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          name: name || existing.name,
          confirmation_token: confirmationToken,
          is_active: false,
          is_confirmed: false,
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      // Send confirmation email
      await sendConfirmationEmail(resend, email, name, confirmationToken);

      return new Response(
        JSON.stringify({ message: "Confirmation email resent", email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new subscriber with confirmation token
    const confirmationToken = generateToken();

    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email,
        name: name || null,
        confirmation_token: confirmationToken,
        is_active: false,
        is_confirmed: false,
      });

    if (insertError) {
      console.error("[confirm-newsletter-subscription] Insert error:", insertError);
      throw insertError;
    }

    // Send confirmation email
    await sendConfirmationEmail(resend, email, name, confirmationToken);

    console.log(`[confirm-newsletter-subscription] Confirmation email sent to: ${email}`);

    return new Response(
      JSON.stringify({ message: "Confirmation email sent", email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[confirm-newsletter-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendConfirmationEmail(
  resend: any,
  email: string,
  name: string | undefined,
  token: string
): Promise<void> {
  const siteUrl = Deno.env.get("SITE_URL") || "https://vozdofato.lovable.app";
  const confirmUrl = `${siteUrl}/confirm-newsletter?token=${encodeURIComponent(token)}`;
  const displayName = name || "Leitor";

  await resend.emails.send({
    from: "Newsletter <onboarding@resend.dev>",
    to: [email],
    subject: "Confirme sua inscrição na Newsletter - Voz do Fato",
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
          <h2 style="color: #dc2626; margin-top: 0;">Olá, ${displayName}!</h2>
          <p style="color: #444;">
            Obrigado por se inscrever em nossa newsletter. Para confirmar sua inscrição e começar a receber nossas notícias, clique no botão abaixo:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Confirmar Inscrição
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Se você não solicitou esta inscrição, pode ignorar este e-mail.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${confirmUrl}" style="color: #dc2626; word-break: break-all;">${confirmUrl}</a>
          </p>
        </div>
        <div style="background: #f9f9f9; padding: 20px; text-align: center; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Voz do Fato. Todos os direitos reservados.
          </p>
        </div>
      </body>
      </html>
    `,
  });
}
