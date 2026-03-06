-- Adiciona colunas OCPP à tabela stations e configura RLS.
-- Garante charge_point_id único e índices para performance.

-- Colunas OCPP (idempotente)
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS charge_point_id text,
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Constraint único para charge_point_id (permite NULL para registros antigos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stations_charge_point_id_key'
  ) THEN
    ALTER TABLE public.stations ADD CONSTRAINT stations_charge_point_id_key UNIQUE (charge_point_id);
  END IF;
EXCEPTION
  WHEN unique_violation THEN NULL; -- ignora se já existir
END $$;

-- Índices para charge_point_id e company_id
CREATE INDEX IF NOT EXISTS idx_stations_charge_point_id ON public.stations (charge_point_id);
CREATE INDEX IF NOT EXISTS idx_stations_company_id ON public.stations (company_id);

-- RLS: usuário só acessa stations da própria company (super_admin vê todas)
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can select all stations" ON public.stations;
CREATE POLICY "Super admin can select all stations"
  ON public.stations
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can select own company stations" ON public.stations;
CREATE POLICY "Users can select own company stations"
  ON public.stations
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Super admin can insert stations" ON public.stations;
CREATE POLICY "Super admin can insert stations"
  ON public.stations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users can insert own company stations" ON public.stations;
CREATE POLICY "Users can insert own company stations"
  ON public.stations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Super admin can update stations" ON public.stations;
CREATE POLICY "Super admin can update stations"
  ON public.stations
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users can update own company stations" ON public.stations;
CREATE POLICY "Users can update own company stations"
  ON public.stations
  FOR UPDATE
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );
