-- Estados de sessão alinhados a carregamento real (OCPP 1.6)
-- pending = StartTransaction aceito, aguardando fluxo real
-- charging = fluxo real detectado (potência/corrente ou energia)
-- paused = fluxo abaixo do limiar (opcional; pode coincidir com charging + monitor)
-- completed = encerramento normal
-- cancelled = fantasma / sem consumo real

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

UPDATE public.transactions SET status = 'charging' WHERE status = 'active';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS last_energy_flow_at timestamptz;

COMMENT ON COLUMN public.transactions.last_energy_flow_at IS 'Última amostra com potência/corrente acima do limiar (carregamento real)';

ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('pending', 'charging', 'paused', 'completed', 'cancelled'));

ALTER TABLE public.transactions ALTER COLUMN status SET DEFAULT 'pending';
