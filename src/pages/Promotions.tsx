import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag } from 'lucide-react';

const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const defaultTariff = {
  initial: '2.50', perKwh: '1.50', perMin: '0.10', opFee: '5.00', tax: '8', idle: '0.50', reserve: '3.00', idleTime: '15',
};

export default function Promotions() {
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
              <div className="space-y-1"><Label className="text-[10px]">Valor Inicial (R$)</Label><Input defaultValue={defaultTariff.initial} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[10px]">Valor/kWh (R$)</Label><Input defaultValue={defaultTariff.perKwh} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[10px]">Valor/min (R$)</Label><Input defaultValue={defaultTariff.perMin} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[10px]">Taxa Op. (R$)</Label><Input defaultValue={defaultTariff.opFee} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[10px]">Impostos (%)</Label><Input defaultValue={defaultTariff.tax} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[10px]">Ociosidade (R$)</Label><Input defaultValue={defaultTariff.idle} className="h-8 text-sm" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
