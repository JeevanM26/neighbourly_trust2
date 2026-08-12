import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const client = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: cats } = await client.from('service_categories').select('*').eq('name_en', 'Electrician').limit(1);
  const catId = cats[0].id;

  console.log("Distance 15km:");
  let res = await client.rpc('nearby_workers', {
    p_category_id: catId,
    p_lat: 13.9381,
    p_lng: 75.5745,
    p_max_distance_km: 15
  });
  console.log(res.data, res.error);

  console.log("Distance 100000km:");
  res = await client.rpc('nearby_workers', {
    p_category_id: catId,
    p_lat: 13.9381,
    p_lng: 75.5745,
    p_max_distance_km: 100000
  });
  console.log(res.data, res.error);

  console.log("Try without max distance:");
  res = await client.rpc('nearby_workers', {
    p_category_id: catId,
    p_lat: 13.9381,
    p_lng: 75.5745
  });
  console.log(res.data, res.error);
}

main();
