# Relatório de Auditoria Técnica — Sistema de Carregadores OCPP
## Atomtech Pulse

**Data:** 05/03/2026  
**Objetivo:** Mapear o estado atual da arquitetura e implementação OCPP.

---

## 1️⃣ ARQUITETURA DO BACKEND

### Linguagem e framework
- **Linguagem:** TypeScript
- **Runtime:** Node.js (ts-node em dev, node em prod)
- **Framework HTTP:** Express 4.x
- **WebSocket:** biblioteca `ws` 8.x

### Estrutura de pastas

```
backend/
├── src/
│   ├── api/                    # Rotas REST
│   │   └── stations.routes.ts  # Endpoints de estações
│   ├── ocpp/                   # Servidor e handlers OCPP
│   │   ├── ocppServer.ts       # WebSocket OCPP, parsing de path
│   │   └── ocppHandlers.ts     # Handlers BootNotification, Heartbeat, etc.
│   ├── realtime/               # WebSocket para frontend
│   │   └── websocketServer.ts  # Broadcast de eventos em tempo real
│   ├── services/               # Lógica de negócio
│   │   ├── stationService.ts   # CRUD stations, atualizações OCPP
│   │   └── transactionService.ts # Criação/finalização de transações OCPP
│   ├── database/               # Cliente Supabase
│   │   └── supabaseClient.ts   # Cliente com SERVICE_ROLE_KEY
│   └── server.ts               # Bootstrap: Express + OCPP + Realtime
├── test-charger.js             # Simulador de carregador OCPP
├── package.json
└── .env.example
```

### Papel de cada pasta

| Pasta | Papel |
|-------|--------|
| `api/` | Rotas REST da API (stations). Não possui autenticação JWT. |
| `ocpp/` | Servidor WebSocket OCPP 1.6 JSON. Recebe conexões em `/ocpp/:chargePointId` e roteia mensagens para handlers. |
| `realtime/` | WebSocket genérico na porta 3002 para broadcast de eventos (charge_point_connected, status_notification, etc.) ao frontend. |
| `services/` | Regras de negócio, acesso ao Supabase. Usa SERVICE_ROLE para bypass de RLS em operações OCPP. |
| `database/` | Configuração do cliente Supabase. Usa `SUPABASE_SERVICE_ROLE_KEY` quando disponível. |

---

## 2️⃣ SERVIDOR OCPP

### Inicialização e porta
- **Onde inicia:** `server.ts` chama `startOcppServer(emitRealtime)` após `app.listen(PORT)`.
- **Porta:** `OCPP_PORT` (variável de ambiente) ou **3001**.
- **Biblioteca WebSocket:** `ws` (WebSocketServer nativo).

### Rota OCPP
```
ws://localhost:3001/ocpp/:chargePointId
```
- **Exemplo:** `ws://localhost:3001/ocpp/CP001`
- Conexões sem `chargePointId` na URL são rejeitadas (`ws.close()`).

### Mensagens OCPP tratadas

| Mensagem | Handler | Descrição |
|----------|---------|-----------|
| **BootNotification** | `handleBootNotification` | Atualiza estação online, retorna `Accepted` + interval 300s |
| **Heartbeat** | `handleHeartbeat` | Atualiza `last_seen` |
| **StatusNotification** | `handleStatusNotification` | Mapeia status OCPP → DB (Available→online, Charging→charging, etc.) |
| **StartTransaction** | `handleStartTransaction` | Cria registro em `transactions`, incrementa `total_sessions` |
| **StopTransaction** | `handleStopTransaction` | Finaliza transação, calcula kWh, atualiza `total_kwh` da estação |
| **MeterValues** | `handleMeterValues` | Atualiza `energy_kwh` da transação ativa (Energy.Active.Import.Register) |

Mensagens não suportadas retornam `CallError` com `NotSupported`.

---

## 3️⃣ SERVICES IMPLEMENTADOS

### `stationService.ts`
Gerencia estações de carregamento e atualizações via OCPP.

| Função | Descrição |
|--------|-----------|
| `findStationByChargePointId(chargePointId)` | Busca estação por `charge_point_id` (para handlers OCPP) |
| `updateStationOnline(chargePointId)` | Seta `status: "online"` e `last_seen` (BootNotification) |
| `updateStationLastSeen(chargePointId)` | Atualiza apenas `last_seen` (Heartbeat, MeterValues) |
| `updateStationStatus(chargePointId, status)` | Atualiza status (StatusNotification) |
| `incrementStationSessions(chargePointId)` | Incrementa `total_sessions` (StartTransaction) |
| `addStationKwh(chargePointId, kwhToAdd)` | Soma kWh em `total_kwh` (StopTransaction) |
| `listStations()` | Lista todas as estações (usado em GET /stations) |
| `createStation(input)` | Cria estação com status `offline` (POST /stations) |

### `transactionService.ts`
Gerencia transações OCPP (StartTransaction, StopTransaction, MeterValues).

| Função | Descrição |
|--------|-----------|
| `createTransaction(chargePointId, stationId, connectorId, meterStart, ocppTransactionId)` | Insere transação com status `active` |
| `stopTransaction(ocppTransactionId, meterStop)` | Finaliza transação, calcula kWh, chama `addStationKwh` |
| `updateTransactionEnergy(ocppTransactionId, meterValue)` | Atualiza `energy_kwh` durante carregamento (MeterValues) |

---

## 4️⃣ MODELO DE BANCO DE DADOS

### Tabelas principais

#### `stations`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | bigint | PK |
| company_id | number | FK → companies.id |
| name | text | Nome da estação |
| charge_point_id | text | Identificador OCPP (UNIQUE) |
| status | text | offline, online, charging, faulted, unavailable |
| last_seen | timestamptz | Última atividade OCPP |
| city, uf | text | Localização |
| lat, lng | numeric | Coordenadas |
| total_kwh | numeric | kWh total carregados (default 0) |
| total_sessions | integer | Total de sessões (default 0) |
| created_at | timestamptz | Criação |

**Constraints:** `stations_status_check`, `stations_charge_point_id_key` (UNIQUE)  
**Índices:** `idx_stations_charge_point_id`, `idx_stations_company_id`  
**RLS:** Habilitado. Políticas para super_admin e usuários por company_id.

#### `transactions`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK (gen_random_uuid) |
| ocpp_transaction_id | integer | ID da transação OCPP (UNIQUE) |
| station_id | bigint | FK → stations.id (ON DELETE CASCADE) |
| charge_point_id | text | Cópia para consultas |
| connector_id | integer | Conector OCPP |
| start_time | timestamptz | Início |
| end_time | timestamptz | Fim (null até StopTransaction) |
| meter_start | integer | Wh no início |
| meter_stop | integer | Wh no fim |
| energy_kwh | numeric | kWh calculado |
| status | text | active, completed |
| created_at | timestamptz | Criação |

**Constraints:** `status IN ('active','completed')`, `ocpp_transaction_id UNIQUE`  
**FK:** `station_id REFERENCES stations(id) ON DELETE CASCADE`  
**Índices:** `idx_transactions_ocpp_id`, `idx_transactions_station_id`, `idx_transactions_charge_point_id`, `idx_transactions_status`  
**RLS:** Habilitado. SELECT por company via station; insert/update via SERVICE_ROLE.

### Outras tabelas referenciadas
- `companies`, `profiles` (auth e multi-tenant)
- `charging_sessions`, `v_sessions_list` (modelo de sessões anterior; **não vinculado a OCPP**)

---

## 5️⃣ FLUXO COMPLETO DO CARREGADOR

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Carregador conecta em ws://localhost:3001/ocpp/CP001                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BootNotification                                                             │
│   → findStationByChargePointId(CP001)                                        │
│   → updateStationOnline(CP001) → status=online, last_seen=now                │
│   → sendCallResult(Accepted, interval: 300)                                  │
│   → emitRealtime("charge_point_connected")                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Heartbeat (a cada ~300s)                                                     │
│   → updateStationLastSeen(CP001)                                             │
│   → sendCallResult(currentTime)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ StatusNotification                                                           │
│   → updateStationStatus(CP001, status mapeado)                               │
│   → emitRealtime("status_notification")                                      │
│   → sendCallResult({})                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ StartTransaction                                                             │
│   → createTransaction(CP001, stationId, connectorId, meterStart, txId)       │
│   → incrementStationSessions(CP001)                                          │
│   → sendCallResult(transactionId, idTagInfo: Accepted)                       │
│   → emitRealtime("start_transaction")                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ MeterValues (durante carregamento)                                           │
│   → updateStationLastSeen(CP001)                                             │
│   → updateTransactionEnergy(ocppTransactionId, Energy.Active.Import.Register)│
│   → sendCallResult({})                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ StopTransaction                                                              │
│   → stopTransaction(ocppTransactionId, meterStop)                            │
│     → calcula energyKwh = (meterStop - meterStart) / 1000                    │
│     → addStationKwh(chargePointId, energyKwh)                                │
│   → sendCallResult(idTagInfo: Accepted)                                      │
│   → emitRealtime("stop_transaction")                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ SIMULADOR DE CARREGADOR

**Arquivo:** `backend/test-charger.js`

### Comportamento
- Conecta em `ws://localhost:3001/ocpp/CP001`
- Envia **apenas BootNotification**
- Aguarda resposta e imprime no console
- **Não envia:** Heartbeat, StatusNotification, StartTransaction, MeterValues, StopTransaction

### Código enviado
```javascript
[2, "12345", "BootNotification", {
  chargePointVendor: "Atomtech",
  chargePointModel: "Pulse-Simulator",
}]
```

### Conclusão
Simulador **parcial** — cobre apenas conexão inicial. Não simula sessões completas.

---

## 7️⃣ APIs REST

### Base URL
`http://localhost:3000` (variável `PORT`)

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Retorna `"Backend online"` |
| GET | `/stations` | Lista todas as estações (id, name, charge_point_id, status, last_seen, city, uf, total_kwh, total_sessions) |
| POST | `/stations` | Cria estação. Body: `company_id`, `name`, `charge_point_id`, opcional: `city`, `uf`, `lat`, `lng` |

**Observações:**
- Nenhum endpoint para `transactions`
- Sem filtro por `company_id` em GET /stations (retorna todas)
- Sem autenticação/autorização (público)

---

## 8️⃣ SISTEMA DE AUTENTICAÇÃO

### Frontend (Supabase Auth)
- **Supabase Auth** com email/senha
- **AuthContext** gerencia sessão, roles (super_admin, company_admin, manager, viewer)
- **Rotas protegidas:** `AdminProtectedRoute`, `DashboardProtectedRoute`
- JWT em cookie/session gerenciado pelo Supabase JS
- Fallback para **usuários mock** (ex.: admin@topup.com) quando não há Supabase

### Backend (API REST)
- **Sem JWT** — endpoints `/stations` e `/health` são públicos
- **Sem middleware de autorização**
- Qualquer cliente pode listar/criar estações via API REST

### OCPP
- Sem autenticação — qualquer cliente pode conectar em `/ocpp/:chargePointId`
- Estações não cadastradas não são rejeitadas na conexão; apenas geram warning nos handlers

---

## 9️⃣ INTEGRAÇÃO COM SUPABASE

### Cliente Supabase no backend
- **Arquivo:** `backend/src/database/supabaseClient.ts`
- **Variáveis:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (ou fallback para ANON_KEY)
- **Uso:** SERVICE_ROLE permite bypass de RLS para operações OCPP e API

### Tabelas com RLS
- `stations` — SELECT/INSERT/UPDATE por company_id e super_admin
- `transactions` — SELECT por company (via station); INSERT/UPDATE apenas via SERVICE_ROLE

### Operações com service role
- Todo o backend usa o cliente com SERVICE_ROLE
- `stationService` e `transactionService` escrevem diretamente em `stations` e `transactions`
- Frontend usa `supabaseClient.ts` com ANON_KEY e respeita RLS

---

## 🔟 RELATÓRIO FINAL

### O que já está pronto ✅

| Item | Estado |
|------|--------|
| Servidor OCPP 1.6 JSON | Implementado (BootNotification, Heartbeat, StatusNotification, StartTransaction, MeterValues, StopTransaction) |
| Integração stations ↔ OCPP | status, last_seen, total_kwh, total_sessions atualizados |
| Tabela transactions | Criada com RLS e FKs |
| Fluxo completo de sessão | StartTransaction → MeterValues → StopTransaction → total_kwh |
| Realtime WebSocket | Broadcast de eventos OCPP ao frontend |
| API REST stations | GET e POST funcionais |
| Supabase + RLS | Multi-tenant em stations e transactions |
| Autenticação frontend | Supabase Auth + roles |
| Simulador básico | BootNotification |

### O que está parcialmente pronto ⚠️

| Item | Lacuna |
|------|--------|
| Simulador de carregador | Só BootNotification; falta Heartbeat, StartTransaction, MeterValues, StopTransaction |
| API REST | Sem autenticação; GET /stations sem filtro por company |
| Frontend Sessions | Usa `charging_sessions`/`v_sessions_list`; **não exibe transações OCPP** |
| Idempotência OCPP | StartTransaction gera `ocppTransactionId` aleatório; carregador real deve enviar o id |

### O que ainda falta para produção ❌

| Item | Ação sugerida |
|------|----------------|
| Autenticação na API REST | Middleware JWT ou validação de sessão Supabase |
| Filtro company_id em GET /stations | Garantir isolamento multi-tenant na API |
| Autenticação OCPP | Basic Auth ou certificados para conexão de carregadores |
| Validação de idTag | StartTransaction aceita qualquer idTag; integrar com vouchers/usuários |
| Exibir transações OCPP no frontend | Nova página ou integração em Sessions usando tabela `transactions` |
| Simulador completo | Estender test-charger.js com fluxo Start → MeterValues → Stop |
| Tratamento de reconexão | Lógica para transações "orphan" (carregador caiu antes de StopTransaction) |
| Logs/auditoria | Rastrear quem criou/alterou e quando |
| Testes automatizados | Unit e integração para handlers OCPP e services |

### Riscos técnicos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| API REST sem auth | Alto | Qualquer um pode listar/criar estações |
| OCPP sem auth | Alto | Carregadores não autorizados podem conectar |
| Duplicidade idTag | Médio | Aceitar qualquer tag pode gerar cobranças incorretas |
| Transações órfãs | Médio | Carregador cai sem StopTransaction; transação fica `active` |
| Inconsistência meter_start/meter_stop | Baixo | OCPP usa Wh; divisão por 1000 para kWh está correta |
| `ocpp_transaction_id` aleatório | Médio | Em produção, o Charge Point deve fornecer o id; backend não deve gerar |

---

*Relatório gerado por auditoria automatizada do código-fonte.*
