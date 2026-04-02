import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function formatAddress(station: {
  street?: string | null;
  address_number?: string | null;
  city?: string | null;
  uf?: string | null;
  cep?: string | null;
  country?: string | null;
}): string {
  const parts = [
    [station.street, station.address_number].filter(Boolean).join(", "),
    station.city,
    station.uf,
    station.cep ? `CEP ${station.cep}` : null,
    station.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "Endereço não informado";
}

interface StationSidebarProps {
  station: {
    charge_point_id: string;
    connection_type: "ws" | "wss";
    external_id: string | null;
    station_type: string | null;
    station_group: string | null;
    vendor: string | null;
    model: string | null;
    firmware: string | null;
    enabled: boolean;
    enable_reservation: boolean;
    open_24h: boolean;
    street: string | null;
    address_number: string | null;
    city: string | null;
    uf: string | null;
    cep: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
  };
  onEdit: () => void;
  onToggleEnabled: () => void;
  /** Deve concluir a exclusão (ex.: mutateAsync); em erro o diálogo permanece aberto */
  onDelete: () => void | Promise<void>;
  /** Nome da estação (textos de confirmação) */
  stationName: string;
  /** Apenas super_admin e company_admin (regra do produto) */
  canDelete?: boolean;
  deletePending?: boolean;
}

export default function StationSidebar({
  station,
  onEdit,
  onToggleEnabled,
  onDelete,
  stationName,
  canDelete = true,
  deletePending = false,
}: StationSidebarProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);

  const qrValue = `station:${station.charge_point_id}`;
  const hasCoords = station.lat != null && station.lng != null;

  const closeDeleteDialog = () => {
    setDeleteOpen(false);
    setDeleteStep(1);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setDeleteStep(1);
  };

  const handleViewMap = () => {
    if (hasCoords) {
      window.open(`https://www.google.com/maps?q=${station.lat},${station.lng}`, "_blank");
    }
  };

  const Block = ({ children, i }: { children: React.ReactNode; i: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * i, duration: 0.3 }}
    >
      {children}
    </motion.div>
  );

  return (
    <aside className="space-y-4">
      {/* Card 1: QR Code */}
      <Block i={0}>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-center rounded-xl bg-muted/40 p-8">
              <QRCodeSVG
                value={qrValue}
                size={140}
                level="M"
                includeMargin={false}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>
      </Block>

      {/* Card 2: Identidade */}
      <Block i={1}>
        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identidade
            </h4>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            <DetailRow label="Charge Point ID" value={station.charge_point_id} />
            <DetailRow label="ID Externo" value={station.external_id} />
          </CardContent>
        </Card>
      </Block>

      {/* Card 3: Hardware */}
      <Block i={2}>
        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hardware
            </h4>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            <DetailRow label="Marca" value={station.vendor} />
            <DetailRow label="Modelo" value={station.model} />
            <DetailRow label="Firmware" value={station.firmware} />
          </CardContent>
        </Card>
      </Block>

      {/* Card 4: Configuração */}
      <Block i={3}>
        <Card>
          <CardHeader className="pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configuração
            </h4>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            <DetailRow
              label="Tipo de conexão OCPP"
              value={
                station.connection_type === "wss"
                  ? "WSS (TLS / domínio)"
                  : "WS (IP / rede local)"
              }
            />
            <DetailRow label="Tipo" value={station.station_type} />
            <DetailRow label="Grupo" value={station.station_group} />
            <DetailRow label="Habilitada" value={station.enabled ? "Sim" : "Não"} />
            <DetailRow label="Reserva" value={station.enable_reservation ? "Sim" : "Não"} />
            <DetailRow label="Aberto 24h" value={station.open_24h ? "Sim" : "Não"} />
          </CardContent>
        </Card>
      </Block>

      {/* Card 5: Localização */}
      <Block i={4}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Localização
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleViewMap}
              disabled={!hasCoords}
            >
              <MapPin className="mr-1 h-3 w-3" />
              Ver no mapa
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">
              {formatAddress(station)}
            </p>
            {hasCoords && (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Integração futura com mapa
                </p>
                <p className="mt-1 font-mono text-xs">
                  {station.lat}, {station.lng}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Block>

      {/* Ações */}
      <Block i={5}>
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full justify-start" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={onToggleEnabled}>
          {station.enabled ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Desativar
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Ativar
            </>
          )}
        </Button>
        {canDelete && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setDeleteStep(1);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </Button>

            <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
              <AlertDialogContent className="sm:max-w-md">
                {deleteStep === 1 ? (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir estação?</AlertDialogTitle>
                      <AlertDialogDescription className="text-left">
                        Deseja excluir a estação{" "}
                        <span className="font-semibold text-foreground">«{stationName}»</span>?
                        Conectores, transações e demais dados vinculados a este ponto serão
                        removidos permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                      <AlertDialogCancel type="button" className="mt-0">
                        Cancelar
                      </AlertDialogCancel>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setDeleteStep(2)}
                      >
                        Sim, quero continuar
                      </Button>
                    </AlertDialogFooter>
                  </>
                ) : (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmação final</AlertDialogTitle>
                      <AlertDialogDescription className="text-left">
                        Tem certeza absoluta? A estação{" "}
                        <span className="font-semibold text-foreground">«{stationName}»</span> será
                        apagada e não poderá ser recuperada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="sm:mr-auto"
                        onClick={() => setDeleteStep(1)}
                      >
                        Voltar
                      </Button>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <AlertDialogCancel type="button" className="mt-0">
                          Cancelar
                        </AlertDialogCancel>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={deletePending}
                          onClick={async () => {
                            try {
                              await Promise.resolve(onDelete());
                              closeDeleteDialog();
                            } catch {
                              /* toast no pai */
                            }
                          }}
                        >
                          {deletePending ? "Excluindo…" : "Excluir definitivamente"}
                        </Button>
                      </div>
                    </AlertDialogFooter>
                  </>
                )}
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
      </Block>
    </aside>
  );
}
