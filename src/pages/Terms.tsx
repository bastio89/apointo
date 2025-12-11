import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
            <h1 className="text-2xl font-bold">Allgemeine Geschäftsbedingungen</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">§ 1 Geltungsbereich</h2>
              <p className="text-muted-foreground mb-4">
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen der Daylane GmbH 
                (nachfolgend "Daylane" oder "wir") und ihren Kunden über die Nutzung der 
                Daylane-Software als Dienstleistung (Software as a Service).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 2 Vertragsgegenstand</h2>
              <p className="text-muted-foreground mb-4">
                Der Anbieter stellt dem Nutzer eine webbasierte Software zur Verfügung, die der Verwaltung von 
                Friseursalons dient. Die Software umfasst insbesondere:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Terminverwaltung und Online-Buchungssystem</li>
                <li>Kundenverwaltung</li>
                <li>Mitarbeiterverwaltung</li>
                <li>Rechnungserstellung</li>
                <li>Berichtswesen und Statistiken</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 3 Nutzungsrecht</h2>
              <p className="text-muted-foreground mb-4">
                Der Nutzer erhält für die Vertragslaufzeit ein einfaches, nicht übertragbares und nicht 
                ausschließliches Recht zur Nutzung der Software. Die Nutzung ist auf den vertraglich 
                vereinbarten Umfang beschränkt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 4 Preise und Zahlungsbedingungen</h2>
              
              <h3 className="text-lg font-semibold mb-2">Preise</h3>
              <p className="text-muted-foreground mb-4">
                Es gelten die zum Zeitpunkt der Bestellung auf der Website angegebenen Preise. 
                Alle Preise verstehen sich als Nettopreise zuzüglich der gesetzlichen Mehrwertsteuer.
              </p>

              <h3 className="text-lg font-semibold mb-2">Zahlungsbedingungen</h3>
              <p className="text-muted-foreground mb-4">
                Die Gebühren sind monatlich im Voraus zu entrichten. Die Zahlung erfolgt per SEPA-Lastschrift 
                oder Kreditkarte. Bei Zahlungsverzug ist der Anbieter berechtigt, die Nutzung der Software 
                zu sperren.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 5 Verfügbarkeit</h2>
              <p className="text-muted-foreground mb-4">
                Der Anbieter bemüht sich um eine Verfügbarkeit der Software von 99% im Jahresdurchschnitt. 
                Hiervon ausgenommen sind Zeiten planmäßiger Wartungsarbeiten sowie Zeiten, in denen die 
                Software aufgrund von Ereignissen nicht erreichbar ist, die nicht im Einflussbereich des 
                Anbieters stehen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 6 Datenschutz und Datensicherheit</h2>
              <p className="text-muted-foreground mb-4">
                Der Anbieter verpflichtet sich, die geltenden Datenschutzbestimmungen einzuhalten. 
                Einzelheiten sind in der Datenschutzerklärung geregelt.
              </p>
              <p className="text-muted-foreground mb-4">
                Der Anbieter führt regelmäßige Datensicherungen durch. Der Nutzer ist jedoch selbst 
                verpflichtet, seine Daten zusätzlich zu sichern.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 7 Pflichten des Nutzers</h2>
              <p className="text-muted-foreground mb-4">Der Nutzer verpflichtet sich:</p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Die Software nur im vereinbarten Umfang zu nutzen</li>
                <li>Zugangsdaten vertraulich zu behandeln</li>
                <li>Keine rechtswidrigen Inhalte zu verarbeiten</li>
                <li>Den Anbieter über Sicherheitsverletzungen zu informieren</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 8 Vertragslaufzeit und Kündigung</h2>
              
              <h3 className="text-lg font-semibold mb-2">Laufzeit</h3>
              <p className="text-muted-foreground mb-4">
                Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Parteien mit einer 
                Frist von einem Monat zum Monatsende gekündigt werden.
              </p>

              <h3 className="text-lg font-semibold mb-2">Außerordentliche Kündigung</h3>
              <p className="text-muted-foreground mb-4">
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. 
                Ein wichtiger Grund liegt insbesondere vor bei erheblichen Vertragsverletzungen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 9 Haftung</h2>
              <p className="text-muted-foreground mb-4">
                Der Anbieter haftet nur bei Vorsatz und grober Fahrlässigkeit. Die Haftung für leichte 
                Fahrlässigkeit ist ausgeschlossen, außer bei der Verletzung wesentlicher Vertragspflichten. 
                In diesem Fall ist die Haftung auf den vorhersehbaren Schaden begrenzt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">§ 10 Schlussbestimmungen</h2>
              <p className="text-muted-foreground mb-4">
                Änderungen dieser AGB bedürfen der Schriftform. Sollten einzelne Bestimmungen unwirksam sein, 
                bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
              <p className="text-muted-foreground mb-4">
                Es gilt deutsches Recht. Gerichtsstand ist Berlin.
              </p>
            </section>

            <div className="bg-muted p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
              <p>
                Daylane GmbH<br />
                Musterstraße 123<br />
                12345 Berlin<br />
                Deutschland
              </p>
              <p className="mt-2">
                E-Mail: legal@daylane.de<br />
                Telefon: +49 (0) 30 12345678
              </p>
            </div>

            <div className="text-sm text-muted-foreground mt-8 pt-8 border-t border-border">
              <p>Stand: Januar 2024</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;