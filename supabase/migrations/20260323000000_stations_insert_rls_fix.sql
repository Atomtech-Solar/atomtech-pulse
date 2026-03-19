-- Fix RLS INSERT em stations: evita hang causado por subquery inline em policies.
-- Usa função SECURITY DEFINER para consulta em profiles (mais rápida, sem RLS recursivo).

-- 1) Função auxiliar: retorna company_id do usuário logado (SECURITY DEFINER bypassa RLS em profiles)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2) Remove políticas INSERT antigas e recria com a função (evita subquery inline que pode travar)
DROP POLICY IF EXISTS "Super admin can insert stations" ON public.stations;
DROP POLICY IF EXISTS "Users can insert own company stations" ON public.stations;

-- Super admin: pode inserir qualquer estação
CREATE POLICY "Super admin can insert stations"
  ON public.stations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Usuário comum: só inserir se company_id = profile.company_id (usa função, não subquery inline)
CREATE POLICY "Users can insert own company stations"
  ON public.stations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
  );

-- 3) [DEBUG] Política permissiva temporária - REMOVER após confirmar que insert funciona
-- Se o insert funcionar com isso, confirma que RLS era a causa. Depois comente/remova.
-- DROP POLICY IF EXISTS "debug_stations_insert_allow" ON public.stations;
-- CREATE POLICY "debug_stations_insert_allow"
--   ON public.stations FOR INSERT TO authenticated
--   WITH CHECK (true);
