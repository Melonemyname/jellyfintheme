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
4. **Empfohlen: automatische Updates für dieses Plugin abschalten** (siehe unten).

### Automatische Updates abschalten

Jellyfin installiert neue Plugin-Versionen von sich aus (geplante Aufgabe „Plugins
aktualisieren“, beim Start und alle 24 Stunden). Für ein Plugin, das aus einem einzelnen GitHub-Repo
kommt, heißt das: Jeder Push, der eine neue Version ins Manifest schreibt, landet ungesehen auf deinem
Server. Besser ist es, Updates bewusst von Hand zu holen.

Jellyfin 10.11 hat dafür keinen Schalter im Dashboard, wohl aber einen je Plugin in dessen
`meta.json`. Jellyfin anhalten, im Plugin-Ordner `"autoUpdate": true` auf `false` setzen,
Jellyfin starten. Bei einer Paketinstallation unter Linux:

```sh
sudo systemctl stop jellyfin
sudo sed -i 's/"autoUpdate": true/"autoUpdate": false/' \
  "/var/lib/jellyfin/plugins/Deezer & Apple Bilder_"*/meta.json
sudo systemctl start jellyfin
```

(In Docker liegt der Ordner unter `/config/plugins/`.) Nach einem Update von Hand legt
Jellyfin einen neuen Versionsordner an, dort steht wieder `true`; dann noch einmal setzen.
Alternativ das Repository nach der Installation wieder entfernen und nur für ein Update kurz
eintragen.

### Woher die ZIP kommt

Die Download-Adresse im Manifest zeigt nicht auf `main`, sondern auf den Commit, der die ZIP
enthält (`https://raw.githubusercontent.com/Melonemyname/jellyfintheme/<Commit>/plugin/dist/…`).
Unter dieser Adresse liegen für immer dieselben Bytes, eine veröffentlichte Version lässt sich
also nicht nachträglich austauschen. Jellyfin prüft die ZIP zusätzlich per MD5 (das Feld
`checksum` kennt in Jellyfin 10.11 nur MD5).

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

Für eine neue Version zuerst `<Version>`, `<AssemblyVersion>` und `<FileVersion>` in
`src/Jellyfin.Plugin.Bilder/Jellyfin.Plugin.Bilder.csproj` hochzählen. Dann im Ordner
`plugin/`, in dieser Reihenfolge:

```sh
./build.sh 1.0.1.0 "Was neu ist"   # 1. bauen, ZIP packen, Eintrag in manifest.json
git add dist/jellyfin-plugin-bilder_1.0.1.0.zip src && git commit && git push
                                   # 2. ZIP committen und pushen, manifest.json noch nicht
./build.sh --quelle 1.0.1.0        # 3. Download-Adresse auf den Commit aus Schritt 2 setzen
git add manifest.json && git commit && git push
                                   # 4. erst jetzt das Manifest
```

Schritt 1 baut im Release-Modus ohne Debug-Informationen (`DebugType=none`, `PathMap`), damit
keine lokalen Pfade in der DLL landen, und bricht ab, wenn doch `/Users/`, `/home/` oder `.pdb`
darin stehen. Er packt **nur** `Jellyfin.Plugin.Bilder.dll` nach
`dist/jellyfin-plugin-bilder_<Version>.zip` (alles Übrige bringt Jellyfin mit), mit festem
Zeitstempel, sodass ein zweiter Lauf dieselbe ZIP ergibt. In `manifest.json` trägt er Version,
Änderungstext, MD5 und Zeitstempel ein; die Download-Adresse enthält noch den Platzhalter
`ZIP-NOCH-NICHT-COMMITTET`, so darf das Manifest nicht ins Repo.

Schritt 3 sucht den Commit, der die ZIP zuletzt geändert hat, prüft, dass die ZIP dort
byte-gleich ist und der Commit auf `origin/main` liegt, und setzt die Adresse. Jellyfin sieht
die neue Version im Katalog, sobald GitHub das Manifest ausliefert (der Raw-Zwischenspeicher
hält etwa fünf Minuten).

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
