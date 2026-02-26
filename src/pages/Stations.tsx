import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStations } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import {
  isSupabaseAuthError,
  dispatchSessionInvalid,
} from "@/lib/supabaseAuthUtils";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  online: "bg-accent/20 text-accent border-accent/30",
  offline: "bg-destructive/20 text-destructive border-destructive/30",
  maintenance: "bg-chart-3/20 text-chart-3 border-chart-3/30",
};

const connectorColors = {
  available: "bg-accent",
  in_use: "bg-chart-3",
  offline: "bg-destructive",
};

export default function Stations() {
  const { user, selectedCompanyId } = useAuth();
  const { data: stations = [], refetch } = useStations();
  const data = stations;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");

  const handleCreate = async () => {
    if (!selectedCompanyId) {
      toast({ title: "Selecione uma empresa", description: "Escolha uma empresa para cadastrar a estação." });
      return;
    }
    const { error } = await supabase.from("stations").insert({
      company_id: selectedCompanyId,
      name,
      city,
      uf,
    });
    if (error) {
      if (isSupabaseAuthError(error)) dispatchSessionInvalid();
      else toast({ title: "Erro ao criar estação", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estação criada", description: name });
    setOpen(false);
    setStep(1);
    setName("");
    setCity("");
    setUf("");
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Estações</h1>
          <p className="text-muted-foreground text-sm mt-1">{data.length} estações cadastradas</p>
        </div>
        {user?.role !== "viewer" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground glow-primary">
                <Plus className="w-4 h-4 mr-2" /> Nova Estação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Estação - Etapa {step} de 3</DialogTitle>
              </DialogHeader>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!name}>
                    Próxima
                  </Button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input value={uf} onChange={e => setUf(e.target.value)} required />
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Voltar
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!city || !uf}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Revisar dados e confirmar criação. Configuração detalhada de conectores ficará para uma próxima
                    versão.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li><strong>Nome:</strong> {name}</li>
                    <li><strong>Cidade:</strong> {city}</li>
                    <li><strong>UF:</strong> {uf}</li>
                  </ul>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Voltar
                    </Button>
                    <Button onClick={handleCreate}>Concluir</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map(station => (
          <Card key={station.id} className="border-border bg-card hover:glow-primary transition-shadow duration-300 cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{station.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{station.city}, {station.uf}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusColors[station.status]}>{station.status}</Badge>
              </div>

              <div className="flex items-center gap-1.5 mb-4">
                {(station.station_connectors ?? station.connectors ?? []).map((c: { id: number; type: string; status: string; power_kw: number }) => (
                  <div key={c.id} className="flex items-center gap-1.5 bg-secondary rounded-md px-2 py-1">
                    <div className={`w-2 h-2 rounded-full ${connectorColors[c.status]}`} />
                    <span className="text-xs text-muted-foreground">{c.type} {c.power_kw}kW</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-lg font-display font-bold text-foreground">{station.total_sessions}</p>
                  <p className="text-[10px] text-muted-foreground">Recargas</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-lg font-display font-bold text-foreground">{station.total_kwh.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-muted-foreground">kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
