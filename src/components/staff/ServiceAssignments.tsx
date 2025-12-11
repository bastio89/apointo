import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, User, Check, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

interface ServiceAssignmentsProps {
  staff: any[];
  tenantId: string;
}

export default function ServiceAssignments({ staff, tenantId }: ServiceAssignmentsProps) {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
    loadAssignments();
  }, [tenantId]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_services')
        .select(`
          *,
          staff (name, color_hex),
          services (name, price_cents, duration_min)
        `)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleToggleAssignment = async (staffId: string, serviceId: string, isAssigned: boolean) => {
    setLoading(true);
    try {
      if (isAssigned) {
        // Remove assignment
        const { error } = await supabase
          .from('staff_services')
          .delete()
          .eq('staff_id', staffId)
          .eq('service_id', serviceId)
          .eq('tenant_id', tenantId);

        if (error) throw error;
      } else {
        // Add assignment
        const { error } = await supabase
          .from('staff_services')
          .insert({
            tenant_id: tenantId,
            staff_id: staffId,
            service_id: serviceId,
          });

        if (error) throw error;
      }

      await loadAssignments();
      toast({
        title: "Zuweisung aktualisiert",
        description: `Service-Zuweisung wurde ${isAssigned ? 'entfernt' : 'hinzugefügt'}.`,
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Fehler",
        description: "Die Zuweisung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isServiceAssigned = (staffId: string, serviceId: string) => {
    return assignments.some(a => a.staff_id === staffId && a.service_id === serviceId);
  };

  const getStaffServices = (staffId: string) => {
    return assignments.filter(a => a.staff_id === staffId);
  };

  const getServiceStaff = (serviceId: string) => {
    return assignments.filter(a => a.service_id === serviceId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scissors className="h-5 w-5" />
            <span>Service-Zuweisungen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Staff-centric view */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Zuweisungen pro Mitarbeiter</h3>
              <div className="grid gap-4">
                {staff.filter(s => s.active).map((member) => {
                  const memberServices = getStaffServices(member.id);

                  return (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: member.color_hex }}
                            />
                            <div>
                              <h4 className="font-medium">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {memberServices.length} von {services.length} Services zugewiesen
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {Math.round((memberServices.length / Math.max(services.length, 1)) * 100)}% Abdeckung
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {services.map((service) => {
                            const isAssigned = isServiceAssigned(member.id, service.id);

                            return (
                              <div
                                key={service.id}
                                className={`flex items-center justify-between p-3 border rounded-lg ${
                                  isAssigned ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={isAssigned}
                                    onCheckedChange={() =>
                                      handleToggleAssignment(member.id, service.id, isAssigned)
                                    }
                                    disabled={loading}
                                  />
                                  <div>
                                    <div className="font-medium text-sm">{service.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatCurrency(service.price_cents / 100)} • {service.duration_min}min
                                    </div>
                                  </div>
                                </div>
                                {isAssigned ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Service-centric view */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Verfügbarkeit pro Service</h3>
              <div className="grid gap-4">
                {services.map((service) => {
                  const serviceStaff = getServiceStaff(service.id);
                  const activeStaff = staff.filter(s => s.active);

                  return (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(service.price_cents / 100)} • {service.duration_min} Minuten
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Verfügbar bei {serviceStaff.length} von {activeStaff.length} Mitarbeitern
                            </p>
                          </div>
                          <Badge variant={serviceStaff.length === 0 ? "destructive" : "default"}>
                            {serviceStaff.length === 0 ? "Nicht verfügbar" : `${serviceStaff.length} Mitarbeiter`}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {activeStaff.map((member) => {
                            const isAssigned = isServiceAssigned(member.id, service.id);

                            return (
                              <Badge
                                key={member.id}
                                variant={isAssigned ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  isAssigned ? 'bg-green-100 text-green-800 border-green-300' : ''
                                }`}
                                onClick={() =>
                                  handleToggleAssignment(member.id, service.id, isAssigned)
                                }
                              >
                                <div
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: member.color_hex }}
                                />
                                {member.name}
                                {isAssigned && <Check className="h-3 w-3 ml-1" />}
                              </Badge>
                            );
                          })}
                        </div>

                        {serviceStaff.length === 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-red-600">
                              <X className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Kein Mitarbeiter verfügbar für diesen Service
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
