/**
 * Aplica a migration de correção de RLS em companies.
 * Uso: defina SUPABASE_DB_URL no .env (Connection string do Supabase: Settings > Database > Connection string > URI)
 *      e rode: pnpm run db:fix-rls
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const url = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Uso: pnpm run db:fix-rls [SUPABASE_DB_URL]");
  console.error("Ou defina SUPABASE_DB_URL no .env (connection string do Postgres do Supabase).");
  process.exit(1);
}

const sqlPath = join(__dirname, "..", "supabase", "migrations", "20250225100000_fix_companies_rls.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("Migration de RLS (companies) aplicada com sucesso.");
} catch (err) {
  console.error("Erro ao aplicar migration:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
