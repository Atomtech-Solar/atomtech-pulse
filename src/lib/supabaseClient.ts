import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (typeof window !== "undefined") {
  const ok = !!(supabaseUrl && supabaseAnonKey);
  console.log("[Supabase] Config:", ok ? "OK" : "FALTANDO", { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, url: supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : "undefined" });
  if (!ok) console.warn("[Supabase] Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas no build.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

