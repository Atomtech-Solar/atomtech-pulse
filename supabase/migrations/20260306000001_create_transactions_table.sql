-- Tabela de sessões de carregamento OCPP (StartTransaction, MeterValues, StopTransaction)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ocpp_transaction_id integer NOT NULL UNIQUE,
  station_id bigint NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  charge_point_id text NOT NULL,
  connector_id integer NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  meter_start integer NOT NULL DEFAULT 0,
  meter_stop integer,
  energy_kwh numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_ocpp_id ON public.transactions (ocpp_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_station_id ON public.transactions (station_id);
CREATE INDEX IF NOT EXISTS idx_transactions_charge_point_id ON public.transactions (charge_point_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);

-- RLS: mesma lógica de stations (company via station)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Super admin vê todas
CREATE POLICY "Super admin can select all transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Usuários veem transactions da própria empresa (via station)
CREATE POLICY "Users can select own company transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    station_id IN (
      SELECT s.id FROM public.stations s
      WHERE s.company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Backend (SERVICE_ROLE) insere/atualiza sem restrição
