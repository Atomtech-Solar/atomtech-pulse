import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Zap } from "lucide-react";

interface RegistrationSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function RegistrationSuccessModal({
  open,
  onOpenChange,
  onClose,
}: RegistrationSuccessModalProps) {
  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md z-[100]">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-xl">
            Cadastro realizado com sucesso
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2 text-center text-sm text-muted-foreground leading-relaxed">
              <p>Seja bem-vindo à Top-up.</p>
              <p>
                Sua solicitação foi recebida e está em análise por nossa equipe
                administrativa. Em breve, entraremos em contato para dar
                continuidade ao processo.
              </p>
              <p>Agradecemos pelo seu interesse.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center sm:justify-center">
          <AlertDialogAction className="w-full sm:w-auto min-w-[160px]">
            Continuar para Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
