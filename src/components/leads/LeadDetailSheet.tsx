import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadSubmissionRow } from "@/services/leadSubmissionsService";
import {
  INTEREST_LABELS,
  interestBadgeClass,
  LEAD_STATUS_LABEL,
  leadStatusBadgeClass,
  formatDataJsonForDisplay,
  type LeadPipelineStatus,
} from "@/lib/leadSubmissionUi";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateLeadStatus } from "@/hooks/useLeadSubmissions";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

type LeadDetailSheetProps = {
  lead: LeadSubmissionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateLeadStatus();

  const canEditStatus =
    user?.role === "super_admin" || user?.role === "company_admin" || user?.role === "manager";

  if (!lead) return null;

  const interestKey = lead.interest_type as keyof typeof INTEREST_LABELS;
  const interestLabel = INTEREST_LABELS[interestKey] ?? lead.interest_type;
  const dataText = formatDataJsonForDisplay(lead.data, lead.interest_type);
  const imageUrl =
    typeof lead.data === "object" &&
    lead.data !== null &&
    !Array.isArray(lead.data) &&
    "image_url" in lead.data &&
    typeof (lead.data as { image_url?: string }).image_url === "string"
      ? (lead.data as { image_url: string }).image_url
      : "";

  const onStatusChange = (v: string) => {
    updateStatus.mutate({ id: lead.id, status: v as LeadPipelineStatus });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border bg-background">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{lead.name}</SheetTitle>
          <SheetDescription className="text-left">
            Enviado em {formatWhen(lead.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("border", interestBadgeClass(lead.interest_type))}>
              {interestLabel}
            </Badge>
            <Badge variant="outline" className={cn("border", leadStatusBadgeClass(lead.lead_status ?? "new"))}>
              {(() => {
                const k = (lead.lead_status ?? "new") as LeadPipelineStatus;
                return LEAD_STATUS_LABEL[k] ?? lead.lead_status ?? "—";
              })()}
            </Badge>
          </div>

          {canEditStatus ? (
            <div className="space-y-2">
              <Label>Status do lead</Label>
              <Select value={lead.lead_status ?? "new"} onValueChange={onStatusChange} disabled={updateStatus.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LEAD_STATUS_LABEL) as LeadPipelineStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LEAD_STATUS_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{lead.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="font-medium break-all">{lead.email ?? "—"}</p>
            </div>
            {lead.company_id != null ? (
              <div>
                <p className="text-xs text-muted-foreground">Empresa (ID)</p>
                <p className="font-mono text-xs">{lead.company_id}</p>
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Dados do formulário</p>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-xs leading-relaxed">
              {dataText || "—"}
            </pre>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Mensagem</p>
            <p className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
              {lead.message?.trim() ? lead.message : "—"}
            </p>
          </div>

          {imageUrl ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Imagem anexada</p>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-border"
              >
                <img src={imageUrl} alt="Anexo do lead" className="max-h-64 w-full object-contain bg-black/20" />
              </a>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
