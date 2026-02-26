-- Adiciona parâmetro p_phone à função create_company_for_signup para salvar telefone no profile.

CREATE OR REPLACE FUNCTION public.create_company_for_signup(
  p_company_name text,
  p_cnpj text,
  p_user_email text,
  p_user_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
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
  v_phone text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  v_cnpj := regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g');
  IF length(v_cnpj) <> 14 THEN
    RAISE EXCEPTION 'CNPJ inválido';
  END IF;

  v_phone := NULLIF(trim(coalesce(p_phone, '')), '');

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
      name = coalesce(trim(nullif(p_user_name, '')), name),
      phone = coalesce(v_phone, phone)
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, email, name, company_id, role, phone)
    VALUES (v_user_id, p_user_email, coalesce(trim(nullif(p_user_name, '')), split_part(p_user_email, '@', 1)), v_company_id, 'company_admin', v_phone);
  END IF;

  RETURN v_company_id;
END;
$$;
