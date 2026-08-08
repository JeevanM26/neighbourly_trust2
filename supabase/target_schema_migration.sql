-- ============================================================================
-- ADDITIVE MIGRATION SCRIPT
-- Converging schema to target while preserving existing data.
-- ============================================================================

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Migrate existing profiles table to match target
-- Add the new column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text default 'en';
-- We leave the 'phone' column intact instead of dropping it, to prevent data loss.
-- Migrate 'provider' to 'worker'
UPDATE public.profiles SET role = 'worker' WHERE role = 'provider';
-- Alter the role column to text and add a check constraint safely
ALTER TABLE public.profiles ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.profiles ADD CONSTRAINT role_check CHECK (role in ('customer','worker')) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT role_check;

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles viewable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;
DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create service_categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug = lower(slug)),
  name_en text not null,
  translations jsonb default '{}',
  synonyms text[] default '{}',
  icon_url text,
  is_active boolean default true
);

-- Seed basic categories based on existing provider categories
INSERT INTO public.service_categories (slug, name_en)
SELECT DISTINCT category, category FROM public.provider_profiles
ON CONFLICT (slug) DO NOTHING;

-- 4. Create worker_profiles and port data
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  years_experience int default 0,
  is_online boolean default false,
  is_verified boolean default false,
  location geography(Point, 4326),
  location_updated_at timestamptz,
  service_radius_km numeric default 8,
  avg_rating numeric default 0,
  total_jobs int default 0
);
CREATE INDEX IF NOT EXISTS worker_location_idx ON public.worker_profiles USING gist (location);

-- Port data from provider_profiles to worker_profiles
INSERT INTO public.worker_profiles (profile_id, bio, is_online, location, avg_rating, total_jobs)
SELECT 
  id, 
  description, 
  is_online, 
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, 
  avg_rating, 
  0
FROM public.provider_profiles
ON CONFLICT (profile_id) DO NOTHING;

-- RLS: Worker Profiles
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "worker manages own row" ON public.worker_profiles;
CREATE POLICY "worker manages own row" ON public.worker_profiles FOR ALL USING (auth.uid() = profile_id);

-- 5. Create worker_categories
CREATE TABLE IF NOT EXISTS public.worker_categories (
  worker_id uuid references public.worker_profiles(profile_id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete cascade,
  primary key (worker_id, category_id)
);

-- 6. Rename existing bookings table
DO $$ BEGIN
    ALTER TABLE public.bookings RENAME TO bookings_old;
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN undefined_table THEN null;
END $$;

-- 7. Create new bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) not null,
  worker_id uuid references public.profiles(id),
  category_id uuid references public.service_categories(id) not null,
  status text not null default 'searching'
    check (status in ('searching','pending','accepted','on_the_way',
                       'in_progress','completed','cancelled','no_workers_found')),
  description text,
  voice_transcript text,
  detected_language text,
  customer_location geography(Point, 4326) not null,
  address_text text,
  price_estimate numeric,
  final_price numeric,
  created_at timestamptz default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_reason text
);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_location_idx ON public.bookings USING gist (customer_location);

-- Port data from old bookings to new bookings
DO $$ BEGIN
    INSERT INTO public.bookings (
      id, 
      customer_id, 
      worker_id, 
      category_id, 
      status, 
      description, 
      customer_location, 
      address_text, 
      final_price, 
      created_at
    )
    SELECT 
      b.id,
      b.customer_id,
      b.provider_id,
      sc.id,
      b.status::text,
      b.address_notes,
      ST_SetSRID(ST_MakePoint(75.5681, 13.9299), 4326)::geography, -- Default location since old lacked coords
      b.address_notes,
      b.total_amount,
      b.created_at
    FROM public.bookings_old b
    JOIN public.service_categories sc ON sc.name_en = b.service_type
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- RLS: Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer sees own bookings" ON public.bookings;
DROP POLICY IF EXISTS "assigned worker sees booking" ON public.bookings;
DROP POLICY IF EXISTS "customer creates booking" ON public.bookings;
DROP POLICY IF EXISTS "customer or worker updates booking" ON public.bookings;
CREATE POLICY "customer sees own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "assigned worker sees booking" ON public.bookings FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "customer creates booking" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer or worker updates booking" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id or auth.uid() = worker_id);

-- 8. Create booking_offers
CREATE TABLE IF NOT EXISTS public.booking_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  worker_id uuid references public.profiles(id),
  status text not null default 'offered'
    check (status in ('offered','accepted','declined','timed_out')),
  offered_at timestamptz default now(),
  responded_at timestamptz
);

-- 9. Create calls log
CREATE TABLE IF NOT EXISTS public.calls (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  caller_id uuid references public.profiles(id) not null,
  callee_id uuid references public.profiles(id) not null,
  status text not null default 'ringing'
    check (status in ('ringing','connected','missed','declined','ended')),
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- RLS: Calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "call visible to participants" ON public.calls;
CREATE POLICY "call visible to participants" ON public.calls FOR SELECT USING (auth.uid() = caller_id or auth.uid() = callee_id);

-- 10. Create reviews (replaces ratings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) not null unique,
  customer_id uuid references public.profiles(id) not null,
  worker_id uuid references public.profiles(id) not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_flagged boolean default false,
  created_at timestamptz default now()
);

-- Port old ratings to reviews
INSERT INTO public.reviews (id, booking_id, customer_id, worker_id, rating, comment, created_at)
SELECT id, booking_id, customer_id, provider_id, stars, comment, created_at
FROM public.ratings
ON CONFLICT (booking_id) DO NOTHING;

-- RLS: Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review visible to participants" ON public.reviews;
DROP POLICY IF EXISTS "customer creates review" ON public.reviews;
CREATE POLICY "review visible to participants" ON public.reviews FOR SELECT USING (auth.uid() = customer_id or auth.uid() = worker_id);
CREATE POLICY "customer creates review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 11. Create push_tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  profile_id uuid references public.profiles(id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz default now(),
  primary key (profile_id, token)
);

-- RPC for Account Deletion
CREATE OR REPLACE FUNCTION public.delete_worker_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET full_name = 'Deleted User', avatar_url = NULL, preferred_language = 'en'
  WHERE id = v_uid;

  UPDATE public.worker_profiles
  SET is_online = false, location = NULL, bio = NULL
  WHERE profile_id = v_uid;
END;
$$;

