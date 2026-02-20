-- Corrige erro de RLS no INSERT de profiles sem abrir acesso amplo.
-- Regra: usuário autenticado só pode inserir o próprio profile.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

