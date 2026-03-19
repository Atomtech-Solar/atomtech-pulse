-- DEBUG ONLY: Política permissiva para testar se RLS causa o hang no INSERT.
-- Aplicar: supabase db push (ou executar manualmente)
-- Se o insert funcionar após aplicar esta migration → RLS era a causa.
-- IMPORTANTE: Remover após debug (executar o rollback abaixo no SQL Editor do Supabase)

-- Adiciona política que permite qualquer INSERT de usuário autenticado
CREATE POLICY "debug_stations_insert_permissive"
  ON public.stations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- === ROLLBACK (executar no Supabase SQL Editor após confirmar): ===
-- DROP POLICY IF EXISTS "debug_stations_insert_permissive" ON public.stations;
