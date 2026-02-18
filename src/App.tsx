import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import Sessions from "@/pages/Sessions";
import Stations from "@/pages/Stations";
import UsersPage from "@/pages/Users";
import Analytics from "@/pages/Analytics";
import Push from "@/pages/Push";
import Vouchers from "@/pages/Vouchers";
import Promotions from "@/pages/Promotions";
import Financial from "@/pages/Financial";
import SettingsPage from "@/pages/SettingsPage";
import Companies from "@/pages/Companies";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Overview />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/stations" element={<Stations />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/push" element={<Push />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/companies" element={<Companies />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
