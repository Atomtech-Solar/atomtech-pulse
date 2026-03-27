const WebSocket = require("ws");

// Base HTTP(S) do backend — ex.: https://ocpp.seudominio.com ou http://127.0.0.1:8080
const SERVER_BASE =
  process.env.OCPP_SERVER_URL || "http://127.0.0.1:8080";
const CHARGER_ID = "TEST_CHARGER";
const WS_URL = `${SERVER_BASE.replace(/^http/, "ws")}/ocpp/${CHARGER_ID}`;

// Configuração da simulação
const METER_INTERVAL_MS = 5000;
const SIMULATION_DURATION_MS = 60000; // 60 segundos de carregamento simulado
const METER_INCREMENT_MIN = 200; // Wh
const METER_INCREMENT_MAX = 500; // Wh

/** OCPP 1.6 Call: [2, uniqueId, action, payload] */
function ocppCall(uniqueId, action, payload) {
  return JSON.stringify([2, uniqueId, action, payload]);
}

/** Parse CallResult: [3, uniqueId, payload] ou CallError: [4, uniqueId, code, desc] */
function parseResponse(data) {
  try {
    const arr = JSON.parse(data.toString());
    if (!Array.isArray(arr)) return null;
    if (arr[0] === 3) return { type: "result", uniqueId: arr[1], payload: arr[2] };
    if (arr[0] === 4) return { type: "error", uniqueId: arr[1], code: arr[2], desc: arr[3] };
  } catch {}
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Valor aleatório entre min e max (inclusive) */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  console.log("[TEST] Conectando em:", WS_URL);
  console.log("[TEST] Subprotocolo: ocpp1.6\n");

  const ws = new WebSocket(WS_URL, ["ocpp1.6"]);

  const pending = new Map();
  let meterIntervalId = null;
  let currentMeter = 0;
  let transactionId = null;
  let meterCallCounter = 0;

  ws.on("open", () => {
    console.log("[CONEXÃO] WebSocket aberta com sucesso\n");
  });

  ws.on("message", (data) => {
    const resp = parseResponse(data);
    if (resp) {
      if (resp.type === "result") {
        const resolver = pending.get(resp.uniqueId);
        if (resolver) {
          pending.delete(resp.uniqueId);
          resolver(resp.payload);
        }
        console.log("[RESPOSTA] CallResult:", JSON.stringify(resp.payload, null, 2));
      } else {
        console.error("[RESPOSTA] CallError:", resp.code, "-", resp.desc);
      }
    } else {
      console.log("[RESPOSTA] Mensagem recebida:", data.toString());
    }
  });

  ws.on("error", (err) => {
    console.error("[ERRO] Conexão WebSocket:", err.message);
  });

  ws.on("close", () => {
    console.log("\n[CONEXÃO] WebSocket encerrada");
  });

  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });

  function sendAndWait(uniqueId, action, payload) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.has(uniqueId)) {
          pending.delete(uniqueId);
          reject(new Error(`Timeout: ${action}`));
        }
      }, 10000);
      pending.set(uniqueId, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
      ws.send(ocppCall(uniqueId, action, payload));
    });
  }

  /** Envia MeterValues (fire-and-forget, não espera resposta) */
  function sendMeterValues() {
    if (transactionId == null) return;
    meterCallCounter += 1;
    const uniqueId = `meter-${meterCallCounter}`;
    const payload = {
      connectorId: 1,
      transactionId,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: String(currentMeter),
              measurand: "Energy.Active.Import.Register",
              unit: "Wh",
            },
          ],
        },
      ],
    };
    ws.send(ocppCall(uniqueId, "MeterValues", payload));
    console.log(`[MeterValues] Enviado: ${currentMeter} Wh (${(currentMeter / 1000).toFixed(3)} kWh)`);
  }

  /** Para o loop de simulação de MeterValues */
  function stopMeterInterval() {
    if (meterIntervalId) {
      clearInterval(meterIntervalId);
      meterIntervalId = null;
      console.log("[MeterValues] Intervalo parado.");
    }
  }

  try {
    // ETAPA 1 — BootNotification (OCPP 1.6)
    console.log("[ENVIO] BootNotification");
    const bootResult = await sendAndWait("boot-1", "BootNotification", {
      chargePointVendor: "Atomtech",
      chargePointModel: "Simulador",
      chargePointSerialNumber: "TEST-001",
      firmwareVersion: "1.0.0",
    });

    if (bootResult?.status === "Accepted") {
      console.log("[OK] BootNotification aceito pelo servidor\n");
    } else {
      console.warn("[AVISO] BootNotification:", bootResult);
    }

    await sleep(500);

    // ETAPA 1 — StartTransaction: definir current_meter = 0
    console.log("[ENVIO] StartTransaction");
    const startResult = await sendAndWait("start-1", "StartTransaction", {
      connectorId: 1,
      idTag: "TEST-USER",
      meterStart: 0,
    });

    transactionId = startResult?.transactionId;
    if (transactionId == null) {
      throw new Error("StartTransaction não retornou transactionId");
    }
    currentMeter = 0;
    console.log(`[OK] Sessão iniciada. transactionId=${transactionId}, current_meter=0\n`);

    // ETAPA 2 e 3 — Loop de simulação: a cada 5s incrementar e enviar MeterValues
    console.log(`[MeterValues] Iniciando simulação: a cada ${METER_INTERVAL_MS / 1000}s, +${METER_INCREMENT_MIN}-${METER_INCREMENT_MAX} Wh\n`);

    meterIntervalId = setInterval(() => {
      const increment = randomBetween(METER_INCREMENT_MIN, METER_INCREMENT_MAX);
      currentMeter += increment;
      sendMeterValues();
    }, METER_INTERVAL_MS);

    // Aguardar duração da simulação
    await sleep(SIMULATION_DURATION_MS);

    // ETAPA 4 — Parar simulação e StopTransaction
    stopMeterInterval();

    console.log("\n[ENVIO] StopTransaction (meterStop =", currentMeter, "Wh)");
    await sendAndWait("stop-1", "StopTransaction", {
      transactionId,
      meterStop: currentMeter,
    });
    console.log(`[OK] Sessão finalizada. Energia total: ${(currentMeter / 1000).toFixed(3)} kWh\n`);

    await sleep(500);
    ws.close();
  } catch (err) {
    stopMeterInterval();
    console.error("\n[ERRO]", err.message);
    ws.close();
  }
}

run().catch((err) => {
  console.error("[ERRO] Falha ao conectar:", err.message);
  process.exit(1);
});
