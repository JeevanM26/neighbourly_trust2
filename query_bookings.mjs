import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw'
);

async function main() {
  const { data, error } = await supabase.from('bookings').select('id, customer_location, customer_lat, customer_lng, status').order('created_at', { ascending: false }).limit(2);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Bookings:', JSON.stringify(data, null, 2));
  }
}
main();
