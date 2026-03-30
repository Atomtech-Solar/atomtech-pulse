import { Link } from "react-router-dom";
import { Zap, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <header className="border-b border-white/10 bg-[#0a0a0a]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-white transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14AB5D] shadow-[0_0_16px_rgba(20,171,93,0.35)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold">Luma Gen</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#a1a1aa] transition-colors hover:border-[#14AB5D]/35 hover:text-[#14AB5D]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à landing
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="mb-8 font-display text-2xl font-bold text-white sm:text-3xl">
          Política de Privacidade e Proteção de Dados (LGPD)
        </h1>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-white">1. Finalidade da Coleta:</h2>
          <p className="leading-relaxed text-[#a1a1aa]">
            Ao preencher nosso formulário, seus dados (Nome, E-mail e WhatsApp) são coletados exclusivamente para:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 leading-relaxed text-[#a1a1aa]">
            <li>Identificar você e sua necessidade técnica.</li>
            <li>Enviar a proposta comercial ou o orçamento solicitado.</li>
            <li>Realizar o acompanhamento comercial (follow-up) da sua solicitação.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">2. Consentimento e Liberdade:</h2>
          <p className="leading-relaxed text-[#a1a1aa]">
            Ao clicar em &quot;Enviar&quot; e marcar a caixa de seleção, você dá seu consentimento livre para que a Atom Tech / Luma Generation processe seus dados. Você não é obrigado a fornecer essas informações, mas elas são indispensáveis para gerarmos seu diagnóstico ou orçamento.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">3. Armazenamento e Segurança:</h2>
          <p className="leading-relaxed text-[#a1a1aa]">
            Seus dados são tratados com total sigilo e armazenados em ambiente seguro. Não compartilhamos, vendemos ou alugamos suas informações. O acesso é restrito apenas à nossa equipe comercial e técnica.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">4. Seus Direitos (Acesso e Exclusão):</h2>
          <p className="leading-relaxed text-[#a1a1aa]">
            De acordo com a LGPD, você tem o direito de, a qualquer momento:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-2 leading-relaxed text-[#a1a1aa]">
            <li>Confirmar que estamos tratando seus dados.</li>
            <li>Acessar seus dados.</li>
            <li>
              Revogar o consentimento: Você pode solicitar a exclusão definitiva dos seus dados da nossa base enviando um e-mail para:{" "}
              <a
                href="mailto:contato@atomtech.com.br"
                className="text-[#14AB5D] underline underline-offset-2 transition-colors hover:text-[#4ade80]"
              >
                contato@atomtech.com.br
              </a>
              .
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
