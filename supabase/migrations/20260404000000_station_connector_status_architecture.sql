-- Arquitetura de status: estação (conexão) vs conector (OCPP operacional)
-- Estação: online | offline | error (WebSocket / erro geral)
-- Conector: available | charging | unavailable | error

-- 1) Estações: normalizar valores legados
UPDATE public.stations
SET status = CASE
  WHEN status = 'error' THEN 'error'
  WHEN status IN ('online', 'charging') THEN 'online'
  ELSE 'offline'
END
WHERE status IS NULL OR status NOT IN ('online', 'offline', 'error');

ALTER TABLE public.stations DROP CONSTRAINT IF EXISTS stations_status_check;
ALTER TABLE public.stations ADD CONSTRAINT stations_status_check
  CHECK (status IN ('online', 'offline', 'error'));

COMMENT ON COLUMN public.stations.status IS 'Conexão OCPP: online | offline | error (não misturar com estado da boca)';

-- 2) Conectores: colapsar estados em 4 valores
UPDATE public.connectors
SET status = CASE
  WHEN status = 'charging' THEN 'charging'
  WHEN status = 'available' THEN 'available'
  WHEN status IN ('faulted', 'error') THEN 'error'
  WHEN status IN (
    'unavailable', 'offline', 'online', 'preparing', 'reserved', 'finishing',
    'idle', 'paused', 'finished'
  ) THEN 'unavailable'
  ELSE 'unavailable'
END;

ALTER TABLE public.connectors DROP CONSTRAINT IF EXISTS connectors_status_check;
ALTER TABLE public.connectors ADD CONSTRAINT connectors_status_check
  CHECK (status IN ('available', 'charging', 'unavailable', 'error'));

COMMENT ON COLUMN public.connectors.status IS 'OCPP agregado: available | charging | unavailable | error';
