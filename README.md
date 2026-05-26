# Game of Life

Eine Implementierung von Conways Spiel des Lebens in Vanilla JavaScript. Ein interaktives webbasiertes Zelluläres Automaton, bei dem sich Zellen basierend auf einfachen Regeln vermehren, verändern und sterben.

Erreichbar unter: https://game-of-life-poc.vercel.app

## Was ist das Spiel des Lebens?

Das Spiel des Lebens ist ein Zelluläres Automaton von John Horton Conway. Es ist ein Nullspielerspiel, das sich nach einem Anfangszustand selbstständig weiterentwickelt. Das Spiel wird auf einem zweidimensionalen Gitter gespielt, bei dem jede Zelle entweder lebendig oder tot ist.

### Regeln

Jede Zelle interagiert mit ihren acht Nachbarn nach diesen Regeln:

- Eine lebende Zelle mit 2 oder 3 Nachbarn bleibt am Leben
- Eine lebende Zelle mit weniger als 2 Nachbarn stirbt
- Eine lebende Zelle mit mehr als 3 Nachbarn stirbt
- Eine tote Zelle mit genau 3 Nachbarn wird lebendig

## Bedienung

### Steuerelemente

- Start/Stop: Startet oder stoppt die Simulation
- Step: Einen Schritt vorwärts
- Renew: Erzeugt ein neues zufälliges Gitter
- Clear: Leert das Gitter

### Mit der Maus spielen

Klicke auf eine beliebige Zelle, um sie zwischen lebendig (schwarz) und tot (weiß) umzuschalten. Das funktioniert auch während die Simulation läuft.

## Aufbau

- index.html - HTML-Struktur mit Canvas und Steuerelementen
- script.js - Spiellogik und Animationsschleife
- style.css - Gestaltung und Layout
- vercel.json - Vercel-Konfiguration

## Technische Details

Das Gitter hat eine Größe von 60x60 Zellen. Jede Zelle ist 10 Pixel groß. Das Gitter wickelt sich am Rand um (toroide Topologie).

Die Implementierung nutzt Change Detection und zeichnet nur lebende Zellen, um die Performance zu optimieren.
