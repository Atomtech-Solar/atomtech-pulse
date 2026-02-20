import {
  Activity,
  Users,
  BarChart3,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Monitoramento em tempo real",
    description: "Acompanhe o status de cada carregador e sessão ativa em um painel unificado.",
  },
  {
    icon: Users,
    title: "Controle de usuários",
    description: "Gerencie perfis, permissões e acesso à plataforma com flexibilidade total.",
  },
  {
    icon: BarChart3,
    title: "Relatórios financeiros",
    description: "Análises detalhadas de receita, consumo e métricas para decisões estratégicas.",
  },
  {
    icon: Building2,
    title: "Gestão multi-empresa",
    description: "Opere múltiplas empresas e estações em um único dashboard centralizado.",
  },
];

export default function Features() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
          Tudo que você precisa para escalar
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Recursos pensados para operadores de redes de recarga de veículos elétricos.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
