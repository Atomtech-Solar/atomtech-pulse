import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import { useTariffs } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function Promotions() {
  const { selectedCompanyId } = useAuth();
  const { data: tariffs = [], refetch } = useTariffs();
  const { toast } = useToast();

  const tariffsByWeekday = useMemo(
    () => new Map(tariffs.map(t => [t.weekday, t])),
    [tariffs],
  );

  const handleBlur = async (weekdayIndex: number, field: keyof typeof tariffs[0], value: string) => {
    if (!selectedCompanyId) return;
    const numeric = Number(value.replace(",", "."));
    const existing = tariffsByWeekday.get(weekdayIndex);
    if (!existing) {
      const { error } = await supabase.from("tariffs").insert({
        company_id: selectedCompanyId,
        weekday: weekdayIndex,
        [field]: numeric,
      } as any);
      if (error) {
        toast({ title: "Erro ao salvar tarifa", description: error.message, variant: "destructive" });
      } else {
        refetch();
      }
      return;
    }
    const { error } = await supabase
      .from("tariffs")
      .update({ [field]: numeric } as any)
      .eq("id", existing.id);
    if (error) {
      toast({ title: "Erro ao salvar tarifa", description: error.message, variant: "destructive" });
    } else {
      refetch();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Promoções & Tarifas</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure preços por dia da semana</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {days.map(day => (
          <Card key={day} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-primary" />{day}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {(() => {
                const index = days.indexOf(day);
                const t = tariffsByWeekday.get(index);
                return (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Valor Inicial (R$)</Label>
                      <Input
                        defaultValue={t?.initial ?? 2.5}
                        className="h-8 text-sm"
                        onBlur={e => handleBlur(index, "initial" as any, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Valor/kWh (R$)</Label>
                      <Input
                        defaultValue={t?.per_kwh ?? 1.5}
                        className="h-8 text-sm"
                        onBlur={e => handleBlur(index, "per_kwh" as any, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Valor/min (R$)</Label>
                      <Input
                        defaultValue={t?.per_min ?? 0.1}
                        className="h-8 text-sm"
                        onBlur={e => handleBlur(index, "per_min" as any, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Taxa Op. (R$)</Label>
                      <Input
                        defaultValue={t?.op_fee ?? 5}
                        className="h-8 text-sm"
                        onBlur={e => handleBlur(index, "op_fee" as any, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Impostos (%)</Label>
                      <Input
                        defaultValue={t?.tax_percent ?? 8}
                        className="h-8 text-sm"
                        onBlur={e => handleBlur(index, "tax_percent" as any, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Ociosidade (R$)</Label>
                      <Input
                        defaultValue={t?.idle ?? 0.5}
                        className="h-8 text-sm"
                        onBlur={e => handleBlur(index, "idle" as any, e.target.value)}
                      />
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
