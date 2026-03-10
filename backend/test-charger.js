const WebSocket = require("ws");

const CHARGER_ID = "CP001";
const PORT = process.env.PORT || 3000;
const WS_URL = `ws://localhost:${PORT}/ocpp/${CHARGER_ID}`;

/** OCPP 1.6 Call: [2, uniqueId, action, payload] */
function ocppCall(uniqueId, action, payload) {
  return JSON.stringify([2, uniqueId, action, payload]);
}

/** Parse CallResult: [3, uniqueId, payload] */
function parseCallResult(data) {
  try {
    const arr = JSON.parse(data.toString());
    if (Array.isArray(arr) && arr[0] === 3) return { uniqueId: arr[1], payload: arr[2] };
  } catch {}
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const ws = new WebSocket(WS_URL);

  const pending = new Map();

  ws.on("message", (data) => {
    const result = parseCallResult(data);
    if (result) {
      const resolver = pending.get(result.uniqueId);
      if (resolver) {
        pending.delete(result.uniqueId);
        resolver(result.payload);
      }
    }
    console.log("Resposta do servidor:", data.toString());
  });

  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });

  console.log("Carregador conectado ao servidor\n");

  function sendAndWait(uniqueId, action, payload) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.has(uniqueId)) {
          pending.delete(uniqueId);
          reject(new Error(`Timeout: ${action}`));
        }
      }, 5000);
      pending.set(uniqueId, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
      ws.send(ocppCall(uniqueId, action, payload));
    });
  }

  try {
    // 1. BootNotification
    console.log("BootNotification enviado");
    await sendAndWait("boot-1", "BootNotification", {
      chargePointVendor: "Atomtech",
      chargePointModel: "Pulse-Simulator",
    });
    await sleep(300);

    // 2. Heartbeat
    console.log("Heartbeat enviado");
    await sendAndWait("hb-1", "Heartbeat", {});
    await sleep(300);

    // 3. StartTransaction
    console.log("StartTransaction enviado");
    const startPayload = {
      connectorId: 1,
      idTag: "TEST_USER",
      meterStart: 120000,
      timestamp: new Date().toISOString(),
    };
    const startResult = await sendAndWait("st-1", "StartTransaction", startPayload);
    const transactionId = startResult?.transactionId;
    if (transactionId == null) {
      throw new Error("StartTransaction não retornou transactionId");
    }
    console.log(`  → transactionId: ${transactionId}`);
    await sleep(300);

    // 4. MeterValues (5 mensagens simulando carregamento)
    const meterValues = [120500, 121000, 121500, 122000, 122500];
    console.log("MeterValues enviados (5 mensagens)");
    for (let i = 0; i < meterValues.length; i++) {
      const value = meterValues[i];
      await sendAndWait(`mv-${i + 1}`, "MeterValues", {
        connectorId: 1,
        transactionId,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [
              {
                value: String(value),
                measurand: "Energy.Active.Import.Register",
                unit: "Wh",
              },
            ],
          },
        ],
      });
      await sleep(400);
    }

    // 5. StopTransaction
    console.log("StopTransaction enviado");
    await sendAndWait("stop-1", "StopTransaction", {
      transactionId,
      meterStop: 125000,
      timestamp: new Date().toISOString(),
    });

    console.log("\n✅ Sessão completa simulada com sucesso!");
    console.log("   energy_kwh esperado: 5.0 kWh (125000 - 120000 Wh)");
  } catch (err) {
    console.error("\n❌ Erro:", err.message);
  } finally {
    ws.close();
  }
}

run().catch((err) => {
  console.error("Falha ao conectar:", err.message);
  process.exit(1);
});
