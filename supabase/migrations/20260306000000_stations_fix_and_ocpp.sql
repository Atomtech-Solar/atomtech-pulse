-- Corrige charge_point_id (typo charget_point_id) e padroniza estrutura para OCPP.
-- Status válidos: offline, online, charging, faulted, unavailable.

-- 1) Corrigir typo: renomear charget_point_id para charge_point_id (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stations' AND column_name = 'charget_point_id'
  ) THEN
    ALTER TABLE public.stations RENAME COLUMN charget_point_id TO charge_point_id;
  END IF;
END $$;

-- 2) Garantir coluna charge_point_id existe
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS charge_point_id text;

-- 3) Remover constraint antigo se existir
ALTER TABLE public.stations DROP CONSTRAINT IF EXISTS stations_charge_point_id_key;

-- 4) Constraint UNIQUE (permite NULL para registros legados; novos registros exigem valor)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stations_charge_point_id_key'
  ) THEN
    ALTER TABLE public.stations ADD CONSTRAINT stations_charge_point_id_key UNIQUE (charge_point_id);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'charge_point_id duplicados existem - resolva antes de aplicar';
END $$;

-- 6) Garantir colunas OCPP
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS last_seen timestamptz,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric,
  ADD COLUMN IF NOT EXISTS total_kwh numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sessions integer DEFAULT 0;

-- 7) Status default
ALTER TABLE public.stations ALTER COLUMN status SET DEFAULT 'offline';

-- 8) Normalizar status inválidos e adicionar check constraint
UPDATE public.stations
SET status = 'offline'
WHERE status IS NULL OR status NOT IN ('offline', 'online', 'charging', 'faulted', 'unavailable');

ALTER TABLE public.stations DROP CONSTRAINT IF EXISTS stations_status_check;
ALTER TABLE public.stations ADD CONSTRAINT stations_status_check
  CHECK (status IN ('offline', 'online', 'charging', 'faulted', 'unavailable'));

-- 9) Índices
CREATE INDEX IF NOT EXISTS idx_stations_charge_point_id ON public.stations (charge_point_id);
CREATE INDEX IF NOT EXISTS idx_stations_company_id ON public.stations (company_id);
