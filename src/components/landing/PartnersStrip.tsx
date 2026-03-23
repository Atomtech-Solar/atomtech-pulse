import { useState } from "react";

const ROW_1 = [
  "Atom Tech", "Energia Plus", "EletroCharge", "Volt Brasil", "Recarga Verde",
  "EcoVolt", "ChargeBR", "Elétrica Move", "Power Green", "Rede EV",
];
const ROW_2 = [
  "Mobilidade EV", "Sustentech", "Carga Rápida", "EcoDrive", "Power Flow",
  "VoltSmart", "Elétrico Brasil", "Zap Charge", "Energia Move", "Recarga Plus",
];

function MarqueeRow({
  items,
  direction,
  isPaused,
}: {
  items: string[];
  direction: "ltr" | "rtl";
  isPaused: boolean;
}) {
  // Cada nome e cada estrela como elemento separado (não blocos)
  const buildChunk = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center gap-6 shrink-0">
      {items.flatMap((name, i) => {
        const els: React.ReactNode[] = [
          <span key={`${keyPrefix}-n-${i}`} className="partners-item cursor-default whitespace-nowrap text-sm sm:text-base">
            {name}
          </span>,
        ];
        if (i < items.length - 1) {
          els.push(
            <span key={`${keyPrefix}-s-${i}`} className="text-[#a1a1aa] opacity-80 shrink-0 text-xs">
              ✦
            </span>
          );
        }
        return els;
      })}
    </div>
  );

  return (
    <div
      className="flex items-center w-max"
      style={{
        animation: direction === "ltr" ? "marquee-ltr 40s linear infinite" : "marquee-rtl 40s linear infinite",
        animationPlayState: isPaused ? "paused" : "running",
      }}
    >
      {["a", "b", "c", "d"].map((prefix) => buildChunk(prefix))}
    </div>
  );
}

export default function PartnersStrip() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section
      className="w-full overflow-hidden bg-[#030712] border-y border-white/5"
      style={{ minHeight: "80px", maxHeight: "120px", height: "100px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Linha 1: esquerda → direita (conteúdo entra pela direita, sai pela esquerda) */}
      <div className="h-1/2 overflow-hidden flex items-center">
        <MarqueeRow items={ROW_1} direction="ltr" isPaused={isPaused} />
      </div>

      {/* Linha 2: direita → esquerda */}
      <div className="h-1/2 overflow-hidden flex items-center">
        <MarqueeRow items={ROW_2} direction="rtl" isPaused={isPaused} />
      </div>
    </section>
  );
}
