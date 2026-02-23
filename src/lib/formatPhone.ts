/**
 * Remove caracteres não numéricos do telefone (mantém apenas dígitos após +55)
 */
export function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Formata apenas a parte nacional (DDD + número) - SEM +55.
 * Usuário digita a partir do 61. Exibe: 61 9 XXXX-XXXX (celular) ou 61 XXXX-XXXX (fixo)
 */
export function formatPhoneNational(digits: string): string {
  const d = stripPhone(digits).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  if (d.length === 3) {
    return d[2] === "9" ? `${d.slice(0, 2)} 9` : `${d.slice(0, 2)} ${d[2]}`;
  }
  if (d[2] === "9") {
    const ddd = d.slice(0, 2);
    const rest = d.slice(3);
    if (rest.length <= 4) return `${ddd} 9 ${rest}`;
    return `${ddd} 9 ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `${ddd} ${rest}`;
  return `${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

/**
 * Retorna apenas os dígitos nacionais (sem +55) - max 11
 * Ex: "61 9 9999-9999" -> "61999999999"
 */
export function getPhoneDigits(formatted: string): string {
  return stripPhone(formatted).slice(0, 11);
}

/**
 * Valida telefone brasileiro (celular 11 dígitos ou fixo 10 dígitos)
 */
export function validatePhoneBR(digits: string): { valid: boolean; error?: string } {
  const d = stripPhone(digits);
  if (d.length < 10) {
    return { valid: false, error: "Telefone incompleto" };
  }
  if (d.length === 10) {
    // Fixo: DDD + 8 dígitos
    return { valid: true };
  }
  if (d.length === 11 && d[2] === "9") {
    // Celular: DDD + 9 + 8 dígitos
    return { valid: true };
  }
  return { valid: false, error: "Formato inválido. Use DDD + 9 + número para celular." };
}
