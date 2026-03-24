-- Campos específicos por tipo de interesse (payload dinâmico)
alter table public.lead_submissions
  add column if not exists data jsonb not null default '{}'::jsonb;

comment on column public.lead_submissions.data is 'Campos específicos por interest_type (qualificação).';

-- Bucket para anexos opcionais do formulário de avaliação (landing / anon)
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'lead-attachments') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'lead-attachments',
      'lead-attachments',
      true,
      5242880,
      array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
    );
  end if;
end $$;

drop policy if exists "Anonymous upload lead attachments" on storage.objects;
create policy "Anonymous upload lead attachments"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'lead-attachments');

drop policy if exists "Public read lead attachments" on storage.objects;
create policy "Public read lead attachments"
  on storage.objects for select
  to public
  using (bucket_id = 'lead-attachments');
