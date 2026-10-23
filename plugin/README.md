# Deezer & Apple Bilder (Jellyfin-Plugin)

Ein kleines Plugin für **Jellyfin 10.11**, das der Musikbibliothek zusätzliche Bildquellen gibt:

| Element | Quelle | Größe |
|---|---|---|
| Interpret (Foto) | Deezer | 1000 × 1000 |
| Album (Cover) | Deezer | 1000 × 1000 |
| Album (Cover) | Apple (iTunes-Katalog) | 3000 × 3000 |

Beide Dienste haben eine öffentliche Suche ohne API-Schlüssel. Das Plugin schickt nur den
Namen des Interpreten bzw. Album und Interpret dorthin und reicht die gefundenen Bildadressen an
Jellyfin weiter. Es lädt selbst keine Bilder vorab und bettet nichts ein; erst wenn ein Bild
ausgewählt wird, holt Jellyfin es ab.

## Installieren

1. In Jellyfin **Dashboard → Plugins → Repositorys** öffnen und ein neues Repository anlegen:
   - Name: `Deezer & Apple Bilder`
   - URL: `https://raw.githubusercontent.com/Melonemyname/jellyfintheme/main/plugin/manifest.json`
2. Im **Katalog** unter „Metadaten“ das Plugin **Deezer & Apple Bilder** installieren.
3. Jellyfin **neu starten** (Dashboard → Neu starten).

## Wo die Bilder auftauchen

**Von Hand:** Bei einem Interpreten oder Album im Menü **Bilder bearbeiten** wählen, dann die
Suche (Lupe) öffnen. In der Auswahl der Quellen stehen jetzt zusätzlich **Deezer** und bei
Alben auch **Apple Music**. Mehrere Treffer werden angeboten, der beste zuerst: exakt gleicher
Name vor Schreibweisen mit Zusatz („Remastered 2009“) vor Namen, die den gesuchten nur enthalten
(„Rob Halford“ bei „Halford“). So lässt sich das passende Bild direkt übernehmen, ohne es
einzeln hochzuladen. Dafür muss in den Bibliothekseinstellungen nichts eingeschaltet werden.

**Automatisch:** Wer die Bilder auch beim Einlesen und bei „Metadaten aktualisieren“ haben
will, schaltet sie in den Bibliothekseinstellungen ein: Dashboard → Bibliotheken → Musik
bearbeiten → bei **Musikinterpreten** bzw. **Musikalben** unter **Bildquellen** die Einträge
„Deezer“ und „Apple Music“ anhaken und in der Reihenfolge einsortieren. Jellyfin nimmt dann
jeweils den ersten Treffer der ersten Quelle, die etwas liefert. Neu hinzugekommene Quellen
sind bei bestehenden Bibliotheken zunächst aus.

## Verhalten und Grenzen

- **Abgleich:** Groß/klein, Akzente, Satzzeichen und ein führendes „The“ spielen keine Rolle
  („GHØSTKID“ findet „Ghostkid“). Bei Alben müssen Titel und Interpret passen, Zusätze in
  Klammern werden beim Vergleich ignoriert. Bei Interpreten reichen bloß ähnlich geschriebene
  Namen nicht, damit keine fremde Person mit ähnlichem Namen (etwa „Marc“ statt „Marcus“) als
  Foto landet.
- **Apple:** Fehlt ein Album im deutschen Store, wird einmal im US-Store nachgesehen. Apple
  liefert die Cover in 3000 × 3000; bei älteren Veröffentlichungen ist das unter Umständen eine
  hochgerechnete Fassung.
- **Deezer:** Einträge ohne eigenes Foto (Deezer zeigt dann ein graues Platzhalterbild) werden
  ausgelassen. Für manche Musiker gibt es deshalb schlicht nichts.
- **Höflich zu den Diensten:** eigener User-Agent, Zeitlimit 10 Sekunden je Anfrage, Abstand
  zwischen zwei Anfragen (Deezer 0,25 s, Apple 1 s), Zwischenspeicher für 30 Minuten. Fehler
  werden still verworfen, die Bildsuche zeigt dann einfach keine Treffer aus dieser Quelle.

## Einstellungen

Es gibt keine eigene Einstellungsseite. Wer etwas ändern will, findet die Werte nach dem
ersten Start in `plugins/configurations/Jellyfin.Plugin.Bilder.xml` im Jellyfin-Datenordner
(danach Jellyfin neu starten):

- `AppleCountry`: Store-Land für Apple, Standard `de`
- `MaxResults`: höchstens so viele Bilder je Quelle, Standard `10`

## Bauen

Voraussetzung ist das .NET 9 SDK. Auf dem Mac ohne Administratorrechte:

```sh
brew install dotnet@9
```

Dann im Ordner `plugin/`:

```sh
./build.sh                       # Version aus der .csproj
./build.sh 1.0.1.0 "Was neu ist" # neue Version
```

Das Skript baut im Release-Modus, packt **nur** `Jellyfin.Plugin.Bilder.dll` nach
`dist/jellyfin-plugin-bilder_<Version>.zip` (alles Übrige bringt Jellyfin mit) und trägt die
Version samt MD5-Prüfsumme, Zeitstempel und Download-Adresse in `manifest.json` ein. Danach
ZIP und `manifest.json` gemeinsam committen und pushen; Jellyfin sieht die neue Version im
Katalog, sobald GitHub sie ausliefert (der Raw-Zwischenspeicher hält etwa fünf Minuten).

Für eine neue Version außerdem `<Version>` in
`src/Jellyfin.Plugin.Bilder/Jellyfin.Plugin.Bilder.csproj` hochzählen.

### Ausprobieren ohne Jellyfin

```sh
dotnet run --project test/Bilder.Probe                       # feste Beispielnamen
dotnet run --project test/Bilder.Probe -- "Saxon" "Kreator"  # eigene Interpreten
```

Das Prüfprogramm testet den Namensabgleich, fragt Deezer und Apple für eine Reihe von Namen ab
und ruft die drei Anbieter so auf, wie Jellyfin es tut. Es gibt die gefundenen Bildadressen aus.

## Aufbau

```
plugin/
├── manifest.json                 Repository-Liste für Jellyfins Katalog
├── build.sh                      Bauen, packen, manifest.json fortschreiben
├── dist/                         fertige ZIPs (werden mit eingecheckt)
├── src/Jellyfin.Plugin.Bilder/
│   ├── Plugin.cs                 Plugin mit fester GUID 3287719a-c59e-4b46-8f7a-8ba59429ee74
│   ├── Configuration/            Einstellungen
│   ├── Providers/                die drei IRemoteImageProvider für Jellyfin
│   └── Search/                   Abfragen, Abgleich, Drosselung (ohne Jellyfin-Abhängigkeit)
└── test/Bilder.Probe/            Prüfprogramm
```

Gebaut gegen die NuGet-Pakete `Jellyfin.Controller` und `Jellyfin.Model` 10.11.0 für
`net9.0`, `targetAbi` 10.11.0.0, läuft damit auf jeder Jellyfin-Version 10.11.x.
