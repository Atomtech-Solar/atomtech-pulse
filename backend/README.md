# Backend Atomtech Pulse

API HTTP, servidor OCPP 1.6 e WebSocket Realtime.

## Estrutura

```
backend/
├── src/
│   ├── api/
│   │   └── stations.routes.ts
│   ├── ocpp/
│   │   ├── ocppServer.ts
│   │   └── ocppHandlers.ts
│   ├── realtime/
│   │   └── websocketServer.ts
│   ├── services/
│   │   └── stationService.ts
│   ├── database/
│   │   └── supabaseClient.ts
│   └── server.ts
├── package.json
└── .env
```

## Portas

| Serviço   | Porta |
|----------|-------|
| API HTTP | 3000  |
| OCPP WS  | 3001  |
| Realtime | 3002  |

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
# Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (obrigatório para OCPP atualizar banco)
npm run dev
```

**Importante:** Use `SUPABASE_SERVICE_ROLE_KEY` para o OCPP atualizar `stations` (o servidor roda sem usuário autenticado).

## Fluxo

1. **Cadastre a estação no frontend** (Estações → Adicionar Estação) com o Charge Point ID (ex: CP001)
2. **Conecte o carregador** em `ws://localhost:3001/ocpp/CP001`
3. O servidor verifica se a estação existe. Se **não existir**, a conexão é recusada
4. Se existir: `status` → online, `last_seen` → now(), e os eventos OCPP atualizam o banco

## Saída esperada

```
API rodando na porta 3000
Realtime WebSocket rodando na porta 3002
OCPP Server rodando na porta 3001
```

Quando um carregador cadastrado conectar:

```
ChargePoint conectado: CP001
Mensagem OCPP: [2,"12345","BootNotification",{...}]
BootNotification recebido de CP001
```

## Endpoints

### GET /health

Retorna `Backend online`.

### GET /stations

Retorna: id, name, charge_point_id, status, last_seen, city, uf, total_kwh, total_sessions.

### POST /stations

Cria estação. Campos: company_id, name, charge_point_id, city?, uf?, lat?, lng?. Status sempre `offline`.

## Testar OCPP

**Antes:** cadastre uma estação no frontend com Charge Point ID = `CP001`.

### Simulador

```bash
cd backend
npm run test:charger
```

Se a estação CP001 não existir no banco: `[OCPP] Estação não cadastrada: CP001 - conexão recusada`
