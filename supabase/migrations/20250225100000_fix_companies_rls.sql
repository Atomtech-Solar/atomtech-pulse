-- Corrige conflito de RLS em companies: remove todas as políticas e recria apenas as necessárias.
-- Garante que super_admin possa SELECT, INSERT e UPDATE; usuários comuns possam SELECT da própria empresa.

-- Garante que a função exista (dependência das políticas).
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

-- Remove todas as políticas existentes na tabela companies para evitar conflito.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', r.policyname);
  END LOOP;
END $$;

-- Colunas opcionais (idempotente).
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS logo_url text;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- SELECT: super_admin vê todas; outros veem só a empresa do próprio perfil.
CREATE POLICY "Super admin can select all companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Users can select own company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- INSERT e UPDATE: apenas super_admin.
CREATE POLICY "Super admin can insert companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
