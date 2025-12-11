import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Crown, Clock, Users, Calendar, FileText, Zap, CreditCard, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  interval: string;
  features: any;
  active: boolean;
}

const Subscription = () => {
  const { user } = useAuth();
  const { 
    status, 
    trial_days_left, 
    plan_name, 
    is_trial_expired, 
    loading, 
    refreshStatus,
    planLimits,
    checkLimit
  } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [usageStats, setUsageStats] = useState({
    monthlyAppointments: 0,
    maxAppointments: 0,
    activeStaff: 0,
    maxStaff: 0
  });
  const { toast } = useToast();

  // Check if this is a public pricing page (user not authenticated)
  const isPublicPricing = !user;

  useEffect(() => {
    loadSubscriptionPlans();
    if (user) {
      loadUsageStats();
    }
    
    // Only check for URL params if user is authenticated
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        toast({
          title: "Zahlung erfolgreich!",
          description: "Ihr Abonnement wurde erfolgreich abgeschlossen.",
        });
        // Clear URL params and refresh subscription
        window.history.replaceState({}, '', '/app/subscription');
        setTimeout(() => {
          refreshStatus();
        }, 2000);
      } else if (urlParams.get('canceled') === 'true') {
        toast({
          title: "Zahlung abgebrochen",
          description: "Der Zahlungsvorgang wurde abgebrochen.",
          variant: "destructive"
        });
        window.history.replaceState({}, '', '/app/subscription');
      }
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

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      toast({
        title: "Fehler",
        description: "Tarife konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setPlansLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, planName: string) => {
    if (isPublicPricing) {
      // For non-authenticated users, redirect to auth with plan selection
      const params = new URLSearchParams();
      params.set('selectedPlan', planId);
      params.set('planName', planName);
      const url = `/auth?${params.toString()}`;
      window.location.href = url;
      return;
    }

    if (status === 'active') {
      // For active subscribers, open customer portal
      try {
        const { data, error } = await supabase.functions.invoke('customer-portal');
        if (error) throw error;
        if (data.url) {
          window.open(data.url, '_blank');
        }
      } catch (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: "Fehler",
          description: "Kunde Portal konnte nicht geöffnet werden. Versuchen Sie es erneut.",
          variant: "destructive"
        });
      }
    } else {
      // For trial users, create checkout session
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId }
        });
        if (error) throw error;
        if (data.url) {
          window.open(data.url, '_blank');
        }
      } catch (error) {
        console.error('Error creating checkout:', error);
        toast({
          title: "Fehler",
          description: "Checkout konnte nicht erstellt werden. Versuchen Sie es erneut.",
          variant: "destructive"
        });
      }
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Fehler",
        description: "Kunde Portal konnte nicht geöffnet werden. Versuchen Sie es erneut.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2);
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'appointments':
        return <Calendar className="h-4 w-4" />;
      case 'customers':
        return <Users className="h-4 w-4" />;
      case 'staff':
        return <Users className="h-4 w-4" />;
      case 'reports':
        return <FileText className="h-4 w-4" />;
      case 'api_access':
        return <Zap className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  const getFeatureLabel = (key: string, value: any) => {
    switch (key) {
      case 'staff':
        return `Bis zu ${value === 'unlimited' ? 'unbegrenzte' : value} Mitarbeiter`;
      case 'online_bookings':
        return value ? 'Online-Buchungen' : null;
      case 'basic_reports':
        return value ? 'Grundlegende Berichte' : null;
      case 'email_support':
        return value ? 'Email-Support' : null;
      case 'all_starter_features':
        return value ? 'Alle Starter-Features' : null;
      case 'whatsapp_sms':
        return value ? 'WhatsApp & SMS' : null;
      case 'advanced_reports':
        return value ? 'Erweiterte Berichte' : null;
      case 'priority_support':
        return value ? 'Prioritäts-Support' : null;
      case 'all_pro_features':
        return value ? 'Alle Pro-Features' : null;
      case 'multi_location':
        return value ? 'Multi-Standort-Verwaltung' : null;
      case 'api_access':
        return value ? 'API-Zugang' : null;
      case 'dedicated_support':
        return value ? 'Dedicated Support' : null;
      default:
        return null;
    }
  };

  if ((isPublicPricing && plansLoading) || (!isPublicPricing && (loading || plansLoading))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Abrechnung</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihr Abonnement und sehen Sie Ihre aktuelle Nutzung.
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Ihr aktueller Plan: {plan_name || "Pro"} Plan
            </h2>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Aktiv
            </Badge>
          </div>

          {/* Usage Statistics */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium mb-3">
                <span>Termine</span>
                <span>
                  {usageStats.monthlyAppointments}/
                  {usageStats.maxAppointments === 999999 ? '150' : usageStats.maxAppointments}
                </span>
              </div>
              <Progress 
                value={usageStats.maxAppointments === 999999 ? 2 : (usageStats.monthlyAppointments / usageStats.maxAppointments) * 100} 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-medium mb-3">
                <span>Mitarbeiter</span>
                <span>
                  {usageStats.activeStaff}/
                  {usageStats.maxStaff === 999999 ? '5' : usageStats.maxStaff}
                </span>
              </div>
              <Progress 
                value={usageStats.maxStaff === 999999 ? 40 : (usageStats.activeStaff / usageStats.maxStaff) * 100} 
                className="h-2" 
              />
            </div>
          </div>

          {/* Payment Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 pt-6 border-t">
            <CreditCard className="h-4 w-4" />
            <span>Zahlung über Stripe verwaltet</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              className="w-full flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abonnement verwalten
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              className="w-full text-destructive hover:text-destructive"
            >
              Abonnement kündigen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;