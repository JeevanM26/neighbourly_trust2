-- Enable Realtime replication for worker_profiles to broadcast live worker location & online status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'worker_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_profiles;
  END IF;
END $$;
