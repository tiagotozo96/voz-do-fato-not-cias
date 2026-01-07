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
      console.error("[unsubscribe-newsletter] No token provided");
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the token (base64 encoded email)
    let email: string;
    try {
      email = atob(token);
    } catch {
      console.error("[unsubscribe-newsletter] Invalid token format");
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[unsubscribe-newsletter] Processing unsubscribe for: ${email}`);

    // Find and update the subscriber
    const { data: subscriber, error: fetchError } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email)
      .single();

    if (fetchError || !subscriber) {
      console.error("[unsubscribe-newsletter] Subscriber not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Subscriber not found", email }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriber.is_active) {
      console.log("[unsubscribe-newsletter] Already unsubscribed");
      return new Response(
        JSON.stringify({ message: "Already unsubscribed", email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unsubscribe the user
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("[unsubscribe-newsletter] Update error:", updateError);
      throw updateError;
    }

    console.log(`[unsubscribe-newsletter] Successfully unsubscribed: ${email}`);

    return new Response(
      JSON.stringify({ message: "Successfully unsubscribed", email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[unsubscribe-newsletter] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
