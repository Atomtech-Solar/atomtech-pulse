import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import type { StationTransaction } from "./types";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

interface StationTransactionsProps {
  transactions: StationTransaction[];
  isLoading?: boolean;
}

export default function StationTransactions({
  transactions,
  isLoading,
}: StationTransactionsProps) {
  return (
    <Card className="flex h-full min-h-0 flex-col transition-colors hover:border-muted-foreground/20">
      <CardHeader className="shrink-0 py-4">
        <h3 className="text-sm font-semibold">Transações</h3>
        <p className="text-xs text-muted-foreground">
          Últimas sessões de carregamento
        </p>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pt-0">
        <ScrollArea className="h-[300px] pr-3">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-border p-4"
                >
                  <div className="flex justify-between">
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                  <div className="mt-2 flex gap-4">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <DollarSign className="mx-auto h-14 w-14 text-muted-foreground/40" />
              </motion.div>
              <p className="mt-4 text-sm font-medium">Nenhuma sessão registrada ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Transações aparecerão aqui quando houver carregamentos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <motion.div
                  key={String(tx.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{tx.energyKwh.toFixed(2)} kWh</p>
                        <p className="text-xs text-muted-foreground">
                          Connector {tx.connectorId}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {tx.valueBrl != null && (
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {fmtMoney(tx.valueBrl)}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          tx.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-primary/12 text-primary border-primary/28"
                        }
                      >
                        {tx.status === "completed" ? "Concluída" : "Em andamento"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(tx.durationMinutes)}
                    </span>
                    {tx.valueBrl == null && tx.energyKwh > 0 && (
                      <span>Valor não configurado</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
