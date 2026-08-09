import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdnh2bmZlamJ3dm9rd3pjdWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTY3MDIsImV4cCI6MjEwMTA5MjcwMn0.WPwp8CeGuP8AIPejbe1i-fwkEJ4HtE0Ime3WJWHOvJw'
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
