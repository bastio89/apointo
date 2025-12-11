import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Scissors, TrendingUp, Crown, ArrowRight, CalendarDays, ExternalLink, UserCog } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, type Currency } from "@/lib/currency";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const Dashboard = () => {
  const { status, trial_days_left, is_trial_expired, plan_name, loading: subscriptionLoading, planLimits } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>("CHF");
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [stats, setStats] = useState([
    { title: "Heute", value: "0", description: "Termine", icon: Calendar, color: "text-blue-500" },
    { title: "Dieser Monat", value: "0", description: "Termine", icon: TrendingUp, color: "text-green-500" },
    { title: "Kunden", value: "0", description: "Gesamt", icon: Users, color: "text-purple-500" },
    { title: "Plan Status", value: "Pro", description: "Aktueller Plan", icon: Crown, color: "text-orange-500" },
  ]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState({
    monthlyAppointments: 0,
    maxAppointments: 50,
    activeStaff: 0,
    maxStaff: 1
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      // Get tenant slug for booking link
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantError) throw tenantError;
      setTenantSlug(tenantData?.slug || '');

      // Load currency from settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('currency')
        .eq('tenant_id', userData.tenant_id)
        .single();
      
      const userCurrency = (settingsData?.currency as Currency) || "CHF";
      setCurrency(userCurrency);

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      // Load today's appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services!appointments_service_id_fkey(name, price_cents),
          staff!appointments_staff_id_fkey(name),
          customers!appointments_customer_id_fkey(name)
        `)
        .eq('tenant_id', userData.tenant_id)
        .gte('start_at', todayStart.toISOString())
        .lte('start_at', todayEnd.toISOString())
        .order('start_at', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Load this month's appointments
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const { data: monthAppointments, error: monthError } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('start_at', monthStart.toISOString());

      if (monthError) throw monthError;

      // Load all customers
      const { data: allCustomers, error: allCustomersError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (allCustomersError) throw allCustomersError;

      // Load active staff
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (staffError) throw staffError;

      // Calculate stats
      const todayCompletedAppointments = appointments?.filter(apt => apt.status === 'COMPLETED') || [];
      const todayPendingAppointments = appointments?.filter(apt => apt.status === 'PENDING') || [];
      
      const todayRevenue = todayCompletedAppointments.reduce((sum, apt) => {
        return sum + (apt.services?.price_cents || 0);
      }, 0);

      const avgServiceDuration = appointments?.length ? 
        appointments.reduce((sum, apt) => {
          const start = new Date(apt.start_at);
          const end = new Date(apt.end_at);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60);
        }, 0) / appointments.length : 0;

      setStats([
        {
          title: "Heute",
          value: appointments?.length.toString() || "0",
          description: "Termine",
          icon: Calendar,
          color: "text-blue-500",
        },
        {
          title: "Dieser Monat",
          value: monthAppointments?.length.toString() || "0",
          description: "Termine",
          icon: TrendingUp,
          color: "text-green-500",
        },
        {
          title: "Kunden",
          value: allCustomers?.length.toString() || "0",
          description: "Gesamt",
          icon: Users,
          color: "text-purple-500",
        },
        {
          title: "Plan Status",
          value: plan_name || "Trial",
          description: "Aktueller Plan",
          icon: Crown,
          color: "text-orange-500",
        },
      ]);

      setUsageStats({
        monthlyAppointments: monthAppointments?.length || 0,
        maxAppointments: planLimits?.appointments === 'unlimited' ? 999999 : Number(planLimits?.appointments || 50),
        activeStaff: staff?.length || 0,
        maxStaff: planLimits?.staff === 'unlimited' ? 999999 : Number(planLimits?.staff || 1)
      });

      // Format appointments for display
      const formattedAppointments = appointments?.map(apt => ({
        time: format(new Date(apt.start_at), "HH:mm", { locale: de }),
        customer: apt.customers?.name || "Unbekannt",
        service: apt.services?.name || "Unbekannt",
        stylist: apt.staff?.name || "Unbekannt",
        status: apt.status?.toLowerCase() || "pending",
      })) || [];

      setTodayAppointments(formattedAppointments);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return "Bestätigt";
      case "pending":
        return "Ausstehend";
      case "cancelled":
        return "Storniert";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen zurück! Hier ist Ihre Übersicht für heute.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app/calendar')}
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Kalender
          </Button>
          <Button 
            onClick={() => navigate(tenantSlug ? `/b/${tenantSlug}` : '/b/testsalon')}
            className="flex items-center gap-2"
            disabled={!tenantSlug}
          >
            <ExternalLink className="h-4 w-4" />
            Buchungslink teilen
          </Button>
        </div>
      </div>


      {/* Stats Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Plan Nutzung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Termine diesen Monat</span>
                <span>
                  {usageStats.monthlyAppointments}/
                  {usageStats.maxAppointments === 999999 ? 'unlimited' : usageStats.maxAppointments}
                </span>
              </div>
              <Progress 
                value={usageStats.maxAppointments === 999999 ? 0 : (usageStats.monthlyAppointments / usageStats.maxAppointments) * 100} 
                className="h-2" 
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Aktive Mitarbeiter</span>
                <span>
                  {usageStats.activeStaff}/
                  {usageStats.maxStaff === 999999 ? 'unlimited' : usageStats.maxStaff}
                </span>
              </div>
              <Progress 
                value={usageStats.maxStaff === 999999 ? 0 : (usageStats.activeStaff / usageStats.maxStaff) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Kommende Termine
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/calendar')}>
                Alle anzeigen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Termine für heute
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 3).map((appointment, index) => (
                  <div key={index} className="space-y-1">
                    <div className="font-medium">{appointment.service}</div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.customer} • {appointment.stylist}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Heute, {appointment.time}
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;