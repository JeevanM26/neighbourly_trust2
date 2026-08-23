-- SQL script to create a debug RPC
CREATE OR REPLACE FUNCTION public.debug_get_latest_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res json;
BEGIN
  SELECT json_build_object(
    'latest_bookings', (
      SELECT json_agg(t) FROM (
        SELECT id, customer_id, category_id, status, created_at, customer_lat, customer_lng
        FROM public.bookings
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    ),
    'latest_offers', (
      SELECT json_agg(t) FROM (
        SELECT id, booking_id, worker_id, status, offered_at
        FROM public.booking_offers
        ORDER BY offered_at DESC
        LIMIT 5
      ) t
    ),
    'workers_online', (
      SELECT json_agg(t) FROM (
        SELECT profile_id, is_online, location::text
        FROM public.worker_profiles
        WHERE is_online = true
      ) t
    )
  ) INTO res;
  RETURN res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_get_latest_data TO anon;
GRANT EXECUTE ON FUNCTION public.debug_get_latest_data TO authenticated;
