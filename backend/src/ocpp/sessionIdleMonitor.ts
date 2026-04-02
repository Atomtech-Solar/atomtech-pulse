import { finalizeTransactionIdleTimeout } from "../services/transactionService";
import { clearSessionIdleTimer, scheduleSessionIdleTimer } from "./sessionIdleRegistry";

const IDLE_MS = Number(process.env.OCPP_SESSION_IDLE_MS ?? 60_000);

/**
 * @param hasSignificantFlow — potência/corrente acima do limiar (ou energia acumulada relevante)
 */
export function touchSessionIdleState(
  ocppTransactionId: number,
  hasSignificantFlow: boolean,
  chargePointId: string
): void {
  if (hasSignificantFlow) {
    clearSessionIdleTimer(ocppTransactionId);
    return;
  }

  scheduleSessionIdleTimer(ocppTransactionId, IDLE_MS, () => {
    void finalizeTransactionIdleTimeout(ocppTransactionId, chargePointId).catch((err) =>
      console.error(`[sessionIdleMonitor] finalize idle ${ocppTransactionId}:`, err)
    );
  });
}

export function getIdleMs(): number {
  return IDLE_MS;
}

export { clearSessionIdleTimer } from "./sessionIdleRegistry";
