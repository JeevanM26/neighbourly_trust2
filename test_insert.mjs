import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw'
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
