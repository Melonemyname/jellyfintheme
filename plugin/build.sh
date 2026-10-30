#!/usr/bin/env bash
# Baut das Plugin, packt die ZIP nach dist/ und trägt die Version in manifest.json ein.
#
# Zwei Schritte, weil die Download-Adresse auf einen festen Commit zeigt (nicht auf main):
#   ./build.sh [Version] [Änderungstext]   bauen, ZIP packen, Eintrag in manifest.json anlegen
#                                          (Version, Änderungstext, MD5, Zeitstempel)
#   ... ZIP committen und pushen ...
#   ./build.sh --quelle [Version]          sourceUrl auf den Commit setzen, der die ZIP enthält
#   ... manifest.json committen und pushen ...
#
# Beispiel: ./build.sh 1.0.1.0 "Kleinere Korrekturen"
set -euo pipefail

cd "$(dirname "$0")"
CSPROJ=src/Jellyfin.Plugin.Bilder/Jellyfin.Plugin.Bilder.csproj
REPO_RAW="https://raw.githubusercontent.com/Melonemyname/jellyfintheme"
# Platzhalter, solange die ZIP noch nicht committet ist. So darf manifest.json nicht ins Repo.
PLATZHALTER="ZIP-NOCH-NICHT-COMMITTET"
TARGET_ABI="10.11.0.0"

MODUS=bauen
if [ "${1:-}" = "--quelle" ]; then MODUS=quelle; shift; fi

VERSION="${1:-$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' "$CSPROJ")}"
CHANGELOG="${2:-}"
ZIP="jellyfin-plugin-bilder_${VERSION}.zip"

# Jellyfin 10.11 prüft die Download-Datei nur per MD5 (InstallationManager), eine andere
# Prüfsumme kennt das Feld "checksum" nicht.
md5_stdin() { md5 -q 2>/dev/null || md5sum | cut -d' ' -f1; }

# ---------------------------------------------------------------- --quelle
if [ "$MODUS" = quelle ]; then
    [ -f "dist/$ZIP" ] || { echo "dist/$ZIP fehlt, erst ./build.sh $VERSION \"Text\""; exit 1; }
    PFAD="plugin/dist/$ZIP"
    # Jüngster Commit, der die ZIP angelegt oder geändert hat
    SHA="$(git log -1 --format=%H -- "dist/$ZIP")"
    [ -n "$SHA" ] || { echo "dist/$ZIP ist noch nicht committet. Erst die ZIP committen und pushen."; exit 1; }
    MD5_LOKAL="$(md5_stdin < "dist/$ZIP")"
    MD5_COMMIT="$(git show "$SHA:$PFAD" | md5_stdin)"
    if [ "$MD5_LOKAL" != "$MD5_COMMIT" ]; then
        echo "dist/$ZIP weicht vom Stand in $SHA ab (neu gebaut, aber nicht committet?)."
        exit 1
    fi
    if ! git merge-base --is-ancestor "$SHA" origin/main 2>/dev/null; then
        echo "Hinweis: $SHA steht noch nicht auf origin/main. Vor dem Commit der manifest.json pushen,"
        echo "sonst liefert GitHub die ZIP unter der neuen Adresse nicht aus."
    fi
    python3 - "$VERSION" "$REPO_RAW/$SHA/$PFAD" "$MD5_COMMIT" <<'PY'
import json, sys
version, url, md5 = sys.argv[1:4]
path = "manifest.json"
data = json.load(open(path, encoding="utf-8"))
eintraege = [v for v in data[0]["versions"] if v.get("version") == version]
if not eintraege:
    sys.exit(f"manifest.json hat keinen Eintrag für {version}, erst ./build.sh {version} \"Text\"")
e = eintraege[0]
if e["checksum"].lower() != md5.lower():
    sys.exit(f"MD5 im Manifest ({e['checksum']}) passt nicht zur committeten ZIP ({md5}).")
e["sourceUrl"] = url
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"manifest.json: {version}  sourceUrl {url}")
PY
    exit 0
fi

# ---------------------------------------------------------------- bauen
# .NET 9 aus der Homebrew-Formel dotnet@9 (keg-only), falls dotnet nicht im PATH steht
if ! command -v dotnet >/dev/null 2>&1 && [ -x /opt/homebrew/opt/dotnet@9/bin/dotnet ]; then
  export DOTNET_ROOT=/opt/homebrew/opt/dotnet@9/libexec
  export PATH="/opt/homebrew/opt/dotnet@9/bin:$PATH"
fi
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

# Ohne Debug-Informationen und mit neutralen Pfaden: sonst steht der lokale Pfad zur .pdb
# (/Users/…) in der veröffentlichten DLL.
dotnet publish src/Jellyfin.Plugin.Bilder -c Release -o "$OUT/publish" \
  -p:Version="$VERSION" -p:AssemblyVersion="$VERSION" -p:FileVersion="$VERSION" \
  -p:DebugType=none -p:DebugSymbols=false -p:Deterministic=true \
  -p:PathMap="$PWD=/_/"

DLL="$OUT/publish/Jellyfin.Plugin.Bilder.dll"
if LC_ALL=C grep -a -q -e '/Users/' -e '/home/' -e '\.pdb' "$DLL"; then
    echo "Die DLL enthält noch einen lokalen Pfad oder Verweis auf eine .pdb:"
    LC_ALL=C strings "$DLL" | grep -e '/Users/' -e '/home/' -e '\.pdb' || true
    exit 1
fi

# Nur die eigene DLL; alles andere bringt Jellyfin selbst mit. Fester Zeitstempel in der ZIP,
# damit ein zweiter Lauf dieselbe ZIP (und dieselbe MD5) ergibt.
touch -t 202001010000 "$DLL"
mkdir -p dist
rm -f "dist/$ZIP"
(cd "$OUT/publish" && zip -X -q "$OLDPWD/dist/$ZIP" Jellyfin.Plugin.Bilder.dll)
unzip -l "dist/$ZIP"

MD5="$(md5_stdin < "dist/$ZIP")"
python3 - "$VERSION" "$CHANGELOG" "$TARGET_ABI" "$REPO_RAW/$PLATZHALTER/plugin/dist/$ZIP" "$MD5" <<'PY'
import json, sys, datetime
version, changelog, abi, url, md5 = sys.argv[1:6]
path = "manifest.json"
data = json.load(open(path, encoding="utf-8"))
plugin = data[0]
alt = next((v for v in plugin.get("versions", []) if v.get("version") == version), None)
if not changelog:
    if alt is None:
        sys.exit(f"Für die neue Version {version} bitte einen Änderungstext angeben: ./build.sh {version} \"Text\"")
    changelog = alt["changelog"]
# Gleiche ZIP wie im Eintrag: Adresse und Zeitstempel behalten (sonst stünde wieder der Platzhalter drin)
if alt is not None and alt.get("checksum", "").lower() == md5.lower():
    url, stempel = alt["sourceUrl"], alt["timestamp"]
else:
    stempel = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
entry = {
    "version": version,
    "changelog": changelog,
    "targetAbi": abi,
    "sourceUrl": url,
    "checksum": md5,
    "timestamp": stempel,
}
plugin["versions"] = [v for v in plugin.get("versions", []) if v.get("version") != version]
plugin["versions"].insert(0, entry)
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"manifest.json: {version}  md5 {md5}")
PY

if grep -q "$PLATZHALTER" manifest.json; then
    echo
    echo "Weiter so (manifest.json noch NICHT committen, sie enthält einen Platzhalter):"
    echo "  1. dist/$ZIP committen und pushen"
    echo "  2. ./build.sh --quelle $VERSION"
    echo "  3. manifest.json committen und pushen"
fi
