-- ============================================================================
-- 🛡️ SHRAMIXS / HEROHAND: CLEANUP DUPLICATES & CATEGORY DELETE RPC
-- Run this in Supabase Dashboard → SQL Editor:
-- https://supabase.com/dashboard/project/rcvxvnfejbwvokwzcuav/sql
-- ============================================================================

-- 1. Remove Duplicate Categories (Keeping Canonical Entries)
-- Remove duplicate acrepair (keeping canonical ac-repair)
DELETE FROM public.service_categories WHERE slug = 'acrepair' OR id = '681d0f6d-4448-4a87-a4fe-f32b39cd45f3';

-- Remove duplicate pestcontrol (keeping canonical pest-control)
DELETE FROM public.service_categories WHERE slug = 'pestcontrol' OR id = '5d6913bd-9fba-4a50-b33b-45716ac3557b';

-- Remove duplicate mason (keeping canonical mason-construction)
DELETE FROM public.service_categories WHERE slug = 'mason' OR id = 'e3a75be2-6c9a-424e-b59a-5ff306c46f20';

-- 2. Create Secure Admin RPC to Delete Categories
CREATE OR REPLACE FUNCTION public.admin_delete_service_category(
  p_phone TEXT,
  p_pin TEXT,
  p_category_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_phone TEXT;
  v_name TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  IF (v_clean_phone != '7975182162') OR (trim(p_pin) != '7975') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Invalid Admin Credentials');
  END IF;

  SELECT name_en INTO v_name FROM public.service_categories WHERE id = p_category_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Category not found');
  END IF;

  DELETE FROM public.service_categories WHERE id = p_category_id;

  RETURN jsonb_build_object(
    'success', true,
    'category_id', p_category_id,
    'message', 'Category "' || v_name || '" deleted successfully'
  );
END;
$$;

-- Grant execute permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.admin_delete_service_category(TEXT, TEXT, UUID) TO anon, authenticated;

-- 3. Ensure Storage Bucket for Category Icons Exists with Public Read
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  CREATE POLICY "Public Read Category Icons"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'category-icons');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public Upload Category Icons"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'category-icons');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
