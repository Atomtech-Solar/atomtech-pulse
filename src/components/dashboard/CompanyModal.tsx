import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
export interface CompanyOption {
  id: number;
  name: string;
}

export interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyOption[];
  selectedCompanyId: number | null;
  onSelect: (id: number | null) => void;
}

export function CompanyModal({
  open,
  onOpenChange,
  companies,
  selectedCompanyId,
  onSelect,
}: CompanyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary/80" />
            Escolher empresa
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1 py-2 max-h-[60vh] overflow-y-auto">
          <Button
            variant={selectedCompanyId === null ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 h-10"
            onClick={() => {
              onSelect(null);
              onOpenChange(false);
            }}
          >
            <Building2 className="w-4 h-4 shrink-0 opacity-70" />
            Visão Global
          </Button>
          {companies.map((c) => (
            <Button
              key={c.id}
              variant={selectedCompanyId === c.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 h-10"
              onClick={() => {
                onSelect(c.id);
                onOpenChange(false);
              }}
            >
              <Building2 className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{c.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
