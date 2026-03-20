import {
  Activity,
  Users,
  BarChart3,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Quero fazer parte da rede",
    description: "Conecte seu espaço a uma nova era da mobilidade.",
  },
  {
    icon: Users,
    title: "Quero instalar um ponto",
    description: "Transforme seu local em um ativo estratégico.",
  },
  {
    icon: BarChart3,
    title: "Quero entrar na Top Up",
    description: "Integre a rede que está crescendo nas cidades.",
  },
  {
    icon: Building2,
    title: "Quero ativar meu ponto",
    description: "Seu carregador pode integrar nosso ecossistema.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10 leading-tight">
          Transformando pontos de recarga em ativos estratégicos.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 sm:p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 sm:mb-4">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
