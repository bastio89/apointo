import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Download, Eye, Calendar, Euro, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, type Currency } from "@/lib/currency";

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<Currency>("CHF");

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
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

      // Load currency from settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('currency')
        .eq('tenant_id', userData.tenant_id)
        .single();
      
      setCurrency((settingsData?.currency as Currency) || "CHF");

      // Load invoices with appointment and customer data
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          appointments (
            start_at,
            customers (name)
          )
        `)
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Fehler",
        description: "Rechnungen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If no real invoices exist, show empty state (removed mock data)
  const invoiceData = invoices;
  const formatCurrencyDisplay = (cents: number) => {
    return formatCurrency(cents, currency);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (paidAt: string | null) => {
    return paidAt ? (
      <Badge className="bg-green-100 text-green-800">Bezahlt</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Ausstehend</Badge>
    );
  };

  const markAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Rechnung wurde als bezahlt markiert.",
      });

      await loadInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast({
        title: "Fehler",
        description: "Rechnung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoiceData.filter((invoice) => {
    const customerName = invoice.appointments?.customers?.name || "Unbekannt";
    const matchesSearch = 
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "paid" && invoice.paid_at) ||
      (filterStatus === "unpaid" && !invoice.paid_at);

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoiceData
    .filter(inv => inv.paid_at)
    .reduce((sum, inv) => sum + (inv.total_cents || 0), 0);

  const pendingRevenue = invoiceData
    .filter(inv => !inv.paid_at)
    .reduce((sum, inv) => sum + (inv.total_cents || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rechnungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Rechnungen und Zahlungen
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Rechnung
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Rechnung erstellen</DialogTitle>
              <DialogDescription>
                Diese Funktion wird in Kürze verfügbar sein.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Automatische Rechnungserstellung wird bald implementiert.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyDisplay(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Alle bezahlten Rechnungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyDisplay(pendingRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Unbezahlte Rechnungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechnungen gesamt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceData.length}</div>
            <p className="text-xs text-muted-foreground">
              Diesen Monat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechnungen suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Alle
              </Button>
              <Button
                variant={filterStatus === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("paid")}
              >
                Bezahlt
              </Button>
              <Button
                variant={filterStatus === "unpaid" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("unpaid")}
              >
                Ausstehend
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Lade Rechnungen...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => {
            const customerName = invoice.appointments?.customers?.name || "Unbekannt";
            const appointmentDate = invoice.appointments?.start_at || invoice.created_at;
            const invoiceItems = invoice.items || [];
            
            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{invoice.number}</CardTitle>
                      <CardDescription className="mt-1">
                        {customerName} • {formatDate(appointmentDate)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(invoice.paid_at)}
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrencyDisplay(invoice.total_cents || 0)}</div>
                        <div className="text-sm text-muted-foreground">
                          inkl. {invoice.vat_rate || 19}% MwSt.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Positionen:</div>
                    <div className="space-y-1">
                      {invoiceItems.length > 0 ? (
                        invoiceItems.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span>{formatCurrencyDisplay(item.price_cents || 0)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">Keine Positionen verfügbar</div>
                      )}
                    </div>
                  </div>
                  
                  {invoice.paid_at && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        Bezahlt am {formatDate(invoice.paid_at)}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ansehen
                    </Button>
                    <Button variant="outline" size="sm" disabled={!invoice.pdf_url}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    {!invoice.paid_at && (
                      <Button size="sm" onClick={() => markAsPaid(invoice.id)}>
                        Als bezahlt markieren
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Keine Rechnungen gefunden</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Ändern Sie Ihre Suchkriterien oder Filter."
                : "Erstellen Sie Ihre erste Rechnung."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Invoices;