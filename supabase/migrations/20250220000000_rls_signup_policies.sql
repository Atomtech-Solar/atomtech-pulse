-- Políticas RLS para fluxo de cadastro com princípio de menor privilégio.
-- Este arquivo mantém apenas regras de profiles (sem políticas abertas).

-- Profiles: permitir INSERT para o próprio usuário (signup)
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
CREATE POLICY "Allow insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Profiles: permitir UPDATE do próprio perfil
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
CREATE POLICY "Allow update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
