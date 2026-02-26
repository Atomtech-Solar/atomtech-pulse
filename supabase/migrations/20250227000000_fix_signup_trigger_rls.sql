-- Correção do erro "database error saving new user" (500) no signup.
-- Causa: a trigger handle_new_user falha ao inserir em profiles (RLS ou auth.uid() NULL no signup).
-- Solução: política que permite a trigger inserir + função mais robusta.

-- 1. Política para INSERT durante signup
-- auth.uid() é NULL no momento do signup, então profiles_insert_own falha.
-- Permite roles que podem executar a trigger (SECURITY DEFINER).
DROP POLICY IF EXISTS "Allow signup trigger to insert profile" ON public.profiles;
CREATE POLICY "Allow signup trigger to insert profile"
  ON public.profiles
  FOR INSERT
  TO postgres, service_role, supabase_auth_admin
  WITH CHECK (true);

-- 2. Atualiza handle_new_user: role viewer por padrão, casting explícito do enum, tratamento de nulls
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_name text;
  v_phone text;
  v_meta jsonb;
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_name := COALESCE(NULLIF(trim(v_meta->>'name'), ''), split_part(NEW.email, '@', 1));
  v_phone := NULLIF(trim(v_meta->>'phone'), '');

  -- Cadastro usuário -> viewer | Cadastro empresa (tem company_name) -> company_admin
  IF (v_meta->>'company_name') IS NOT NULL AND trim(v_meta->>'company_name') <> '' THEN
    v_role := 'company_admin'::public.user_role;
  ELSE
    v_role := 'viewer'::public.user_role;
  END IF;

  INSERT INTO public.profiles (user_id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_role,
    v_phone
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: % (user_id=%)', SQLERRM, NEW.id;
    RAISE;
END;
$$;

