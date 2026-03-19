import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import type { StationDetails } from "@/services/stationsService";

interface LocationTabProps {
  station: StationDetails;
}

function formatAddress(station: StationDetails): string {
  const parts = [
    station.street,
    station.address_number,
    station.city,
    station.uf,
    station.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default function LocationTab({ station }: LocationTabProps) {
  const hasCoords = station.lat != null && station.lng != null;

  const handleViewMap = () => {
    if (hasCoords) {
      window.open(
        `https://www.google.com/maps?q=${station.lat},${station.lng}`,
        "_blank",
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Endereço</CardTitle>
        <Button variant="outline" size="sm" onClick={handleViewMap} disabled={!hasCoords}>
          <MapPin className="mr-2 h-4 w-4" />
          Ver no mapa
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Endereço completo</p>
          <p className="mt-0.5 text-sm font-medium">{formatAddress(station)}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">CEP</p>
            <p className="mt-0.5 text-sm font-medium">{station.cep ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cidade / Estado / País</p>
            <p className="mt-0.5 text-sm font-medium">
              {[station.city, station.uf, station.country]
                .filter(Boolean)
                .join(" / ") || "—"}
            </p>
          </div>
        </div>
        {hasCoords && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
            <p className="text-xs text-muted-foreground">
              Integração futura com mapa (Google Maps / Mapbox)
            </p>
            <p className="mt-1 font-mono text-sm">
              {station.lat}, {station.lng}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
