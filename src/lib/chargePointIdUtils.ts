/** Regex: apenas identificador (letras, números, underscore, hífen) */
const VALID_CHARGE_POINT_ID = /^[a-zA-Z0-9_-]+$/;

/** Prefixos de URL a remover automaticamente */
const URL_PREFIXES = /^(wss?|https?):\/\//i;

/**
 * Remove prefixos de URL do Charge Point ID.
 * Ex: "ws://charger001" → "charger001"
 */
export function stripUrlPrefixes(value: string): string {
  return value.replace(URL_PREFIXES, "").trim();
}

/**
 * Valida Charge Point ID: apenas identificador, sem URLs.
 * Exemplos válidos: charger001, station_sp_01, evcharger_abc
 */
export function isValidChargePointId(value: string): boolean {
  const cleaned = stripUrlPrefixes(value);
  return cleaned.length > 0 && VALID_CHARGE_POINT_ID.test(cleaned);
}

/**
 * Sanitiza e valida. Retorna o ID limpo ou null se inválido.
 */
export function sanitizeChargePointId(value: string): { valid: true; id: string } | { valid: false; error: string } {
  const stripped = stripUrlPrefixes(value);
  if (!stripped) {
    return { valid: false, error: "Informe o Charge Point ID (OCPP)." };
  }
  if (!VALID_CHARGE_POINT_ID.test(stripped)) {
    return {
      valid: false,
      error: "Use apenas letras, números, underscore (_) e hífen (-). Ex: charger001, station_sp_01",
    };
  }
  return { valid: true, id: stripped };
}
