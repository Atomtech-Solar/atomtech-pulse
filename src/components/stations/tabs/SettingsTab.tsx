import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StationDetails } from "@/services/stationsService";

interface SettingsTabProps {
  station: StationDetails;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export default function SettingsTab({ station }: SettingsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Charge Point ID" value={station.charge_point_id} />
          <DetailRow
            label="Tipo de conexão OCPP"
            value={
              station.connection_type === "wss"
                ? "WSS (TLS / domínio)"
                : "WS (IP / rede local)"
            }
          />
          <DetailRow label="ID Externo" value={station.external_id} />
          <DetailRow label="Descrição" value={station.description} />
          <DetailRow label="Grupo" value={station.station_group} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horários</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Aberto 24h" value={station.open_24h ? "Sim" : "Não"} />
          {!station.open_24h && (
            <>
              <DetailRow label="Horário de abertura" value={station.opening_time} />
              <DetailRow label="Horário de fechamento" value={station.closing_time} />
            </>
          )}
        </CardContent>
      </Card>
      {(station.main_photo_url || (station.photo_urls?.length ?? 0) > 0) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fotos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {station.main_photo_url && (
              <a
                href={station.main_photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Foto principal
              </a>
            )}
            {station.photo_urls?.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Foto {i + 1}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
