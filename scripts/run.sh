#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -x .runtime/node/bin/node ]; then echo 'Bitte zuerst scripts/install.sh ausführen.' >&2; exit 1; fi
export PATH="$PWD/.runtime/node/bin:$PATH"
exec node scripts/clip.mjs "$@"
