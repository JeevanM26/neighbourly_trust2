import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw';
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
