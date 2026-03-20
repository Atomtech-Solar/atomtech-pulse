-- Verificação e documentação das políticas RLS para profiles e companies.
-- IMPORTANTE: Quando auth.uid() é NULL (sessão expirada), as políticas retornam false/vazio.
-- O frontend deve: (1) não executar queries sem sessão válida, (2) refresh ao focar aba.

-- ========== PROFILES ==========
-- SELECT: próprio perfil OU super_admin vê todos.
-- A função is_super_admin() lê profiles com auth.uid() - se NULL, retorna false.

-- Garante que is_super_admin existe e está correta.
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

-- Políticas profiles (idempotente - recria se necessário).
DROP POLICY IF EXISTS "Super admin can select all profiles" ON public.profiles;
CREATE POLICY "Super admin can select all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ========== COMPANIES ==========
-- SELECT: super_admin vê todas; outros veem só a empresa do próprio perfil.
-- A subquery (SELECT company_id FROM profiles WHERE user_id = auth.uid()) retorna NULL se auth.uid() é NULL.

-- Não recriar policies de companies aqui (já existem em 20250225100000).
-- Apenas documentar: as policies atuais são suficientes.
-- Se auth.uid() = NULL: is_super_admin() = false, subquery = NULL → nenhuma row passa.
