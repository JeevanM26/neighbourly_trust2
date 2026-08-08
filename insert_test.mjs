import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw'
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
