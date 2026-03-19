/** Formata CEP para 00000-000 */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Remove formatação do CEP (apenas dígitos) */
export function parseCep(cep: string): string {
  return cep.replace(/\D/g, "");
}
