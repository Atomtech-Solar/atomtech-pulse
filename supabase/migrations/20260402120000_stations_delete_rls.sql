-- Permite exclusão de estações por super_admin e usuários da própria empresa (company_id).

DROP POLICY IF EXISTS "Super admin can delete stations" ON public.stations;
CREATE POLICY "Super admin can delete stations"
  ON public.stations
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can delete own company stations" ON public.stations;
CREATE POLICY "Users can delete own company stations"
  ON public.stations
  FOR DELETE
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );
