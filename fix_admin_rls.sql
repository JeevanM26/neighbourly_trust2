-- ============================================================================
-- 🚀 SHRAMIXS / HEROHAND: INSTANT ADMIN DATA VISIBILITY FIX
-- Copy and paste this whole script into your Supabase Dashboard:
-- -> Go to https://supabase.com/dashboard/project/rcvxvnfejbwvokwzcuav/sql
-- -> Click "New Query", paste this SQL, and click "RUN"
-- ============================================================================

-- 1. Enable Full Access for Admin Dashboard on Bookings
DROP POLICY IF EXISTS "allow all read bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow all admin read bookings" ON public.bookings;
CREATE POLICY "allow all read bookings" ON public.bookings FOR SELECT USING (true);

-- 2. Enable Full Access for Admin Dashboard on Calls
DROP POLICY IF EXISTS "allow all read calls" ON public.calls;
DROP POLICY IF EXISTS "allow all admin read calls" ON public.calls;
CREATE POLICY "allow all read calls" ON public.calls FOR SELECT USING (true);

-- 3. Enable Full Access for Admin Dashboard on Reviews
DROP POLICY IF EXISTS "allow all read reviews" ON public.reviews;
DROP POLICY IF EXISTS "allow all admin read reviews" ON public.reviews;
CREATE POLICY "allow all read reviews" ON public.reviews FOR SELECT USING (true);

-- 4. Enable Full Access for Admin Dashboard on Booking Offers
DROP POLICY IF EXISTS "allow all read offers" ON public.booking_offers;
DROP POLICY IF EXISTS "allow all admin read offers" ON public.booking_offers;
CREATE POLICY "allow all read offers" ON public.booking_offers FOR SELECT USING (true);

-- 5. Enable Full Access on Profiles & Worker Directory
DROP POLICY IF EXISTS "allow all read profiles" ON public.profiles;
CREATE POLICY "allow all read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow all read worker profiles" ON public.worker_profiles;
CREATE POLICY "allow all read worker profiles" ON public.worker_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow all read worker categories" ON public.worker_categories;
CREATE POLICY "allow all read worker categories" ON public.worker_categories FOR SELECT USING (true);

-- 6. Enable Admin to toggle Worker Verification in the app
DROP POLICY IF EXISTS "allow admin update worker verification" ON public.worker_profiles;
CREATE POLICY "allow admin update worker verification" ON public.worker_profiles FOR UPDATE USING (true);

-- 7. Grant public/anon schema permissions
GRANT SELECT ON public.bookings TO anon, authenticated;
GRANT SELECT ON public.calls TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.booking_offers TO anon, authenticated;
GRANT SELECT, UPDATE ON public.worker_profiles TO anon, authenticated;
GRANT SELECT ON public.worker_categories TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
