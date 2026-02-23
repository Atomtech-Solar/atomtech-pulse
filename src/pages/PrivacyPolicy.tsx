import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">TOP-UP</span>
          </Link>
          <Link
            to="/cadastro"
            className="text-sm text-primary hover:underline underline-offset-2"
          >
            Cadastro
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-8">
          Política de Privacidade e Proteção de Dados (LGPD)
        </h1>
        

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            1. Finalidade da Coleta:
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao preencher nosso formulário, seus dados (Nome, E-mail e WhatsApp) são coletados exclusivamente para:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
            <li>Identificar você e sua necessidade técnica.</li>
            <li>Enviar a proposta comercial ou o orçamento solicitado.</li>
            <li>Realizar o acompanhamento comercial (follow-up) da sua solicitação.</li>
          </ul>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            2. Consentimento e Liberdade:
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao clicar em &quot;Enviar&quot; e marcar a caixa de seleção, você dá seu consentimento livre para que a Atom Tech / Top-Up processe seus dados. Você não é obrigado a fornecer essas informações, mas elas são indispensáveis para gerarmos seu diagnóstico ou orçamento.
          </p>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            3. Armazenamento e Segurança:
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Seus dados são tratados com total sigilo e armazenados em ambiente seguro. Não compartilhamos, vendemos ou alugamos suas informações. O acesso é restrito apenas à nossa equipe comercial e técnica.
          </p>
        </section>

        <section className="space-y-4 mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            4. Seus Direitos (Acesso e Exclusão):
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            De acordo com a LGPD, você tem o direito de, a qualquer momento:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
            <li>Confirmar que estamos tratando seus dados.</li>
            <li>Acessar seus dados.</li>
            <li>
              Revogar o consentimento: Você pode solicitar a exclusão definitiva dos seus dados da nossa base enviando um e-mail para:{" "}
              <a
                href="mailto:contato@atomtech.com.br"
                className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                contato@atomtech.com.br
              </a>
              .
            </li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            to="/cadastro"
            className="text-primary hover:underline underline-offset-2 text-sm"
          >
            ← Voltar ao cadastro
          </Link>
        </div>
      </div>
    </div>
  );
}
