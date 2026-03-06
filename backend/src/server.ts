import "dotenv/config";
import express from "express";
import cors from "cors";
import { stationsRouter } from "./api/stations.routes";
import { startOcppServer } from "./ocpp/ocppServer";
import { startRealtimeServer, emitRealtime } from "./realtime/websocketServer";

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.send("Backend online");
});

app.use("/stations", stationsRouter);

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

startRealtimeServer();
startOcppServer(emitRealtime);
