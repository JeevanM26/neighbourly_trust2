import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rcvxvnfejbwvokwzcuav.supabase.co',
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'testworker99@example.com',
    password: 'password123'
  });
  console.log("Signup:", data, error);
}
main();
