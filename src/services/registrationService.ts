import { supabase } from "@/lib/supabaseClient";

export type RegistrationInput = {
  name: string;
  email: string;
  account_type: "user" | "company";
  phone?: string | null;
  company_name?: string | null;
  cnpj?: string | null;
};

export async function createRegistration(data: RegistrationInput): Promise<{ error: string | null }> {
  console.log("[Register] inserting registration", {
    email: data.email,
    account_type: data.account_type,
  });

  const client = supabase as unknown as {
    from: (
      table: string
    ) => {
      insert: (payload: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
    };
  };

  const { error } = await client.from("registrations").insert({
    name: data.name,
    email: data.email,
    account_type: data.account_type,
    status: "pending",
    created_at: new Date().toISOString(),
    phone: data.phone ?? null,
    company_name: data.company_name ?? null,
    cnpj: data.cnpj ?? null,
  });

  if (error) {
    return { error: error.message ?? "Não foi possível registrar o cadastro." };
  }

  console.log("[Register] registration success", {
    email: data.email,
    account_type: data.account_type,
  });
  return { error: null };
}
