-- Adiciona coluna phone à tabela profiles para cadastro de usuários.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;
