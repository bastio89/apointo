import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/ContactForm";

const Contact = () => {
  const contactMethods = [
    {
      icon: Mail,
      title: "E-Mail Support",
      description: "Schreiben Sie uns eine E-Mail",
      contact: "support@daylane.de",
      action: "E-Mail senden"
    }
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
            <h1 className="text-2xl font-bold">Kontakt</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Kontaktieren Sie uns</h2>
            <p className="text-lg text-muted-foreground">
              Haben Sie Fragen oder benötigen Unterstützung? Wir sind hier, um Ihnen zu helfen.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="flex justify-center mb-16">
            {contactMethods.map((method) => (
              <Card key={method.title} className="text-center">
                <CardHeader>
                  <method.icon className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-4">{method.contact}</p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`mailto:${method.contact}`, '_self')}
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Nachricht senden</h3>
              <ContactForm />
            </div>

            {/* Office Info - Hidden per user request */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;