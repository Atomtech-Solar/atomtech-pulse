-- Habilita Supabase Realtime para connectors e transactions.
-- Permite que a página de detalhes da estação receba updates em tempo real.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'connectors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connectors;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;
