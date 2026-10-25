# ElegantFin-Werkstatt für Jellyfin

Ein Aufsatz auf das Theme [ElegantFin](https://github.com/lscambo13/ElegantFin) für
Jellyfin 10.11: einheitliche Knöpfe und Regler, klassischer Darkmode mit wählbarer
Grundfarbe, Akzentfarbe pro Person, überarbeiteter Player am Rechner und am Handy, eine
große Ansicht mit mitlaufendem Songtext und vieles mehr. Standard-Akzentfarbe ist Orange.

Das Repo enthält nur das fertige Theme, zwei Dateien:

| Datei | Wofür |
|---|---|
| `elegantfin-werkstatt.css` | das Aussehen, kommt als `@import` ins Feld „Benutzerdefiniertes CSS“ |
| `elegantfin-werkstatt.js` | die Teile, die ein Skript brauchen (Ziehen, Wischen, Farbwähler, große Ansicht …), über das Plugin JavaScript Injector |

Das CSS funktioniert auch allein. Ohne das Skript fehlen nur die mit „Skript“ markierten
Funktionen unten.

## Einbinden

### 1. CSS

Dashboard → **Branding** → **Benutzerdefinierter CSS-Code**, genau diese zwei Zeilen, in
dieser Reihenfolge (erst ElegantFin, dann der Aufsatz):

```css
@import url("https://cdn.jsdelivr.net/gh/lscambo13/ElegantFin@main/Theme/ElegantFin-jellyfin-theme-build-latest-minified.css");
@import url("https://cdn.jsdelivr.net/gh/Melonemyname/jellyfintheme@main/elegantfin-werkstatt.css");
```

Speichern, Seite neu laden.

### 2. Skript (optional, empfohlen)

1. Dashboard → **Plugins** → Katalog → **JavaScript Injector** installieren und Jellyfin
   neu starten.
2. Im Plugin einen Eintrag anlegen, „Requires Authentication“ an, und diesen Lader
   einfügen:

```js
(function () {
    var id = 'elegantfin-werkstatt-js';
    if (document.getElementById(id)) return;
    var s = document.createElement('script');
    s.id = id;
    s.src = 'https://cdn.jsdelivr.net/gh/Melonemyname/jellyfintheme@main/elegantfin-werkstatt.js';
    s.onerror = function () { console.warn('ElegantFin-Werkstatt: Skript ließ sich nicht laden:', s.src); };
    (document.head || document.documentElement).appendChild(s);
})();
```

3. Speichern, Seite neu laden. Am Handy die App einmal ganz schließen.

### Hinweise

- jsDelivr hält `@main` bis zu zwölf Stunden im Zwischenspeicher. Wer einen festen Stand
  will, ersetzt `@main` durch einen Commit-Hash.
- Akzent- und Grundfarbe stellt jede Person selbst ein: Einstellungen → **Anzeige**, ganz
  oben „Theme-Farbe“ (braucht das Skript).
- Die helle Fassung von ElegantFin bleibt unverändert, der Aufsatz gilt für die dunklen
  Designs.

## Was der Aufsatz ändert

- Gleiche Bausteine sehen überall gleich aus
- Ecken beim Überfahren des Abspielknopfs
- Titel statt „?“ bei fehlendem Bild
- Kein „Medien löschen“ in Jellyfin
- Kein „Link zum Stream kopieren“
- Abspielknöpfe überall gleich
- Buchstaben-Springer als Reihe über dem Raster *(Skript)*
- Bibliotheken: Seitenanzeige unten weg
- Rechner: kein Nachfedern beim Scrollen
- Listen: Abspielknopf zu den Knöpfen rechts
- Albumseite: Titelnummer wird beim Überfahren zum Abspielknopf *(Skript)*
- Folgenliste: Abspielknopf unten links (Handy: bei den Knöpfen rechts)
- Detailseite: Inhalt als dunkles Milchglas über dem Film
- Kopfzeile wird beim Scrollen deckend und läuft weich aus *(Skript)*
- Listen: Gesehen-Status am Haken-Knopf statt auf dem Cover
- Folgenliste: Gesehen-Haken wie auf den Karten
- Klassischer Darkmode statt Blaugrau
- Bibliothek: ohne „Alles abspielen“ und „Zufall“ (außer Musik)
- Serien: Staffelzahl im Zähler *(Skript)*
- Handy: „Meine Medien“ zweispaltig
- Seitenmenü ohne harte Kante
- Detailseite: „Mehr anzeigen“ und Links gut lesbar
- Handy: Kopfzeile der Detailseite mit Acryl wie überall
- Handy: Knöpfe färben sich beim Antippen nicht um
- Kapitelmarken beim Überfahren und Ziehen *(Skript)*
- Zeitleisten: Füllung folgt beim Ziehen *(Skript)*
- Zeitleisten gleiten statt zu springen *(Skript)*
- Kapitelabschnitt unter dem Zeiger dicker *(Skript)*
- Blaue Reste im Player in Akzentfarbe
- Player-Knöpfe: Play/Pause wie alle anderen
- Wiedergabe-Knöpfe groß in der Bildmitte
- „Endet um“ im Player weg
- Herz (Favorit) im Player weg
- Lautstärke als aufklappender, senkrechter Regler *(Skript)*
- Untertitel und Tonspur im Einstellungsmenü *(Skript)*
- Zeit rechts: Klick wechselt Restzeit und Länge *(Skript)*
- „Wiedergabeinformationen“ aus dem Menü
- Musikleiste: Wiederholen, Zurück, Pause, Weiter, Zufall *(Skript)*
- Wiedergabeseite: Knöpfe wie in der Musikleiste
- Warteschlange: Cover bleibt, Titel in Akzentfarbe statt Equalizer *(Skript)*
- Desktop: kleine Blasen über den Reglern im Player
- Desktop: Speichern-Knopf der Wiedergabeliste weg
- Desktop: Knopf zum Schließen der Wiedergabeseite *(Skript)*
- Handy: Menüs und „Als Nächstes“ als Sheet unten
- Handy: kleineres Vorschaubild beim Ziehen
- Handy: kleinerer „Vorspann überspringen“-Knopf
- Handy: Musikleiste als schwebende Karte mit allen Knöpfen
- Wiedergabeseite: Player bleibt beim Scrollen stehen *(Skript)*
- Handy: Fortschritt im Miniplayer *(Skript)*
- Handy: Player, Wiedergabeliste und Songtexte als Karten, die hochfahren *(Skript)*
- Handy: Titel aus der Wiedergabeliste wischen *(Skript)*
- Theme-Farbe und Grundfarbe pro Benutzer wählen *(Skript)*
- Musik nach einem Neustart weiterhören *(Skript)*
- Zufall mit „Alle wiederholen“: jede Runde neu mischen *(Skript)*
- Desktop: Vollbild für Musik (große Ansicht) *(Skript)*
- Bibliotheken: weniger Reiter, eigene Reihenfolge *(Skript)*
- Serien, Reiter „Folgen“: Überschriften je Serie und Staffel *(Skript)*
- Musik, Reiter „Lieder“ volle Breite, „Genres“ linksbündig
- Musik, Reiter „Lieder“ und „Genres“: Ansicht wählbar, saubere Genre-Bilder *(Skript)*
- Musik: Abspielen und Zufall auf allen Reitern und Unterseiten *(Skript)*

## Lizenz und Herkunft

Baut auf [ElegantFin](https://github.com/lscambo13/ElegantFin) von lscambo13 auf, das per
`@import` geladen wird und nicht Teil dieses Repos ist. Klassen und Aufbau stammen aus
[jellyfin-web](https://github.com/jellyfin/jellyfin-web).
