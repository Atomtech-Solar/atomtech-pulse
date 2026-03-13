/**
 * Utilitários para detecção de erros de autenticação Supabase/PostgREST.
 * Usado para forçar logout quando a sessão está inválida ou expirada.
 * Também detecta erros de RLS (auth.uid() NULL, permissões insuficientes).
 */

const AUTH_ERROR_CODES = [
  "PGRST301", // JWT expired (PostgREST)
  "401",
  "invalid_jwt",
  "jwt_expired",
  "42501", // insufficient_privilege (PostgreSQL)
];
const AUTH_ERROR_PATTERNS = [
  /jwt/i,
  /refresh.*token/i,
  /token.*expired/i,
  /session.*expired/i,
  /not.*authenticated/i,
  /invalid.*credentials/i,
  /permission.*denied/i,
  /row-level security|rls/i,
  /policy.*violation/i,
  /insufficient.*privilege/i,
  /new row violates row-level security/i,
];

export function isSupabaseAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; code?: string; status?: number; details?: string };
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  const details = typeof e.details === "string" ? e.details.toLowerCase() : "";
  const code = String(e.code ?? e.status ?? "");

  if (AUTH_ERROR_CODES.includes(code) || AUTH_ERROR_CODES.includes(String(e.status))) {
    return true;
  }
  const combined = `${msg} ${details}`;
  return AUTH_ERROR_PATTERNS.some((p) => p.test(combined));
}

/** Log estruturado para erros de permissão/RLS (ajuda debug em produção). */
export function logPermissionError(context: string, error: unknown): void {
  const e = error as { message?: string; code?: string; details?: string };
  console.warn(
    `[RLS/Auth] ${context}:`,
    {
      code: e?.code,
      message: e?.message,
      details: e?.details,
      isAuthError: isSupabaseAuthError(error),
    }
  );
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
