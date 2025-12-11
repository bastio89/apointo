import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import LimitIndicator from "@/components/LimitIndicator";

const Calendar = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkLimit } = useSubscription();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [staff, setStaff] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [staffOffset, setStaffOffset] = useState(0);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [user, currentDate, view]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('active', true)
        .order('name');

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('active', true)
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Load appointments for the current date or week
      let startDate, endDate;
      
      if (view === "week") {
        // Get start of week (Monday)
        startDate = new Date(currentDate);
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        
        // Get end of week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Day view
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      }

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          customers (name),
          services (name),
          staff (name, color_hex)
        `)
        .eq('tenant_id', userData.tenant_id)
        .gte('start_at', startDate.toISOString())
        .lte('start_at', endDate.toISOString())
        .order('start_at');

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Fehler",
        description: "Kalenderdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    if (view === "week") {
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString("de-DE")} - ${endOfWeek.toLocaleDateString("de-DE")}`;
    }
    
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 30; // Start at 8:00, add 30 minutes for each slot
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatAppointmentTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getAppointmentForTimeSlot = (staffId: string, timeSlot: string, dayOffset = 0) => {
    return appointments.find(apt => {
      if (view === "week") {
        const appointmentDate = new Date(apt.start_at);
        const targetDate = new Date(currentDate);
        const dayOfWeek = targetDate.getDay();
        const startOfWeek = new Date(targetDate);
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff + dayOffset);
        
        const isSameDay = appointmentDate.toDateString() === startOfWeek.toDateString();
        return apt.staff_id === staffId && isTimeSlotCoveredByAppointment(apt, timeSlot) && isSameDay;
      }
      
      return apt.staff_id === staffId && isTimeSlotCoveredByAppointment(apt, timeSlot);
    });
  };

  const isTimeSlotCoveredByAppointment = (appointment: any, timeSlot: string) => {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotTime = slotHour * 60 + slotMinute; // Convert to minutes from midnight
    
    const startTime = new Date(appointment.start_at);
    const endTime = new Date(appointment.end_at);
    
    const appointmentStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const appointmentEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    
    // Check if the time slot falls within the appointment duration
    return slotTime >= appointmentStartMinutes && slotTime < appointmentEndMinutes;
  };

  const getAppointmentPosition = (appointment: any, timeSlot: string) => {
    const appointmentStartTime = formatAppointmentTime(appointment.start_at);
    const isFirstSlot = appointmentStartTime === timeSlot;
    
    if (!isFirstSlot) {
      return 'continuation'; // This is a continuation of the appointment
    }
    
    return 'start'; // This is the start of the appointment
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const handleCreateAppointment = async (appointmentData: any) => {
    if (!user) return;

    // Check appointment limit before creating new appointment
    const limitCheck = await checkLimit('appointments');
    
    if (!limitCheck.withinLimit) {
      toast({
        title: "Terminlimit erreicht",
        description: `Ihr aktueller Plan erlaubt nur ${limitCheck.limit} Termine pro Monat. Sie haben bereits ${limitCheck.current} Termine in diesem Monat. Bitte upgraden Sie Ihren Plan.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      const { error } = await supabase
        .from('appointments')
        .insert({
          tenant_id: userData.tenant_id,
          customer_id: appointmentData.customer_id,
          staff_id: appointmentData.staff_id,
          service_id: appointmentData.service_id,
          start_at: appointmentData.start_at,
          end_at: appointmentData.end_at,
          note: appointmentData.note,
          status: 'PENDING',
          source: 'ONLINE'
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Termin wurde erfolgreich erstellt.",
      });

      setCreatingAppointment(false);
      loadData();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Fehler",
        description: "Termin konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleEditAppointment = async (appointmentData: any) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          customer_id: appointmentData.customer_id,
          staff_id: appointmentData.staff_id,
          service_id: appointmentData.service_id,
          start_at: appointmentData.start_at,
          end_at: appointmentData.end_at,
          note: appointmentData.note,
          status: appointmentData.status
        })
        .eq('id', editingAppointment.id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Termin wurde erfolgreich aktualisiert.",
      });

      setEditingAppointment(null);
      loadData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Fehler",
        description: "Termin konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Termin wurde erfolgreich gelöscht.",
      });

      setEditingAppointment(null);
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Fehler",
        description: "Termin konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const maxVisibleStaff = 4;
  const visibleStaff = staff.slice(staffOffset, staffOffset + maxVisibleStaff);
  const showStaffNavigation = staff.length > maxVisibleStaff;

  const handlePreviousStaff = () => {
    setStaffOffset(Math.max(0, staffOffset - 1));
  };

  const handleNextStaff = () => {
    setStaffOffset(Math.min(staff.length - maxVisibleStaff, staffOffset + 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kalender</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Termine und Zeitpläne
          </p>
          <LimitIndicator type="appointments" className="mt-2" />
        </div>
        <Button onClick={() => setCreatingAppointment(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Termin
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("day")}
              >
                Tag
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Woche
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {view === "day" ? (
              // Day View
              <>
                {/* Header */}
                <div className="bg-muted">
                  <div className="flex">
                    <div className="w-24 p-3 border-r border-border flex-shrink-0">
                      <span className="text-sm font-medium">Zeit</span>
                    </div>
                    {showStaffNavigation && (
                      <div className="w-10 flex items-center justify-center border-r border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviousStaff}
                          disabled={staffOffset === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-1 min-w-0">
                      {visibleStaff.map((member) => (
                        <div key={member.id} className="flex-1 p-3 border-r border-border last:border-r-0 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: member.color_hex || "#3B82F6" }}
                            />
                            <span className="text-sm font-medium truncate">{member.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {showStaffNavigation && (
                      <div className="w-10 flex items-center justify-center border-l border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNextStaff}
                          disabled={staffOffset + maxVisibleStaff >= staff.length}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="border-t border-border">
                    <div className="flex">
                      <div className="w-24 p-3 border-r border-border bg-muted/50 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">{time}</span>
                      </div>
                      {showStaffNavigation && (
                        <div className="w-10 border-r border-border"></div>
                      )}
                      <div className="flex flex-1 min-w-0">
                        {visibleStaff.map((member) => {
                          const appointment = getAppointmentForTimeSlot(member.id, time);
                          
                          return (
                            <div key={member.id} className="flex-1 p-2 border-r border-border last:border-r-0 min-h-[60px] min-w-0">
                              {appointment && (
                                <div 
                                  className="bg-card border rounded p-2 shadow-sm cursor-pointer hover:bg-accent transition-colors"
                                  onClick={() => setEditingAppointment(appointment)}
                                >
                                  {getAppointmentPosition(appointment, time) === 'start' ? (
                                    <>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`} />
                                        <span className="text-xs font-medium truncate">
                                          {appointment.customers?.name || "Unbekannter Kunde"}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {appointment.services?.name || "Unbekannter Service"}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatAppointmentTime(appointment.start_at)} - {formatAppointmentTime(appointment.end_at)}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-center h-8">
                                      <div className="w-full h-1 bg-primary/30 rounded"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {showStaffNavigation && (
                        <div className="w-10 border-l border-border"></div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Week View
              <>
                {/* Staff Selection for Week View */}
                <div className="p-4 bg-muted border-b border-border">
                  <div className="flex items-center space-x-4">
                    <Label className="text-sm font-medium">Mitarbeiter:</Label>
                    <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                      <SelectTrigger className="w-64 bg-background border border-border">
                        <SelectValue placeholder="Mitarbeiter auswählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        <SelectItem value="all" className="hover:bg-accent">
                          Alle Mitarbeiter
                        </SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id} className="hover:bg-accent">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: member.color_hex || "#3B82F6" }}
                              />
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Week Header */}
                <div className="grid grid-cols-8 bg-muted">
                  <div className="p-3 border-r border-border">
                    <span className="text-sm font-medium">Zeit</span>
                  </div>
                  {getWeekDays().map((day) => (
                    <div key={day.toISOString()} className="p-3 border-r border-border text-center last:border-r-0">
                      <div className="text-sm font-medium">
                        {day.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week Time slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-t border-border">
                    <div className="p-3 border-r border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">{time}</span>
                    </div>
                    {getWeekDays().map((day, dayIndex) => {
                      const dayAppointments = appointments.filter(apt => {
                        const appointmentDate = new Date(apt.start_at);
                        const matchesDay = appointmentDate.toDateString() === day.toDateString();
                        const matchesTimeSlot = isTimeSlotCoveredByAppointment(apt, time);
                        const matchesStaff = selectedStaffId === "all" || apt.staff_id === selectedStaffId;
                        return matchesDay && matchesTimeSlot && matchesStaff;
                      });
                      
                      return (
                        <div key={`${day.toISOString()}-${time}`} className="p-2 border-r border-border last:border-r-0 min-h-[60px]">
                          {dayAppointments.map((appointment) => {
                            const position = getAppointmentPosition(appointment, time);
                            return (
                              <div 
                                key={appointment.id} 
                                className="bg-card border rounded p-2 shadow-sm mb-1 cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => setEditingAppointment(appointment)}
                              >
                                {position === 'start' ? (
                                  <>
                                    <div className="flex items-center space-x-1 mb-1">
                                      <div className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`} />
                                      <span className="text-xs font-medium truncate">
                                        {appointment.customers?.name || "Unbekannt"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {appointment.services?.name || "Service"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {appointment.staff?.name || "Mitarbeiter"}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center h-8">
                                    <div className="w-full h-1 bg-primary/30 rounded"></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Appointment Dialog */}
      {creatingAppointment && (
        <Dialog open={creatingAppointment} onOpenChange={() => setCreatingAppointment(false)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neuen Termin erstellen</DialogTitle>
            </DialogHeader>
            <AppointmentCreateForm 
              customers={customers}
              staff={staff}
              services={services}
              onSave={handleCreateAppointment}
              onCancel={() => setCreatingAppointment(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Appointment Dialog */}
      {editingAppointment && (
        <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Termin bearbeiten</DialogTitle>
            </DialogHeader>
            <AppointmentEditForm 
              appointment={editingAppointment}
              customers={customers}
              staff={staff}
              services={services}
              onSave={handleEditAppointment}
              onDelete={handleDeleteAppointment}
              onCancel={() => setEditingAppointment(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Appointment Create Form Component
const AppointmentCreateForm = ({ customers, staff, services, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    staff_id: '',
    service_id: '',
    date: '',
    time: '',
    duration: 60,
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time into start_at
    const startAt = new Date(`${formData.date}T${formData.time}`);
    const endAt = new Date(startAt.getTime() + formData.duration * 60000);

    const appointmentData = {
      customer_id: formData.customer_id,
      staff_id: formData.staff_id,
      service_id: formData.service_id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      note: formData.note
    };

    onSave(appointmentData);
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer">Kunde *</Label>
        <Select 
          value={formData.customer_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Kunde auswählen" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff">Mitarbeiter *</Label>
        <Select 
          value={formData.staff_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Mitarbeiter auswählen" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((member: any) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service">Service *</Label>
        <Select 
          value={formData.service_id} 
          onValueChange={(value) => {
            const selectedService = services.find((s: any) => s.id === value);
            setFormData(prev => ({ 
              ...prev, 
              service_id: value,
              duration: selectedService?.duration_min || 60
            }));
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Service auswählen" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service: any) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} ({service.duration_min} Min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            min={today}
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Uhrzeit *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Notizen</Label>
        <Textarea
          id="note"
          value={formData.note}
          onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
          rows={3}
          placeholder="Zusätzliche Informationen zum Termin..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit">
          Termin erstellen
        </Button>
      </div>
    </form>
  );
};

// Appointment Edit Form Component
const AppointmentEditForm = ({ appointment, customers, staff, services, onSave, onDelete, onCancel }: any) => {
  const [formData, setFormData] = useState({
    customer_id: appointment.customer_id || '',
    staff_id: appointment.staff_id || '',
    service_id: appointment.service_id || '',
    date: appointment.start_at ? new Date(appointment.start_at).toISOString().split('T')[0] : '',
    time: appointment.start_at ? new Date(appointment.start_at).toTimeString().slice(0, 5) : '',
    duration: appointment.end_at && appointment.start_at ? 
      Math.round((new Date(appointment.end_at).getTime() - new Date(appointment.start_at).getTime()) / 60000) : 60,
    note: appointment.note || '',
    status: appointment.status || 'PENDING'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time into start_at
    const startAt = new Date(`${formData.date}T${formData.time}`);
    const endAt = new Date(startAt.getTime() + formData.duration * 60000);

    const appointmentData = {
      customer_id: formData.customer_id,
      staff_id: formData.staff_id,
      service_id: formData.service_id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      note: formData.note,
      status: formData.status
    };

    onSave(appointmentData);
  };

  const handleDelete = () => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Termin löschen möchten?')) {
      onDelete(appointment.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer">Kunde *</Label>
        <Select 
          value={formData.customer_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Kunde auswählen" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff">Mitarbeiter *</Label>
        <Select 
          value={formData.staff_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Mitarbeiter auswählen" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((member: any) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service">Service *</Label>
        <Select 
          value={formData.service_id} 
          onValueChange={(value) => {
            const selectedService = services.find((s: any) => s.id === value);
            setFormData(prev => ({ 
              ...prev, 
              service_id: value,
              duration: selectedService?.duration_min || 60
            }));
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Service auswählen" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service: any) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} ({service.duration_min} Min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Status auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Ausstehend</SelectItem>
            <SelectItem value="confirmed">Bestätigt</SelectItem>
            <SelectItem value="cancelled">Storniert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Uhrzeit *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Notizen</Label>
        <Textarea
          id="note"
          value={formData.note}
          onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
          rows={3}
          placeholder="Zusätzliche Informationen zum Termin..."
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="destructive" onClick={handleDelete}>
          Löschen
        </Button>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit">
            Speichern
          </Button>
        </div>
      </div>
    </form>
  );
};

export default Calendar;