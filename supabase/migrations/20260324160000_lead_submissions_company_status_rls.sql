-- Leads por empresa + status comercial + leitura/atualização via RLS (dashboard)

alter table public.lead_submissions
  add column if not exists company_id integer references public.companies (id) on delete set null;

alter table public.lead_submissions
  add column if not exists lead_status text not null default 'new'
    check (lead_status in ('new', 'contact', 'converted'));

alter table public.lead_submissions
  add column if not exists updated_at timestamptz not null default now();

comment on column public.lead_submissions.company_id is 'Empresa dona do lead (landing deve enviar o id alvo).';
comment on column public.lead_submissions.lead_status is 'new | contact | converted — pipeline comercial.';

create index if not exists lead_submissions_company_id_idx on public.lead_submissions (company_id);
create index if not exists lead_submissions_lead_status_idx on public.lead_submissions (lead_status);

-- Leitura: super_admin vê tudo; demais usuários autenticados só leads da própria empresa
drop policy if exists "lead_submissions_select_scope" on public.lead_submissions;
create policy "lead_submissions_select_scope"
  on public.lead_submissions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and (
        p.role::text = 'super_admin'
        or (
          p.company_id is not null
          and lead_submissions.company_id is not null
          and p.company_id = lead_submissions.company_id
        )
      )
    )
  );

-- Atualização (status): super_admin, company_admin e manager
drop policy if exists "lead_submissions_update_pipeline" on public.lead_submissions;
create policy "lead_submissions_update_pipeline"
  on public.lead_submissions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and (
        p.role::text = 'super_admin'
        or (
          p.company_id is not null
          and lead_submissions.company_id is not null
          and p.company_id = lead_submissions.company_id
          and p.role::text in ('company_admin', 'manager')
        )
      )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and (
        p.role::text = 'super_admin'
        or (
          p.company_id is not null
          and lead_submissions.company_id is not null
          and p.company_id = lead_submissions.company_id
          and p.role::text in ('company_admin', 'manager')
        )
      )
    )
  );
