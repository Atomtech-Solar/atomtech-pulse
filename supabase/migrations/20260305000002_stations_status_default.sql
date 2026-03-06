-- Garante que status default seja 'offline' e aceita faulted.
-- Status só muda via eventos OCPP (BootNotification, etc).

ALTER TABLE public.stations
  ALTER COLUMN status SET DEFAULT 'offline';
