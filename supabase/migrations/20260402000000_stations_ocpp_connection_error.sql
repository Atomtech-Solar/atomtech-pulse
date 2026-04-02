-- OCPP: tipo de conexão (ws/wss), host/porta para URL, último erro e status "error".

ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS connection_type text NOT NULL DEFAULT 'wss',
  ADD COLUMN IF NOT EXISTS ocpp_host text,
  ADD COLUMN IF NOT EXISTS ocpp_port integer,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.stations DROP CONSTRAINT IF EXISTS stations_connection_type_check;
ALTER TABLE public.stations
  ADD CONSTRAINT stations_connection_type_check
  CHECK (connection_type IN ('ws', 'wss'));

COMMENT ON COLUMN public.stations.connection_type IS 'ws = IP (ex.: ws://IP:8080/ocpp), wss = domínio TLS (ex.: wss://ocpp.dominio.com/ocpp)';
COMMENT ON COLUMN public.stations.ocpp_host IS 'Host para URL OCPP (IP sem porta ou domínio), sem esquema';
COMMENT ON COLUMN public.stations.ocpp_port IS 'Porta opcional na URL (ex.: 8080 para WS; omitir para 443 em WSS)';
COMMENT ON COLUMN public.stations.last_error IS 'Última mensagem de erro (protocolo, socket, autenticação)';

-- Inclui status "error" operacional
UPDATE public.stations
SET status = 'offline'
WHERE status IS NULL OR status NOT IN ('offline', 'online', 'charging', 'faulted', 'unavailable', 'error');

ALTER TABLE public.stations DROP CONSTRAINT IF EXISTS stations_status_check;
ALTER TABLE public.stations ADD CONSTRAINT stations_status_check
  CHECK (status IN ('offline', 'online', 'charging', 'faulted', 'unavailable', 'error'));

CREATE OR REPLACE FUNCTION public.set_stations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stations_set_updated_at ON public.stations;
CREATE TRIGGER stations_set_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_stations_updated_at();
