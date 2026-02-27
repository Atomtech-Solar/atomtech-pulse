import { supabase } from "@/lib/supabaseClient";

export type RegistrationInput = {
  name: string;
  email: string;
  account_type: "user" | "company";
  phone?: string | null;
  company_name?: string | null;
  cnpj?: string | null;
};

export async function createRegistration(
  data: RegistrationInput,
  timeoutMs = 10000
): Promise<{ error: string | null; timedOut?: boolean }> {
  console.log("[Register] inserting registration", {
    email: data.email,
    account_type: data.account_type,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { error } = await supabase
      .from("registrations")
      .insert({
        name: data.name,
        email: data.email,
        account_type: data.account_type,
        status: "pending",
        created_at: new Date().toISOString(),
        phone: data.phone ?? null,
        company_name: data.company_name ?? null,
        cnpj: data.cnpj ?? null,
      })
      .abortSignal(controller.signal);

    if (error) {
      return { error: error.message ?? "Não foi possível registrar o cadastro." };
    }
  } catch (err) {
    const isTimeoutAbort =
      err instanceof DOMException && err.name === "AbortError";
    if (isTimeoutAbort) {
      return { error: "TIMEOUT", timedOut: true };
    }
    return {
      error: err instanceof Error ? err.message : "Não foi possível registrar o cadastro.",
    };
  } finally {
    clearTimeout(timeoutId);
  }

  console.log("[Register] registration success", {
    email: data.email,
    account_type: data.account_type,
  });
  return { error: null, timedOut: false };
}
