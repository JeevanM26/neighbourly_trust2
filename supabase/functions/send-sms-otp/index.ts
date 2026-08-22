import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Payload from Supabase Auth Send SMS Hook or custom trigger
    const phone = payload?.user?.phone || payload?.phone;
    const otp = payload?.sms?.otp || payload?.otp;

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone number and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract 10-digit Indian mobile number (remove +91 / non-digits)
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Invalid 10-digit Indian phone number" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!FAST2SMS_API_KEY) {
      console.warn(`[Fast2SMS Demo] Missing FAST2SMS_API_KEY. Simulating OTP ${otp} to +91${cleanPhone}`);
      return new Response(
        JSON.stringify({ success: true, message: "Demo mode: OTP simulated", phone: cleanPhone }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Fast2SMS Bulk V2 OTP API
    const fast2smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: String(otp),
        numbers: cleanPhone,
      }),
    });

    const result = await fast2smsRes.json();
    console.log(`[Fast2SMS] Dispatched OTP to ${cleanPhone}:`, result);

    if (!fast2smsRes.ok || result?.return === false) {
      console.error("[Fast2SMS] Provider error:", result);
      return new Response(
        JSON.stringify({ error: result?.message || "Failed to send SMS via Fast2SMS" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result?.request_id, return: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Fast2SMS] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
