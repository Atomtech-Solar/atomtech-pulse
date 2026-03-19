import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

interface StationHorarioProps {
  open24h: boolean;
  openingTime: string | null;
  closingTime: string | null;
}

function parseTime(t: string | null): { h: number; m: number } | null {
  if (!t) return null;
  const match = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
}

function isOpenNow(
  open24h: boolean,
  openingTime: string | null,
  closingTime: string | null,
): boolean | null {
  if (open24h) return true;
  const open = parseTime(openingTime);
  const close = parseTime(closingTime);
  if (!open || !close) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = open.h * 60 + open.m;
  const closeMin = close.h * 60 + close.m;
  if (closeMin > openMin) {
    return nowMin >= openMin && nowMin < closeMin;
  }
  return nowMin >= openMin || nowMin < closeMin;
}

export default function StationHorario({
  open24h,
  openingTime,
  closingTime,
}: StationHorarioProps) {
  const openNow = isOpenNow(open24h, openingTime, closingTime);

  if (open24h) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        >
          <Clock className="mr-1 h-3.5 w-3.5" />
          24h
        </Badge>
      </motion.div>
    );
  }

  if (openNow === null) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Clock className="h-4 w-4" />
        {openingTime && closingTime
          ? `${openingTime} - ${closingTime}`
          : "Horário não configurado"}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
    >
      <Badge
        variant="outline"
        className={
          openNow
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : "bg-muted text-muted-foreground"
        }
      >
        <Clock className="mr-1 h-3.5 w-3.5" />
        {openNow ? "Aberto agora" : "Fechado"}
      </Badge>
    </motion.div>
  );
}
