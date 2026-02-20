import {
  Activity,
  Users,
  BarChart3,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Gamificação para Mobilidade Elétrica",
    description: "Transformamos o carregamento urbano em uma experiência dinâmica, baseada em progresso, metas e engajamento.",
  },
  {
    icon: Users,
    title: "Plataforma que engaja de verdade",
    description: "Metas, rankings e evolução em tempo real.",
  },
  {
    icon: BarChart3,
    title: "Uma rede que aprende com o uso",
    description: "Quanto mais ativa, mais eficiente.",
  },
  {
    icon: Building2,
    title: "Energia urbana com mentalidade de jogo",
    description: "Progresso visível. Crescimento constante.",
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
