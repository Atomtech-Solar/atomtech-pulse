-- Padronização de lead_submissions: data JSONB por interest_type, índices e migração de legado
-- Ver comentário em buildLeadDataPayload (frontend) para o contrato dos objetos.

comment on column public.lead_submissions.data is
  'JSONB por interest_type: saber_mais (city), investir, avaliar_instalacao, anunciar — ver documentação do app.';

-- Índice para filtros por tipo de interesse
create index if not exists lead_submissions_interest_type_idx
  on public.lead_submissions (interest_type);

-- GIN para consultas genéricas ao documento (containment / chaves)
create index if not exists lead_submissions_data_gin_idx
  on public.lead_submissions using gin (data jsonb_path_ops);

-- Faixa de investimento (analytics / CRM) — só linhas investir
create index if not exists lead_submissions_data_investment_range_idx
  on public.lead_submissions ((data->>'investment_range'))
  where interest_type = 'investir' and coalesce(data->>'investment_range', '') <> '';

-- Migração de dados legados (interest_type + chaves antigas em data)

-- investir: has_location string sim/nao -> boolean
update public.lead_submissions
set data = jsonb_strip_nulls(
  jsonb_build_object(
    'city', nullif(trim(both from coalesce(data->>'city', '')), ''),
    'state', nullif(trim(both from coalesce(data->>'state', '')), ''),
    'investment_range', nullif(trim(both from coalesce(data->>'investment_range', '')), ''),
    'has_location', case
      when jsonb_typeof(data->'has_location') = 'boolean' then data->'has_location'
      when data->>'has_location' = 'sim' then 'true'::jsonb
      when data->>'has_location' = 'nao' then 'false'::jsonb
      else null::jsonb
    end,
    'location_type', nullif(trim(both from coalesce(data->>'location_type', '')), '')
  )
)
where interest_type = 'investir';

-- anunciar: vehicle_flow sim/nao -> boolean
update public.lead_submissions
set data = jsonb_strip_nulls(
  jsonb_build_object(
    'company_name', nullif(trim(both from coalesce(data->>'company_name', '')), ''),
    'business_type', nullif(trim(both from coalesce(data->>'business_type', '')), ''),
    'location', nullif(trim(both from coalesce(data->>'location', '')), ''),
    'vehicle_flow', case
      when jsonb_typeof(data->'vehicle_flow') = 'boolean' then data->'vehicle_flow'
      when data->>'vehicle_flow' = 'sim' then 'true'::jsonb
      when data->>'vehicle_flow' = 'nao' then 'false'::jsonb
      else null::jsonb
    end
  )
)
where interest_type = 'anunciar';

-- avaliar_ponto -> avaliar_instalacao + renomear chaves em data
update public.lead_submissions
set
  interest_type = 'avaliar_instalacao',
  data = jsonb_strip_nulls(
    jsonb_build_object(
      'address', nullif(
        trim(both from coalesce(data->>'full_address', data->>'address', '')),
        ''
      ),
      'place_type', nullif(
        trim(both from coalesce(data->>'location_kind', data->>'place_type', '')),
        ''
      ),
      'has_parking', case
        when jsonb_typeof(data->'has_parking') = 'boolean' then data->'has_parking'
        when data->>'own_parking' = 'sim' then 'true'::jsonb
        when data->>'own_parking' = 'nao' then 'false'::jsonb
        else null::jsonb
      end,
      'power_type', nullif(
        trim(both from coalesce(data->>'electrical_network', data->>'power_type', '')),
        ''
      ),
      'image_url', nullif(
        trim(both from coalesce(data->>'image_url', data->>'image_path', '')),
        ''
      )
    )
  )
where interest_type = 'avaliar_ponto';

-- saber_mais: manter apenas city de forma consistente
update public.lead_submissions
set data = jsonb_build_object(
  'city', coalesce(nullif(trim(both from coalesce(data->>'city', '')), ''), '')
)
where interest_type = 'saber_mais';
