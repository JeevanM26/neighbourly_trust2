import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { worker_id } = await req.json();
    if (!worker_id) throw new Error('worker_id required');

    // Security Verification: Ensure the caller (customer) has an active or accepted booking with this worker
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, status')
      .eq('customer_id', user.id)
      .eq('worker_id', worker_id)
      .in('status', ['accepted', 'in_progress', 'completed'])
      .limit(1)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No active booking with this worker.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Since they are authorized, fetch the phone number using Service Role to bypass strict profile visibility if needed
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('phone')
      .eq('id', worker_id)
      .single();

    if (profileError || !profile) throw new Error('Worker not found');

    return new Response(JSON.stringify({ phone: profile.phone }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
