-- ============================================================================
-- NEIGHBORLY TRUST — PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Supabase / PostgreSQL Migration Script
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'provider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'completed', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    language TEXT NOT NULL DEFAULT 'en',
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROVIDER PROFILES / WORKERS TABLE
CREATE TABLE IF NOT EXISTS public.provider_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
    avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
    reviews_count INT NOT NULL DEFAULT 0,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    lat NUMERIC(9, 6) NOT NULL DEFAULT 13.9299,
    lng NUMERIC(9, 6) NOT NULL DEFAULT 75.5681,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BOOKINGS TABLE (Includes 8% Platform Commission)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Automatically calculated as 8% of total_amount
    address_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PAYOUTS TABLE (Running Ledger)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TRIGGER: AUTOMATIC 8% COMMISSION COMPUTATION
CREATE OR REPLACE FUNCTION compute_booking_commission()
RETURNS TRIGGER AS $$
BEGIN
    NEW.commission_amount := ROUND(NEW.total_amount * 0.08, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_commission ON public.bookings;
CREATE TRIGGER set_booking_commission
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION compute_booking_commission();

-- 9. TRIGGER: RECOMPUTE PROVIDER AVG RATING ON NEW RATING
CREATE OR REPLACE FUNCTION update_provider_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.provider_profiles
    SET 
        avg_rating = (
            SELECT COALESCE(ROUND(AVG(stars), 2), 5.0) 
            FROM public.ratings 
            WHERE provider_id = NEW.provider_id
        ),
        reviews_count = (
            SELECT COUNT(*) 
            FROM public.ratings 
            WHERE provider_id = NEW.provider_id
        )
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_avg_rating ON public.ratings;
CREATE TRIGGER trigger_update_avg_rating
AFTER INSERT OR UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION update_provider_avg_rating();

-- 10. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles viewable by all authenticated users" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Provider Profiles Policies
CREATE POLICY "Provider directory viewable by all users" 
    ON public.provider_profiles FOR SELECT USING (true);

CREATE POLICY "Providers can update own profile" 
    ON public.provider_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Providers can insert own profile" 
    ON public.provider_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Bookings Policies
CREATE POLICY "Users can view relevant bookings" 
    ON public.bookings FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "Customers can create bookings" 
    ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Parties can update relevant bookings" 
    ON public.bookings FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Ratings Policies
CREATE POLICY "Ratings viewable by all" 
    ON public.ratings FOR SELECT USING (true);

CREATE POLICY "Customers can add ratings for their bookings" 
    ON public.ratings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Payouts Policies
CREATE POLICY "Providers can view own payouts" 
    ON public.payouts FOR SELECT USING (auth.uid() = provider_id);
