import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Plug,
  DollarSign,
  MapPin,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import OverviewTab from "./tabs/OverviewTab";
import ConnectorsTab from "./tabs/ConnectorsTab";
import FinancialTab from "./tabs/FinancialTab";
import LocationTab from "./tabs/LocationTab";
import SettingsTab from "./tabs/SettingsTab";
import SessionTable from "./SessionTable";
import type { StationDetails } from "@/services/stationsService";

interface StationSpecTabsProps {
  station: StationDetails;
  totalRevenue: number | null;
  onAddConnector?: () => void;
}

const tabTriggerClass =
  "data-[state=active]:bg-background data-[state=active]:shadow-sm";

export default function StationSpecTabs({
  station,
  totalRevenue,
  onAddConnector,
}: StationSpecTabsProps) {
  const sessionRows = station.recent_sessions.map((s) => ({
    transactionId: s.transaction_id,
    connectorId: s.connector_id,
    startTime: s.start_time,
    stopTime: s.stop_time,
    energyKwh: s.energy_kwh,
  }));

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-4 h-auto flex-wrap gap-1 bg-muted/50 p-1">
        <TabsTrigger value="overview" className={tabTriggerClass}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="connectors" className={tabTriggerClass}>
          <Plug className="mr-2 h-4 w-4" />
          Conectores
        </TabsTrigger>
        <TabsTrigger value="financial" className={tabTriggerClass}>
          <DollarSign className="mr-2 h-4 w-4" />
          Financeiro
        </TabsTrigger>
        <TabsTrigger value="location" className={tabTriggerClass}>
          <MapPin className="mr-2 h-4 w-4" />
          Localização
        </TabsTrigger>
        <TabsTrigger value="settings" className={tabTriggerClass}>
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <OverviewTab station={station} />
            {sessionRows.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                  Sessões Recentes
                </h3>
                <SessionTable sessions={sessionRows} />
              </div>
            )}
          </motion.div>
      </TabsContent>

      <TabsContent value="connectors" className="mt-0">
          <motion.div
            key="connectors"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ConnectorsTab station={station} onAddConnector={onAddConnector} />
          </motion.div>
      </TabsContent>

      <TabsContent value="financial" className="mt-0">
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <FinancialTab station={station} totalRevenue={totalRevenue} />
          </motion.div>
      </TabsContent>

      <TabsContent value="location" className="mt-0">
          <motion.div
            key="location"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <LocationTab station={station} />
          </motion.div>
      </TabsContent>

      <TabsContent value="settings" className="mt-0">
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsTab station={station} />
          </motion.div>
      </TabsContent>
    </Tabs>
  );
}
