-- Landing Page Analytics (single-tenant): remove bloqueio de RLS em leituras via PostgREST (join profiles + companies).
-- A UI continua restrita a super_admin no React; o front não usa mais a RPC get_landing_profiles.
--
-- AVISO: antes de ir a multi-tenant em produção, reative RLS e revise políticas (ou use RPC + SECURITY DEFINER corrigida).

DROP FUNCTION IF EXISTS public.get_landing_profiles();

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.profiles IS
  'RLS desabilitado temporariamente para analytics/joins — reativar para isolamento multi-tenant.';
COMMENT ON TABLE public.companies IS
  'RLS desabilitado temporariamente para analytics/joins — reativar para isolamento multi-tenant.';
