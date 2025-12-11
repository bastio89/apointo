import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, Clock } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
}

const SubscriptionGuard = ({ children, feature = "diese Funktion" }: SubscriptionGuardProps) => {
  const { canAccessFeatures, isTrialExpired, trial_days_left, loading } = useSubscription();
  const navigate = useNavigate();

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

  if (!canAccessFeatures) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              {isTrialExpired ? <Crown className="h-6 w-6 text-destructive" /> : <Clock className="h-6 w-6 text-warning" />}
            </div>
            <CardTitle>
              {isTrialExpired ? "Testphase beendet" : "Zugriff beschränkt"}
            </CardTitle>
            <CardDescription>
              {isTrialExpired
                ? `Ihre 14-tägige Testphase ist abgelaufen. Wählen Sie einen Tarif, um ${feature} weiterhin zu nutzen.`
                : `Sie können ${feature} noch ${trial_days_left} Tage kostenlos nutzen.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button
              onClick={() => navigate('/app/subscription')}
              className="w-full"
            >
              {isTrialExpired ? "Tarif auswählen" : "Tarife ansehen"}
            </Button>
            {!isTrialExpired && (
              <Button
                variant="outline"
                onClick={() => navigate('/app/dashboard')}
                className="w-full"
              >
                Zurück zum Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
