import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Ticket } from 'lucide-react';

const vouchers = [
  { id: 1, code: 'PROMO2026', name: 'Promoção Verão', type: 'kWh', total: 100, daily: 10, used: 45, status: 'active', expiry: '2026-03-31' },
  { id: 2, code: 'ECO50', name: 'Eco Desconto', type: '%', total: 200, daily: 20, used: 120, status: 'active', expiry: '2026-06-30' },
  { id: 3, code: 'WELCOME', name: 'Boas-vindas', type: 'R$', total: 50, daily: 5, used: 50, status: 'expired', expiry: '2026-01-31' },
];

export default function Vouchers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Vouchers</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie cupons e descontos</p>
        </div>
        <Button className="gradient-primary text-primary-foreground glow-primary"><Plus className="w-4 h-4 mr-2" /> Novo Voucher</Button>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Usados</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map(v => (
                <TableRow key={v.id} className="border-border">
                  <TableCell className="font-mono text-xs">{v.code}</TableCell>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.type}</TableCell>
                  <TableCell>{v.total}</TableCell>
                  <TableCell>{v.used}</TableCell>
                  <TableCell className="text-sm">{new Date(v.expiry).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={v.status === 'active' ? 'bg-accent/20 text-accent border-accent/30' : 'bg-muted text-muted-foreground border-muted'}>
                      {v.status === 'active' ? 'Ativo' : 'Expirado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
