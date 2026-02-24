import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthInit from "@/components/AuthInit";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import DashboardProtectedRoute from "@/components/DashboardProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import AdminLayout from "@/components/AdminLayout";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
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
import LandingPageAnalytics from "@/pages/LandingPageAnalytics";
import NotFound from "@/pages/NotFound";
import AppRedirect from "@/components/AppRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AuthInit>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/app/*" element={<AppRedirect />} />
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/companies" replace />} />
                <Route path="companies" element={<Companies />} />
                <Route path="landing-analytics" element={<LandingPageAnalytics />} />
              </Route>
            </Route>
            <Route element={<DashboardProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="stations" element={<Stations />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="push" element={<Push />} />
                <Route path="vouchers" element={<Vouchers />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="financial" element={<Financial />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="companies" element={<Companies />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthInit>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
