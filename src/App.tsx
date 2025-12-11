import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Calendar from "./pages/admin/Calendar";
import Customers from "./pages/admin/Customers";
import Services from "./pages/admin/Services";
import Staff from "./pages/admin/Staff";
import Reports from "./pages/admin/Reports";
import Invoices from "./pages/admin/Invoices";
import Settings from "./pages/admin/Settings";
import Subscription from "./pages/admin/Subscription";
import SubscriptionGuard from "./components/SubscriptionGuard";
import BookingFlow from "./pages/BookingFlow";
import HelpCenter from "./pages/HelpCenter";
import Contact from "./pages/Contact";
import Status from "./pages/Status";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Imprint from "./pages/Imprint";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Subscription />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/b/:slug" element={<BookingFlow />} />
            <Route path="/hilfe-center" element={<HelpCenter />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/status" element={<Status />} />
            <Route path="/datenschutz" element={<Privacy />} />
            <Route path="/agb" element={<Terms />} />
            <Route path="/impressum" element={<Imprint />} />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="calendar" element={<SubscriptionGuard feature="den Kalender"><Calendar /></SubscriptionGuard>} />
              <Route path="customers" element={<SubscriptionGuard feature="die Kundenverwaltung"><Customers /></SubscriptionGuard>} />
              <Route path="services" element={<SubscriptionGuard feature="die Serviceverwaltung"><Services /></SubscriptionGuard>} />
              <Route path="staff" element={<SubscriptionGuard feature="die Mitarbeiterverwaltung"><Staff /></SubscriptionGuard>} />
              <Route path="reports" element={<SubscriptionGuard feature="die Berichte"><Reports /></SubscriptionGuard>} />
              <Route path="invoices" element={<SubscriptionGuard feature="die Rechnungsverwaltung"><Invoices /></SubscriptionGuard>} />
              <Route path="settings" element={<Settings />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
