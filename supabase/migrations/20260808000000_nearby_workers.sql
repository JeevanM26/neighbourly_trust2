-- Migration: Create nearby_workers RPC
-- Drops the old version and creates the updated spatial lookup for PostGIS

DROP FUNCTION IF EXISTS public.nearby_workers;

CREATE OR REPLACE FUNCTION public.nearby_workers(
  p_category_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_max_distance_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  worker_id UUID,
  full_name TEXT,
  rating NUMERIC,
  total_jobs INTEGER,
  service_radius_km NUMERIC,
  distance_km DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wp.profile_id as worker_id,
    p.full_name,
    wp.avg_rating as rating,
    wp.total_jobs,
    wp.service_radius_km,
    ST_Distance(
      wp.location, 
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0 AS distance_km,
    ST_Y(wp.location::geometry) as lat,
    ST_X(wp.location::geometry) as lng
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
  ORDER BY distance_km ASC;
$$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.nearby_workers TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_workers TO anon;
