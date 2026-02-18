import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Ticket } from "lucide-react";
import { useVouchers } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function Vouchers() {
  const { selectedCompanyId, user } = useAuth();
  const { data: vouchers = [], refetch } = useVouchers();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedCompanyId) {
      toast({ title: "Selecione uma empresa", description: "Escolha uma empresa para criar vouchers." });
      return;
    }
    setCreating(true);
    const code = `VOUCHER-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("vouchers").insert({
      company_id: selectedCompanyId,
      code,
      name: "Novo Voucher",
      type: "kWh",
      total: 100,
      daily: 10,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Erro ao criar voucher", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Voucher criado", description: code });
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Vouchers</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie cupons e descontos</p>
        </div>
        {user?.role !== "viewer" && (
          <Button
            className="gradient-primary text-primary-foreground glow-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            <Plus className="w-4 h-4 mr-2" /> {creating ? "Criando..." : "Novo Voucher"}
          </Button>
        )}
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
                  <TableCell className="text-sm">
                    {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString("pt-BR") : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        v.status === "active"
                          ? "bg-accent/20 text-accent border-accent/30"
                          : "bg-muted text-muted-foreground border-muted"
                      }
                    >
                      {v.status === "active" ? "Ativo" : "Expirado"}
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
