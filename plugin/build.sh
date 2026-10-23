#!/usr/bin/env bash
# Baut das Plugin, packt die ZIP nach dist/ und trägt die Version samt MD5 in manifest.json ein.
# Aufruf: ./build.sh [Version] [Änderungstext]   z. B. ./build.sh 1.0.1.0 "Kleinere Korrekturen"
set -euo pipefail

cd "$(dirname "$0")"
VERSION="${1:-$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' src/Jellyfin.Plugin.Bilder/Jellyfin.Plugin.Bilder.csproj)}"
CHANGELOG="${2:-Erste Fassung: Interpretenfotos von Deezer, Albumcover von Deezer und Apple.}"
TARGET_ABI="10.11.0.0"
REPO_RAW="https://raw.githubusercontent.com/Melonemyname/jellyfintheme/main/plugin"
ZIP="jellyfin-plugin-bilder_${VERSION}.zip"

# .NET 9 aus der Homebrew-Formel dotnet@9 (keg-only), falls dotnet nicht im PATH steht
if ! command -v dotnet >/dev/null 2>&1 && [ -x /opt/homebrew/opt/dotnet@9/bin/dotnet ]; then
  export DOTNET_ROOT=/opt/homebrew/opt/dotnet@9/libexec
  export PATH="/opt/homebrew/opt/dotnet@9/bin:$PATH"
fi
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

dotnet publish src/Jellyfin.Plugin.Bilder -c Release -o "$OUT/publish" \
  -p:Version="$VERSION" -p:AssemblyVersion="$VERSION" -p:FileVersion="$VERSION"

# Nur die eigene DLL; alles andere bringt Jellyfin selbst mit.
mkdir -p dist
rm -f "dist/$ZIP"
(cd "$OUT/publish" && zip -X -q "$OLDPWD/dist/$ZIP" Jellyfin.Plugin.Bilder.dll)
unzip -l "dist/$ZIP"

MD5="$(md5 -q "dist/$ZIP" 2>/dev/null || md5sum "dist/$ZIP" | cut -d' ' -f1)"
python3 - "$VERSION" "$CHANGELOG" "$TARGET_ABI" "$REPO_RAW/dist/$ZIP" "$MD5" <<'PY'
import json, sys, datetime
version, changelog, abi, url, md5 = sys.argv[1:6]
path = "manifest.json"
data = json.load(open(path, encoding="utf-8"))
plugin = data[0]
entry = {
    "version": version,
    "changelog": changelog,
    "targetAbi": abi,
    "sourceUrl": url,
    "checksum": md5,
    "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
}
plugin["versions"] = [v for v in plugin.get("versions", []) if v.get("version") != version]
plugin["versions"].insert(0, entry)
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"manifest.json: {version}  md5 {md5}")
PY
