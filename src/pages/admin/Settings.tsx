import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Building, Clock, Euro, MessageSquare, Mail, Phone, CreditCard, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    status, 
    trial_days_left, 
    plan_name, 
    is_trial_expired, 
    loading: subscriptionLoading, 
    checkLimit 
  } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState({
    monthlyAppointments: 0,
    maxAppointments: 0,
    activeStaff: 0,
    maxStaff: 0
  });

  // Salon Info
  const [salonInfo, setSalonInfo] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: "",
    domain: "",
  });

  // Opening Hours
  const [openingHours, setOpeningHours] = useState({
    monStart: 540, // 09:00
    monEnd: 1080,  // 18:00
    tueStart: 540,
    tueEnd: 1080,
    wedStart: 540,
    wedEnd: 1080,
    thuStart: 540,
    thuEnd: 1080,
    friStart: 540,
    friEnd: 1080,
    satStart: 600, // 10:00
    satEnd: 960,   // 16:00
    sunStart: null,
    sunEnd: null,
  });

  // Booking Settings
  const [bookingSettings, setBookingSettings] = useState({
    bookingIntervalMin: 15,
    requireDeposit: false,
    depositCents: 1000, // CHF 10
    cancellationHours: 24,
    timezone: "Europe/Zurich",
    currency: "CHF" as "EUR" | "CHF",
  });

  // Communication Settings
  const [commSettings, setCommSettings] = useState({
    enableWhatsapp: false,
    senderEmail: "",
    senderName: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
    if (user) {
      loadUsageStats();
    }
  }, [user]);

  const loadUsageStats = async () => {
    if (!user) return;
    
    try {
      const appointmentStats = await checkLimit('appointments');
      const staffStats = await checkLimit('staff');
      
      setUsageStats({
        monthlyAppointments: appointmentStats.current,
        maxAppointments: appointmentStats.limit === 'unlimited' ? 999999 : Number(appointmentStats.limit),
        activeStaff: staffStats.current,
        maxStaff: staffStats.limit === 'unlimited' ? 999999 : Number(staffStats.limit)
      });
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      setTenantId(userData.tenant_id);

      // Load tenant info
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantError) throw tenantError;

      setSalonInfo({
        name: tenantData.name || "",
        slug: tenantData.slug || "",
        email: tenantData.email || "",
        phone: tenantData.phone || "",
        address: tenantData.address || "",
        logoUrl: tenantData.logo_url || "",
        domain: tenantData.domain || "",
      });

      // Load opening hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (!hoursError && hoursData) {
        setOpeningHours({
          monStart: hoursData.mon_start,
          monEnd: hoursData.mon_end,
          tueStart: hoursData.tue_start,
          tueEnd: hoursData.tue_end,
          wedStart: hoursData.wed_start,
          wedEnd: hoursData.wed_end,
          thuStart: hoursData.thu_start,
          thuEnd: hoursData.thu_end,
          friStart: hoursData.fri_start,
          friEnd: hoursData.fri_end,
          satStart: hoursData.sat_start,
          satEnd: hoursData.sat_end,
          sunStart: hoursData.sun_start,
          sunEnd: hoursData.sun_end,
        });
      }

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (!settingsError && settingsData) {
        setBookingSettings({
          bookingIntervalMin: settingsData.booking_interval_min || 15,
          requireDeposit: settingsData.require_deposit || false,
          depositCents: settingsData.deposit_cents || 1000,
          cancellationHours: settingsData.cancellation_hours || 24,
          timezone: settingsData.timezone || "Europe/Zurich",
          currency: (settingsData.currency as "EUR" | "CHF") || "CHF",
        });

        setCommSettings({
          enableWhatsapp: settingsData.enable_whatsapp || false,
          senderEmail: settingsData.sender_email || "",
          senderName: settingsData.sender_name || "",
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeString: string) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const weekdays = [
    { key: 'mon', label: 'Montag' },
    { key: 'tue', label: 'Dienstag' },
    { key: 'wed', label: 'Mittwoch' },
    { key: 'thu', label: 'Donnerstag' },
    { key: 'fri', label: 'Freitag' },
    { key: 'sat', label: 'Samstag' },
    { key: 'sun', label: 'Sonntag' },
  ];

  const handleSave = async (section: string) => {
    if (!tenantId) return;

    setLoading(true);
    try {
      if (section === "Salon") {
        const { error } = await supabase
          .from('tenants')
          .update({
            name: salonInfo.name,
            slug: salonInfo.slug,
            email: salonInfo.email,
            phone: salonInfo.phone,
            address: salonInfo.address,
            logo_url: salonInfo.logoUrl || null,
            domain: salonInfo.domain || null,
          })
          .eq('id', tenantId);

        if (error) throw error;
      }

      if (section === "Öffnungszeiten") {
        const { error } = await supabase
          .from('opening_hours')
          .upsert({
            tenant_id: tenantId,
            mon_start: openingHours.monStart,
            mon_end: openingHours.monEnd,
            tue_start: openingHours.tueStart,
            tue_end: openingHours.tueEnd,
            wed_start: openingHours.wedStart,
            wed_end: openingHours.wedEnd,
            thu_start: openingHours.thuStart,
            thu_end: openingHours.thuEnd,
            fri_start: openingHours.friStart,
            fri_end: openingHours.friEnd,
            sat_start: openingHours.satStart,
            sat_end: openingHours.satEnd,
            sun_start: openingHours.sunStart,
            sun_end: openingHours.sunEnd,
          }, {
            onConflict: 'tenant_id'
          });

        if (error) throw error;
      }

      if (section === "Buchungs" || section === "Kommunikations") {
        const { error } = await supabase
          .from('settings')
          .upsert({
            tenant_id: tenantId,
            booking_interval_min: bookingSettings.bookingIntervalMin,
            require_deposit: bookingSettings.requireDeposit,
            deposit_cents: bookingSettings.depositCents,
            cancellation_hours: bookingSettings.cancellationHours,
            timezone: bookingSettings.timezone,
            currency: bookingSettings.currency,
            enable_whatsapp: commSettings.enableWhatsapp,
            sender_email: commSettings.senderEmail || null,
            sender_name: commSettings.senderName || null,
          }, {
            onConflict: 'tenant_id'
          });

        if (error) throw error;
      }
      
      toast({
        title: "Einstellungen gespeichert",
        description: `${section}-Einstellungen wurden erfolgreich aktualisiert.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Salon-Einstellungen und Konfiguration
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="salon">Salon</TabsTrigger>
          <TabsTrigger value="hours">Öffnungszeiten</TabsTrigger>
          <TabsTrigger value="booking">Buchungen</TabsTrigger>
          <TabsTrigger value="communication">Kommunikation</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Ihr aktueller Plan: {plan_name || (status === 'trial' ? 'Trial' : 'Unbekannt')} Plan
                </h2>
                <Badge className={`${
                  status === 'trial' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                  status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 
                  'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {status === 'trial' && is_trial_expired ? 'Trial Abgelaufen' :
                   status === 'trial' ? `Trial (${trial_days_left} Tage)` :
                   status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>

              {/* Usage Statistics */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-3">
                    <span>Termine</span>
                    <span>
                      {usageStats.monthlyAppointments}/
                      {usageStats.maxAppointments === 999999 ? 'Unbegrenzt' : usageStats.maxAppointments}
                    </span>
                  </div>
                  <Progress 
                    value={usageStats.maxAppointments === 999999 ? 5 : (usageStats.monthlyAppointments / usageStats.maxAppointments) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium mb-3">
                    <span>Mitarbeiter</span>
                    <span>
                      {usageStats.activeStaff}/
                      {usageStats.maxStaff === 999999 ? 'Unbegrenzt' : usageStats.maxStaff}
                    </span>
                  </div>
                  <Progress 
                    value={usageStats.maxStaff === 999999 ? 20 : (usageStats.activeStaff / usageStats.maxStaff) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 pt-6 border-t">
                <CreditCard className="h-4 w-4" />
                <span>
                  {status === 'trial' ? 'Trial-Version aktiv' : 'Zahlung über Stripe verwaltet'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                {status !== 'trial' ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abonnement verwalten
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive hover:text-destructive"
                    >
                      Abonnement kündigen
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Plan upgraden
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salon" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Salon-Informationen</span>
              </CardTitle>
              <CardDescription>
                Grundlegende Informationen über Ihren Salon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salon-name">Salon-Name</Label>
                  <Input
                    id="salon-name"
                    value={salonInfo.name}
                    onChange={(e) => setSalonInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Buchungs-URL</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                      apointo.com/b/
                    </span>
                    <Input
                      id="slug"
                      value={salonInfo.slug}
                      onChange={(e) => setSalonInfo(prev => ({ ...prev, slug: e.target.value }))}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={salonInfo.email}
                    onChange={(e) => setSalonInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={salonInfo.phone}
                    onChange={(e) => setSalonInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={salonInfo.address}
                  onChange={(e) => setSalonInfo(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={salonInfo.logoUrl}
                    onChange={(e) => setSalonInfo(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    value={salonInfo.domain}
                    onChange={(e) => setSalonInfo(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="salon.ihre-domain.de"
                  />
                </div>
              </div>

              <Button onClick={() => handleSave("Salon")} disabled={loading}>
                Salon-Info speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Öffnungszeiten</span>
              </CardTitle>
              <CardDescription>
                Legen Sie Ihre regulären Öffnungszeiten fest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weekdays.map((day) => (
                <div key={day.key} className="flex items-center space-x-4">
                  <div className="w-24">
                    <Label>{day.label}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={formatTime(openingHours[`${day.key}Start` as keyof typeof openingHours] as number)}
                      onChange={(e) => setOpeningHours(prev => ({
                        ...prev,
                        [`${day.key}Start`]: parseTime(e.target.value)
                      }))}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">bis</span>
                    <Input
                      type="time"
                      value={formatTime(openingHours[`${day.key}End` as keyof typeof openingHours] as number)}
                      onChange={(e) => setOpeningHours(prev => ({
                        ...prev,
                        [`${day.key}End`]: parseTime(e.target.value)
                      }))}
                      className="w-32"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpeningHours(prev => ({
                        ...prev,
                        [`${day.key}Start`]: null,
                        [`${day.key}End`]: null,
                      }))}
                    >
                      Geschlossen
                    </Button>
                  </div>
                </div>
              ))}

              <Button onClick={() => handleSave("Öffnungszeiten")} disabled={loading}>
                Öffnungszeiten speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Euro className="h-5 w-5" />
                <span>Buchungs-Einstellungen</span>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihre Online-Buchungsoptionen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="interval">Buchungsintervall (Minuten)</Label>
                <Select
                  value={bookingSettings.bookingIntervalMin.toString()}
                  onValueChange={(value) => setBookingSettings(prev => ({
                    ...prev,
                    bookingIntervalMin: parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minuten</SelectItem>
                    <SelectItem value="30">30 Minuten</SelectItem>
                    <SelectItem value="60">60 Minuten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anzahlung erforderlich</Label>
                    <p className="text-sm text-muted-foreground">
                      Kunden müssen eine Anzahlung leisten
                    </p>
                  </div>
                  <Switch
                    checked={bookingSettings.requireDeposit}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({
                      ...prev,
                      requireDeposit: checked
                    }))}
                  />
                </div>

                {bookingSettings.requireDeposit && (
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Anzahlungsbetrag (CHF)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      value={(bookingSettings.depositCents / 100).toFixed(2)}
                      onChange={(e) => setBookingSettings(prev => ({
                        ...prev,
                        depositCents: Math.round(parseFloat(e.target.value || "0") * 100)
                      }))}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="cancellation">Stornierungsfrist (Stunden)</Label>
                <Input
                  id="cancellation"
                  type="number"
                  value={bookingSettings.cancellationHours}
                  onChange={(e) => setBookingSettings(prev => ({
                    ...prev,
                    cancellationHours: parseInt(e.target.value) || 0
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  Mindestzeit vor dem Termin für kostenlose Stornierung
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Select
                  value={bookingSettings.timezone}
                  onValueChange={(value) => setBookingSettings(prev => ({
                    ...prev,
                    timezone: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem>
                    <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                    <SelectItem value="Europe/Vienna">Europe/Vienna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Standardwährung</Label>
                <Select
                  value={bookingSettings.currency}
                  onValueChange={(value: "EUR" | "CHF") => setBookingSettings(prev => ({
                    ...prev,
                    currency: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Diese Währung wird für Preise und Rechnungen verwendet
                </p>
              </div>

              <Button onClick={() => handleSave("Buchungs")} disabled={loading}>
                Buchungs-Einstellungen speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Kommunikations-Einstellungen</span>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie E-Mail und andere Kommunikationskanäle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Absender E-Mail</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={commSettings.senderEmail}
                    onChange={(e) => setCommSettings(prev => ({
                      ...prev,
                      senderEmail: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Absender Name</Label>
                  <Input
                    id="sender-name"
                    value={commSettings.senderName}
                    onChange={(e) => setCommSettings(prev => ({
                      ...prev,
                      senderName: e.target.value
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>WhatsApp aktivieren</Label>
                    <p className="text-sm text-muted-foreground">
                      Termine-Erinnerungen via WhatsApp versenden
                    </p>
                  </div>
                  <Switch
                    checked={commSettings.enableWhatsapp}
                    onCheckedChange={(checked) => setCommSettings(prev => ({
                      ...prev,
                      enableWhatsapp: checked
                    }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave("Kommunikations")} disabled={loading}>
                Kommunikations-Einstellungen speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;