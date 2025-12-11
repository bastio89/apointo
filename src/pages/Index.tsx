import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, Users, Bell, BarChart3, MessageSquare, Clock, Star } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
const Index = () => {
  const [currentBusinessType, setCurrentBusinessType] = useState(0);
  const businessTypes = ["Unternehmen", "Teams", "Freelancer", "Agenturen"];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBusinessType(prev => (prev + 1) % businessTypes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold text-foreground">Daylane</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/pricing" className="hidden sm:block text-muted-foreground hover:text-foreground">
              Preise
            </Link>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground text-sm sm:text-base">
              Anmelden
            </Link>
            <Button asChild size="sm" className="text-xs sm:text-sm">
              <Link to="/auth">
                <span className="hidden sm:inline">Kostenlos starten</span>
                <span className="sm:hidden">Starten</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container max-w-6xl">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              Über 1.000 Unternehmen vertrauen uns bereits
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Intelligentes{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-salon-accent bg-clip-text text-transparent">
                Zeitmanagement
              </span>{" "}
              für moderne{" "}
              <span className="text-primary transition-all duration-500 ease-in-out">
                {businessTypes[currentBusinessType]}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Termine verwalten, Zeiterfassung, Produktivität steigern und mehr. 
              Alles was Sie brauchen, um Ihre Zeit optimal zu nutzen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <Link to="/auth">Jetzt kostenlos testen</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                Demo buchen
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Alles für Ihren Zeitmanagement-Erfolg
            </h2>
            <p className="text-xl text-muted-foreground">
              Professionelle Tools für effizientes Zeitmanagement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Terminplanung</CardTitle>
                <CardDescription>
                  Intelligente Terminverwaltung für optimale Zeitnutzung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Automatische Terminoptimierung
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Kalender-Integration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Konfliktmanagement
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Kundenverwaltung</CardTitle>
                <CardDescription>
                  Alle Kundeninformationen zentral verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Besuchshistorie
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Persönliche Notizen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Kundentags
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Automatische Erinnerungen</CardTitle>
                <CardDescription>
                  Keine verpassten Termine mehr
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Email-Erinnerungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    SMS-Benachrichtigungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    WhatsApp-Integration
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Berichte & Analysen</CardTitle>
                <CardDescription>
                  Wichtige Kennzahlen im Überblick
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Umsatzberichte
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Auslastungsstatistiken
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Top-Services
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Kommunikation</CardTitle>
                <CardDescription>
                  Direkter Kontakt zu Ihren Kunden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Terminbestätigungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Änderungsbenachrichtigungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Marketing-Messages
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Service-Management</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre Dienstleistungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Flexible Preisgestaltung
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Mitarbeiter-Zuordnung
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Online-Sichtbarkeit
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4">
        <div className="container max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Transparente Preise
            </h2>
            <p className="text-xl text-muted-foreground">
              Wählen Sie das richtige Paket für Ihren Salon
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">29 CHF</div>
                  <div className="text-muted-foreground">pro Monat</div>
                </div>
                <CardDescription>
                  Perfekt für kleine Salons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/auth">Jetzt starten</Link>
                </Button>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Bis zu 2 Mitarbeiter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Online-Buchungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Grundlegende Berichte
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Email-Support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge className="bg-primary text-primary-foreground">Beliebt</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">49 CHF</div>
                  <div className="text-muted-foreground">pro Monat</div>
                </div>
                <CardDescription>
                  Für wachsende Salons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <Link to="/auth">Jetzt starten</Link>
                </Button>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Bis zu 5 Mitarbeiter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Alle Starter-Features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    WhatsApp & SMS
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Erweiterte Berichte
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Prioritäts-Support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Business</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">89 CHF</div>
                  <div className="text-muted-foreground">pro Monat</div>
                </div>
                <CardDescription>
                  Für große Salon-Ketten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/auth">Jetzt starten</Link>
                </Button>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Unbegrenzte Mitarbeiter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Alle Pro-Features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Multi-Standort-Verwaltung
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    API-Zugang
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-salon-accent" />
                    Dedicated Support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Das sagen unsere Kunden
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-salon-accent text-salon-accent" />)}
                </div>
                 <p className="text-muted-foreground mb-4">
                   "Daylane hat unseren Salon komplett verändert. Die Online-Buchungen haben sich verdreifacht!"
                 </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">MS</span>
                  </div>
                  <div>
                    <div className="font-medium">Maria Schmidt</div>
                    <div className="text-sm text-muted-foreground">Salon Bella Vista</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-salon-accent text-salon-accent" />)}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Endlich haben wir den Überblick über alle Termine. Das spart uns täglich 2 Stunden!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">TM</span>
                  </div>
                  <div>
                    <div className="font-medium">Thomas Müller</div>
                    <div className="text-sm text-muted-foreground">Friseursalon Zentral</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-salon-accent text-salon-accent" />)}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Die automatischen Erinnerungen haben unsere No-Show-Rate um 70% reduziert."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">LK</span>
                  </div>
                  <div>
                    <div className="font-medium">Lisa Klein</div>
                    <div className="text-sm text-muted-foreground">Hair & Beauty Studio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-4">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Haben Sie Fragen?
            </h2>
            <p className="text-xl text-muted-foreground">
              Kontaktieren Sie uns und wir helfen Ihnen gerne weiter
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Daylane</span>
              </div>
              <p className="text-muted-foreground">
                Die komplette Management-Lösung für moderne Dienstleistungsunternehmen.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Produkt</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Preise</Link></li>
                <li><Link to="/kontakt" className="hover:text-foreground">Demo</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/hilfe-center" className="hover:text-foreground">Hilfe-Center</Link></li>
                <li><Link to="/kontakt" className="hover:text-foreground">Kontakt</Link></li>
                <li><Link to="/status" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Rechtliches</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/datenschutz" className="hover:text-foreground">Datenschutz</Link></li>
                <li><Link to="/agb" className="hover:text-foreground">AGB</Link></li>
                <li><Link to="/impressum" className="hover:text-foreground">Impressum</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Daylane. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;