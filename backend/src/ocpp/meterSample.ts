/**
 * Extração de amostras OCPP 1.6 MeterValues para validar carregamento real.
 * Potência em W, corrente em A, energia acumulada em Wh (register).
 */

const DEFAULT_MIN_POWER_W = Number(process.env.OCPP_MIN_CHARGING_POWER_W ?? 100);
const DEFAULT_MIN_CURRENT_A = Number(process.env.OCPP_MIN_CHARGING_CURRENT_A ?? 1);

export interface ParsedMeterSample {
  powerW: number | null;
  currentA: number | null;
  energyWh: number | null;
  connectorId: number | null;
  transactionId: number | null;
}

function parseFloatSafe(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/** Normaliza unidade para W */
function toWatts(value: number, unit?: string, context?: string): number {
  const u = (unit ?? "").toLowerCase();
  if (u === "kw" || context?.toLowerCase().includes("kw")) return value * 1000;
  return value;
}

/** Normaliza para A */
function toAmps(value: number, unit?: string): number {
  const u = (unit ?? "").toLowerCase();
  if (u === "ma") return value / 1000;
  return value;
}

export function parseMeterValuesPayload(payload: unknown): ParsedMeterSample {
  const p = payload as {
    connectorId?: number;
    transactionId?: number;
    meterValue?: Array<{
      sampledValue?: Array<{
        value?: string;
        measurand?: string;
        unit?: string;
        context?: string;
      }>;
    }>;
  };

  const connectorId = p?.connectorId != null ? Number(p.connectorId) : null;
  const transactionId = p?.transactionId != null ? Number(p.transactionId) : null;

  let powerW: number | null = null;
  let currentA: number | null = null;
  let energyWh: number | null = null;

  const meterValues = p?.meterValue ?? [];
  for (const mv of meterValues) {
    const samples = mv?.sampledValue ?? [];
    for (const s of samples) {
      const measurand = (s.measurand ?? "").trim();
      const raw = parseFloatSafe(s.value);
      if (raw == null) continue;

      switch (measurand) {
        case "Power.Active.Import":
          {
            const w = toWatts(raw, s.unit, s.context ?? undefined);
            powerW = powerW == null ? w : Math.max(powerW, w);
          }
          break;
        case "Current.Import":
          {
            const a = toAmps(raw, s.unit);
            currentA = currentA == null ? a : Math.max(currentA, a);
          }
          break;
        case "Energy.Active.Import.Register":
          energyWh = raw;
          break;
        default:
          break;
      }
    }
  }

  return { powerW, currentA, energyWh, connectorId, transactionId };
}

export function hasSignificantChargingFlow(
  sample: ParsedMeterSample,
  opts?: { minPowerW?: number; minCurrentA?: number }
): boolean {
  const minP = opts?.minPowerW ?? DEFAULT_MIN_POWER_W;
  const minI = opts?.minCurrentA ?? DEFAULT_MIN_CURRENT_A;

  if (sample.powerW != null && sample.powerW >= minP) return true;
  if (sample.currentA != null && sample.currentA >= minI) return true;
  return false;
}

/** Delta mínimo no registrador de energia (Wh) para considerar início de carga sem P/I */
const MIN_ENERGY_DELTA_WH = Number(process.env.OCPP_MIN_ENERGY_DELTA_WH ?? 50);

export function shouldPromoteFromEnergyRegister(meterStartWh: number, energyWh: number | null): boolean {
  if (energyWh == null) return false;
  return energyWh - meterStartWh >= MIN_ENERGY_DELTA_WH;
}

export { DEFAULT_MIN_POWER_W, DEFAULT_MIN_CURRENT_A };
