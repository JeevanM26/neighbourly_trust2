import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

async function main() {
  const { data, error } = await supabase.from('service_categories').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
  } else {
    console.log('Categories:', JSON.stringify(data, null, 2));
  }
}
main();
