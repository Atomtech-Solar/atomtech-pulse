import { Router } from "express";
import {
  listStationsWithConnectors,
  createStation,
  getStationByIdWithDetails,
} from "../services/stationService";

export const stationsRouter = Router();

stationsRouter.get("/", async (_req, res) => {
  try {
    const stations = await listStationsWithConnectors();
    res.json(
      stations.map((s) => ({
        station_id: s.id,
        name: s.name,
        charge_point_id: s.charge_point_id,
        status: s.status,
        vendor: s.charge_point_vendor ?? null,
        model: s.charge_point_model ?? null,
        last_seen: s.last_seen,
        city: s.city,
        uf: s.uf,
        total_kwh: s.total_kwh,
        total_sessions: s.total_sessions,
        connectors: s.connectors.map((c) => ({
          connector_id: c.connector_id,
          status: c.status,
          energy_kwh: c.energy_kwh,
          power_kw: c.power_kw,
        })),
      }))
    );
  } catch (err) {
    console.error("[API] Erro ao listar estações:", err);
    res.status(500).json({ error: "Erro ao listar estações" });
  }
});

stationsRouter.get("/:station_id", async (req, res) => {
  try {
    const { station_id } = req.params;
    const station = await getStationByIdWithDetails(station_id);
    if (!station) {
      return res.status(404).json({ error: "Estação não encontrada" });
    }
    res.json(station);
  } catch (err) {
    console.error("[API] Erro ao buscar estação:", err);
    res.status(500).json({ error: "Erro ao buscar estação" });
  }
});

stationsRouter.post("/", async (req, res) => {
  try {
    const { company_id, name, charge_point_id, city, uf, lat, lng, charge_point_vendor, charge_point_model, connector_count } = req.body;

    if (!company_id || !name || !charge_point_id) {
      return res.status(400).json({
        error: "company_id, name e charge_point_id são obrigatórios",
      });
    }

    const station = await createStation({
      company_id: Number(company_id),
      name: String(name).trim(),
      charge_point_id: String(charge_point_id).trim(),
      city: city ? String(city).trim() : null,
      uf: uf ? String(uf).trim().toUpperCase().slice(0, 2) : null,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      charge_point_vendor: charge_point_vendor ? String(charge_point_vendor).trim().slice(0, 50) : null,
      charge_point_model: charge_point_model ? String(charge_point_model).trim().slice(0, 50) : null,
      connector_count: connector_count != null && connector_count > 0 ? Number(connector_count) : null,
    });

    res.status(201).json(station);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar estação";
    if (msg.includes("já cadastrado")) {
      return res.status(409).json({ error: msg });
    }
    console.error("[API] Erro ao criar estação:", err);
    res.status(500).json({ error: "Erro ao criar estação" });
  }
});
