-- ============================================================================
-- 🧹 HEROHAND / SHRAMIXS: COMPLETE DATABASE RESET SCRIPT
-- ============================================================================
-- ⚠️ INSTRUCTIONS:
-- 1. Open your Supabase Dashboard:
--    👉 https://supabase.com/dashboard/project/rcvxvnfejbwvokwzcuav/sql
-- 2. Click "New Query", paste this entire script, and click "RUN".
-- ============================================================================

BEGIN;

-- 1. Delete all transactional booking offers and realtime signals
TRUNCATE TABLE public.booking_offers CASCADE;

-- 2. Delete all customer ratings and reviews
TRUNCATE TABLE public.reviews CASCADE;

-- 3. Delete all past and active bookings
TRUNCATE TABLE public.bookings CASCADE;

-- 4. Delete all worker skills and category mappings
TRUNCATE TABLE public.worker_categories CASCADE;

-- 5. Delete all worker partner profiles (ratings, wallet balance, locations)
TRUNCATE TABLE public.worker_profiles CASCADE;

-- 6. Delete all customer & worker profiles
TRUNCATE TABLE public.profiles CASCADE;

-- 7. Delete all registered auth users (allows clean fresh Google & Phone signups)
DELETE FROM auth.users;

-- 8. Ensure the 10 Core Service Categories are intact and active for new signups
INSERT INTO public.service_categories (slug, name_en, is_active) VALUES
  ('electrician', 'Electrician', true),
  ('plumber', 'Plumber', true),
  ('carpenter', 'Carpenter', true),
  ('painter', 'Painter', true),
  ('cleaning', 'Home Cleaning', true),
  ('salon', 'Salon & Grooming', true),
  ('acrepair', 'AC & Appliance Repair', true),
  ('pestcontrol', 'Pest Control', true),
  ('mason', 'Masonry & Construction', true),
  ('mechanic', 'Auto & Bike Mechanic', true)
ON CONFLICT (slug) DO UPDATE SET is_active = true;

COMMIT;

-- ============================================================================
-- Verification Output
-- ============================================================================
SELECT 'Database reset successful! Ready for fresh customer & worker onboarding.' AS status;
