/**
 * Utilitários para detecção de erros de autenticação Supabase/PostgREST.
 * Usado para forçar logout quando a sessão está inválida ou expirada.
 */

const AUTH_ERROR_CODES = ["PGRST301", "401", "invalid_jwt", "jwt_expired"];
const AUTH_ERROR_PATTERNS = [
  /jwt/i,
  /refresh.*token/i,
  /token.*expired/i,
  /session.*expired/i,
  /not.*authenticated/i,
  /invalid.*credentials/i,
];

export function isSupabaseAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; code?: string; status?: number };
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  const code = String(e.code ?? e.status ?? "");

  if (AUTH_ERROR_CODES.includes(code) || AUTH_ERROR_CODES.includes(String(e.status))) {
    return true;
  }
  return AUTH_ERROR_PATTERNS.some((p) => p.test(msg));
}

const SESSION_INVALID_EVENT = "auth:session-invalid";

export function dispatchSessionInvalid(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT));
  }
}

export function onSessionInvalid(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(SESSION_INVALID_EVENT, handler);
  return () => window.removeEventListener(SESSION_INVALID_EVENT, handler);
}
