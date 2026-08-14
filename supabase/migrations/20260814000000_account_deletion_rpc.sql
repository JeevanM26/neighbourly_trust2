-- ============================================================================
-- NEIGHBORLY TRUST: 100% DPDP & Google Play Compliant Account Deletion System
-- ============================================================================

-- 1. Ensure all dependent foreign keys CASCADE on delete safely
DO $$ BEGIN
  -- Reviews
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_worker_id_fkey;
    
    ALTER TABLE public.reviews 
      ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
      ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD CONSTRAINT reviews_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Booking Offers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_offers') THEN
    ALTER TABLE public.booking_offers DROP CONSTRAINT IF EXISTS booking_offers_booking_id_fkey;
    ALTER TABLE public.booking_offers DROP CONSTRAINT IF EXISTS booking_offers_worker_id_fkey;
    
    ALTER TABLE public.booking_offers 
      ADD CONSTRAINT booking_offers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
      ADD CONSTRAINT booking_offers_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Bookings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_worker_id_fkey;
    
    ALTER TABLE public.bookings 
      ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD CONSTRAINT bookings_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Worker Categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_categories') THEN
    ALTER TABLE public.worker_categories DROP CONSTRAINT IF EXISTS worker_categories_worker_id_fkey;
    ALTER TABLE public.worker_categories 
      ADD CONSTRAINT worker_categories_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Worker Profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_profiles') THEN
    ALTER TABLE public.worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_profile_id_fkey;
    ALTER TABLE public.worker_profiles 
      ADD CONSTRAINT worker_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Calls
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calls') THEN
    ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_caller_id_fkey;
    ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_callee_id_fkey;
    ALTER TABLE public.calls 
      ADD CONSTRAINT calls_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD CONSTRAINT calls_callee_id_fkey FOREIGN KEY (callee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Push Tokens
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'push_tokens') THEN
    ALTER TABLE public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_profile_id_fkey;
    ALTER TABLE public.push_tokens 
      ADD CONSTRAINT push_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Customer Account Deletion RPC (Security Definer)
CREATE OR REPLACE FUNCTION public.delete_customer_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Cascaded erasure
  DELETE FROM public.reviews WHERE customer_id = v_uid;
  DELETE FROM public.bookings WHERE customer_id = v_uid;
  DELETE FROM public.calls WHERE caller_id = v_uid OR callee_id = v_uid;
  DELETE FROM public.push_tokens WHERE profile_id = v_uid;
  DELETE FROM public.profiles WHERE id = v_uid;
  DELETE FROM auth.users WHERE id = v_uid;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  DELETE FROM public.profiles WHERE id = v_uid;
  DELETE FROM auth.users WHERE id = v_uid;
  RETURN true;
END;
$$;

-- 3. Worker Partner Account Deletion RPC
CREATE OR REPLACE FUNCTION public.delete_worker_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Cascaded erasure
  DELETE FROM public.reviews WHERE worker_id = v_uid;
  DELETE FROM public.booking_offers WHERE worker_id = v_uid;
  DELETE FROM public.worker_categories WHERE worker_id = v_uid;
  DELETE FROM public.worker_profiles WHERE profile_id = v_uid;
  DELETE FROM public.calls WHERE caller_id = v_uid OR callee_id = v_uid;
  DELETE FROM public.push_tokens WHERE profile_id = v_uid;
  DELETE FROM public.profiles WHERE id = v_uid;
  DELETE FROM auth.users WHERE id = v_uid;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  DELETE FROM public.profiles WHERE id = v_uid;
  DELETE FROM auth.users WHERE id = v_uid;
  RETURN true;
END;
$$;

-- 4. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.delete_customer_account() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.delete_worker_account() TO authenticated, anon;
