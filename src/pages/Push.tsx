import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Send } from "lucide-react";
import { usePushNotifications } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function Push() {
  const { selectedCompanyId } = useAuth();
  const { data: history = [], refetch } = usePushNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      toast({ title: "Selecione uma empresa", description: "Escolha uma empresa para enviar notificações." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("push_notifications").insert({
      company_id: selectedCompanyId,
      title,
      message,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar notificação", description: error.message, variant: "destructive" });
      return;
    }
    setTitle("");
    setMessage("");
    toast({ title: "Notificação criada", description: "Histórico atualizado. Envio real é futuro." });
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Push Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Envie notificações para os usuários</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Nova Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Título da notificação"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Conteúdo da mensagem..."
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground glow-primary"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Notificação"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleDateString("pt-BR")} • {h.recipients_count} destinatários
                  </p>
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
