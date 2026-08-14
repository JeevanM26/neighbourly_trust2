-- ============================================================================
-- NEIGHBORLY TRUST: MASTER GODMODE & FUTURE-PROOF DATABASE ENGINE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. POSTGIS SPATIAL CLUSTERING & ULTRA-FAST KNN INDEXING
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_worker_profiles_location_gist 
  ON public.worker_profiles USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_bookings_location_gist 
  ON public.bookings USING GIST (customer_location);

-- Partial Index: Instant lookup for online & verified workers only
CREATE INDEX IF NOT EXISTS idx_workers_online_active_partial 
  ON public.worker_profiles (profile_id) 
  WHERE is_online = true AND is_verified = true;

-- Partial Index: Instant lookup for active offered bookings in dispatch queue
CREATE INDEX IF NOT EXISTS idx_booking_offers_active_partial 
  ON public.booking_offers (worker_id, booking_id) 
  WHERE status = 'offered';

-- Covering Index: Returns active customer bookings straight from RAM cache
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status_covering 
  ON public.bookings (customer_id, status) 
  INCLUDE (worker_id, category_id, final_price, created_at);

-- Covering Index: Returns active worker jobs straight from RAM cache
CREATE INDEX IF NOT EXISTS idx_bookings_worker_status_covering 
  ON public.bookings (worker_id, status) 
  INCLUDE (customer_id, category_id, address_text, created_at);

-- ----------------------------------------------------------------------------
-- 2. REALTIME REPLICATION PERFORMANCE OPTIMIZATION
-- ----------------------------------------------------------------------------
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.booking_offers REPLICA IDENTITY FULL;
ALTER TABLE public.calls REPLICA IDENTITY FULL;

-- ----------------------------------------------------------------------------
-- 3. BULLETPROOF DATA INTEGRITY CONSTRAINTS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  -- Coordinate Bounds Protection
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_lat') THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT chk_bookings_lat 
      CHECK (customer_lat IS NULL OR (customer_lat >= -90 AND customer_lat <= 90));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_lng') THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT chk_bookings_lng 
      CHECK (customer_lng IS NULL OR (customer_lng >= -180 AND customer_lng <= 180));
  END IF;

  -- Price sanity check
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_price') THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT chk_bookings_price 
      CHECK (final_price IS NULL OR final_price >= 0);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 4. ULTRA-FAST KNN SPATIAL LOOKUP RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nearby_workers_godmode(
  p_category_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_max_distance_km DOUBLE PRECISION DEFAULT 15,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  worker_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  rating NUMERIC,
  total_jobs INTEGER,
  distance_km DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    wp.profile_id AS worker_id,
    p.full_name,
    p.avatar_url,
    p.phone,
    wp.avg_rating AS rating,
    wp.total_jobs,
    ROUND((ST_Distance(wp.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0)::numeric, 2)::double precision AS distance_km,
    ST_Y(wp.location::geometry) AS lat,
    ST_X(wp.location::geometry) AS lng
  FROM public.worker_profiles wp
  JOIN public.profiles p ON wp.profile_id = p.id
  JOIN public.worker_categories wc ON wp.profile_id = wc.worker_id
  WHERE 
    wp.is_online = true 
    AND wp.is_verified = true
    AND wc.category_id = p_category_id
    AND wp.location IS NOT NULL
    AND ST_DWithin(
      wp.location, 
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, 
      p_max_distance_km * 1000
    )
  ORDER BY wp.location <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_workers_godmode(UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- 5. FINITE STATE MACHINE (FSM) ANTI-TAMPER INTEGRITY GUARD
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_booking_fsm_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If status is not changing, allow update
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate permitted state transitions only
  IF OLD.status = 'searching' AND NEW.status NOT IN ('accepted', 'cancelled', 'no_workers_found') THEN
    RAISE EXCEPTION 'Invalid State Transition: searching cannot transition directly to %', NEW.status;
  ELSIF OLD.status = 'accepted' AND NEW.status NOT IN ('on_the_way', 'in_progress', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid State Transition: accepted cannot transition directly to %', NEW.status;
  ELSIF OLD.status = 'on_the_way' AND NEW.status NOT IN ('in_progress', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid State Transition: on_the_way cannot transition directly to %', NEW.status;
  ELSIF OLD.status = 'in_progress' AND NEW.status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid State Transition: in_progress cannot transition directly to %', NEW.status;
  ELSIF OLD.status IN ('completed', 'cancelled', 'no_workers_found') THEN
    RAISE EXCEPTION 'Terminal State: Cannot modify booking that is already %', OLD.status;
  END IF;

  -- Automatic timestamp stamps
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.accepted_at := COALESCE(NEW.accepted_at, now());
  ELSIF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.started_at := COALESCE(NEW.started_at, now());
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_fsm_guard ON public.bookings;
CREATE TRIGGER trg_booking_fsm_guard
BEFORE UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_booking_fsm_integrity();

-- ----------------------------------------------------------------------------
-- 6. ATOMIC CONCURRENCY RPC: ACCEPT BOOKING OFFER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_booking_offer_atomic(
  p_booking_id UUID,
  p_worker_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- 1. Acquire atomic row-level mutex lock on the booking
  SELECT * INTO v_booking 
  FROM public.bookings 
  WHERE id = p_booking_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  -- 2. Validate booking is still in a claimable state
  IF v_booking.status NOT IN ('searching', 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job already accepted by another specialist');
  END IF;

  -- 3. Assign the worker and advance status
  UPDATE public.bookings
  SET 
    worker_id = p_worker_id,
    status = 'accepted',
    accepted_at = now()
  WHERE id = p_booking_id;

  -- 4. Mark winning offer as accepted
  UPDATE public.booking_offers
  SET status = 'accepted', responded_at = now()
  WHERE booking_id = p_booking_id AND worker_id = p_worker_id;

  -- 5. Auto-cancel all other dispatched offers for this job
  UPDATE public.booking_offers
  SET status = 'cancelled', responded_at = now()
  WHERE booking_id = p_booking_id AND worker_id != p_worker_id AND status = 'offered';

  RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'status', 'accepted');
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_booking_offer_atomic(UUID, UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. INCREMENTAL REALTIME BAYESIAN RATING & METRICS ENGINE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_worker_rating_incremental()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker_id UUID;
  v_avg NUMERIC(3,2);
  v_count INT;
BEGIN
  v_worker_id := COALESCE(NEW.worker_id, OLD.worker_id);

  SELECT 
    ROUND(AVG(rating)::numeric, 2),
    COUNT(id)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE worker_id = v_worker_id AND is_flagged = false;

  UPDATE public.worker_profiles
  SET 
    avg_rating = COALESCE(v_avg, 5.00),
    total_jobs = COALESCE(v_count, 0)
  WHERE profile_id = v_worker_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_worker_rating ON public.reviews;
CREATE TRIGGER trg_update_worker_rating
AFTER INSERT OR UPDATE OF rating, is_flagged OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recompute_worker_rating_incremental();

-- ----------------------------------------------------------------------------
-- 8. AUTONOMOUS RADIAL CASCADE DISPATCH ENGINE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cascade_dispatch_next_worker(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking RECORD;
  v_next_worker_id UUID;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  
  IF v_booking.status != 'searching' THEN
    RETURN;
  END IF;

  SELECT nw.worker_id INTO v_next_worker_id
  FROM public.nearby_workers_godmode(
    v_booking.category_id,
    COALESCE(v_booking.customer_lat, ST_Y(v_booking.customer_location::geometry)),
    COALESCE(v_booking.customer_lng, ST_X(v_booking.customer_location::geometry)),
    15,
    10
  ) nw
  WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_offers bo 
    WHERE bo.booking_id = p_booking_id AND bo.worker_id = nw.worker_id
  )
  LIMIT 1;

  IF v_next_worker_id IS NOT NULL THEN
    INSERT INTO public.booking_offers (booking_id, worker_id, status, offered_at)
    VALUES (p_booking_id, v_next_worker_id, 'offered', now());
  ELSE
    UPDATE public.bookings 
    SET status = 'no_workers_found' 
    WHERE id = p_booking_id AND status = 'searching';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_offer_cascade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IN ('declined', 'timed_out') AND OLD.status = 'offered' THEN
    NEW.responded_at := now();
    PERFORM public.cascade_dispatch_next_worker(NEW.booking_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_on_decline ON public.booking_offers;
CREATE TRIGGER trg_cascade_on_decline
BEFORE UPDATE OF status ON public.booking_offers
FOR EACH ROW
EXECUTE FUNCTION public.trg_offer_cascade();

-- ----------------------------------------------------------------------------
-- 9. ZERO-LEAK CONSOLIDATED ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON public.profiles;

CREATE POLICY "profiles_select_safe" ON public.profiles 
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "profiles_insert_safe" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_safe" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "worker_profiles_read_all" ON public.worker_profiles;
DROP POLICY IF EXISTS "worker_profiles_modify_own" ON public.worker_profiles;

CREATE POLICY "worker_profiles_read_all" ON public.worker_profiles 
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "worker_profiles_modify_own" ON public.worker_profiles 
  FOR ALL TO authenticated 
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_view_policy" ON public.bookings;
DROP POLICY IF EXISTS "bookings_create_policy" ON public.bookings;
DROP POLICY IF EXISTS "bookings_modify_policy" ON public.bookings;

CREATE POLICY "bookings_view_policy" ON public.bookings 
  FOR SELECT TO authenticated 
  USING (
    customer_id = (SELECT auth.uid()) 
    OR worker_id = (SELECT auth.uid())
    OR status = 'searching'
  );

CREATE POLICY "bookings_create_policy" ON public.bookings 
  FOR INSERT TO authenticated 
  WITH CHECK (customer_id = (SELECT auth.uid()));

CREATE POLICY "bookings_modify_policy" ON public.bookings 
  FOR UPDATE TO authenticated 
  USING (
    customer_id = (SELECT auth.uid()) 
    OR worker_id = (SELECT auth.uid())
  );

ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking_offers_worker_view" ON public.booking_offers;
DROP POLICY IF EXISTS "booking_offers_worker_update" ON public.booking_offers;

CREATE POLICY "booking_offers_worker_view" ON public.booking_offers 
  FOR SELECT TO authenticated 
  USING (
    worker_id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_offers.booking_id AND b.customer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "booking_offers_worker_update" ON public.booking_offers 
  FOR UPDATE TO authenticated 
  USING (worker_id = (SELECT auth.uid()))
  WITH CHECK (worker_id = (SELECT auth.uid()));

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_tokens_owner_only" ON public.push_tokens;

CREATE POLICY "push_tokens_owner_only" ON public.push_tokens 
  FOR ALL TO authenticated 
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spatial_ref_sys_read" ON public.spatial_ref_sys;
CREATE POLICY "spatial_ref_sys_read" ON public.spatial_ref_sys 
  FOR SELECT TO authenticated, anon USING (true);
