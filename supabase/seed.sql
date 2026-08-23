-- ============================================================================
-- NEIGHBORLY TRUST — PRODUCTION DATABASE SEED DATA
-- Populate initial provider profiles and sample records in Supabase
-- ============================================================================

-- Seed User & Provider Profiles (UUIDs generated statically for seed consistency)
INSERT INTO public.profiles (id, full_name, phone, role, language, consent_given, avatar_url)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Jim Caldwell', '+91 98765 43210', 'provider', 'en', true, 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Jenkins', '+91 98765 43211', 'provider', 'en', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
  ('33333333-3333-3333-3333-333333333333', 'Robert Evans', '+91 98765 43212', 'provider', 'en', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
  ('44444444-4444-4444-4444-444444444444', 'Meena Kulkarni', '+91 98765 43213', 'provider', 'kn', true, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

INSERT INTO public.provider_profiles (id, category, description, hourly_rate, avg_rating, reviews_count, is_online, lat, lng, featured)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Electrician', 'Master Electrician with 12+ years experience in domestic & farm wiring.', 350.00, 4.90, 124, true, 13.9381, 75.5745, true),
  ('22222222-2222-2222-2222-222222222222', 'Plumber', 'Plumbing Specialist for leaks, pipe fittings, solar heaters & borewell pumps.', 400.00, 4.80, 89, true, 13.9142, 75.5812, false),
  ('33333333-3333-3333-3333-333333333333', 'Carpenter', 'Custom woodwork, roof repair, door fittings & agricultural tool handles.', 300.00, 5.00, 215, true, 13.9335, 75.5622, true),
  ('44444444-4444-4444-4444-444444444444', 'Home Clean', 'Deep cleaning, dusting, and sanitizing for homes and small offices.', 320.00, 4.70, 63, true, 13.9218, 75.5758, false)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  hourly_rate = EXCLUDED.hourly_rate;
