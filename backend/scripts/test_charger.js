const WebSocket = require("ws");

const CHARGER_ID = "TEST_CHARGER";
const CONNECTOR_ID = 1;

const BASE_URL =
  process.env.OCPP_SERVER_URL || "ws://renewed-exploration.railway.internal";
const WS_URL = `${BASE_URL.replace(/^http/, "ws")}/ocpp/${CHARGER_ID}`;

const METER_INTERVAL_MS = 5000;
const START_TX_DELAY_MS = 2000;
const MAX_KWH = 10;

/** OCPP 1.6 Call: [2, uniqueId, action, payload] */
function ocppCall(uniqueId, action, payload) {
  return JSON.stringify([2, uniqueId, action, payload]);
}

/** Parse CallResult: [3, uniqueId, payload] or CallError: [4, uniqueId, code, desc] */
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
  console.log("Connecting to server:", WS_URL);

  const ws = new WebSocket(WS_URL, ["ocpp1.6"]);
  const pending = new Map();
  let transactionId = null;
  let energyKwh = 0;
  let meterCounter = 0;
  let meterIntervalId = null;

  ws.on("open", () => {
    console.log("Connected to server\n");
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
        console.log("Server response:", JSON.stringify(resp.payload));
      } else {
        console.error("Server error:", resp.code, "-", resp.desc);
      }
    } else {
      console.log("Server message:", data.toString());
    }
  });

  ws.on("error", (err) => {
    console.error("Connection error:", err.message);
  });

  ws.on("close", () => {
    console.log("\nDisconnected from server");
    process.exit(0);
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

  function sendMeterValues() {
    if (transactionId == null) return;
    meterCounter += 1;
    energyKwh += 1;
    const uniqueId = `meter-${meterCounter}`;
    const energyWh = energyKwh * 1000;
    const payload = {
      connectorId: CONNECTOR_ID,
      transactionId,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            {
              value: String(energyWh),
              measurand: "Energy.Active.Import.Register",
              unit: "Wh",
            },
          ],
        },
      ],
    };
    ws.send(ocppCall(uniqueId, "MeterValues", payload));
    console.log(`MeterValues sent: ${energyKwh} kWh`);

    if (energyKwh >= MAX_KWH) {
      clearInterval(meterIntervalId);
      meterIntervalId = null;
      (async () => {
        await sendAndWait("stop-1", "StopTransaction", {
          transactionId,
          idTag: "TEST_USER",
          meterStop: energyWh,
          timestamp: new Date().toISOString(),
        });
        console.log("StopTransaction sent");
        console.log("Charging session finished");
        ws.close();
      })();
    }
  }

  try {
    // BootNotification
    await sendAndWait("boot-1", "BootNotification", {
      chargePointVendor: "Atomtech",
      chargePointModel: "Simulated Charger",
    });
    console.log("BootNotification sent\n");

    await sleep(START_TX_DELAY_MS);

    // StartTransaction
    const startResult = await sendAndWait("start-1", "StartTransaction", {
      connectorId: CONNECTOR_ID,
      idTag: "TEST_USER",
      meterStart: 0,
      timestamp: new Date().toISOString(),
    });
    transactionId = startResult?.transactionId;
    if (transactionId == null) {
      throw new Error("StartTransaction did not return transactionId");
    }
    energyKwh = 0;
    console.log("Transaction started (id:", transactionId, ")\n");

    // MeterValues every 5 seconds
    meterIntervalId = setInterval(sendMeterValues, METER_INTERVAL_MS);
  } catch (err) {
    console.error("Error:", err.message);
    ws.close();
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
