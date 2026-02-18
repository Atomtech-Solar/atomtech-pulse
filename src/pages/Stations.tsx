import { useAuth } from '@/contexts/AuthContext';
import { stations, filterByCompany } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, MapPin } from 'lucide-react';

const statusColors = {
  online: 'bg-accent/20 text-accent border-accent/30',
  offline: 'bg-destructive/20 text-destructive border-destructive/30',
  maintenance: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
};

const connectorColors = {
  available: 'bg-accent',
  in_use: 'bg-chart-3',
  offline: 'bg-destructive',
};

export default function Stations() {
  const { user, selectedCompanyId } = useAuth();
  const data = filterByCompany(stations, selectedCompanyId, user?.role ?? 'viewer');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Estações</h1>
          <p className="text-muted-foreground text-sm mt-1">{data.length} estações cadastradas</p>
        </div>
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
                {station.connectors.map(c => (
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
