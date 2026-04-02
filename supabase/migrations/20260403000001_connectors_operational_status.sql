-- Estados operacionais adicionais para UI (idle, paused, finished, error)

ALTER TABLE public.connectors DROP CONSTRAINT IF EXISTS connectors_status_check;

ALTER TABLE public.connectors ADD CONSTRAINT connectors_status_check
  CHECK (status IN (
    'available', 'charging', 'offline', 'online', 'faulted', 'unavailable',
    'reserved', 'preparing', 'finishing',
    'idle', 'paused', 'finished', 'error'
  ));
