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
import { isSupabaseConfigured } from "./database/supabaseClient";

// ========== Tratamento global de erros (evita crash do processo) ==========
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] uncaughtException:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] unhandledRejection:", reason, promise);
});

// ========== Validação de variáveis de ambiente ==========
/** Porta HTTP (API + WebSocket upgrade OCPP/realtime). */
const PORT = Number(process.env.PORT) || 8080;
/**
 * Bind em todas as interfaces — obrigatório para carregadores e proxy (Nginx) no VPS.
 * Use 127.0.0.1 só em dev local se não quiser expor na rede.
 */
const HOST = (process.env.HOST ?? "0.0.0.0").trim() || "0.0.0.0";

if (!isSupabaseConfigured()) {
  console.warn(
    "[ENV] AVISO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas. " +
      "Operações de banco (OCPP, API) falharão até que as variáveis sejam configuradas."
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
server.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT} (OCPP + API + WS upgrade)`);
  console.log(`[server] health: http://${HOST}:${PORT}/health`);
  console.log(`[server] OCPP WebSocket path: ws://<host>:${PORT}${OCPP_PATH_PREFIX}<chargePointId> (use wss:// atrás de TLS)`);
});

function shutdown(signal: string) {
  console.log(`[server] ${signal} recebido — encerrando conexões...`);
  server.close(() => {
    console.log("[server] HTTP encerrado.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[server] timeout no shutdown — forçando exit.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
