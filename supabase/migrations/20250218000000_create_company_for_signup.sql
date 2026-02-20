-- Função para criar empresa e associar ao perfil do usuário recém-cadastrado.
-- Necessária porque RLS impede INSERT direto em companies para usuários anônimos/não super_admin.
-- Executar no SQL Editor do Supabase se ainda não existir.

CREATE OR REPLACE FUNCTION public.create_company_for_signup(
  p_company_name text,
  p_cnpj text,
  p_user_email text,
  p_user_name text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id bigint;
  v_cnpj text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  v_cnpj := regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g');
  IF length(v_cnpj) <> 14 THEN
    RAISE EXCEPTION 'CNPJ inválido';
  END IF;

  SELECT c.id
  INTO v_company_id
  FROM companies c
  WHERE regexp_replace(coalesce(c.cnpj, ''), '\D', '', 'g') = v_cnpj
  LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO companies (name, cnpj)
    VALUES (trim(p_company_name), v_cnpj)
    RETURNING id INTO v_company_id;
  END IF;

  UPDATE profiles
  SET company_id = v_company_id, role = 'company_admin',
      name = coalesce(trim(nullif(p_user_name, '')), name)
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, email, name, company_id, role)
    VALUES (v_user_id, p_user_email, coalesce(trim(nullif(p_user_name, '')), split_part(p_user_email, '@', 1)), v_company_id, 'company_admin');
  END IF;

  RETURN v_company_id;
END;
$$;
