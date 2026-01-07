import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      console.error("[verify-newsletter-subscription] No token provided");
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[verify-newsletter-subscription] Processing token verification`);

    // Find subscriber by confirmation token
    const { data: subscriber, error: fetchError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, is_confirmed")
      .eq("confirmation_token", token)
      .single();

    if (fetchError || !subscriber) {
      console.error("[verify-newsletter-subscription] Subscriber not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "invalid_token", message: "Token inválido ou expirado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (subscriber.is_confirmed) {
      console.log("[verify-newsletter-subscription] Already confirmed");
      return new Response(
        JSON.stringify({ message: "already_confirmed", email: subscriber.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Confirm the subscription
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        is_confirmed: true,
        is_active: true,
        confirmed_at: new Date().toISOString(),
        confirmation_token: null, // Clear the token after use
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("[verify-newsletter-subscription] Update error:", updateError);
      throw updateError;
    }

    console.log(`[verify-newsletter-subscription] Successfully confirmed: ${subscriber.email}`);

    return new Response(
      JSON.stringify({ message: "confirmed", email: subscriber.email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[verify-newsletter-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
