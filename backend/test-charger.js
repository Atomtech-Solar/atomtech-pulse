const WebSocket = require("ws");

const chargerId = "CP001";
const ws = new WebSocket(`ws://localhost:3001/ocpp/${chargerId}`);

ws.on("open", () => {
  console.log("Carregador conectado ao servidor");

  const bootNotification = [
    2,
    "12345",
    "BootNotification",
    {
      chargePointVendor: "Atomtech",
      chargePointModel: "Pulse-Simulator",
    },
  ];

  ws.send(JSON.stringify(bootNotification));
});

ws.on("message", (data) => {
  console.log("Resposta do servidor:", data.toString());
});
