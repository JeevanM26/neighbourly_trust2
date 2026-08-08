import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw';
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
