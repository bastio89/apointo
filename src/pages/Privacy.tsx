import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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
            <h1 className="text-2xl font-bold">Datenschutzerklärung</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-lg font-semibold mb-2">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
                passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
                persönlich identifiziert werden können.
              </p>

              <h3 className="text-lg font-semibold mb-2">Datenerfassung auf dieser Website</h3>
              <p className="text-muted-foreground mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Hosting</h2>
              <p className="text-muted-foreground mb-4">
                Wir hosten die Inhalte unserer Website bei folgenden Anbietern:
              </p>
              
              <h3 className="text-lg font-semibold mb-2">Externes Hosting</h3>
              <p className="text-muted-foreground mb-4">
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, 
                werden auf den Servern des Hosters / der Hoster gespeichert. Hierbei kann es sich v. a. um IP-Adressen, 
                Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe 
                und sonstige Daten, die über eine Website generiert werden, handeln.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-lg font-semibold mb-2">Datenschutz</h3>
              <p className="text-muted-foreground mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie 
                dieser Datenschutzerklärung.
              </p>

              <h3 className="text-lg font-semibold mb-2">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-muted-foreground mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p>
                  Apointo GmbH<br />
                  Musterstraße 123<br />
                  12345 Berlin<br />
                  Deutschland
                </p>
                <p>
                  Telefon: +49 (0) 30 12345678<br />
                  E-Mail: datenschutz@apointo.com
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-lg font-semibold mb-2">Cookies</h3>
              <p className="text-muted-foreground mb-4">
                Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete und richten auf 
                Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung 
                (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
              </p>

              <h3 className="text-lg font-semibold mb-2">Server-Log-Dateien</h3>
              <p className="text-muted-foreground mb-4">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
                die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Kontakt und Anfragen</h2>
              <p className="text-muted-foreground mb-4">
                Wenn Sie uns per Kontaktformular oder E-Mail kontaktieren, werden Ihre Angaben aus dem Anfrageformular 
                inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von 
                Anschlussfragen bei uns gespeichert.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Ihre Rechte</h2>
              <p className="text-muted-foreground mb-4">
                Sie haben folgende Rechte:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Recht auf Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten</li>
                <li>Recht auf Berichtigung unrichtiger oder Vervollständigung richtiger Daten</li>
                <li>Recht auf Löschung Ihrer bei uns gespeicherten Daten</li>
                <li>Recht auf Einschränkung der Datenverarbeitung</li>
                <li>Recht auf Datenübertragbarkeit</li>
                <li>Widerspruchsrecht gegen die Verarbeitung Ihrer Daten bei uns</li>
                <li>Recht auf Beschwerde bei einer Aufsichtsbehörde</li>
              </ul>
            </section>

            <div className="text-sm text-muted-foreground mt-8 pt-8 border-t border-border">
              <p>Stand: Januar 2024</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;