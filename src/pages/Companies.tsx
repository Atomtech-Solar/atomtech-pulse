import { useState } from "react";
import { useCompanies } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, AlertCircle, Globe, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import {
  isSupabaseAuthError,
  dispatchSessionInvalid,
} from "@/lib/supabaseAuthUtils";

const defaultForm = {
  name: "",
  cnpj: "",
  city: "",
  uf: "",
  status: "active" as "active" | "inactive",
  website_url: "",
  logo_url: "",
};

export default function Companies() {
  const { user } = useAuth();
  const { data: companies = [], isLoading, isError, refetch } = useCompanies();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) setForm(defaultForm);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("companies").insert({
      name: form.name.trim(),
      cnpj: form.cnpj.trim() || null,
      city: form.city.trim() || null,
      uf: form.uf.trim().toUpperCase().slice(0, 2) || null,
      status: form.status,
      website_url: form.website_url.trim() || null,
      logo_url: form.logo_url.trim() || null,
    });
    setSaving(false);
    if (error) {
      if (isSupabaseAuthError(error)) dispatchSessionInvalid();
      else toast({ title: "Erro ao criar empresa", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Empresa criada", description: form.name });
    handleOpenChange(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão multi-tenant</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-destructive">Falha ao carregar empresas. Verifique as permissões no banco (RLS) e tente novamente.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão multi-tenant</p>
        </div>
        {user?.role === "super_admin" && (
          <>
            <Button
              className="gradient-primary text-primary-foreground glow-primary"
              onClick={() => setOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Empresa
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Empresa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome *</Label>
                    <Input
                      id="company-name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Razão social"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-cnpj">CNPJ</Label>
                    <Input
                      id="company-cnpj"
                      value={form.cnpj}
                      onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-city">Cidade</Label>
                      <Input
                        id="company-city"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-uf">UF</Label>
                      <Input
                        id="company-uf"
                        value={form.uf}
                        onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v: "active" | "inactive") => setForm((f) => ({ ...f, status: v }))}
                    >
                      <SelectTrigger id="company-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-url" className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> URL do site
                    </Label>
                    <Input
                      id="company-url"
                      type="url"
                      value={form.website_url}
                      onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                      placeholder="https://empresa.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-logo" className="flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> URL da foto / logo
                    </Label>
                    <Input
                      id="company-logo"
                      type="url"
                      value={form.logo_url}
                      onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                      placeholder="https://exemplo.com/logo.png"
                    />
                    {form.logo_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={form.logo_url}
                          alt="Preview logo"
                          className="h-12 w-12 rounded-md border border-border object-cover bg-muted"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <span className="text-xs text-muted-foreground">Preview</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Salvando…" : "Cadastrar empresa"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estações</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              ) : companies.map(c => (
                <TableRow key={c.id} className="border-border cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium flex items-center gap-2">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt=""
                        className="w-7 h-7 rounded-md object-cover border border-border bg-muted"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-primary" /></div>
                    )}
                    {c.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.cnpj}</TableCell>
                  <TableCell>{c.city}, {c.uf}</TableCell>
                  <TableCell>{c.stations_count}</TableCell>
                  <TableCell>{c.users_count}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">{c.status === 'active' ? 'Ativa' : 'Inativa'}</Badge>
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
