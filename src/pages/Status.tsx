import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Status = () => {
  const services = [
    {
      name: "Terminbuchung",
      status: "operational",
      uptime: "99.9%",
      responseTime: "45ms"
    },
    {
      name: "Kundenverwaltung",
      status: "operational", 
      uptime: "99.8%",
      responseTime: "32ms"
    },
    {
      name: "E-Mail Versand",
      status: "maintenance",
      uptime: "99.5%",
      responseTime: "120ms"
    },
    {
      name: "SMS Versand",
      status: "operational",
      uptime: "99.7%",
      responseTime: "89ms"
    },
    {
      name: "API Services",
      status: "degraded",
      uptime: "98.9%",
      responseTime: "245ms"
    }
  ];

  const incidents = [
    {
      title: "Geplante Wartung - E-Mail Service",
      status: "scheduled",
      date: "2024-01-20 02:00 UTC",
      description: "Routinemäßige Wartungsarbeiten am E-Mail-System"
    },
    {
      title: "API Antwortzeiten erhöht",
      status: "investigating",
      date: "2024-01-19 14:30 UTC", 
      description: "Wir untersuchen erhöhte Antwortzeiten bei API-Anfragen"
    },
    {
      title: "SMS Versand kurzzeitig unterbrochen",
      status: "resolved",
      date: "2024-01-18 09:15 UTC",
      description: "SMS Versand war für 15 Minuten nicht verfügbar - Problem behoben"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "maintenance":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      operational: "default",
      degraded: "secondary", 
      maintenance: "outline",
      outage: "destructive",
      scheduled: "outline",
      investigating: "secondary",
      resolved: "default"
    } as const;

    const labels = {
      operational: "Betriebsbereit",
      degraded: "Beeinträchtigt",
      maintenance: "Wartung",
      outage: "Ausfall",
      scheduled: "Geplant",
      investigating: "Wird untersucht",
      resolved: "Behoben"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

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
            <h1 className="text-2xl font-bold">System Status</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Overall Status */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <CardTitle className="text-2xl">Alle Systeme betriebsbereit</CardTitle>
              </div>
              <CardDescription>
                Letzte Aktualisierung: {new Date().toLocaleString('de-DE')}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Services Status */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6">Service Status</h2>
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.name}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Verfügbarkeit: {service.uptime}</span>
                          <span>Antwortzeit: {service.responseTime}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Incidents */}
          <div>
            <h2 className="text-xl font-bold mb-6">Aktuelle Vorfälle</h2>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      {getStatusBadge(incident.status)}
                    </div>
                    <CardDescription>{incident.date}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{incident.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Status;