import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Clock, Euro, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

interface StaffPerformanceProps {
  staff: any[];
  tenantId: string;
}

interface PerformanceData {
  staffId: string;
  staffName: string;
  colorHex: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  avgAppointmentsPerDay: number;
  completionRate: number;
}

export default function StaffPerformance({ staff, tenantId }: StaffPerformanceProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month">("month");

  useEffect(() => {
    loadPerformanceData();
  }, [tenantId, staff, timeRange]);

  const loadPerformanceData = async () => {
    if (!tenantId || staff.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (timeRange === "week") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          staff_id,
          status,
          start_at,
          service:services(price_cents)
        `)
        .eq("tenant_id", tenantId)
        .gte("start_at", startDate.toISOString())
        .lte("start_at", endDate.toISOString());

      if (error) throw error;

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const performance: PerformanceData[] = staff
        .filter(s => s.active)
        .map(member => {
          const staffAppointments = appointments?.filter(a => a.staff_id === member.id) || [];
          const completed = staffAppointments.filter(a => a.status === "COMPLETED");
          const cancelled = staffAppointments.filter(a => a.status === "CANCELLED");
          
          const totalRevenue = completed.reduce((sum, a) => {
            const service = a.service as { price_cents: number } | null;
            return sum + (service?.price_cents || 0);
          }, 0);

          return {
            staffId: member.id,
            staffName: member.name,
            colorHex: member.color_hex,
            totalAppointments: staffAppointments.length,
            completedAppointments: completed.length,
            cancelledAppointments: cancelled.length,
            totalRevenue: totalRevenue / 100,
            avgAppointmentsPerDay: Math.round((staffAppointments.length / daysDiff) * 10) / 10,
            completionRate: staffAppointments.length > 0 
              ? Math.round((completed.length / staffAppointments.length) * 100) 
              : 0,
          };
        });

      setPerformanceData(performance);
    } catch (error) {
      console.error("Error loading performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = {
    appointments: performanceData.reduce((sum, p) => sum + p.totalAppointments, 0),
    revenue: performanceData.reduce((sum, p) => sum + p.totalRevenue, 0),
    completed: performanceData.reduce((sum, p) => sum + p.completedAppointments, 0),
    cancelled: performanceData.reduce((sum, p) => sum + p.cancelledAppointments, 0),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Leistungsdaten...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTimeRange("week")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === "week" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Diese Woche
        </button>
        <button
          onClick={() => setTimeRange("month")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === "month" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Dieser Monat
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Termine gesamt</p>
                <p className="text-2xl font-bold">{totalStats.appointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Umsatz</p>
                <p className="text-2xl font-bold">{formatCurrency(totalStats.revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                <p className="text-2xl font-bold">{totalStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storniert</p>
                <p className="text-2xl font-bold">{totalStats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Mitarbeiter-Leistung</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine aktiven Mitarbeiter gefunden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {performanceData.map((data) => (
                <Card key={data.staffId} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: data.colorHex }}
                        />
                        <div>
                          <h4 className="font-semibold">{data.staffName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Ø {data.avgAppointmentsPerDay} Termine/Tag
                          </p>
                        </div>
                      </div>
                      <Badge variant={data.completionRate >= 80 ? "default" : "secondary"}>
                        {data.completionRate}% Abschlussrate
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Termine</p>
                        <p className="text-lg font-semibold">{data.totalAppointments}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                        <p className="text-lg font-semibold text-green-600">{data.completedAppointments}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Storniert</p>
                        <p className="text-lg font-semibold text-red-600">{data.cancelledAppointments}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Umsatz</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.totalRevenue)}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Abschlussrate</span>
                        <span>{data.completionRate}%</span>
                      </div>
                      <Progress value={data.completionRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
