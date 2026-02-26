import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Shield } from "lucide-react";
import { useCompanySettings } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  isSupabaseAuthError,
  dispatchSessionInvalid,
} from "@/lib/supabaseAuthUtils";
import { useToast } from "@/hooks/use-toast";

const employees = [
  { id: 1, name: "João Silva", role: "Criador", permissions: "Acesso Total" },
  { id: 2, name: "Maria Santos", role: "Gerente", permissions: "Visualizar, Editar" },
  { id: 3, name: "Carlos Mendes", role: "Visualizador", permissions: "Visualizar" },
];

export default function SettingsPage() {
  const { selectedCompanyId } = useAuth();
  const { data: settings, refetch } = useCompanySettings();
  const { toast } = useToast();

  const [currency, setCurrency] = useState("BRL");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [co2, setCo2] = useState("0.5");

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
      setTimezone(settings.timezone);
      setCo2(String(settings.co2_factor));
    }
  }, [settings]);

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    const numericCo2 = Number(co2.replace(",", "."));
    const payload = {
      currency,
      timezone,
      co2_factor: numericCo2,
      company_id: selectedCompanyId,
    };
    const { error } = await supabase
      .from("company_settings")
      .upsert(payload, { onConflict: "company_id" });
    if (error) {
      if (isSupabaseAuthError(error)) dispatchSessionInvalid();
      else toast({ title: "Erro ao salvar configurações", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas", description: "Preferências atualizadas com sucesso." });
      refetch();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Preferências do sistema e equipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fuso Horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fórmula CO₂ (kg/kWh)</Label>
              <Input value={co2} onChange={e => setCo2(e.target.value)} />
            </div>
            <Button className="gradient-primary text-primary-foreground glow-primary" onClick={handleSave}>
              Salvar
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Equipe</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {employees.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{e.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.permissions}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{e.role}</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2"><Shield className="w-4 h-4 mr-2" /> Gerenciar Permissões</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
