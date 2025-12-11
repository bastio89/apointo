import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, User, Mail, Phone, Clock, TrendingUp, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import LimitIndicator from "@/components/LimitIndicator";
import WorkingHoursManager from "@/components/staff/WorkingHoursManager";
import StaffPerformance from "@/components/staff/StaffPerformance";
import ServiceAssignments from "@/components/staff/ServiceAssignments";

const Staff = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkLimit, planLimits } = useSubscription();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    colorHex: "#3B82F6",
    skills: "",
    active: true,
  });

  useEffect(() => {
    loadStaff();
  }, [user]);

  const loadStaff = async () => {
    console.log('Starting loadStaff, user:', user?.id);
    if (!user) {
      console.log('No user available');
      return;
    }

    try {
      console.log('Getting user tenant data...');
      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      console.log('User data result:', { userData, userError });
      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant found');

      console.log('Setting tenant ID:', userData.tenant_id);
      setTenantId(userData.tenant_id);

      console.log('Loading staff data...');
      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('name');

      console.log('Staff data result:', { staffData, staffError });
      if (staffError) throw staffError;

      console.log('Setting staff data:', staffData?.length || 0, 'records');
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      
      toast({
        title: "Fehler",
        description: `Personal konnte nicht geladen werden: ${error?.message || 'Unbekannter Fehler'}`,
        variant: "destructive",
      });
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleEdit = (member: any) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      colorHex: member.color_hex || "#3B82F6",
      skills: (member.skills || []).join(", "),
      active: member.active,
    });
    setIsDialogOpen(true);
  };

  const handleNew = async () => {
    console.log('Starting handleNew - checking staff limit...');
    
    try {
      // Check staff limit before allowing new staff creation
      const limitCheck = await checkLimit('staff');
      console.log('Limit check result:', limitCheck);
      
      if (!limitCheck.withinLimit) {
        console.log('Staff limit reached');
        toast({
          title: "Mitarbeiterlimit erreicht",
          description: `Ihr aktueller Plan erlaubt nur ${limitCheck.limit} Mitarbeiter. Sie haben bereits ${limitCheck.current} Mitarbeiter. Bitte upgraden Sie Ihren Plan.`,
          variant: "destructive",
        });
        return;
      }

      console.log('Limit check passed, opening new staff dialog');
      setEditingStaff(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        colorHex: "#3B82F6",
        skills: "",
        active: true,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error in handleNew:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Überprüfen der Limits. Versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    console.log('Starting handleSave, tenantId:', tenantId);
    console.log('Form data:', formData);
    
    if (!tenantId) {
      console.error('No tenantId available');
      toast({
        title: "Fehler",
        description: "Keine Tenant-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s);
      console.log('Processed skills array:', skillsArray);
      
      if (editingStaff) {
        console.log('Updating existing staff member:', editingStaff.id);
        const updateData = {
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          color_hex: formData.colorHex,
          skills: skillsArray,
          active: formData.active,
        };
        console.log('Update data:', updateData);
        
        const { error, data } = await supabase
          .from('staff')
          .update(updateData)
          .eq('id', editingStaff.id)
          .select();

        console.log('Update result:', { error, data });
        if (error) throw error;
      } else {
        console.log('Creating new staff member');
        const insertData = {
          tenant_id: tenantId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          color_hex: formData.colorHex,
          skills: skillsArray,
          active: formData.active,
        };
        console.log('Insert data:', insertData);

        const { error, data } = await supabase
          .from('staff')
          .insert(insertData)
          .select();

        console.log('Insert result:', { error, data });
        if (error) throw error;
      }

      console.log('Staff operation successful, reloading data...');
      await loadStaff();
      setIsDialogOpen(false);
      
      toast({
        title: "Personal gespeichert",
        description: "Das Personal wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error('Error saving staff:', error);
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      
      toast({
        title: "Fehler",
        description: `Das Personal konnte nicht gespeichert werden: ${error?.message || 'Unbekannter Fehler'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      await loadStaff();
      
      toast({
        title: "Personal gelöscht",
        description: "Das Personal wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Fehler",
        description: "Das Personal konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Personal</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Salon-Personal und Arbeitszeiten
          </p>
          <LimitIndicator type="staff" className="mt-2" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Personal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Personal bearbeiten" : "Neues Personal"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff 
                  ? "Bearbeiten Sie die Details des Personals."
                  : "Fügen Sie ein neues Mitglied zu Ihrem Team hinzu."
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
                  placeholder="Vollständiger Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@salon.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+49 123 456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Kalenderfarbe</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.colorHex}
                    onChange={(e) => setFormData(prev => ({ ...prev, colorHex: e.target.value }))}
                    className="w-16 h-8"
                  />
                  <Input
                    value={formData.colorHex}
                    onChange={(e) => setFormData(prev => ({ ...prev, colorHex: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Fähigkeiten</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="Schnitt, Farbe, Styling (durch Komma getrennt)"
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

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="staff">Personal</TabsTrigger>
          <TabsTrigger value="schedule">Arbeitszeiten</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Leistung</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-4">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                       <div
                         className="w-4 h-4 rounded-full"
                         style={{ backgroundColor: member.color_hex }}
                       />
                       <div>
                         <CardTitle className="flex items-center space-x-2">
                           <span>{member.name}</span>
                           {!member.active && (
                             <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                               Inaktiv
                             </Badge>
                           )}
                         </CardTitle>
                         <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                           <div className="flex items-center space-x-1">
                             <Mail className="h-4 w-4" />
                             <span>{member.email || "Keine E-Mail"}</span>
                           </div>
                           <div className="flex items-center space-x-1">
                             <Phone className="h-4 w-4" />
                             <span>{member.phone || "Keine Telefonnummer"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Fähigkeiten</div>
                    <div className="flex flex-wrap gap-1">
                      {(member.skills || []).map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <WorkingHoursManager staff={staff} tenantId={tenantId || ""} />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <ServiceAssignments staff={staff} tenantId={tenantId || ""} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <StaffPerformance staff={staff} tenantId={tenantId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Staff;