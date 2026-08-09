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

    -- First try the explicitly requested worker, if they haven't been offered yet
    IF v_booking.worker_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.booking_offers bo 
        WHERE bo.booking_id = p_booking_id AND bo.worker_id = v_booking.worker_id
    ) THEN
        -- Verify they are online and match category
        SELECT wp.profile_id INTO v_worker_id
        FROM public.worker_profiles wp
        JOIN public.worker_categories wc ON wp.profile_id = wc.worker_id
        WHERE wp.profile_id = v_booking.worker_id
          AND wc.category_id = v_booking.category_id
          AND wp.is_online = true;
    END IF;

    -- If no explicitly requested worker, or they already declined, find nearest online worker
    IF v_worker_id IS NULL THEN
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
    END IF;

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
