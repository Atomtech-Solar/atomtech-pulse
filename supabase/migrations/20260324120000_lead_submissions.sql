-- Formulário de interesse (landing) — armazenamento de leads
create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  phone varchar(64) not null,
  email varchar(255),
  interest_type varchar(64) not null,
  message text,
  created_at timestamptz not null default now()
);

comment on table public.lead_submissions is 'Envios do formulário de interesse da landing (LGPD).';

create index if not exists lead_submissions_created_at_idx on public.lead_submissions (created_at desc);

alter table public.lead_submissions enable row level security;

-- Inserção pública (anon + autenticado) para captura na landing
create policy "lead_submissions_insert_public"
  on public.lead_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Leitura restrita: apenas service role / painel futuro (sem policy de SELECT para anon)
