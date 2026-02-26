-- Garante que a coluna phone existe e que trigger + função salvam o telefone corretamente.
-- Execute este arquivo no SQL Editor do Supabase se db push não aplicar.

-- 1. Coluna phone em profiles (se não existir)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Trigger handle_new_user com phone
-- Cadastro como usuário -> role viewer | Cadastro como empresa -> role company_admin (create_company_for_signup ajusta depois)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Se tem company_name no metadata = cadastro empresa, senão = cadastro usuário (viewer)
  v_role := CASE
    WHEN (NEW.raw_user_meta_data->>'company_name') IS NOT NULL AND trim(NEW.raw_user_meta_data->>'company_name') <> '' 
    THEN 'company_admin'
    ELSE 'viewer'
  END;
  INSERT INTO public.profiles (user_id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '')
  );
  RETURN NEW;
END;
$$;

-- 3. Função create_company_for_signup com p_phone
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
