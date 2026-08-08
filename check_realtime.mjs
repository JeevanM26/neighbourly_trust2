import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRealtime() {
  console.log("Setting up subscription to 'bookings' table...");
  const channel = supabase.channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        console.log('Realtime event received for bookings!', payload);
      }
    )
    .subscribe((status, err) => {
      console.log('Subscription status for bookings:', status);
      if (err) console.error('Subscription error:', err);
    });
  
  // Wait a bit to see if subscription connects
  await new Promise(res => setTimeout(res, 2000));
  
  // Check the channel state
  if (channel.state === 'joined') {
      console.log("Successfully joined Realtime channel for bookings!");
      // We can also query pg_publication_tables if anon role has access (it doesn't normally, but let's try via RPC if there's one, or just REST)
  }
  
  console.log("Setting up subscription to 'booking_offers' table...");
  const channel2 = supabase.channel('schema-db-changes-2')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'booking_offers' },
      (payload) => {
        console.log('Realtime event received for booking_offers!', payload);
      }
    )
    .subscribe((status, err) => {
      console.log('Subscription status for booking_offers:', status);
    });

  await new Promise(res => setTimeout(res, 2000));
  
  if (channel2.state === 'joined') {
      console.log("Successfully joined Realtime channel for booking_offers!");
  }
  
  process.exit(0);
}

checkRealtime();
