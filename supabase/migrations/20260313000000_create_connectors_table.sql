-- Tabela de conectores (bocas) de carregadores OCPP
-- Cada estação pode ter múltiplos conectores com estado independente

CREATE TABLE IF NOT EXISTS public.connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id bigint NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  connector_id integer NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'charging', 'offline', 'online', 'faulted', 'unavailable', 'reserved', 'preparing', 'finishing'
  )),
  power_kw numeric DEFAULT 0,
  energy_kwh numeric DEFAULT 0,
  current_transaction_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(station_id, connector_id)
);

CREATE INDEX IF NOT EXISTS idx_connectors_station ON public.connectors(station_id);

-- RLS: mesma lógica de stations (via company)
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

-- Super admin vê todos
CREATE POLICY "Super admin can select all connectors"
  ON public.connectors
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Usuários veem connectors da própria empresa (via station)
CREATE POLICY "Users can select own company connectors"
  ON public.connectors
  FOR SELECT
  TO authenticated
  USING (
    station_id IN (
      SELECT s.id FROM public.stations s
      WHERE s.company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Backend (SERVICE_ROLE) insere/atualiza sem restrição

-- Para Realtime: habilitar publicação em Supabase Dashboard > Database > Replication
-- Adicionar a tabela "connectors" à publicação
