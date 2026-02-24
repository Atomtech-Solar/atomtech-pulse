-- Permite que super_admin leia todas as empresas (aba Empresas e join em Landing Analytics).
-- Usuários não-admin podem ler a empresa do próprio perfil.
-- Depende de is_super_admin() existir (migration 20250224000000).

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can select all companies" ON public.companies;
CREATE POLICY "Super admin can select all companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can select own company" ON public.companies;
CREATE POLICY "Users can select own company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );
