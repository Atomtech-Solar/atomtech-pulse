import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase (criado uma única vez).
 * Usa SUPABASE_SERVICE_ROLE_KEY para bypass de RLS em operações OCPP.
 * @throws Error se SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estiverem definidas
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) {
    console.error(
      "[ENV] ERRO: Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente."
    );
    throw new Error(
      "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(url, key);
  console.log("[ENV] Supabase configurado com sucesso (SERVICE_ROLE)");
  return client;
}

/**
 * Verifica se as variáveis do Supabase estão definidas (sem criar o cliente).
 */
export function isSupabaseConfigured(): boolean {
  const url =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    "";
  return Boolean(url && key);
}
