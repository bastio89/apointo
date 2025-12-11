import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Customers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
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

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Fehler",
        description: "Kunden konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
  };

  const handleViewAppointments = (customerId: string) => {
    navigate(`/app/calendar?customer=${customerId}`);
  };

  const handleNewAppointment = (customerId: string) => {
    navigate(`/app/calendar?newAppointment=true&customer=${customerId}`);
  };

  const handleSaveCustomer = async (customerData: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          notes: customerData.notes,
          tags: customerData.tags,
        })
        .eq('id', customerData.id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Kunde wurde erfolgreich aktualisiert.",
      });

      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Fehler",
        description: "Kunde konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCustomer = async (customerData: any) => {
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

      const { error } = await supabase
        .from('customers')
        .insert({
          tenant_id: userData.tenant_id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          notes: customerData.notes,
          tags: customerData.tags,
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Kunde wurde erfolgreich erstellt.",
      });

      setCreatingCustomer(false);
      loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Fehler",
        description: "Kunde konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "VIP":
        return "bg-yellow-100 text-yellow-800";
      case "Stammkunde":
        return "bg-green-100 text-green-800";
      case "Neukunde":
        return "bg-blue-100 text-blue-800";
      case "Allergie":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kunden</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kundendatenbank
          </p>
        </div>
        <Button onClick={() => setCreatingCustomer(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Kunden suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    {customer.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(customer.tags || []).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={getTagColor(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">Erstellt am</div>
                    <div className="text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Status</div>
                  <div className="text-muted-foreground">Aktiv</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Typ</div>
                  <div className="text-muted-foreground">
                    {(customer.tags || []).includes("VIP") ? "VIP Kunde" : "Standard Kunde"}
                  </div>
                </div>
              </div>
              {customer.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-1">Notizen</div>
                  <div className="text-sm text-muted-foreground">{customer.notes}</div>
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditCustomer(customer)}
                >
                  Bearbeiten
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewAppointments(customer.id)}
                >
                  Termine anzeigen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNewAppointment(customer.id)}
                >
                  Neuer Termin
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Kunde bearbeiten</DialogTitle>
            </DialogHeader>
            <CustomerEditForm 
              customer={editingCustomer} 
              onSave={handleSaveCustomer}
              onCancel={() => setEditingCustomer(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Create Customer Dialog */}
      {creatingCustomer && (
        <Dialog open={creatingCustomer} onOpenChange={() => setCreatingCustomer(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Neuen Kunden erstellen</DialogTitle>
            </DialogHeader>
            <CustomerCreateForm 
              onSave={handleCreateCustomer}
              onCancel={() => setCreatingCustomer(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Customer Edit Form Component
const CustomerEditForm = ({ customer, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    id: customer.id,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    notes: customer.notes || '',
    tags: customer.tags || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (komma-getrennt)</Label>
        <Input
          id="tags"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="z.B. VIP, Stammkunde, Allergie"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit">
          Speichern
        </Button>
      </div>
    </form>
  );
};

// Customer Create Form Component
const CustomerCreateForm = ({ onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    tags: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (komma-getrennt)</Label>
        <Input
          id="tags"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="z.B. VIP, Stammkunde, Allergie"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit">
          Erstellen
        </Button>
      </div>
    </form>
  );
};

export default Customers;