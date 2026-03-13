import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

/**
 * Página de monitoramento detalhado da estação.
 * Rota: /dashboard/stations/:chargePointId
 * Será expandida para exibir sessões, métricas em tempo real, etc.
 */
export default function StationDetailPage() {
  const { chargePointId } = useParams<{ chargePointId: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/stations")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">
            Estação {chargePointId ?? "—"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitoramento detalhado
          </p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Em desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O monitoramento detalhado desta estação estará disponível em breve.
            Aqui você poderá visualizar sessões de carregamento, consumo em tempo real
            e histórico de conexões OCPP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
