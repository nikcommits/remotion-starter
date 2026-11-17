#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .work/logs .runtime public/jobs out
LOG=".work/logs/install.log"
exec > >(tee -a "$LOG") 2>&1
trap 'echo "Installation unterbrochen oder fehlgeschlagen. Diagnose: $PWD/$LOG. Nach Behebung erneut starten."' ERR
[ "$(uname -s)" = Darwin ] || { echo 'Nur macOS wird unterstützt.'; exit 1; }
case "$(uname -m)" in
 arm64) ARCH=arm64; SHA=e9404633bc02a5162c5c573b1e2490f5fb44648345d64a958b17e325729a5e42;;
 x86_64) ARCH=x64; SHA=6698587713ab565a94a360e091df9f6d91c8fadda6d00f0cf6526e9b40bed250;;
 *) echo 'Diese Prozessorarchitektur wird nicht unterstützt.'; exit 1;;
esac
printf 'macOS %s, %s\n' "$(sw_vers -productVersion)" "$ARCH"
FREE=$(df -Pk . | awk 'NR==2 {print $4}')
[ "$FREE" -ge 8000000 ] || { echo 'Mindestens 8 GB freier Speicher für Installation und kurzen Test benötigt.'; exit 1; }
if ! xcode-select -p >/dev/null 2>&1 || ! xcrun --find clang >/dev/null 2>&1; then
 echo 'Apple Command Line Tools fehlen. Bitte auf diesem Mac xcode-select --install ausführen, den Dialog bestätigen und danach erneut starten.'; exit 1
fi
if ! xcrun clang --version >/dev/null 2>&1; then echo 'Apple-Build-Werkzeuge nicht nutzbar. Eventuell Xcode-Lizenz im Terminal bestätigen.'; exit 1; fi
NODE="$PWD/.runtime/node/bin/node"
if [ ! -x "$NODE" ] || [ "$("$NODE" -v)" != v22.14.0 ]; then
 NAME="node-v22.14.0-darwin-$ARCH"
 rm -f ".runtime/$NAME.tar.gz.part"
 curl -fL --retry 3 "https://nodejs.org/dist/v22.14.0/$NAME.tar.gz" -o ".runtime/$NAME.tar.gz.part"
 ACTUAL=$(shasum -a 256 ".runtime/$NAME.tar.gz.part" | awk '{print $1}')
 [ "$ACTUAL" = "$SHA" ] || { echo 'Node-Prüfsumme stimmt nicht.'; exit 1; }
 rm -rf .runtime/node-new
 mkdir -p .runtime/node-new
 tar -xzf ".runtime/$NAME.tar.gz.part" -C .runtime/node-new --strip-components 1
 rm -rf .runtime/node-old
 [ ! -d .runtime/node ] || mv .runtime/node .runtime/node-old
 mv .runtime/node-new .runtime/node
 rm -rf .runtime/node-old ".runtime/$NAME.tar.gz.part"
fi
export PATH="$PWD/.runtime/node/bin:$PATH"
if [ ! -f .runtime/npm-ready ] || [ ! -x node_modules/.bin/remotion ]; then
 npm ci --no-audit --no-fund
 shasum -a 256 package-lock.json > .runtime/npm-ready
elif ! shasum -a 256 -c .runtime/npm-ready >/dev/null 2>&1; then
 echo 'Lockfile geändert; Abhängigkeiten werden aktualisiert.'; npm ci --no-audit --no-fund; shasum -a 256 package-lock.json > .runtime/npm-ready
fi
FONT='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
[ -f "$FONT" ] || { echo 'Arial Bold fehlt. Bitte eine lokal lizenzierte Arial-Bold-Datei als public/wisam-arial-bold.ttf bereitstellen.'; [ -f public/wisam-arial-bold.ttf ] || exit 1; }
[ -f public/wisam-arial-bold.ttf ] || cp "$FONT" public/wisam-arial-bold.ttf
node scripts/setup-whisper.mjs
node_modules/.bin/remotion browser ensure
node scripts/doctor.mjs
printf '\nInstallation abgeschlossen. Jetzt Beispieltest: scripts/run.sh example\n'
