import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// --- DIAGNÓSTICO: logs temporários para debug de produção ---
if (typeof window !== "undefined") {
  const ok = !!(supabaseUrl && supabaseAnonKey);
  const isProd = import.meta.env.PROD;
  const env = isProd ? "produção" : "desenvolvimento";

  console.log("[Supabase] URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("[Supabase] KEY exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log("[Supabase] Ambiente:", env);
  console.log("[Supabase] VITE_SUPABASE_URL:", supabaseUrl ?? "undefined", supabaseUrl ? `(${supabaseUrl.length} chars)` : "");
  // Key: mostra só início e fim para debug (não expor completa)
  const keyPreview = supabaseAnonKey
    ? `${supabaseAnonKey.slice(0, 12)}...${supabaseAnonKey.slice(-4)} (${supabaseAnonKey.length} chars)`
    : "undefined";
  console.log("[Supabase] VITE_SUPABASE_ANON_KEY:", keyPreview);
  console.log("[Supabase] Config:", ok ? "OK" : "FALTANDO", { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });

  if (!ok) {
    console.error(
      "[Supabase] ERRO: VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY estão undefined. " +
        "Problema de build ou .env.production não carregado. " +
        "Defina as variáveis no build (ex: Hostinger Environment Variables) e faça redeploy."
    );
  } else if (supabaseUrl?.includes("localhost")) {
    console.warn("[Supabase] ATENÇÃO: URL contém localhost - em produção isso causa falha de conexão.");
  }
}
// --- fim diagnóstico ---

const url = supabaseUrl ?? "";
const key = supabaseAnonKey ?? "";

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

