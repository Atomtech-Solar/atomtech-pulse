-- Índice para acelerar subquery RLS em stations (SELECT company_id FROM profiles WHERE user_id = auth.uid()).
-- Evita slow query que pode causar timeout/hang.
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
