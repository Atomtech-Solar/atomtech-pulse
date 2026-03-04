/**
 * Serviço de autenticação.
 * Cadastro via Edge Function clever-service (sem uso de supabase.auth.signUp no frontend).
 */

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  accountType: "user" | "company";
  phone?: string | null;
  companyName?: string | null;
  cnpj?: string | null;
};

function getCleverServiceUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) {
    throw new Error("VITE_SUPABASE_URL não configurada.");
  }
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectRef = match?.[1];
  if (!projectRef) {
    throw new Error("URL do Supabase inválida. Não foi possível obter o project ref.");
  }
  return `https://${projectRef}.functions.supabase.co/clever-service`;
}

export async function registerUser(payload: RegisterPayload): Promise<true> {
  const url = getCleverServiceUrl();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (data?.error as { message?: string })?.message ??
        data?.error?.message ??
        (typeof data?.error === "string" ? data.error : undefined) ??
        "Erro ao criar conta.";
      throw new Error(message);
    }

    if (data?.success === false) {
      const message =
        (data?.error as { message?: string })?.message ??
        data?.error?.message ??
        (typeof data?.error === "string" ? data.error : undefined) ??
        "Erro ao criar conta.";
      throw new Error(message);
    }

    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro inesperado ao criar conta.");
  }
}
