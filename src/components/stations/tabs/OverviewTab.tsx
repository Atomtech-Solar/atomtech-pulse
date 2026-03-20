import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StationDetails } from "@/services/stationsService";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function fmtBool(b: boolean) {
  return b ? "Sim" : "Não";
}

interface OverviewTabProps {
  station: StationDetails;
}

export default function OverviewTab({ station }: OverviewTabProps) {
  const connectorDisplay =
    station.connector_count != null
      ? `${station.connectors.length} (pré-def: ${station.connector_count})`
      : String(station.connectors.length);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="ID da estação" value={station.charge_point_id} />
          <DetailRow label="Fabricante" value={station.vendor} />
          <DetailRow label="Modelo" value={station.model} />
          <DetailRow label="Tipo" value={station.station_type} />
          <DetailRow label="Número de conectores" value={connectorDisplay} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações Operacionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Habilitada" value={fmtBool(station.enabled)} />
          <DetailRow
            label="Reserva ativa"
            value={fmtBool(station.enable_reservation)}
          />
          <DetailRow
            label="Mostrar % carga"
            value={fmtBool(station.show_charge_percentage)}
          />
          <DetailRow label="Aberto 24h" value={fmtBool(station.open_24h)} />
        </CardContent>
      </Card>
    </div>
  );
}
