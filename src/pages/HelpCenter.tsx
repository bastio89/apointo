import { Link } from "react-router-dom";
import { ArrowLeft, Search, MessageCircle, Book, Settings, Users, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HelpCenter = () => {
  const categories = [
    {
      icon: Calendar,
      title: "Terminverwaltung",
      description: "Termine erstellen, bearbeiten und verwalten",
      articles: 12
    },
    {
      icon: Users,
      title: "Kundenverwaltung", 
      description: "Kundendaten pflegen und verwalten",
      articles: 8
    },
    {
      icon: Settings,
      title: "Einstellungen",
      description: "Salon-Einstellungen und Konfiguration",
      articles: 15
    },
    {
      icon: CreditCard,
      title: "Abrechnung",
      description: "Rechnungen und Zahlungsabwicklung",
      articles: 6
    }
  ];

  const popularArticles = [
    "Wie erstelle ich einen neuen Termin?",
    "Kunden-Erinnerungen einrichten",
    "Mitarbeiter hinzufügen und verwalten",
    "Öffnungszeiten konfigurieren",
    "Online-Buchungen aktivieren"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Zurück zur Startseite</span>
            </Link>
            <h1 className="text-2xl font-bold">Hilfe-Center</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Suchen Sie nach Hilfe-Artikeln..."
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category) => (
            <Card key={category.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <category.icon className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <span className="text-sm text-muted-foreground">{category.articles} Artikel</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Beliebte Artikel</h2>
          <div className="space-y-4">
            {popularArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <Book className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{article}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Lesen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2">
                <MessageCircle className="h-6 w-6" />
                <span>Benötigen Sie weitere Hilfe?</span>
              </CardTitle>
              <CardDescription>
                Unser Support-Team hilft Ihnen gerne weiter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/kontakt">Kontakt aufnehmen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;