-- 20260809000000_booking_lat_lng.sql
-- Add explicit lat/lng columns to bookings for easier frontend consumption

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS customer_lng DOUBLE PRECISION;

-- Backfill from existing GEOGRAPHY column if not null
UPDATE public.bookings
SET 
  customer_lat = ST_Y(customer_location::geometry),
  customer_lng = ST_X(customer_location::geometry)
WHERE customer_location IS NOT NULL AND customer_lat IS NULL;
