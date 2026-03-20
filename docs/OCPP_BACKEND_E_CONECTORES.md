# OCPP Backend e número de conectores (bocas)

Este documento explica (1) **como o sistema trata o número de bocas do carregador** e (2) **como o backend OCPP está funcionando** no projeto.

---

## 1. O código identifica quantas bocas tem quando eu coloco o OCPP do carregador?

**Não.** No cadastro da estação você só informa o **Charge Point ID** (código OCPP do carregador). O sistema **não** descobre sozinho quantas bocas (conectores) esse carregador tem nesse momento.

### O que acontece hoje

- **No cadastro (frontend)**  
  Só é salva a estação: nome, Charge Point ID, empresa, cidade, UF, etc. Nenhum número de conectores é informado nem calculado.

- **Quando o carregador conecta (backend OCPP)**  
  - No **BootNotification** o backend encontra a estação pelo `charge_point_id` e cria **sempre 2 conectores** por padrão (valor fixo no código).  
  - O payload do BootNotification **não** é usado para ler “quantidade de conectores”.  
  - Conectores adicionais aparecem quando o carregador envia **StatusNotification** para cada boca (ex.: connectorId 1, 2, 3, 4). Para cada connectorId novo o backend chama `ensureConnectorExists` e cria o registro na tabela `connectors`.  
  Ou seja: o número de bocas vai sendo descoberto **depois**, conforme o carregador reporta cada conector.

**Resumo:** o código **não** identifica quantas bocas tem só pelo OCPP/Charge Point ID; o número de conectores surge quando o carregador **conecta** (2 no Boot + mais um por cada StatusNotification de conector).

Se quiser que isso seja “identificado” já no cadastro, é possível:  
- **Opção A:** campo “Número de bocas” no formulário de nova estação; ao criar a estação, o backend cria logo esses registros em `connectors`.  
- **Opção B:** (se o carregador enviar no BootNotification o número de conectores) o backend pode usar esse valor em vez do “2” fixo.

---

## 2. Como está funcionando o backend OCPP

O backend expõe um **servidor WebSocket** que fala **OCPP 1.6** com os carregadores. Toda a lógica de mensagens fica em `backend/src/ocpp/`.

### 2.1 Conexão WebSocket

- **URL:** `ws://{host}:{porta}/ocpp/{chargePointId}`  
  Exemplo: `ws://localhost:3001/ocpp/CP001`  
  O **Charge Point ID** é o último segmento do path; ele deve ser **exatamente** o mesmo cadastrado na estação no dashboard (ex.: `CP001`).

- O servidor exige no handshake o subprotocolo **`ocpp1.6`** (compatível com carregadores OCPP 1.6).

- Ao conectar: o backend usa o `chargePointId` da URL para buscar a estação no banco.  
- Ao desconectar: a estação é marcada como **offline** e um evento realtime é emitido.

### 2.2 Formato das mensagens (OCPP 1.6)

As mensagens são **JSON em array**:

- **CALL (carregador → servidor):** `[2, uniqueId, "Action", payload]`  
  - `2` = tipo CALL  
  - `uniqueId` = identificador da chamada  
  - `"Action"` = nome da ação (ex.: BootNotification, Heartbeat)  
  - `payload` = objeto com os dados da ação  

- **CALLRESULT (servidor → carregador):** `[3, uniqueId, payload]`  
- **CALLERROR:** `[4, uniqueId, code, description, details]`

O backend só processa mensagens do tipo **2 (CALL)**; erros de parsing ou tipo inválido geram **CallError** quando possível.

### 2.3 Ações suportadas e o que o backend faz

| Ação | Origem | O que o backend faz |
|------|--------|----------------------|
| **BootNotification** | Carregador ao conectar | Busca estação por `charge_point_id`. Se existir: atualiza `status` = online, `last_seen`, `charge_point_vendor` e `charge_point_model` (se vierem no payload); chama `ensureConnectorsForStation(stationId, 2)` e cria **2 conectores** (ids 1 e 2) se ainda não houver nenhum. Responde `Accepted` + `currentTime` + `interval` (300 s). Emite evento realtime `charge_point_connected`. Se a estação não existir, só loga aviso e ainda responde Accepted. |
| **Heartbeat** | Carregador (periódico) | Se a estação existir, atualiza `last_seen`. Responde com `currentTime`. |
| **Authorize** | Carregador (ex.: antes de iniciar sessão) | Apenas responde `idTagInfo: { status: "Accepted" }` (aceita qualquer idTag). |
| **StatusNotification** | Carregador (mudança de status de um conector) | Lê `connectorId` e `status` (ex.: Available, Charging, Faulted). Converte para status interno (available, charging, faulted, etc.). Se a estação existir: atualiza o status da **estação** (online/charging/faulted/unavailable) a partir do status do conector; para `connectorId >= 1` chama `ensureConnectorExists` (cria o conector se não existir) e `updateConnectorStatus`. Emite eventos realtime `connector_update` e `status_notification`. Responde `{}`. |
| **StartTransaction** | Carregador (início de sessão de carregamento) | Lê `connectorId`, `meterStart`, opcionalmente `idTag`. Gera um `transactionId` (número) e cria registro na tabela **transactions** (station_id, charge_point_id, connector_id, meter_start, status active). Atualiza o conector com `current_transaction_id` e incrementa contador de sessões da estação. Responde `transactionId` + `idTagInfo: Accepted`. Emite `connector_update` e `start_transaction`. |
| **StopTransaction** | Carregador (fim da sessão) | Lê `transactionId` e `meterStop`. Busca a transação ativa no banco, calcula energia (meterStop - meterStart, em kWh), finaliza a transação (meter_stop, end_time, energy_kwh, status completed), atualiza a energia total da estação, zera `current_transaction_id` do conector e atualiza `energy_kwh` do conector. Responde `idTagInfo: Accepted`. Emite `connector_update` e `stop_transaction`. |
| **MeterValues** | Carregador (medições durante o carregamento) | Lê `transactionId` e, no `meterValue`, o valor de `Energy.Active.Import.Register`. Atualiza a transação e o conector com essa energia; atualiza `last_seen` da estação. Responde `{}`. Emite `connector_update` com energy_kwh. |

Qualquer outra ação recebida resulta em **CallError** com `NotSupported`.

### 2.4 Fluxo resumido (estação + bocas + sessão)

1. **Cadastro (dashboard)**  
   Você cria a estação com um **Charge Point ID** (ex.: `CP001`). Só existe a linha em **stations**; ainda não há linhas em **connectors**.

2. **Carregador conecta**  
   O carregador abre o WebSocket em `ws://.../ocpp/CP001` e envia **BootNotification**.  
   O backend:  
   - Atualiza a estação (online, last_seen, vendor, model).  
   - Cria **2 conectores** (connector_id 1 e 2) na tabela **connectors** se não existir nenhum.

3. **Status de cada boca**  
   O carregador envia **StatusNotification** para cada conector (ex.: connectorId 1 e 2, ou 1, 2, 3, 4).  
   Para cada connectorId o backend cria o conector se ainda não existir (`ensureConnectorExists`) e atualiza o status. Assim, carregadores com mais de 2 bocas passam a ter mais registros em **connectors** conforme vão reportando.

4. **Sessão de carregamento**  
   - **StartTransaction** → cria linha em **transactions**, associa ao conector (`current_transaction_id`), incrementa sessões da estação.  
   - **MeterValues** (opcional) → atualiza energia da transação e do conector.  
   - **StopTransaction** → finaliza a transação, calcula energia, atualiza totais da estação e do conector, zera `current_transaction_id`.

5. **Desconexão**  
   Ao fechar o WebSocket, o backend marca a estação como **offline** e emite evento para o frontend (realtime).

### 2.5 Onde está no código

- **Servidor WebSocket OCPP:** `backend/src/ocpp/ocppServer.ts` (rota `/ocpp/:chargePointId`, handshake `ocpp1.6`).  
- **Parsing e despacho das mensagens:** `backend/src/ocpp/ocppHandlers.ts` (`handleOcppMessage` + um handler por ação).  
- **Estação:** `backend/src/services/stationService.ts` (findStationByChargePointId, updateStationBootInfo, updateStationLastSeen, updateStationStatus, updateStationOffline, incrementStationSessions, etc.).  
- **Conectores:** `backend/src/services/connectorService.ts` (ensureConnectorsForStation(count=2), ensureConnectorExists, updateConnectorStatus, setConnectorTransaction, updateConnectorEnergy).  
- **Transações:** `backend/src/services/transactionService.ts` (createTransaction, stopTransaction, updateTransactionEnergy).

O backend usa **SERVICE_ROLE** do Supabase para escrever em **stations**, **connectors** e **transactions**; o frontend lê esses dados via API/dashboard com RLS normal.

---

## Resumo rápido

- **Número de bocas:** não é detectado só pelo Charge Point ID no cadastro; é definido/descoberto quando o carregador conecta (2 no Boot + mais um por cada StatusNotification de conector).  
- **Backend OCPP:** WebSocket em `/ocpp/{chargePointId}`, protocolo OCPP 1.6; BootNotification, Heartbeat, Authorize, StatusNotification, StartTransaction, StopTransaction, MeterValues; atualiza stations, connectors e transactions e emite eventos realtime para o dashboard.
