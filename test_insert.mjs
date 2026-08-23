import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

async function main() {
  const { data, error } = await supabase.from('bookings').insert({
    customer_id: '4d205f94-1434-4d75-b474-b4bc78992fcc', // Dummy UUID
    category_id: 'general',
    customer_location: `SRID=4326;POINT(77.5 12.9)`,
    customer_lat: 12.9,
    customer_lng: 77.5,
    status: 'cancelled'
  }).select();
  
  console.log('Insert Result:', data);
  console.log('Insert Error:', error);
}
main();
