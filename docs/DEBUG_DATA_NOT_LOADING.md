# Análise: Dados não carregam ao navegar entre páginas

## Resumo do problema
Ao trocar de rota (React Router), a UI renderiza mas os dados ficam vazios ou `undefined`.

---

## 1. React Query

### 1.1 Invalidação
- **Onde:** Não há `invalidateQueries` genérico ao navegar; só em ações pontuais (ex.: `Stations.tsx` após criar estação, `StationDetails.tsx` em realtime).
- **Conclusão:** Invalidação não parece ser a causa do “vazio” ao navegar.

### 1.2 Chaves de query (query keys)
- **Onde:** `src/hooks/useSupabaseData.ts` — todas as hooks.
- **Problema:** Chaves usam `user?.id`, `role`, `selectedCompanyId`. Se `selectedCompanyId` mudar depois do primeiro render (ex.: `parseStoredCompany()` vs `applyAuthUser()`), a chave muda e uma **nova** query é disparada; até ela resolver, pode haver tela vazia ou dado antigo.
- **Exemplo:** `["sessions", role, selectedCompanyId]` — de `null` para `1` gera duas entradas no cache.
- **Onde inspecionar:**
  - `AuthContext.tsx`: estado inicial `selectedCompanyId` (linha ~230) e onde `applyAuthUser` atualiza (linhas 234–247).
  - `useSupabaseData.ts`: todas as `queryKey` (linhas 48, 66, 88, 110, 132, 154, 175, 194, 215, 235).

### 1.3 staleTime / gcTime
- **Onde:** `App.tsx` — `createQueryClient()` (linhas 36–62).
- **Situação:** Não há `staleTime` nem `gcTime`; usam-se os padrões do React Query (stale imediato, refetch em mount).
- **Risco:** Em toda navegação as queries são consideradas stale e refetch; se alguma falhar ou atrasar, a UI pode mostrar vazio se a página não tratar `isLoading`/`isError`.

### 1.4 refetchOnMount / refetchOnWindowFocus
- **Situação:** Padrões (ambos true). Refetch ao montar e ao focar a janela.
- **Risco:** Refetch ao focar pode competir com navegação (novo mount + refetch) e dar sensação de “dados sumindo” ou atraso.

---

## 2. Ciclo de vida dos componentes

### 2.1 Montagem na troca de rota
- **Onde:** `App.tsx` — rotas aninhadas; `DashboardLayout` é pai e usa `<Outlet />`.
- **Comportamento:** Ao ir de `/dashboard` → `/dashboard/sessions`, só o conteúdo do `Outlet` muda (Overview desmonta, Sessions monta). Layout permanece montado.
- **Conclusão:** Montagem está correta; não é reutilização indevida do mesmo componente de página.

### 2.2 Dependências de useEffect
- **AuthInit:** `useEffect(() => { loadUserFromStorage(); }, [loadUserFromStorage]);` — estável (useCallback com deps corretas no AuthContext).
- **Risco:** Em páginas que fazem `useEffect` dependendo de `data` ou `user`, uma dependência instável pode atrasar ou não rodar lógica que “preenche” a tela.

### 2.3 Corrida entre auth e dados
- **Onde:** `AuthContext.tsx` — `isSessionReady: !isLoading` (linha 687); `loadUserFromStorage` roda uma vez (`initRan.current`, linha 422).
- **Fluxo:** Em rotas protegidas, `AuthInit` e `DashboardProtectedRoute` só mostram filhos quando `!isLoading`. Quando a página de dashboard monta, `isSessionReady` já é `true`.
- **Risco:** Se em algum momento `user` ou `selectedCompanyId` ficar `undefined` brevemente (ex.: evento de auth), `enabled` das queries vira `false` e a query não roda; sem cache para aquela chave, `data` fica `undefined` → tela vazia.

---

## 3. Supabase auth / sessão

### 3.1 Sessão carregada antes das queries
- **Onde:** `AuthInit.tsx` — em rotas não públicas, o conteúdo só renderiza quando `!isLoading` (linhas 23–32). `isLoading` só vira `false` no `finally` de `loadUserFromStorage` (AuthContext linha 504).
- **Conclusão:** Em rotas protegidas, a sessão já foi resolvida antes de montar as páginas que usam dados.

### 3.2 Queries com user null/undefined
- **Onde:** `useSupabaseData.ts` — `enabled: isSessionReady && (!useSupabase || !!user)` (e variações com `selectedCompanyId`).
- **Risco:** Se `onAuthStateChange` disparar com sessão nula (ex.: refresh de token) e limpar `user` antes de repopular, por um frame `enabled` pode ser `false` e a query não executar ou não reexecutar.

### 3.3 Atraso em getSession()
- **Onde:** `AuthContext.tsx` — `loadUserFromStorage` usa `Promise.race` com timeout de 500 ms (SESSION_CHECK_TIMEOUT_MS). Se der timeout, trata como “sem sessão” e limpa (linhas 439–451).
- **Risco:** Em rede lenta, 500 ms pode não ser suficiente; aí o usuário é tratado como deslogado e redirecionado, em vez de “dados não carregando”. Para o bug de “dados vazios ao navegar”, isso é menos provável que as causas de query/estado abaixo.

---

## 4. Rotas (React Router)

### 4.1 Reutilização de componente
- **Onde:** `App.tsx` — `<Route path="/dashboard" element={<DashboardLayout />}>` com filhos via `<Outlet />`.
- **Comportamento:** Cada rota filha (Overview, Sessions, Stations, etc.) é um componente diferente; não há reuse do mesmo componente com props diferentes que pudesse “travar” estado antigo.

### 4.2 Key para forçar remount
- **Situação:** Nenhum `key` no `Outlet` ou nas rotas.
- **Conclusão:** Para “dados vazios ao navegar”, o problema não parece ser necessidade de remount do layout; é mais provável que seja `enabled`, chave de query ou tratamento de loading/erro nas páginas.

---

## 5. Camada de rede

### 5.1 Requisições sendo enviadas
- **Onde:** Supabase é chamado em `useSupabaseData.ts` e em serviços como `stationsService.ts` (`listStations`, `getStationDetails`).
- **Como checar:** Aba Network do DevTools; filtrar por domínio do Supabase (e eventual backend). Ver se ao navegar surgem requests e se retornam 200 ou 401/500.

### 5.2 Erros silenciosos
- **Onde:** `useSupabaseData.ts` — `handleQueryError` faz `dispatchSessionInvalid()` em erro de auth ou timeout e depois `throw error` (linhas 21–30). O erro propaga e o React Query coloca a query em `status: 'error'`.
- **Problema:** Várias páginas usam só `const { data = [] } = useX()` e **não** usam `isLoading` nem `isError`. Quando a query falha, `data` fica `undefined` e o default `[]` faz a tabela aparecer vazia, sem feedback de erro.
- **Arquivos:** `Sessions.tsx` (linha 15), `Overview.tsx` (linhas 11–13), `Stations.tsx` (linhas 98, 118–121), etc.

---

## 6. Estado local vs dados da query

### 6.1 Estado sobrescrevendo dados
- **Onde:** Em geral as páginas não inicializam listas com estado local que sobrescreva a query; usam `data` da query com default `[]`.
- **Exceção:** Lógica que depende de `selectedCompanyId` ou `companyId` (ex.: Stations) pode fazer a query rodar com `companyId` null e depois com valor; nesse meio tempo a UI pode mostrar vazio.

### 6.2 Condições que impedem render
- **Onde:** Verificar em cada página se há `if (!data) return null` ou similar que, com `data` undefined na primeira carga ou após erro, esconda o conteúdo.
- **Exemplo:** Se existir “só renderizo tabela quando `data.length > 0`”, em loading ou erro a tela fica em branco.

---

## 7. Produção vs desenvolvimento

- **Build:** Nenhuma lógica específica que desligue queries em produção.
- **Variáveis de ambiente:** Supabase usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; se em produção alguma estiver errada, as chamadas falham (401/network) e, sem tratamento de erro na UI, os dados “não aparecem”.
- **Minificação:** Improvável que mude comportamento de React Query ou de `enabled`; mais provável ver diferença por cache/network em produção.

---

## Causas mais prováveis (ordenadas)

1. **Queries que rodam sem esperar auth ou com `enabled` dependente de `selectedCompanyId`**
   - **Stations:** `useQuery` em `Stations.tsx` (linhas 118–121) **não tem `enabled`**; chama `listStations(companyId)` assim que monta. Se a sessão ainda não estiver pronta ou a requisição falhar (ex.: 401), a query fica em erro e `data` pode ser `undefined` → default `[]` → tabela vazia sem mensagem.
   - **Configurações / Tariffs:** `useCompanySettings` e `useTariffs` têm `enabled: ... && !!selectedCompanyId`. Para super_admin com “Visão Global” (`selectedCompanyId === null`), a query **nunca** roda → dados sempre `undefined`.

2. **Páginas não tratam loading/erro**
   - **Onde:** `Sessions.tsx`, `Overview.tsx`, `Financial.tsx`, etc. — usam `data = []` e não usam `isLoading`/`isError`.
   - **Efeito:** Enquanto a query está loading ou em erro, a UI mostra lista vazia em vez de spinner ou mensagem de erro, parecendo “dados não carregam”.

3. **Instabilidade da query key (selectedCompanyId)**
   - **Onde:** `AuthContext` inicializa `selectedCompanyId` com `parseStoredCompany()` e depois `applyAuthUser` pode atualizar com `authUser.company_id`. Se em um render temos `null` e no seguinte `1`, a chave muda, uma nova query é disparada e até ela resolver pode haver tela vazia ou dado “antigo” da chave anterior.

4. **Refetch ao focar a janela**
   - Com `refetchOnWindowFocus: true` (padrão), ao voltar para a aba ou mudar de rota pode haver refetch; se a rede ou o token falharem, a query vai para erro e, sem tratamento na UI, a lista fica vazia.

5. **Timeout/erro de auth tratado como “logout”**
   - Em `useSupabaseData`, timeout ou erro de auth chama `dispatchSessionInvalid()` e a query falha. O usuário pode ser redirecionado para login; em outros casos a página pode só ficar com dados vazios se o redirect não ocorrer no mesmo momento.

---

## Onde inspecionar no código

| Causa provável              | Arquivo(s)                         | Trecho / linha |
|----------------------------|-------------------------------------|----------------|
| Stations sem `enabled`     | `src/pages/Stations.tsx`           | 118–121        |
| Settings/Tariffs com null  | `src/hooks/useSupabaseData.ts`     | 173–210        |
| Chave com selectedCompanyId| `src/hooks/useSupabaseData.ts`     | Todas as queryKey |
| isSessionReady / user      | `src/contexts/AuthContext.tsx`     | 682–697, 421–511 |
| Sem loading/erro na UI     | `src/pages/Sessions.tsx`           | 14–16          |
|                            | `src/pages/Overview.tsx`          | 8–13           |
|                            | `src/pages/Financial.tsx`         | 8–12           |
| QueryClient defaults       | `src/App.tsx`                      | 36–62          |

---

## Logs sugeridos

1. **Auth / sessão ao montar página**
   - Em `AuthContext.tsx`, no início do Provider (ou onde expõe `user`/`isSessionReady`), logar em dev:
     - `[Auth] render`, `user?.id`, `isSessionReady`, `selectedCompanyId`
   - Objetivo: ver se em alguma navegação `user` ou `selectedCompanyId` fica undefined.

2. **Queries ao montar**
   - Em cada hook de `useSupabaseData.ts`, no início do `queryFn` (dentro do `if` que usa Supabase), logar:
     - `[Query] queryKey`, `enabled` (passar como parâmetro ou derivar)
   - Ou no `queryFn`: `console.log('[Query] running', queryKey)`.
   - Objetivo: confirmar se a query está rodando na rota onde os dados ficam vazios.

3. **Erro / status da query**
   - Nas páginas que usam a query (ex.: Sessions, Stations), logar:
     - `isLoading`, `isError`, `error`, `data?.length`
   - Objetivo: ver se o “vazio” é loading, erro ou realmente `data === []`.

4. **Stations: listStations**
   - Em `stationsService.ts`, em `listStations`, logar no início:
     - `companyId` e, após o `await query`, `error` e `(data ?? []).length`.
   - Objetivo: ver se a requisição está sendo feita e se retorna erro ou array vazio.

---

## Testes rápidos para isolar

1. **Só Stations**
   - Ir direto para `/dashboard/stations` (já logado). Se a tabela vier vazia, abrir DevTools → Network e ver se a request para Supabase (tabela `stations`/`connectors`) existe e qual o status (200 vs 401/500). Repetir após 1+ min na mesma aba (token).
2. **Super_admin em Configurações**
   - Login como super_admin, deixar “Visão Global” (sem empresa selecionada), ir em Configurações. Se a página não mostrar dados, é o `enabled: !!selectedCompanyId` em `useCompanySettings`/`useTariffs`.
3. **Sessions após navegar**
   - Ir em Visão Geral (Overview), depois em Sessões. Se Sessões aparecer vazia, no console verificar os logs de `[Query]` e o status da query (React Query DevTools se possível).
4. **Forçar remount do outlet**
   - Em `DashboardLayout.tsx`, usar `<Outlet key={location.pathname} />`. Se o problema sumir, pode haver estado ou cache “preso” por componente; se continuar, a causa é mais provável em auth/query/enabled/loading/erro.
5. **Desligar refetch ao focar**
   - Em `createQueryClient`, definir `defaultOptions.queries.refetchOnWindowFocus: false`. Se o problema parar de acontecer ao trocar de aba e voltar, vale ajustar refetch (ex.: só em rotas específicas ou com staleTime > 0).

---

## Ações recomendadas (resumo)

1. **Stations:** Adicionar `enabled: isSessionReady && !!user` (e opcionalmente `!!companyId` se fizer sentido) ao `useQuery` de `["stations-module", companyId]` e tratar `isLoading`/`isError` na UI (spinner / mensagem).
2. **Configurações/Tariffs (super_admin):** Quando `selectedCompanyId === null`, decidir comportamento (ex.: mensagem “Selecione uma empresa” ou usar uma empresa padrão) em vez de deixar a query sempre desabilitada.
3. **Páginas que usam dados:** Em todas as listagens (Sessions, Overview, Financial, Stations, etc.), usar `isLoading` e `isError` da query e mostrar spinner ou mensagem de erro em vez de só `data = []`.
4. **Estabilidade de selectedCompanyId:** Garantir que `selectedCompanyId` seja definido de forma estável no primeiro render quando houver `user` (ex.: em `loadUserFromStorage`/`applyAuthUser`) para evitar “flap” de query key.
5. **React Query:** Considerar `staleTime: 60_000` (1 min) para listagens e, se necessário, `refetchOnWindowFocus: false` ou condicional, para reduzir refetches desnecessários e efeitos colaterais ao navegar/focar janela.
