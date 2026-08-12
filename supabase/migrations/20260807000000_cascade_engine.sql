-- 20260807000000_cascade_engine.sql
-- Migration: End-to-End Real-Time Booking Lifecycle

-- 1. Ensure `booking_offers` table exists (in case it wasn't created by target_schema)
CREATE TABLE IF NOT EXISTS public.booking_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  worker_id uuid references public.profiles(id),
  status text not null default 'offered'
    check (status in ('offered','accepted','declined','timed_out','cancelled')),
  offered_at timestamptz default now(),
  responded_at timestamptz
);

-- RLS for Booking Offers
ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workers can read own offers" ON public.booking_offers;
DROP POLICY IF EXISTS "workers can update own offers" ON public.booking_offers;
DROP POLICY IF EXISTS "customers can read offers for their bookings" ON public.booking_offers;

CREATE POLICY "workers can read own offers" ON public.booking_offers FOR SELECT USING (worker_id = auth.uid());
CREATE POLICY "workers can update own offers" ON public.booking_offers FOR UPDATE USING (worker_id = auth.uid());
CREATE POLICY "customers can read offers for their bookings" ON public.booking_offers FOR SELECT USING (
  booking_id IN (SELECT id FROM public.bookings WHERE customer_id = auth.uid())
);

-- Allow workers to read public worker_profiles (needed for GPS tracking)
DROP POLICY IF EXISTS "customers can read public worker profiles" ON public.worker_profiles;
CREATE POLICY "customers can read public worker profiles" ON public.worker_profiles FOR SELECT USING (true);


-- 2. Dispatch Booking Offer Function
CREATE OR REPLACE FUNCTION public.dispatch_booking_offer(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id UUID;
    v_booking RECORD;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    
    IF v_booking.status != 'searching' THEN
        RETURN;
    END IF;

    -- Find nearest online worker who hasn't been offered this booking yet
    -- We exclude any worker who already has an offer for this booking (regardless of status)
    SELECT nw.worker_id INTO v_worker_id
    FROM public.nearby_workers(
        v_booking.category_id, 
        ST_Y(v_booking.customer_location::geometry), 
        ST_X(v_booking.customer_location::geometry), 
        15 -- km radius
    ) nw
    WHERE NOT EXISTS (
        SELECT 1 FROM public.booking_offers bo 
        WHERE bo.booking_id = p_booking_id AND bo.worker_id = nw.worker_id
    )
    ORDER BY nw.distance_km ASC
    LIMIT 1;

    IF v_worker_id IS NOT NULL THEN
        -- Insert offer
        INSERT INTO public.booking_offers (booking_id, worker_id, status)
        VALUES (p_booking_id, v_worker_id, 'offered');
    ELSE
        -- No workers left
        UPDATE public.bookings SET status = 'no_workers_found' WHERE id = p_booking_id;
    END IF;
END;
$$;


-- 3. Triggers for Automatic Dispatch
-- Trigger on new Booking
CREATE OR REPLACE FUNCTION public.trigger_dispatch_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'searching' THEN
        PERFORM public.dispatch_booking_offer(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_dispatch_on_booking();

-- Trigger on Offer Declined or Timed Out
CREATE OR REPLACE FUNCTION public.trigger_dispatch_on_offer_decline()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'declined' OR NEW.status = 'timed_out') AND OLD.status = 'offered' THEN
        -- Mark response time
        NEW.responded_at = now();
        PERFORM public.dispatch_booking_offer(NEW.booking_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_offer_declined ON public.booking_offers;
CREATE TRIGGER on_offer_declined
BEFORE UPDATE ON public.booking_offers
FOR EACH ROW
EXECUTE FUNCTION public.trigger_dispatch_on_offer_decline();

-- 4. RPC for Atomic Offer Acceptance
CREATE OR REPLACE FUNCTION public.accept_booking_offer(p_offer_id UUID, p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rows_affected INT;
BEGIN
    -- Verify caller owns the offer, and is a verified worker
    IF NOT EXISTS (
        SELECT 1 FROM public.booking_offers bo
        JOIN public.worker_profiles wp ON bo.worker_id = wp.profile_id
        WHERE bo.id = p_offer_id 
          AND bo.worker_id = auth.uid()
          AND wp.is_verified = true
    ) THEN
        RETURN FALSE;
    END IF;

    -- Atomically update booking if it's still 'searching'
    UPDATE public.bookings 
    SET status = 'accepted', worker_id = auth.uid(), accepted_at = now()
    WHERE id = p_booking_id AND status = 'searching';
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    IF v_rows_affected = 0 THEN
        -- Booking was already taken, cancelled, or expired
        UPDATE public.booking_offers 
        SET status = 'cancelled', responded_at = now() 
        WHERE id = p_offer_id;
        
        RETURN FALSE;
    ELSE
        -- Successfully claimed
        UPDATE public.booking_offers 
        SET status = 'accepted', responded_at = now() 
        WHERE id = p_offer_id;
        
        -- Cancel all other pending offers for this booking (if any)
        UPDATE public.booking_offers 
        SET status = 'cancelled'
        WHERE booking_id = p_booking_id AND id != p_offer_id AND status = 'offered';
        
        RETURN TRUE;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.dispatch_booking_offer TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_booking_offer TO anon;
GRANT EXECUTE ON FUNCTION public.accept_booking_offer TO authenticated;
