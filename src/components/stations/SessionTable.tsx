import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "./stationConstants";

export interface SessionRow {
  transactionId: string | number;
  connectorId: number;
  startTime: string;
  stopTime: string | null;
  energyKwh: number;
}

interface SessionTableProps {
  sessions: SessionRow[];
  emptyMessage?: string;
}

export default function SessionTable({
  sessions,
  emptyMessage = "Nenhuma sessão registrada.",
}: SessionTableProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">{emptyMessage}</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction ID</TableHead>
          <TableHead>Connector</TableHead>
          <TableHead>Start time</TableHead>
          <TableHead>Stop time</TableHead>
          <TableHead>Energia consumida</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={String(session.transactionId)}>
            <TableCell className="font-mono">{session.transactionId}</TableCell>
            <TableCell>{session.connectorId}</TableCell>
            <TableCell>{formatDateTime(session.startTime)}</TableCell>
            <TableCell>{formatDateTime(session.stopTime)}</TableCell>
            <TableCell>{session.energyKwh.toFixed(2)} kWh</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
