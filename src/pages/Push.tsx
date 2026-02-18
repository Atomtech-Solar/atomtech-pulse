import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Send } from 'lucide-react';

const history = [
  { id: 1, title: 'Promoção de Carnaval', date: '2026-02-15', recipients: 340, status: 'sent' },
  { id: 2, title: 'Nova estação disponível', date: '2026-02-10', recipients: 210, status: 'sent' },
  { id: 3, title: 'Manutenção programada', date: '2026-02-05', recipients: 95, status: 'sent' },
];

export default function Push() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Push Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Envie notificações para os usuários</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Nova Notificação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input placeholder="Título da notificação" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Conteúdo da mensagem..." rows={4} /></div>
            <Button className="w-full gradient-primary text-primary-foreground glow-primary">Enviar Notificação</Button>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString('pt-BR')} • {h.recipients} destinatários</p>
                </div>
                <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">Enviado</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
