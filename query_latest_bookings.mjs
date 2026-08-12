import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

async function main() {
  const { data, error } = await supabase.from('bookings')
    .select('id, status, created_at, customer_lat, customer_lng, customer_location')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent Bookings:', JSON.stringify(data, null, 2));
}
main();
