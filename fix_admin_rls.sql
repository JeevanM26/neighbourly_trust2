-- ============================================================================
-- 🛡️ SHRAMIXS / HEROHAND: SECURE ADMIN RPC & RLS HARDENING ENGINE
-- Copy and paste this whole script into your Supabase Dashboard:
-- -> Go to https://supabase.com/dashboard/project/rcvxvnfejbwvokwzcuav/sql
-- -> Click "New Query", paste this SQL, and click "RUN"
-- ============================================================================

-- 1. Tighten User-Scoped Row Level Security (Zero Unauthorized Data Leakage)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Clean up old wide-open policies
DROP POLICY IF EXISTS "allow all read bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow all admin read bookings" ON public.bookings;
DROP POLICY IF EXISTS "customer sees own bookings" ON public.bookings;
DROP POLICY IF EXISTS "assigned worker sees booking" ON public.bookings;

DROP POLICY IF EXISTS "allow all read calls" ON public.calls;
DROP POLICY IF EXISTS "allow all admin read calls" ON public.calls;
DROP POLICY IF EXISTS "call visible to participants" ON public.calls;

DROP POLICY IF EXISTS "allow all read reviews" ON public.reviews;
DROP POLICY IF EXISTS "allow all admin read reviews" ON public.reviews;
DROP POLICY IF EXISTS "review visible to participants" ON public.reviews;

-- 3. Apply Strict Participant-Only RLS Policies for App Users
CREATE POLICY "customer sees own bookings" 
  ON public.bookings FOR SELECT 
  USING (auth.uid() = customer_id);

CREATE POLICY "assigned worker sees booking" 
  ON public.bookings FOR SELECT 
  USING (auth.uid() = worker_id);

CREATE POLICY "customer creates booking" 
  ON public.bookings FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer or worker updates booking" 
  ON public.bookings FOR UPDATE 
  USING (auth.uid() = customer_id OR auth.uid() = worker_id);

CREATE POLICY "call visible to participants" 
  ON public.calls FOR SELECT 
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "review visible to participants" 
  ON public.reviews FOR SELECT 
  USING (auth.uid() = customer_id OR auth.uid() = worker_id);

CREATE POLICY "public read worker profiles" 
  ON public.worker_profiles FOR SELECT 
  USING (true);

-- 4. Server-Side Secure Admin Data Aggregation RPC (Protected by Phone + PIN)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data(
  p_phone TEXT,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_result JSONB;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  -- Verify Admin Authentication (Super Admin: 7975182162, Master PIN: 7975)
  IF (v_clean_phone != '7975182162' AND v_clean_phone NOT IN (
    SELECT phone FROM public.profiles WHERE role IN ('admin', 'super_admin')
  )) OR (trim(p_pin) != '7975') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Invalid Admin Phone or Security PIN'
    );
  END IF;

  -- Build aggregated Admin dataset securely with full schema resolution
  SELECT jsonb_build_object(
    'success', true,
    'categories', COALESCE((
      SELECT json_agg(c) FROM (
        SELECT id, slug, name_en FROM public.service_categories WHERE is_active = true
      ) c
    ), '[]'::json),
    'bookings', COALESCE((
      SELECT json_agg(b) FROM (
        SELECT 
          b.id,
          b.created_at,
          b.completed_at,
          b.status,
          b.description,
          COALESCE(b.price_estimate, 350) AS price_estimate,
          COALESCE(b.final_price, b.price_estimate, 350) AS final_price,
          b.address_text,
          b.category_id,
          json_build_object(
            'id', cp.id,
            'full_name', COALESCE(cp.full_name, 'Customer'),
            'phone', cp.phone,
            'email', cp.email,
            'avatar_url', cp.avatar_url
          ) AS customer,
          json_build_object(
            'id', wp.id,
            'full_name', COALESCE(wp.full_name, 'Specialist'),
            'phone', wp.phone,
            'email', wp.email,
            'avatar_url', wp.avatar_url,
            'rating', COALESCE(wprof.avg_rating, 5.0)
          ) AS worker
        FROM public.bookings b
        LEFT JOIN public.profiles cp ON cp.id = b.customer_id
        LEFT JOIN public.profiles wp ON wp.id = b.worker_id
        LEFT JOIN public.worker_profiles wprof ON wprof.profile_id = b.worker_id
        ORDER BY b.created_at DESC
      ) b
    ), '[]'::json),
    'workers', COALESCE((
      SELECT json_agg(w) FROM (
        SELECT 
          wp.profile_id AS id,
          COALESCE(p.full_name, 'Technician') AS full_name,
          p.phone,
          p.email,
          p.avatar_url,
          wp.bio,
          COALESCE(wp.years_experience, 0) AS years_experience,
          COALESCE(wp.is_online, false) AS is_online,
          COALESCE(wp.is_verified, false) AS is_verified,
          COALESCE(wp.avg_rating, 5.0) AS rating,
          COALESCE(wp.total_jobs, 0) AS total_jobs,
          COALESCE(wp.service_radius_km, 8) AS service_radius_km,
          p.created_at
        FROM public.worker_profiles wp
        LEFT JOIN public.profiles p ON p.id = wp.profile_id
        ORDER BY wp.is_online DESC, wp.avg_rating DESC
      ) w
    ), '[]'::json),
    'worker_categories', COALESCE((
      SELECT json_agg(wc) FROM (
        SELECT worker_id, category_id FROM public.worker_categories
      ) wc
    ), '[]'::json),
    'customers', COALESCE((
      SELECT json_agg(c) FROM (
        SELECT 
          p.id,
          COALESCE(p.full_name, 'Customer') AS full_name,
          p.phone,
          p.email,
          p.avatar_url,
          COALESCE(p.language, 'en') AS language,
          p.created_at
        FROM public.profiles p
        WHERE p.role = 'customer' OR p.role IS NULL
        ORDER BY p.created_at DESC
      ) c
    ), '[]'::json),
    'reviews', COALESCE((
      SELECT json_agg(r) FROM (
        SELECT 
          r.id,
          r.booking_id,
          COALESCE(r.rating, 5) AS rating,
          r.comment,
          r.created_at,
          cp.full_name AS customer_name,
          cp.phone AS customer_phone,
          wp.full_name AS worker_name,
          wp.phone AS worker_phone
        FROM public.reviews r
        LEFT JOIN public.profiles cp ON cp.id = r.customer_id
        LEFT JOIN public.profiles wp ON wp.id = r.worker_id
        ORDER BY r.created_at DESC
      ) r
    ), '[]'::json),
    'calls', COALESCE((
      SELECT json_agg(cl) FROM (
        SELECT 
          c.id,
          c.caller_id,
          c.callee_id,
          c.booking_id,
          c.status,
          c.created_at,
          cp.full_name AS caller_name,
          wp.full_name AS callee_name
        FROM public.calls c
        LEFT JOIN public.profiles cp ON cp.id = c.caller_id
        LEFT JOIN public.profiles wp ON wp.id = c.callee_id
        ORDER BY c.created_at DESC
        LIMIT 50
      ) cl
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. Server-Side Secure Worker Verification Toggle RPC
CREATE OR REPLACE FUNCTION public.admin_toggle_worker_verification(
  p_phone TEXT,
  p_pin TEXT,
  p_worker_id UUID,
  p_status BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  IF (v_clean_phone != '7975182162') OR (trim(p_pin) != '7975') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Invalid Admin PIN');
  END IF;

  UPDATE public.worker_profiles 
  SET is_verified = p_status 
  WHERE profile_id = p_worker_id;

  RETURN jsonb_build_object('success', true, 'is_verified', p_status);
END;
$$;

-- 6. Grant RPC execution to anon & authenticated
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_data(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_worker_verification(TEXT, TEXT, UUID, BOOLEAN) TO anon, authenticated;
