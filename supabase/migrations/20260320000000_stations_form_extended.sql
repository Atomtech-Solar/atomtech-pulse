-- Campos estendidos para o formulário de estação em 4 partes (Geral, Endereço, Pagamento, Fotos).
-- Todas as colunas opcionais para compatibilidade com dados existentes.

-- ========== GERAL (1/4) ==========
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS station_type text,
  ADD COLUMN IF NOT EXISTS station_group text,
  ADD COLUMN IF NOT EXISTS enable_reservation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_charge_percentage boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS opening_time time,
  ADD COLUMN IF NOT EXISTS closing_time time,
  ADD COLUMN IF NOT EXISTS open_24h boolean DEFAULT true;

-- ========== ENDEREÇO (2/4) ==========
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT true;

-- ========== PAGAMENTO (3/4) ==========
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS charge_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS charge_type text,
  ADD COLUMN IF NOT EXISTS cost_per_kwh numeric(10, 4),
  ADD COLUMN IF NOT EXISTS revenue_charge_type text,
  ADD COLUMN IF NOT EXISTS revenue_per_start numeric(10, 4),
  ADD COLUMN IF NOT EXISTS revenue_tax_percent numeric(5, 2),
  ADD COLUMN IF NOT EXISTS revenue_per_kwh numeric(10, 4);

-- ========== FOTOS (4/4) ==========
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS main_photo_url text,
  ADD COLUMN IF NOT EXISTS photo_urls text[];

COMMENT ON COLUMN public.stations.enabled IS 'Habilitar estação (visível/ativa)';
COMMENT ON COLUMN public.stations.open_24h IS 'Aberto 24 horas; se true, opening_time/closing_time ignorados';
COMMENT ON COLUMN public.stations.charge_type IS 'kwh ou min - usado quando charge_enabled = true';
