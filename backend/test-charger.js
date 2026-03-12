const WebSocket = require("ws");

// URL do backend OCPP no Railway (override via OCPP_SERVER_URL para testes locais)
const SERVER_BASE =
  process.env.OCPP_SERVER_URL ||
  "https://renewed-exploration-production.up.railway.app";
const CHARGER_ID = "TEST_CHARGER";
const WS_URL = `${SERVER_BASE.replace(/^http/, "ws")}/ocpp/${CHARGER_ID}`;

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

async function run() {
  console.log("[TEST] Conectando em:", WS_URL);
  console.log("[TEST] Subprotocolo: ocpp1.6\n");

  const ws = new WebSocket(WS_URL, ["ocpp1.6"]);

  const pending = new Map();

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

  try {
    // BootNotification (OCPP 1.6)
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
    ws.close();
  } catch (err) {
    console.error("\n[ERRO]", err.message);
    ws.close();
  }
}

run().catch((err) => {
  console.error("[ERRO] Falha ao conectar:", err.message);
  process.exit(1);
});
