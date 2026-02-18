import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // In dev, fail fast if env is missing
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are missing. Check .env.local.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

