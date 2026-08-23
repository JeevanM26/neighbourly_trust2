import 'dotenv/config';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('FATAL: MISSING_JWT_SECRET');
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcvxvnfejbwvokwzcuav.supabase.co';
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const customerClient = createClient(supabaseUrl, supabaseKey);

async function tryLogin(phone) {
  const otp = '123456';
  console.log(`Sending OTP to ${phone}...`);
  const { error: signInErr } = await customerClient.auth.signInWithOtp({ phone });
  if (signInErr) {
    console.error("signInErr:", signInErr);
    return null;
  }
  console.log(`Verifying OTP for ${phone}...`);
  const { data: authData, error: verifyErr } = await customerClient.auth.verifyOtp({
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

async function main() {
  const authData = await tryLogin('+919535024317');
  if (!authData) return;

  const customerId = authData.user.id;
  const phone = authData.user.phone;
  console.log(`Successfully logged in as CUSTOMER. ID: ${customerId}`);

  // 1. Update Profile to customer
  await customerClient.from('profiles').upsert({
    id: customerId,
    full_name: 'Test Customer 2',
    phone: phone,
    role: 'customer',
    language: 'en',
    consent_given: true
  });

  // 2. Fetch the worker's category ID
  const { data: cats } = await customerClient.from('service_categories').select('*').eq('name_en', 'Electrician').limit(1);
  if (!cats || cats.length === 0) {
    console.error("Category Electrician not found");
    return;
  }
  const catId = cats[0].id;
  
  // 3. Create Booking
  console.log("Creating booking for category:", catId);
  const { data: bookingData, error: bookingErr } = await customerClient
      .from('bookings')
      .insert({
        customer_id: customerId,
        category_id: catId,
        status: 'searching',
        customer_location: `SRID=4326;POINT(75.5745 13.9381)`
      })
      .select('id')
      .single();

  if (bookingErr) {
    console.error("Booking creation failed:", bookingErr);
    return;
  }
  
  const bookingId = bookingData.id;
  console.log(`Booking created: ${bookingId}`);

  // 4. Wait a bit for the trigger to fire just in case
  await new Promise(r => setTimeout(r, 1000));

  // 5. Check if booking_offers was created (bypassing RLS or using customer's RLS policy)
  // According to RLS, customer can read offers for their bookings!
  const { data: offers, error: offersErr } = await customerClient
      .from('booking_offers')
      .select('*')
      .eq('booking_id', bookingId);
      
  console.log("Offers for this booking:", offersErr ? offersErr : offers);
  
  // 6. Check if customer can read their own booking (Visibility test)
  const { data: fetchBooking, error: fetchErr } = await customerClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId);
      
  console.log("Customer fetching their own booking:", fetchErr ? fetchErr : fetchBooking);
}

main();
