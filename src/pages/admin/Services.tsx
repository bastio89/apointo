import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Clock, Euro, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, getCurrencySymbol, type Currency } from "@/lib/currency";

const Services = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [currency, setCurrency] = useState<Currency>("CHF");
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationMin: 30,
    priceCents: 0,
    visibleOnline: true,
    active: true,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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

      // Load currency from settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('currency')
        .eq('tenant_id', userData.tenant_id)
        .single();
      
      setCurrency((settingsData?.currency as Currency) || "CHF");

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('name');

      if (servicesError) throw servicesError;

      setServices(servicesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const formatPriceDisplay = (cents: number) => {
    return formatPrice(cents, currency);
  };

  const formatPriceInput = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      durationMin: service.duration_min,
      priceCents: service.price_cents,
      visibleOnline: service.visible_online,
      active: service.active,
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      durationMin: 30,
      priceCents: 0,
      visibleOnline: true,
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description || null,
            duration_min: formData.durationMin,
            price_cents: formData.priceCents,
            visible_online: formData.visibleOnline,
            active: formData.active,
          })
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            tenant_id: tenantId,
            name: formData.name,
            description: formData.description || null,
            duration_min: formData.durationMin,
            price_cents: formData.priceCents,
            visible_online: formData.visibleOnline,
            active: formData.active,
          });

        if (error) throw error;
      }

      await loadData();
      setIsDialogOpen(false);
      
      toast({
        title: "Service gespeichert",
        description: "Der Service wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Fehler",
        description: "Der Service konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      await loadData();
      
      toast({
        title: "Service gelöscht",
        description: "Der Service wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Fehler",
        description: "Der Service konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Dienstleistungen und Preise
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Service bearbeiten" : "Neuer Service"}
              </DialogTitle>
              <DialogDescription>
                {editingService 
                  ? "Bearbeiten Sie die Details des Services."
                  : "Erstellen Sie einen neuen Service für Ihren Salon."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Service-Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Service-Beschreibung"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Dauer (Minuten)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.durationMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationMin: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preis ({getCurrencySymbol(currency)})</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formatPriceInput(formData.priceCents)}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Online sichtbar</Label>
                <Switch
                  id="visible"
                  checked={formData.visibleOnline}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visibleOnline: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Aktiv</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{service.name}</span>
                     {!service.active && (
                       <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                         Inaktiv
                       </Badge>
                     )}
                     {service.visible_online ? (
                       <Eye className="h-4 w-4 text-green-500" />
                     ) : (
                       <EyeOff className="h-4 w-4 text-gray-400" />
                     )}
                   </CardTitle>
                   <CardDescription className="mt-1">
                     {service.description}
                   </CardDescription>
                 </div>
                 <div className="flex space-x-2">
                   <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                     <Edit className="h-4 w-4" />
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => handleDelete(service.id)}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center space-x-2">
                   <Clock className="h-4 w-4 text-muted-foreground" />
                   <div className="text-sm">
                     <div className="font-medium">Dauer</div>
                     <div className="text-muted-foreground">
                       {formatDuration(service.duration_min)}
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Euro className="h-4 w-4 text-muted-foreground" />
                   <div className="text-sm">
                     <div className="font-medium">Preis</div>
                     <div className="text-muted-foreground">
                       {formatPriceDisplay(service.price_cents)}
                    </div>
                  </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Services;