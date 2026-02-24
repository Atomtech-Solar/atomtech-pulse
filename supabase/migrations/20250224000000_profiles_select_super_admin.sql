-- Permite que super_admin leia todos os perfis (para Landing Page Analytics).
-- Cria a função is_super_admin se não existir (checa role em profiles).

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Super admin: pode ler todos os perfis (Landing Page Analytics).
DROP POLICY IF EXISTS "Super admin can select all profiles" ON public.profiles;
CREATE POLICY "Super admin can select all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Usuários podem ler o próprio perfil.
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
