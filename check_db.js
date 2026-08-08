const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error: pErr } = await supabase.from('worker_profiles').select('*');
  console.log('Worker Profiles:', profiles, pErr);
  
  const { data: cats, error: cErr } = await supabase.from('worker_categories').select('*');
  console.log('Worker Categories:', cats, cErr);
}

check();
