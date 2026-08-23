import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

async function main() {
  const { data, error } = await supabase.from('booking_offers').select('*').order('offered_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Offers:', JSON.stringify(data, null, 2));
  }
}
main();
