import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleCheck, CircleX, Zap, Radio } from "lucide-react";
import { motion } from "framer-motion";
import type { StationEvent } from "./types";

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventIcon({ event }: { event: StationEvent }) {
  const iconClass = "h-4 w-4 shrink-0";
  if (event.type === "error") {
    return <CircleX className={`${iconClass} text-destructive`} />;
  }
  if (event.type === "started") {
    return <Zap className={`${iconClass} text-emerald-500`} />;
  }
  if (event.type === "stopped") {
    return <CircleCheck className={`${iconClass} text-muted-foreground`} />;
  }
  return <Radio className={`${iconClass} text-primary`} />;
}

interface StationEventsProps {
  events: StationEvent[];
  isLoading?: boolean;
}

export default function StationEvents({ events, isLoading }: StationEventsProps) {
  return (
    <Card className="flex h-full min-h-0 flex-col transition-colors hover:border-muted-foreground/20">
      <CardHeader className="shrink-0 py-4">
        <h3 className="text-sm font-semibold">Eventos</h3>
        <p className="text-xs text-muted-foreground">
          Timeline operacional • Tempo real
        </p>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pt-0">
        <ScrollArea className="h-[260px] pr-3">
          {isLoading ? (
            <div className="space-y-4 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="h-4 w-4 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Radio className="mx-auto h-14 w-14 text-muted-foreground/40" />
              </motion.div>
              <p className="mt-4 text-sm font-medium">Aguardando eventos em tempo real...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Eventos e logs OCPP aparecerão aqui quando o carregador comunicar
              </p>
            </div>
          ) : (
            <div className="relative pl-1">
              {/* Linha vertical da timeline */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-0">
                {events.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="group relative flex gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-border">
                      <EventIcon event={event} />
                    </div>
                    <div className="min-w-0 flex-1 rounded-md px-2 py-1 transition-colors group-hover:bg-muted/40">
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatEventTime(event.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
