-- RLS da tabela companies: garante que super_admin possa ver e cadastrar empresas sem erro.
-- A função is_super_admin() deve retornar true para o usuário logado com role super_admin em profiles.

-- 1) Função is_super_admin: retorna false se auth.uid() for NULL; caso contrário consulta profiles.
--    SECURITY DEFINER permite ler profiles mesmo com RLS ativo (usa privilégios do dono da função).
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (p.role = 'super_admin')
     FROM public.profiles p
     WHERE p.user_id = auth.uid()
     LIMIT 1),
    false
  );
$$;

-- 2) Garante RLS ativo em companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3) Remove todas as políticas atuais de companies para recriar de forma limpa
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', r.policyname);
  END LOOP;
END $$;

-- 4) SELECT: super_admin vê todas; demais usuários veem só a empresa do próprio perfil
CREATE POLICY "companies_select_super_admin"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "companies_select_own_company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- 5) INSERT: apenas super_admin
CREATE POLICY "companies_insert_super_admin"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- 6) UPDATE: apenas super_admin
CREATE POLICY "companies_update_super_admin"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 7) DELETE: apenas super_admin (para gestão completa na aba Empresas)
CREATE POLICY "companies_delete_super_admin"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());
