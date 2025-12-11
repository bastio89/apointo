import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, TrendingUp, TrendingDown, Users, Euro, Scissors, Star } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, type Currency } from "@/lib/currency";

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currency, setCurrency] = useState<Currency>("CHF");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date(), // Today
  });

  useEffect(() => {
    if (user) {
      loadCurrency();
      loadReportData();
    }
  }, [user, dateRange]);

  const loadCurrency = async () => {
    try {
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      // Load currency from settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('currency')
        .eq('tenant_id', userData.tenant_id)
        .single();
      
      setCurrency((settingsData?.currency as Currency) || "CHF");
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      console.log('Loading report data...', { user: user?.id, dateRange });
      
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      console.log('Found tenant:', userData.tenant_id);

      // Load appointments data
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services!appointments_service_id_fkey(name, price_cents),
          staff!appointments_staff_id_fkey(name),
          customers!appointments_customer_id_fkey(name)
        `)
        .eq('tenant_id', userData.tenant_id)
        .gte('start_at', dateRange.from.toISOString())
        .lte('start_at', dateRange.to.toISOString());

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw appointmentsError;
      }

      console.log('Loaded appointments:', appointments?.length);

      // Load customers data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (customersError) {
        console.error('Customers error:', customersError);
        throw customersError;
      }

      console.log('Loaded customers:', customers?.length);

      // Load services data
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (servicesError) {
        console.error('Services error:', servicesError);
        throw servicesError;
      }

      console.log('Loaded services:', services?.length);

      // Load staff data
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (staffError) {
        console.error('Staff error:', staffError);
        throw staffError;
      }

      console.log('Loaded staff:', staff?.length);

      // Calculate real metrics
      const completedAppointments = appointments?.filter(apt => apt.status === 'COMPLETED') || [];
      const cancelledAppointments = appointments?.filter(apt => apt.status === 'CANCELLED') || [];
      
      // Calculate revenue from completed appointments
      const totalRevenue = completedAppointments.reduce((sum, apt) => {
        return sum + (apt.services?.price_cents || 0);
      }, 0);

      // Get new customers (created in date range)
      const newCustomers = customers?.filter(customer => 
        new Date(customer.created_at) >= dateRange.from && 
        new Date(customer.created_at) <= dateRange.to
      ) || [];

      // Calculate service performance
      const serviceStats = services?.map(service => {
        const serviceAppointments = completedAppointments.filter(apt => apt.service_id === service.id);
        const serviceRevenue = serviceAppointments.reduce((sum, apt) => sum + (apt.services?.price_cents || 0), 0);
        
        return {
          name: service.name,
          count: serviceAppointments.length,
          revenue: serviceRevenue / 100, // Convert cents to currency
          change: 0 // We'd need historical data to calculate change
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 4) || [];

      // Calculate staff performance
      const staffStats = staff?.map(member => {
        const memberAppointments = completedAppointments.filter(apt => apt.staff_id === member.id);
        const memberRevenue = memberAppointments.reduce((sum, apt) => sum + (apt.services?.price_cents || 0), 0);
        
        return {
          name: member.name,
          appointments: memberAppointments.length,
          revenue: memberRevenue / 100, // Convert cents to currency
          rating: 4.5 // Default rating - could be calculated from future reviews system
        };
      }).sort((a, b) => b.revenue - a.revenue) || [];

      // Calculate popular time slots
      const timeSlotStats = completedAppointments.reduce((acc: any, apt) => {
        const hour = new Date(apt.start_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const timeSlots = Object.entries(timeSlotStats)
        .map(([hour, count]: [string, any]) => ({
          hour: parseInt(hour),
          count,
          percentage: ((count / completedAppointments.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate customer frequency
      const customerAppointmentCounts = completedAppointments.reduce((acc: any, apt) => {
        acc[apt.customer_id] = (acc[apt.customer_id] || 0) + 1;
        return acc;
      }, {});

      const frequencyBuckets = {
        single: 0,      // 1 appointment
        occasional: 0,  // 2-3 appointments
        regular: 0,     // 4-6 appointments
        loyal: 0        // 7+ appointments
      };

      Object.values(customerAppointmentCounts).forEach((count: any) => {
        if (count === 1) frequencyBuckets.single++;
        else if (count <= 3) frequencyBuckets.occasional++;
        else if (count <= 6) frequencyBuckets.regular++;
        else frequencyBuckets.loyal++;
      });

      const totalCustomersWithAppointments = Object.keys(customerAppointmentCounts).length;
      const customerFrequency = [
        { type: 'single', label: 'Einmalige Besucher', count: frequencyBuckets.single, percentage: ((frequencyBuckets.single / totalCustomersWithAppointments) * 100).toFixed(1) },
        { type: 'occasional', label: 'Gelegentliche Besucher', count: frequencyBuckets.occasional, percentage: ((frequencyBuckets.occasional / totalCustomersWithAppointments) * 100).toFixed(1) },
        { type: 'regular', label: 'Stammkunden', count: frequencyBuckets.regular, percentage: ((frequencyBuckets.regular / totalCustomersWithAppointments) * 100).toFixed(1) },
        { type: 'loyal', label: 'Treue Kunden', count: frequencyBuckets.loyal, percentage: ((frequencyBuckets.loyal / totalCustomersWithAppointments) * 100).toFixed(1) },
      ];

      // Calculate average order value
      const avgOrderValue = completedAppointments.length > 0 
        ? (totalRevenue / 100) / completedAppointments.length 
        : 0;

      // Set calculated data
      setReportData({
        revenue: {
          total: totalRevenue / 100, // Convert cents to currency
          change: 0, // Would need historical data
          trend: "up" as const,
        },
        appointments: {
          total: appointments?.length || 0,
          completed: completedAppointments.length,
          cancelled: cancelledAppointments.length,
          changeRate: 0, // Would need historical data
        },
        customers: {
          total: customers?.length || 0,
          new: newCustomers.length,
          returning: (customers?.length || 0) - newCustomers.length,
          changeRate: 0, // Would need historical data
        },
        occupancy: {
          rate: appointments?.length ? (completedAppointments.length / appointments.length) * 100 : 0,
          change: 0, // Would need historical data
        },
        timeSlots,
        customerFrequency,
        monthlyTrend: {
          revenue: { current: 0, change: 0 },
          appointments: { current: 0, change: 0 },
          avgOrderValue: { current: avgOrderValue, change: 0 },
          newCustomers: { current: newCustomers.length, change: 0 }
        }
      });

      setTopServices(serviceStats);
      setStaffPerformance(staffStats);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Fehler",
        description: "Berichtsdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
      
      // Fallback to empty state
      setReportData({
        revenue: { total: 0, change: 0, trend: "up" as const },
        appointments: { total: 0, completed: 0, cancelled: 0, changeRate: 0 },
        customers: { total: 0, new: 0, returning: 0, changeRate: 0 },
        occupancy: { rate: 0, change: 0 },
      });
      setTopServices([]);
      setStaffPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyDisplay = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Berichte</h1>
          <p className="text-muted-foreground">
            Analysieren Sie die Leistung Ihres Salons
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd. MMM yyyy", { locale: de })} -{" "}
                      {format(dateRange.to, "dd. MMM yyyy", { locale: de })}
                    </>
                  ) : (
                    format(dateRange.from, "dd. MMM yyyy", { locale: de })
                  )
                ) : (
                  <span>Zeitraum wählen</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Lade Berichte...</span>
        </div>
      ) : !reportData ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Keine Daten verfügbar</p>
        </div>
      ) : (
        <>
        {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyDisplay(reportData.revenue.total * 100)}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(reportData.revenue.change)}`}>
              {getTrendIcon(reportData.revenue.change)}
              <span className="ml-1">{formatPercentage(reportData.revenue.change)}</span>
              <span className="ml-1 text-muted-foreground">vs. Vormonat</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Termine</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.appointments.total}</div>
            <div className="text-xs text-muted-foreground">
              {reportData.appointments.completed} abgeschlossen, {reportData.appointments.cancelled} storniert
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunden</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.customers.total}</div>
            <div className="text-xs text-muted-foreground">
              {reportData.customers.new} neue, {reportData.customers.returning} wiederkehrende
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auslastung</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.occupancy.rate}%</div>
            <div className={`flex items-center text-xs ${getTrendColor(reportData.occupancy.change)}`}>
              {getTrendIcon(reportData.occupancy.change)}
              <span className="ml-1">{formatPercentage(reportData.occupancy.change)}</span>
              <span className="ml-1 text-muted-foreground">vs. Vormonat</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle>Top Services</CardTitle>
          <CardDescription>
            Die beliebtesten Services nach Anzahl und Umsatz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.count} Termine
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrencyDisplay(service.revenue * 100)}</div>
                  <div className={`text-xs flex items-center justify-end ${getTrendColor(service.change)}`}>
                    {getTrendIcon(service.change)}
                    <span className="ml-1">{formatPercentage(service.change)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Personal-Performance</CardTitle>
          <CardDescription>
            Leistung der einzelnen Mitarbeiter im gewählten Zeitraum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffPerformance.map((staff) => (
              <div key={staff.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {staff.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{staff.appointments} Termine</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{staff.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrencyDisplay(staff.revenue * 100)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrencyDisplay((staff.revenue / staff.appointments) * 100)} ⌀ pro Termin
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Popular Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Beliebteste Uhrzeiten</CardTitle>
            <CardDescription>
              Meist gebuchte Zeiträume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.timeSlots?.map((slot: any, index: number) => (
                <div key={slot.hour} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{slot.hour}:00 - {slot.hour + 1}:00</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{slot.count} Termine</div>
                    <div className="text-xs text-muted-foreground">{slot.percentage}%</div>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center">Keine Daten verfügbar</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Kunden-Häufigkeit</CardTitle>
            <CardDescription>
              Verteilung der Kundenbesuche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.customerFrequency?.map((freq: any) => (
                <div key={freq.type} className="flex items-center justify-between">
                  <span className="font-medium">{freq.label}</span>
                  <div className="text-right">
                    <div className="font-medium">{freq.count} Kunden</div>
                    <div className="text-xs text-muted-foreground">{freq.percentage}%</div>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center">Keine Daten verfügbar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monats-Trend</CardTitle>
          <CardDescription>
            Vergleich mit dem Vormonat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {reportData.monthlyTrend?.revenue?.current || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Umsatz-Trend</div>
              <div className={`text-xs mt-1 ${getTrendColor(reportData.monthlyTrend?.revenue?.change || 0)}`}>
                {getTrendIcon(reportData.monthlyTrend?.revenue?.change || 0)}
                {formatPercentage(reportData.monthlyTrend?.revenue?.change || 0)}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {reportData.monthlyTrend?.appointments?.current || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Termine-Trend</div>
              <div className={`text-xs mt-1 ${getTrendColor(reportData.monthlyTrend?.appointments?.change || 0)}`}>
                {getTrendIcon(reportData.monthlyTrend?.appointments?.change || 0)}
                {formatPercentage(reportData.monthlyTrend?.appointments?.change || 0)}
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrencyDisplay((reportData.monthlyTrend?.avgOrderValue?.current || 0) * 100)}
              </div>
              <div className="text-sm text-muted-foreground">⌀ Auftragswert</div>
              <div className={`text-xs mt-1 ${getTrendColor(reportData.monthlyTrend?.avgOrderValue?.change || 0)}`}>
                {getTrendIcon(reportData.monthlyTrend?.avgOrderValue?.change || 0)}
                {formatPercentage(reportData.monthlyTrend?.avgOrderValue?.change || 0)}
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {reportData.monthlyTrend?.newCustomers?.current || 0}
              </div>
              <div className="text-sm text-muted-foreground">Neue Kunden</div>
              <div className={`text-xs mt-1 ${getTrendColor(reportData.monthlyTrend?.newCustomers?.change || 0)}`}>
                {getTrendIcon(reportData.monthlyTrend?.newCustomers?.change || 0)}
                {formatPercentage(reportData.monthlyTrend?.newCustomers?.change || 0)}
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
        </>
      )}
    </div>
  );
};

export default Reports;