import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Euro,
  User, 
  ChevronLeft, 
  ChevronRight,
  Scissors,
  Check
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { de } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number;
}

interface Staff {
  id: string;
  name: string;
  color_hex: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
}

const BookingFlow = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Form states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    consent: false,
  });

  useEffect(() => {
    loadTenantData();
  }, [slug]);

  useEffect(() => {
    if (selectedService) {
      loadStaff();
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedStaff, selectedDate]);

  const loadTenantData = async () => {
    try {
      // Load tenant by slug
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("slug", slug)
        .single();

      if (tenantError) throw tenantError;
      
      setTenant(tenantData);

      // Load active services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .eq("visible_online", true)
        .eq("active", true);

      if (servicesError) throw servicesError;
      
      setServices(servicesData || []);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Salon nicht gefunden.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!selectedService || !tenant) return;

    try {
      const { data: staffData, error } = await supabase
        .from("staff_services")
        .select(`
          staff:staff_id (
            id,
            name,
            color_hex
          )
        `)
        .eq("tenant_id", tenant.id)
        .eq("service_id", selectedService.id);

      if (error) throw error;

      const staffList = staffData?.map((item: any) => item.staff).filter(Boolean) || [];
      setStaff(staffList);
    } catch (error: any) {
      console.error("Error loading staff:", error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedService || !tenant || !selectedDate) return;

    try {
      // Load opening hours for the selected day
      const { data: openingHours } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      if (!openingHours) {
        setAvailableSlots([]);
        return;
      }

      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = selectedDate.getDay();
      const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayKey = dayMap[dayOfWeek];
      
      const startKey = `${dayKey}_start` as keyof typeof openingHours;
      const endKey = `${dayKey}_end` as keyof typeof openingHours;
      
      const dayStart = openingHours[startKey] as number;
      const dayEnd = openingHours[endKey] as number;

      if (!dayStart || !dayEnd) {
        setAvailableSlots([]); // Closed on this day
        return;
      }

      // Load existing appointments for the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_at, end_at, staff_id')
        .eq('tenant_id', tenant.id)
        .gte('start_at', startOfDay.toISOString())
        .lte('start_at', endOfDay.toISOString());

      // Generate time slots based on opening hours and booking interval
      const { data: settingsData } = await supabase
        .from('settings')
        .select('booking_interval_min')
        .eq('tenant_id', tenant.id)
        .single();

      const intervalMinutes = settingsData?.booking_interval_min || 15;
      const serviceDuration = selectedService.duration_min;
      
      const slots: string[] = [];
      
      // Convert minutes to time slots
      for (let minutes = dayStart; minutes <= dayEnd - serviceDuration; minutes += intervalMinutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        // Check if this slot conflicts with existing appointments
        const slotStart = new Date(selectedDate);
        slotStart.setHours(hours, mins, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
        
        const hasConflict = existingAppointments?.some(apt => {
          const aptStart = new Date(apt.start_at);
          const aptEnd = new Date(apt.end_at);
          
          return (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          );
        });
        
        if (!hasConflict) {
          slots.push(timeSlot);
        }
      }
      
      setAvailableSlots(slots);
    } catch (error: any) {
      console.error("Error loading available slots:", error);
      setAvailableSlots([]);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedStaff(null);
    setStep(2);
  };

  const handleStaffSelect = (staffMember: Staff | null) => {
    setSelectedStaff(staffMember);
    setStep(3);
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedTime || !customerData.name || !customerData.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    if (!customerData.consent) {
      toast({
        title: "Fehler",
        description: "Bitte akzeptieren Sie die Datenschutzerklärung.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Call the create appointment edge function
      const { data, error } = await supabase.functions.invoke('create-appointment', {
        body: {
          tenantSlug: slug,
          serviceId: selectedService.id,
          staffId: selectedStaff?.id,
          startAt: new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            parseInt(selectedTime.split(':')[0]),
            parseInt(selectedTime.split(':')[1])
          ).toISOString(),
          customer: customerData,
        }
      });

      if (error) throw error;
      
      if (data.success) {
        setStep(5);
      } else {
        throw new Error(data.error || 'Failed to create appointment');
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Termin konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `CHF ${(cents / 100).toFixed(2)}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Salon nicht gefunden</h1>
          <p className="text-muted-foreground">Der angeforderte Salon existiert nicht.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Scissors className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-muted-foreground">Online Terminbuchung</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < 5 && (
                <div
                  className={`w-full h-0.5 mx-2 ${
                    stepNumber < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Service wählen</CardTitle>
              <CardDescription>
                Wählen Sie den gewünschten Service aus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(service.duration_min)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatPrice(service.price_cents)}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Personal wählen (optional)</CardTitle>
              <CardDescription>
                Wählen Sie einen Stylisten oder lassen Sie uns einen für Sie auswählen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleStaffSelect(null)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Keine Präferenz</h3>
                    <p className="text-sm text-muted-foreground">
                      Wir wählen den besten verfügbaren Stylisten für Sie aus
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {staff.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleStaffSelect(member)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: member.color_hex }}
                      />
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Datum & Zeit wählen</CardTitle>
              <CardDescription>
                Wählen Sie Ihren gewünschten Termin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date selection */}
              <div>
                <Label className="text-base font-medium">Datum</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(new Date(), i);
                    const isSelected = isSameDay(date, selectedDate);
                    
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDate(date)}
                        className="flex flex-col h-auto p-3"
                      >
                        <span className="text-xs">
                          {format(date, "EEE", { locale: de })}
                        </span>
                        <span className="text-sm font-medium">
                          {format(date, "dd.MM")}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Time selection */}
              <div>
                <Label className="text-base font-medium">Uhrzeit</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {availableSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <Button
                  onClick={() => selectedTime && setStep(4)}
                  disabled={!selectedTime}
                  className="flex-1"
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && selectedService && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>Ihre Daten</CardTitle>
              <CardDescription>
                Bitte geben Sie Ihre Kontaktdaten ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking summary */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Buchungsübersicht</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  {selectedStaff && (
                    <div className="flex justify-between">
                      <span>Stylist:</span>
                      <span>{selectedStaff.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Datum:</span>
                    <span>{format(selectedDate, "dd.MM.yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uhrzeit:</span>
                    <span>{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dauer:</span>
                    <span>{formatDuration(selectedService.duration_min)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Preis:</span>
                    <span>{formatPrice(selectedService.price_cents)}</span>
                  </div>
                </div>
              </div>

              {/* Customer form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ihr vollständiger Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ihre@email.de"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+49 123 456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Besondere Wünsche</Label>
                    <Textarea
                      id="notes"
                      value={customerData.notes}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Allergien, spezielle Wünsche, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={customerData.consent}
                    onCheckedChange={(checked) => setCustomerData(prev => ({ ...prev, consent: !!checked }))}
                  />
                  <Label htmlFor="consent" className="text-sm leading-relaxed">
                    Ich akzeptiere die{" "}
                    <a href="#" className="text-primary hover:underline">
                      Datenschutzerklärung
                    </a>{" "}
                    und stimme der Verarbeitung meiner Daten zu.
                  </Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !customerData.name || !customerData.email || !customerData.consent}
                  className="flex-1"
                >
                  {submitting ? "Wird gebucht..." : "Termin buchen"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Termin erfolgreich gebucht!</h2>
              <p className="text-muted-foreground mb-6">
                Wir haben Ihnen eine Bestätigung per E-Mail gesendet.
              </p>
              
              <div className="space-y-4">
                <Button className="w-full">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Zum Kalender hinzufügen
                </Button>
                <Button variant="outline" className="w-full">
                  Termin verwalten
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;