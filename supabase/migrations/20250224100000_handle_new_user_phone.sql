-- Atualiza o trigger handle_new_user para incluir phone do raw_user_meta_data.
-- Assim o telefone informado no cadastro aparece em profiles mesmo no fluxo de confirmação de email.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'company_admin',
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '')
  );
  RETURN NEW;
END;
$$;
