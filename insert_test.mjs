import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

async function main() {
  const existingId = '4d205f94-1434-4d75-b474-b4bc78992fcc'; // Jeevan M
  
  // Try inserting into worker_profiles
  const { error: wpErr } = await supabase.from('worker_profiles').insert({
    profile_id: existingId,
    is_online: true,
    avg_rating: 5.0,
    total_jobs: 0,
    location: 'SRID=4326;POINT(75.5745 13.9381)'
  });
  console.log("worker_profiles insert:", wpErr);
}
main();
