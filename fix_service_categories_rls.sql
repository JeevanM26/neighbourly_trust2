-- ============================================================================
-- 🛡️ SHRAMIXS / HEROHAND: SERVICE CATEGORIES RLS & ADMIN MANAGEMENT ENGINE
-- Copy and paste this entire script into your Supabase Dashboard:
-- -> Go to https://supabase.com/dashboard/project/rcvxvnfejbwvokwzcuav/sql
-- -> Click "New Query", paste this SQL, and click "RUN"
-- ============================================================================

-- 1. Ensure Table Structure & Missing Columns
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  translations jsonb DEFAULT '{}',
  synonyms text[] DEFAULT '{}',
  icon_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add optional multi-lingual columns safely
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS name_hi text;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS name_kn text;

-- Ensure lower-case slug check if not exists
DO $$ BEGIN
  ALTER TABLE public.service_categories DROP CONSTRAINT IF EXISTS service_categories_slug_check;
  ALTER TABLE public.service_categories ADD CONSTRAINT service_categories_slug_check CHECK (slug = lower(slug));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Enable Row Level Security
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- 3. Clean up any previous conflicting or restrictive policies
DROP POLICY IF EXISTS "allow_all_read_service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "allow_all_insert_service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "allow_all_update_service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "allow_all_delete_service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "public read service categories" ON public.service_categories;
DROP POLICY IF EXISTS "admin manage service categories" ON public.service_categories;
DROP POLICY IF EXISTS "allow select service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "allow insert service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "allow update service_categories" ON public.service_categories;

-- 4. Apply Direct Non-blocking RLS Policies for Web/App Clients
-- Anyone can view service categories (Customer App, Worker App, Admin Portal)
CREATE POLICY "allow_all_read_service_categories"
  ON public.service_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow inserting categories (Admin Portal & Worker Custom Trades)
CREATE POLICY "allow_all_insert_service_categories"
  ON public.service_categories FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(trim(name_en)) > 0 AND char_length(trim(slug)) > 0);

-- Allow updating categories (Toggling is_active, updating translations or names)
CREATE POLICY "allow_all_update_service_categories"
  ON public.service_categories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Secure Admin RPC: Add Service Category (PIN & Phone Verified)
CREATE OR REPLACE FUNCTION public.admin_add_service_category(
  p_phone TEXT,
  p_pin TEXT,
  p_name_en TEXT,
  p_slug TEXT DEFAULT NULL,
  p_icon_url TEXT DEFAULT NULL,
  p_name_hi TEXT DEFAULT NULL,
  p_name_kn TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_clean_name TEXT;
  v_slug TEXT;
  v_row RECORD;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  v_clean_name := trim(p_name_en);

  -- Verify Admin Authentication (Super Admin or Profiles role = admin/super_admin)
  IF (v_clean_phone != '7975182162' AND v_clean_phone NOT IN (
    SELECT phone FROM public.profiles WHERE role IN ('admin', 'super_admin')
  )) OR (trim(p_pin) != '7975') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Invalid Admin Credentials');
  END IF;

  IF v_clean_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Category name cannot be empty');
  END IF;

  -- Generate or sanitize slug
  IF p_slug IS NULL OR trim(p_slug) = '' THEN
    v_slug := lower(regexp_replace(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'));
  ELSE
    v_slug := lower(trim(p_slug));
  END IF;

  IF v_slug = '' THEN
    v_slug := 'service-' || floor(extract(epoch from now()))::text;
  END IF;

  -- Check if already exists by slug or name
  SELECT * INTO v_row FROM public.service_categories
  WHERE slug = v_slug OR lower(name_en) = lower(v_clean_name)
  LIMIT 1;

  IF FOUND THEN
    -- If currently inactive, re-activate it
    IF NOT v_row.is_active THEN
      UPDATE public.service_categories
      SET is_active = true,
          icon_url = COALESCE(p_icon_url, v_row.icon_url)
      WHERE id = v_row.id
      RETURNING * INTO v_row;

      RETURN jsonb_build_object(
        'success', true,
        'category', row_to_json(v_row),
        'message', 'Reactivated existing category "' || v_row.name_en || '"'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', true,
        'category', row_to_json(v_row),
        'message', 'Category "' || v_row.name_en || '" is already active'
      );
    END IF;
  END IF;

  -- Insert new category
  INSERT INTO public.service_categories (
    name_en,
    slug,
    icon_url,
    is_active
  )
  VALUES (
    v_clean_name,
    v_slug,
    p_icon_url,
    true
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'success', true,
    'category', row_to_json(v_row),
    'message', 'Category "' || v_clean_name || '" created successfully'
  );
END;
$$;

-- 6. Secure Admin RPC: Toggle Category Active/Inactive
CREATE OR REPLACE FUNCTION public.admin_toggle_service_category(
  p_phone TEXT,
  p_pin TEXT,
  p_category_id UUID,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_row RECORD;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  IF (v_clean_phone != '7975182162') OR (trim(p_pin) != '7975') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Invalid Admin Credentials');
  END IF;

  UPDATE public.service_categories
  SET is_active = p_is_active
  WHERE id = p_category_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Category not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'category_id', p_category_id,
    'is_active', p_is_active,
    'message', 'Service category ' || (CASE WHEN p_is_active THEN 'activated' ELSE 'deactivated' END) || ' successfully'
  );
END;
$$;

-- 7. Grant Permissions to Anon and Authenticated Roles
GRANT EXECUTE ON FUNCTION public.admin_add_service_category(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_service_category(TEXT, TEXT, UUID, BOOLEAN) TO anon, authenticated;

-- 8. Enable Realtime Replication for instant multi-app sync
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_categories;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;
