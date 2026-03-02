import { supabase } from "@/lib/supabaseClient";

export type RegistrationInput = {
  name: string;
  email: string;
  account_type: "user" | "company";
  phone?: string | null;
  company_name?: string | null;
  cnpj?: string | null;
};

const REGISTRATION_TIMEOUT_MS = 8000;

export async function createRegistration(
  data: RegistrationInput,
  timeoutMs = REGISTRATION_TIMEOUT_MS
): Promise<{ error: string | null; timedOut?: boolean }> {
  console.log("[Register] inserting registration", {
    email: data.email,
    account_type: data.account_type,
  });

  const insertPayload = {
    name: data.name,
    email: data.email,
    account_type: data.account_type,
    status: "pending",
    created_at: new Date().toISOString(),
    phone: data.phone ?? null,
    company_name: data.company_name ?? null,
    cnpj: data.cnpj ?? null,
  };

  const insertPromise = supabase.from("registrations").insert(insertPayload);

  const timeoutPromise = new Promise<{ error: string; timedOut: true }>((resolve) =>
    setTimeout(
      () => resolve({ error: "TIMEOUT", timedOut: true }),
      timeoutMs
    )
  );

  const result = await Promise.race([
    insertPromise.then(({ error }) =>
      error
        ? { error: error.message ?? "Não foi possível registrar o cadastro.", timedOut: false as const }
        : { error: null as string | null, timedOut: false as const }
    ),
    timeoutPromise,
  ]).catch((err) => ({
    error: err instanceof Error ? err.message : "Não foi possível registrar o cadastro.",
    timedOut: false as const,
  }));

  if (result.timedOut) {
    console.warn("[Register] registration timed out after", timeoutMs, "ms");
    return result;
  }
  if (result.error) {
    return result;
  }

  console.log("[Register] registration success", {
    email: data.email,
    account_type: data.account_type,
  });
  return { error: null, timedOut: false };
}
