-- RPC para Landing Page Analytics: leitura agregada sem depender de RLS em joins (SECURITY DEFINER).
-- Segurança: só usuários autenticados com role super_admin em profiles podem executar.
-- Reversível: remover a função e voltar ao SELECT direto no hook quando multi-tenant estiver maduro.

CREATE OR REPLACE FUNCTION public.get_landing_profiles()
RETURNS TABLE (
  user_id uuid,
  email text,
  name text,
  phone text,
  role text,
  company_id integer,
  created_at timestamptz,
  company_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária'
      USING ERRCODE = '42501',
            HINT = 'Sessão inválida ou expirada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administrador'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email::text,
    p.name::text,
    p.phone::text,
    p.role::text,
    p.company_id,
    p.created_at,
    c.name::text AS company_name
  FROM public.profiles p
  LEFT JOIN public.companies c ON c.id = p.company_id
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_landing_profiles() IS
  'Landing Page Analytics: lista profiles + nome da empresa (bypass RLS). Apenas super_admin. Leitura.';

REVOKE ALL ON FUNCTION public.get_landing_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_profiles() TO authenticated;
