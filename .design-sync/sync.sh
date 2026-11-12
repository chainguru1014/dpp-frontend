#!/usr/bin/env bash
# Pre-build + converter for /design-sync (run from the app root).
set -e
N="${DS_NODE:-node}"
"$N" .design-sync/build-ds.mjs
"$N" .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --entry ./.design-sync/.cache/pkg/dist/index.js --out ./ds-bundle "$@"
