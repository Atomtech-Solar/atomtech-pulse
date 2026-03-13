# Deploy da Edge Function `create-user` no projeto correto

A Edge Function foi deployada no projeto Supabase errado. Siga estes passos para deployar no projeto correto.

## Pré-requisitos

1. **Supabase CLI** instalado:
   ```bash
   npm install -g supabase
   ```

2. **Login** na CLI (se ainda não estiver):
   ```bash
   supabase login
   ```

## Passos

### 1. Vincular ao projeto correto

No diretório do projeto:

```bash
cd "d:\EV - Atomtech\atomtech-pulse"
supabase link --project-ref SEU_PROJECT_REF
```

**Onde encontrar o Project Ref:**
- Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
- Selecione o projeto **correto** (atomtech-pulse)
- Vá em **Settings → General**
- Em **Reference ID** está o `project-ref` (ex: `abcdefghijklmnop`)

### 2. Deploy da função

```bash
supabase functions deploy create-user
```

O deploy usa automaticamente as variáveis do projeto (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Não é necessário configurá-las manualmente — o Supabase já as injeta.

### 3. Verificar

- No Dashboard: **Edge Functions** → deve aparecer `create-user` com status ativo
- Teste o cadastro na aplicação

## Se o `supabase link` não existir

Se a pasta `supabase` ainda não estiver vinculada a nenhum projeto, o comando `supabase link` vai criar a vinculação. Se já estiver vinculada ao projeto errado, ele será sobrescrito pelo novo.

## Remover link do projeto errado (opcional)

Se quiser remover o link antes de vincular ao correto:

```bash
supabase unlink
```

Depois execute `supabase link --project-ref PROJETO_CORRETO`.
