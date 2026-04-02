/** Apenas timers — sem import de transactionService (evita ciclo) */

const idleTimers = new Map<number, ReturnType<typeof setTimeout>>();

export function clearSessionIdleTimer(ocppTransactionId: number): void {
  const t = idleTimers.get(ocppTransactionId);
  if (t) {
    clearTimeout(t);
    idleTimers.delete(ocppTransactionId);
  }
}

export function scheduleSessionIdleTimer(
  ocppTransactionId: number,
  idleMs: number,
  onFire: () => void
): void {
  clearSessionIdleTimer(ocppTransactionId);
  const tid = setTimeout(() => {
    idleTimers.delete(ocppTransactionId);
    onFire();
  }, idleMs);
  idleTimers.set(ocppTransactionId, tid);
}
