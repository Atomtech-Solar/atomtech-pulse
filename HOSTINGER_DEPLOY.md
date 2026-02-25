# Deploy Atomtech Pulse na Hostinger (Supabase)

Este guia ajuda a configurar o deploy na Hostinger para que o Supabase funcione corretamente (incluindo login).

---

## 1. Variáveis de ambiente no Hostinger

O Vite injeta `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` **no momento do build**. Essas variáveis **precisam estar definidas no Hostinger** quando o build rodar.

### Opção A — Importar de um arquivo .env (recomendado)

1. Crie um arquivo `.env.production` localmente (ou use o conteúdo abaixo).
2. No painel Hostinger, durante o deploy do Node.js, na etapa **Environment variables**:
   - Selecione **Import from .env file**.
   - Cole o conteúdo do arquivo ou faça upload dele.
3. Confirme as variáveis e prossiga com o build.

Conteúdo mínimo necessário:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### Opção B — Adicionar manualmente

1. Na etapa **Environment variables** do deploy, clique em **Add**.
2. Adicione cada variável:
   - Nome: `VITE_SUPABASE_URL`  
     Valor: `https://SEU_PROJETO.supabase.co`
   - Nome: `VITE_SUPABASE_ANON_KEY`  
     Valor: a chave anon/public do seu projeto Supabase
3. Confirme e prossiga com o build.

### Onde obter os valores

- **Supabase Dashboard** → **Project Settings** → **API**
- **Project URL** → use como `VITE_SUPABASE_URL`
- **anon public** → use como `VITE_SUPABASE_ANON_KEY`

---

## 2. Configuração no Supabase (Authentication)

Para o login funcionar em produção, configure as URLs no Supabase:

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Preencha:
   - **Site URL**: `https://seudominio.com` (URL final do app na Hostinger)
   - **Redirect URLs**: adicione também `https://seudominio.com/**` e, se quiser, `https://seudominio.com/*`
3. Salve as alterações.

---

## 3. Comandos de build na Hostinger

O projeto usa Vite. Certifique-se de que o Hostinger execute:

- **Build command**: `npm run build` (ou `npx vite build`)
- **Output directory**: `dist`
- **Node.js version**: 18 ou superior (se disponível)

---

## 4. Redeploy após mudar variáveis

Sempre que alterar `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY`, é necessário **redeployar** o app, pois essas variáveis são usadas em tempo de build.

---

## 5. Verificação rápida

Depois do deploy, abra o console do navegador (F12) e verifique:

- Se aparecer `[Supabase] Config: OK` → a configuração está correta.
- Se aparecer `[Supabase] Config: FALTANDO` → as variáveis não foram usadas no build ou estão incorretas.

---

## Resumo checklist

- [ ] Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` definidas no Hostinger
- [ ] **Site URL** e **Redirect URLs** configurados no Supabase com o domínio da Hostinger
- [ ] Build executado com `npm run build` e output em `dist`
- [ ] Redeploy feito após qualquer alteração nas variáveis
