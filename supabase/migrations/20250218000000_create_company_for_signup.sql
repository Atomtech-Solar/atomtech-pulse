-- Função para criar empresa e associar ao perfil do usuário recém-cadastrado.
-- Necessária porque RLS impede INSERT direto em companies para usuários anônimos/não super_admin.
-- Executar no SQL Editor do Supabase se ainda não existir.

CREATE OR REPLACE FUNCTION public.create_company_for_signup(
  p_company_name text,
  p_user_email text,
  p_user_name text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  INSERT INTO companies (name)
  VALUES (trim(p_company_name))
  RETURNING id INTO v_company_id;

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
