import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Imprint = () => {
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
            <h1 className="text-2xl font-bold">Impressum</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Angaben gemäß § 5 TMG</h2>
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Daylane</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Risistrasse 19</p>
                  <p>5737 Menziken</p>
                  <p>Schweiz</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Telefon</h3>
                  <p className="text-muted-foreground">+41 (0) 76 203 57 47</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">E-Mail</h3>
                  <p className="text-muted-foreground">info@daylane.de</p>
                </div>
              </div>
            </section>


            <section>
              <h2 className="text-2xl font-bold mb-4">Geschäftsführung</h2>
              <p className="text-muted-foreground">
                Sebastian Oczachowski<br />
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <div className="text-muted-foreground">
                <p>Sebastian Oczachowski</p>
                <p>Risistrasse 19</p>
                <p>5737 Menziken</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">EU-Streitschlichtung</h2>
              <p className="text-muted-foreground mb-4">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              </p>
              <p className="text-muted-foreground mb-4">
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="text-muted-foreground">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
              <p className="text-muted-foreground">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section className="bg-muted/50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Haftungsausschluss</h2>
              
              <h3 className="font-semibold mb-2">Inhalte</h3>
              <p className="text-muted-foreground mb-4">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
                unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach 
                Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>

              <h3 className="font-semibold mb-2">Links</h3>
              <p className="text-muted-foreground">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
                verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

            <div className="text-sm text-muted-foreground mt-8 pt-8 border-t border-border">
              <p>Stand: August 2025</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Imprint;