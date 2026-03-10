import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { stationsRouter } from "./api/stations.routes";
import {
  startRealtimeServer,
  emitRealtime,
  getRealtimeWss,
  REALTIME_PATH,
} from "./realtime/websocketServer";
import {
  startOcppServer,
  getOcppWss,
  OCPP_PATH_PREFIX,
} from "./ocpp/ocppServer";

// ========== Tratamento global de erros (evita crash do processo) ==========
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] uncaughtException:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] unhandledRejection:", reason, promise);
});

// ========== Validação de variáveis de ambiente ==========
const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "";

if (!SUPABASE_URL) {
  console.warn(
    "[ENV] AVISO: SUPABASE_URL não definida. Operações de banco podem falhar."
  );
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[ENV] AVISO: SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY não definidas. Operações de banco podem falhar."
  );
}

// ========== Express App ==========
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.send("Backend online");
});

app.use("/stations", stationsRouter);

// ========== HTTP Server (único, para API + WebSocket + OCPP) ==========
const server = http.createServer(app);

// ========== WebSocket Realtime (no mesmo servidor) ==========
startRealtimeServer(server);

// ========== OCPP WebSocket (no mesmo servidor) ==========
startOcppServer(server, emitRealtime);

// ========== Roteamento único de upgrade (evita múltiplos handlers) ==========
server.on("upgrade", (request, socket, head) => {
  const pathname = (request.url ?? "/").split("?")[0];

  if (pathname === REALTIME_PATH || pathname.startsWith(`${REALTIME_PATH}/`)) {
    const wss = getRealtimeWss();
    if (wss) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
    return;
  }

  if (pathname.startsWith(OCPP_PATH_PREFIX)) {
    const wss = getOcppWss();
    if (wss) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
    return;
  }

  socket.destroy();
});

// ========== Iniciar servidor ==========
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://0.0.0.0:${PORT}`);
  console.log(`WebSocket Realtime: ws://0.0.0.0:${PORT}${REALTIME_PATH}`);
  console.log(`OCPP: ws://0.0.0.0:${PORT}${OCPP_PATH_PREFIX}{chargePointId}`);
});
