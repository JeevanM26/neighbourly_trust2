import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const client = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: authData } = await client.auth.verifyOtp({
    phone: '+919535024317',
    token: '123456',
    type: 'sms'
  });
  
  // Try calling dispatch_booking_offer manually to see if it exists
  const { error } = await client.rpc('dispatch_booking_offer', {
    p_booking_id: '883192b7-1779-46fb-9a85-e26344e33c70'
  });
  console.log("Manual dispatch:", error);

  const { data: check } = await client.from('bookings').select('status').eq('id', '883192b7-1779-46fb-9a85-e26344e33c70');
  console.log("Booking status:", check);
}

main();
