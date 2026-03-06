-- Habilita Supabase Realtime para a tabela stations.
-- Permite que o dashboard receba updates (ex: status online) em tempo real.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'stations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;
  END IF;
END $$;
