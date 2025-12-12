import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('selectedPlan');
  const planName = searchParams.get('planName');
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      navigate("/app/dashboard");
    }
  }, [user, loading, navigate]);

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    salonName: "",
    ownerName: "",
    slug: ""
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Fehler",
        description: "Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Call the signup edge function
      const { data, error } = await supabase.functions.invoke('signup-tenant', {
        body: {
          email: signUpData.email,
          password: signUpData.password,
          salonName: signUpData.salonName,
          ownerName: signUpData.ownerName,
          slug: signUpData.slug,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Konto erstellt!",
          description: "Sie werden automatisch angemeldet...",
        });
        
        // Automatically sign in the user after successful registration
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: signUpData.email,
          password: signUpData.password,
        });

        if (signInError) {
          toast({
            title: "Anmeldung fehlgeschlagen",
            description: "Bitte melden Sie sich manuell an.",
            variant: "destructive",
          });
          
          // Switch to sign in tab
          const tabsTrigger = document.querySelector('[value="signin"]') as HTMLElement;
          if (tabsTrigger) {
            tabsTrigger.click();
          }
          return;
        }

        // Success - user will be automatically redirected by AuthContext
        toast({
          title: "Willkommen!",
          description: "Ihr Salon wurde erfolgreich eingerichtet.",
        });
        
        // Navigate to dashboard
        navigate("/app/dashboard");
      }
    } catch (error: any) {
      let errorMessage = "Ein Fehler ist aufgetreten.";
      
      if (error.message === "Dieser Slug ist bereits vergeben") {
        errorMessage = `Die URL "apointo.com/b/${signUpData.slug}" ist bereits vergeben. Bitte wählen Sie einen anderen Namen oder ändern Sie die URL.`;
      } else if (error.message === "Email bereits registriert. Bitte verwenden Sie eine andere Email oder melden Sie sich an.") {
        errorMessage = "Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: "Erfolgreich angemeldet!",
        description: "Willkommen zurück.",
      });

      navigate("/app/dashboard");
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Anmeldung fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (salonName: string) => {
    return salonName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSalonNameChange = (value: string) => {
    setSignUpData(prev => ({
      ...prev,
      salonName: value,
      slug: generateSlug(value)
    }));
  };

  // Show loading while checking authentication status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold">
            <Calendar className="h-8 w-8 text-primary" />
            <span>Daylane</span>
          </Link>
        </div>
        
        {selectedPlan && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-primary mb-2">Gewählter Tarif</h3>
                <p className="text-sm text-muted-foreground">
                  Sie haben den <strong>{planName}</strong> Tarif ausgewählt.
                  Nach der Registrierung wird Ihre 14-tägige Testphase aktiviert.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={selectedPlan ? "signup" : "signin"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Anmelden</TabsTrigger>
            <TabsTrigger value="signup">Registrieren</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Anmelden</CardTitle>
                <CardDescription>
                  Melden Sie sich in Ihrem Apointo-Konto an
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">E-Mail</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="ihre@email.de"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Passwort</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Wird angemeldet..." : "Anmelden"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedPlan ? `${planName} Tarif - Salon registrieren` : "Salon registrieren"}
                </CardTitle>
                <CardDescription>
                  {selectedPlan 
                    ? `Erstellen Sie Ihr Konto für den ${planName} Tarif und starten Sie Ihre 14-tägige Testphase`
                    : "Erstellen Sie Ihr Daylane-Konto"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="salon-name">Salon-Name</Label>
                    <Input
                      id="salon-name"
                      value={signUpData.salonName}
                      onChange={(e) => handleSalonNameChange(e.target.value)}
                      required
                      placeholder="Ihr Salon-Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Buchungs-URL (anpassbar)</Label>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-muted-foreground">apointo.com/b/</span>
                      <Input
                        id="slug"
                        value={signUpData.slug}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                        required
                        placeholder="ihr-bereich"
                        className="flex-1"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Diese URL können Kunden für Online-Buchungen verwenden
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="owner-name">Ihr Name</Label>
                    <Input
                      id="owner-name"
                      value={signUpData.ownerName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, ownerName: e.target.value }))}
                      required
                      placeholder="Ihr Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-Mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="ihre@email.de"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Wird erstellt..." : "Salon registrieren"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Link to={selectedPlan ? "/pricing" : "/"} className="text-muted-foreground hover:text-foreground">
            ← {selectedPlan ? "Zurück zur Tarifauswahl" : "Zurück zur Startseite"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;