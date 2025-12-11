import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Clock,
  LayoutDashboard,
  Calendar,
  Users,
  Wrench,
  UserCog,
  BarChart3,
  Settings,
  FileText,
  Menu,
  LogOut,
  Crown,
  Scissors,
  DollarSign,
  CalendarDays,
  ExternalLink,
} from "lucide-react";

const AdminLayout = () => {
  const { signOut } = useAuth();
  const { plan_name } = useSubscription();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Übersicht", href: "/app/dashboard", icon: LayoutDashboard },
    { name: "Kalender", href: "/app/calendar", icon: CalendarDays },
    { name: "Services", href: "/app/services", icon: Scissors },
    { name: "Mitarbeiter", href: "/app/staff", icon: UserCog },
    { name: "Kunden", href: "/app/customers", icon: Users },
    { name: "Abrechnung", href: "/app/invoices", icon: DollarSign },
    { name: "Einstellungen", href: "/app/settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Testsalon</h2>
          <Badge variant="secondary" className="text-xs">
            {plan_name || "Pro"} Plan
          </Badge>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header with menu button */}
      <div className="md:hidden bg-background border-b px-4 py-3 flex items-center justify-between">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Testsalon</h2>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
