import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";

interface StationHeaderProps {
  name: string;
  chargePointId: string;
}

export default function StationHeader({ name, chargePointId }: StationHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/dashboard")}
        aria-label="Voltar para dashboard"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          {name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">
          {chargePointId}
        </p>
      </div>
      <Button variant="outline" onClick={() => navigate("/dashboard")}>
        Voltar para dashboard
      </Button>
    </div>
  );
}
