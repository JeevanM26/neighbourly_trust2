import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
