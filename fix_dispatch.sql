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
        v_booking.customer_lat, 
        v_booking.customer_lng, 
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
