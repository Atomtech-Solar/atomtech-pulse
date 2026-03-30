/**
 * Chaves localStorage — marca Luma Gen.
 * Migração automática de chaves legadas `topup_*` em supabaseClient (sessão) e index.html (tema).
 */

export const STORAGE_KEY_USER = "luma_gen_user";
export const STORAGE_KEY_COMPANY = "luma_gen_company";
export const STORAGE_KEY_THEME = "luma_gen_theme";
export const STORAGE_KEY_LEADS_COLUMNS = "luma_gen_leads_visible_columns_v1";
export const SIDEBAR_EXPANDED_GROUP = "luma_gen_sidebar_expanded_group";
export const SIDEBAR_COLLAPSED = "luma_gen_sidebar_collapsed";

/** Chave da sessão JWT Supabase no cliente (deve coincidir com supabaseClient). */
export const SUPABASE_AUTH_STORAGE_KEY = "luma-supabase-auth";

const LEGACY: Record<string, string> = {
  topup_user: STORAGE_KEY_USER,
  topup_company: STORAGE_KEY_COMPANY,
  topup_theme: STORAGE_KEY_THEME,
  topup_leads_visible_columns_v1: STORAGE_KEY_LEADS_COLUMNS,
  topup_sidebar_expanded_group: SIDEBAR_EXPANDED_GROUP,
  topup_sidebar_collapsed: SIDEBAR_COLLAPSED,
  "topup-supabase-auth": SUPABASE_AUTH_STORAGE_KEY,
};

/** Copia valores legados para as novas chaves se a nova estiver vazia. */
export function migrateLegacyAuthStorageKeys(): void {
  if (typeof window === "undefined") return;
  try {
    for (const [from, to] of Object.entries(LEGACY)) {
      if (!localStorage.getItem(to) && localStorage.getItem(from)) {
        localStorage.setItem(to, localStorage.getItem(from)!);
      }
    }
  } catch {
    /* ignore */
  }
}
