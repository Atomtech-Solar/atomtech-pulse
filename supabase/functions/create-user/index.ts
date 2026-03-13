import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Payload = {
  email?: string;
  password?: string;
  name?: string;
  accountType?: "user" | "company";
  phone?: string | null;
  companyName?: string | null;
  cnpj?: string | null;
};

function mapError(msg: string): { code: string; message: string; status: number } {
  const m = msg.toLowerCase();
  if (m.includes("already") || m.includes("duplicate") || m.includes("exists")) {
    return { code: "EMAIL_ALREADY_EXISTS", message: "Este email já está cadastrado. Faça login.", status: 409 };
  }
  if (m.includes("password")) {
    return { code: "INVALID_PASSWORD", message: "A senha não atende aos requisitos mínimos.", status: 422 };
  }
  return { code: "CREATE_FAILED", message: "Não foi possível criar a conta. Tente novamente.", status: 500 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Método não permitido." } }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return json({ success: false, error: { code: "SERVER_ERROR", message: "Serviço indisponível." } }, 500);
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return json({ success: false, error: { code: "INVALID_PAYLOAD", message: "Corpo inválido." } }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const accountType = body.accountType === "company" ? "company" : "user";
  const phone = body.phone && String(body.phone).trim() ? String(body.phone).trim() : null;
  const companyName = String(body.companyName ?? "").trim();
  const cnpj = body.cnpj ? String(body.cnpj).replace(/\D/g, "") : null;

  if (!email || !email.includes("@")) {
    return json({ success: false, error: { code: "INVALID_PAYLOAD", message: "Email inválido." } }, 400);
  }
  if (password.length < 6) {
    return json({ success: false, error: { code: "INVALID_PASSWORD", message: "A senha deve ter pelo menos 6 caracteres." } }, 400);
  }
  if (!name) {
    return json({ success: false, error: { code: "INVALID_PAYLOAD", message: "Nome é obrigatório." } }, 400);
  }
  if (accountType === "company") {
    if (!companyName) return json({ success: false, error: { code: "INVALID_PAYLOAD", message: "Nome da empresa é obrigatório." } }, 400);
    if (!cnpj || cnpj.length !== 14) return json({ success: false, error: { code: "INVALID_PAYLOAD", message: "CNPJ inválido." } }, 400);
  }

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, company_name: accountType === "company" ? companyName : null, phone },
  });

  if (createErr || !created.user) {
    const e = mapError(createErr?.message ?? "Erro ao criar usuário");
    return json({ success: false, error: { code: e.code, message: e.message } }, e.status);
  }

  const userId = created.user.id;

  if (accountType === "company" && cnpj) {
    const { data: existing } = await admin.from("companies").select("id").eq("cnpj", cnpj).maybeSingle();
    let companyId: number;
    if (existing?.id) {
      companyId = existing.id;
    } else {
      const { data: ins, error: insErr } = await admin.from("companies").insert({ name: companyName, cnpj }).select("id").single();
      if (insErr || !ins?.id) {
        await admin.auth.admin.deleteUser(userId);
        return json({ success: false, error: { code: "CREATE_FAILED", message: "Erro ao criar empresa." } }, 500);
      }
      companyId = ins.id;
    }
    const { error: upErr } = await admin.from("profiles").update({ company_id: companyId, role: "company_admin" }).eq("user_id", userId);
    if (upErr) {
      await admin.auth.admin.deleteUser(userId);
      return json({ success: false, error: { code: "CREATE_FAILED", message: "Erro ao vincular empresa." } }, 500);
    }
  }

  return json({ success: true }, 200);
});
