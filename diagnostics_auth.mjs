import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const workerClient = createClient(supabaseUrl, supabaseKey);

async function tryLogin(phone) {
  const otp = '123456';
  console.log(`Sending OTP to ${phone}...`);
  const { error: signInErr } = await workerClient.auth.signInWithOtp({ phone });
  if (signInErr) {
    console.error("signInErr:", signInErr);
    return null;
  }
  console.log(`Verifying OTP for ${phone}...`);
  const { data: authData, error: verifyErr } = await workerClient.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });
  if (verifyErr || !authData.session) {
    console.error("verifyErr:", verifyErr);
    return null;
  }
  return authData;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let authData = await tryLogin('+917975182162');
  if (!authData) {
    console.log("Sleeping 4 seconds...");
    await sleep(4000);
    authData = await tryLogin('917975182162');
  }
  
  if (!authData) {
    console.error("Failed to login with both formats.");
    return;
  }

  const workerId = authData.user.id;
  const phone = authData.user.phone;
  console.log(`Successfully logged in as worker. ID: ${workerId}`);

  // 1. Update Profile to worker
  const { error: pErr } = await workerClient.from('profiles').upsert({
    id: workerId,
    full_name: 'Test Worker 1',
    phone: phone,
    role: 'worker',
    language: 'en',
    consent_given: true
  });
  console.log("Profile update:", pErr ? pErr : 'OK');

  // 2. Update Worker Profile
  const { error: wpErr } = await workerClient.from('worker_profiles').upsert({
    profile_id: workerId,
    bio: 'I am a test worker',
    is_online: true,
    location: 'SRID=4326;POINT(75.5745 13.9381)',
    location_updated_at: new Date().toISOString(),
    service_radius_km: 10,
    avg_rating: 5.0,
    total_jobs: 0
  });
  console.log("Worker Profile update:", wpErr ? wpErr : 'OK');

  // 3. Fetch a category to assign
  const { data: cats } = await workerClient.from('service_categories').select('*').limit(1);
  if (cats && cats.length > 0) {
    const { error: wcErr } = await workerClient.from('worker_categories').upsert({
      worker_id: workerId,
      category_id: cats[0].id
    });
    console.log(`Worker Category assigned (${cats[0].name_en}):`, wcErr ? wcErr : 'OK');
  }

  const { data: checkWp } = await workerClient.from('worker_profiles').select('*').eq('profile_id', workerId);
  console.log("Final check of worker_profile:", checkWp);
}

main();
