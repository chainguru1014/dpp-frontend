# /design-sync notes — Yometel DPP admin site

Project: "Yometel DPP Admin" (claude.ai/design), projectId in config.json.

## How this repo syncs
- CRA app, no Storybook, no package build: `.design-sync/build-ds.mjs` (the
  `buildCmd`) bundles `.design-sync/kit/index.js` with esbuild (JSX in .js,
  images inlined, `process.env` defined empty so REACT_APP_* fall back to the
  hosted defaults) into `.design-sync/.cache/pkg`, plus tsc declarations
  (allowJs, loosely typed). Then the converter runs on that package:
  `bash .design-sync/sync.sh` with `DS_NODE` set to a Node 20 binary (on this
  PC `$APPDATA/nvm/v20.18.1/node.exe`).
- Final/driver run: `node .design-sync/build-ds.mjs` then
  `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.design-sync/.cache/pkg/dist/index.js --out ./ds-bundle [--remote .design-sync/.cache/remote-sync.json]`.
- `.ds-sync` needs `typescript` installed next to esbuild/ts-morph/playwright
  (the build script runs tsc from there).
- React stays external via the `react-external` wrapper plugin (CommonJS deps
  require('react')).
- `kit/icons.js` re-exports every MUI icon the site imports (collected by a
  one-off scan of src/); refresh it when pages start using new icons.
  Exported as the `Icons` namespace, excluded from cards with the MUI parts
  via `componentSrcMap: null`.
- Poppins comes from Google Fonts: `.design-sync/fonts.css` is copied into the
  package and set as `cssEntry` (cssEntry must live inside the package).
- QR components take `identifer` as `{ type, serial }[]` (not a string);
  hand-written contracts in `config.dtsPropsFor`.
- Groups come from `docsMap` stubs in `.design-sync/groups/*.md`.

## Left out on purpose
- PrintModal / PrintDialog: `@react-pdf/renderer` resolves Node builds (fs,
  zlib, stream) and won't bundle for the browser. Stat (its figure tile) ships.
- RegisterIdentifierPanel: needs AuthProvider + live API.
- The admin page shell (AppBar + Drawer) lives inside pages/index.js, not a
  reusable component; designs compose it from the exported MUI AppBar/Drawer.

## Floor cards (not authored)
- GlobalLoadingBar: only shows while axios requests are in flight.

## Re-sync risks
- Previews load product photos from the live API (api.innosynch.com/files/...,
  demo "Shirt Jacket"); deleting those files empties the photo cells.
- The admin theme (src/theme.js) is the whole look; theme edits change every
  card but don't invalidate grades — eyeball the contact sheets after one.
- `process.env` is defined as `{}` in the bundle: anything reading a
  REACT_APP_* variable gets its hard-coded default (hosted URLs).
