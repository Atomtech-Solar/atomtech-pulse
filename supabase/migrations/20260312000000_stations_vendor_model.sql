-- Adiciona charge_point_vendor e charge_point_model para BootNotification OCPP 1.6
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS charge_point_vendor text,
  ADD COLUMN IF NOT EXISTS charge_point_model text;
