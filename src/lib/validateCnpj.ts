/**
 * Remove caracteres não numéricos do CNPJ
 */
export function stripCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Valida formato e dígitos verificadores do CNPJ
 */
export function validateCnpj(cnpj: string): { valid: boolean; error?: string } {
  const digits = stripCnpj(cnpj);

  if (digits.length !== 14) {
    return { valid: false, error: "CNPJ deve ter 14 dígitos" };
  }

  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, error: "CNPJ inválido" };
  }

  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  let rest = sum % 11;
  const d1 = rest < 2 ? 0 : 11 - rest;
  if (d1 !== parseInt(digits[12], 10)) {
    return { valid: false, error: "Dígito verificador inválido" };
  }

  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  rest = sum % 11;
  const d2 = rest < 2 ? 0 : 11 - rest;
  if (d2 !== parseInt(digits[13], 10)) {
    return { valid: false, error: "Dígito verificador inválido" };
  }

  return { valid: true };
}

/**
 * Formata CNPJ como XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(cnpj: string): string {
  const d = stripCnpj(cnpj);
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
