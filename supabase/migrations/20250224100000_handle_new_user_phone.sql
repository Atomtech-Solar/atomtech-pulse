-- Atualiza o trigger handle_new_user para incluir phone e role correta.
-- Cadastro usuário -> viewer | Cadastro empresa -> company_admin

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
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
