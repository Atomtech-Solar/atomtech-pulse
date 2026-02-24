-- Adiciona campos URL e logo (foto) da empresa.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Super admin pode inserir e atualizar empresas.
DROP POLICY IF EXISTS "Super admin can insert companies" ON public.companies;
CREATE POLICY "Super admin can insert companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can update companies" ON public.companies;
CREATE POLICY "Super admin can update companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
