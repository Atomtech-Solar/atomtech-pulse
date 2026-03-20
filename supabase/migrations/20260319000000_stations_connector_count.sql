-- Optional connector count at station creation (used by OCPP BootNotification when present).
-- If null, connectors are created only via StatusNotification (dynamic).
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS connector_count integer NULL;

COMMENT ON COLUMN public.stations.connector_count IS 'Optional. If set, BootNotification creates this many connectors (1..N). If null, connectors are created only when charger sends StatusNotification.';
