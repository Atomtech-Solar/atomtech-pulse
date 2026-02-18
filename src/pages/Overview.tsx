import { useAuth } from '@/contexts/AuthContext';
import { stations, sessions, evUsers, consumptionByDay, popularHours, filterByCompany } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Zap, BatteryCharging, DollarSign, Leaf, TreePine, Gauge } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const { user, selectedCompanyId } = useAuth();
  const role = user?.role ?? 'viewer';

  const filteredStations = filterByCompany(stations, selectedCompanyId, role);
  const filteredSessions = filterByCompany(sessions, selectedCompanyId, role);
  const filteredUsers = filterByCompany(evUsers, selectedCompanyId, role);

  const totalKwh = filteredStations.reduce((s, st) => s + st.total_kwh, 0);
  const totalRevenue = filteredSessions.reduce((s, se) => s + se.revenue, 0);
  const activeSessions = filteredSessions.filter(s => s.status === 'active').length;
  const onlineStations = filteredStations.filter(s => s.status === 'online').length;
  const allConnectors = filteredStations.flatMap(s => s.connectors);
  const availableConnectors = allConnectors.filter(c => c.status === 'available').length;
  const co2Saved = totalKwh * 0.5;
  const treesEquiv = Math.round(co2Saved / 22);

  const kpis = [
    { label: 'Usuários', value: filteredUsers.length.toLocaleString('pt-BR'), icon: Users, color: 'text-primary' },
    { label: 'Sessões Ativas', value: activeSessions, icon: Activity, color: 'text-accent' },
    { label: 'Recargas Total', value: filteredSessions.length, icon: BatteryCharging, color: 'text-chart-3' },
    { label: 'Estações Online', value: `${onlineStations}/${filteredStations.length}`, icon: Zap, color: 'text-primary' },
    { label: 'Conectores Livres', value: `${availableConnectors}/${allConnectors.length}`, icon: Gauge, color: 'text-accent' },
    { label: 'kWh Consumidos', value: totalKwh.toLocaleString('pt-BR'), icon: BatteryCharging, color: 'text-chart-3' },
    { label: 'Receita Estimada', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-accent' },
    { label: 'CO₂ Economizado', value: `${co2Saved.toLocaleString('pt-BR')} kg`, icon: Leaf, color: 'text-chart-2' },
    { label: 'Árvores Equiv.', value: treesEquiv, icon: TreePine, color: 'text-chart-2' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Visão Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {role === 'super_admin' && !selectedCompanyId ? 'Consolidado de todas as empresas' : 'Resumo operacional'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="border-border bg-card hover:glow-primary transition-shadow duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consumo & Receita por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={consumptionByDay}>
                <defs>
                  <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="kwh" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#kwhGrad)" name="kWh" />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#revGrad)" name="Receita (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horários Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={popularHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessões" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
