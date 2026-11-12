#!/usr/bin/env node
// Builds the admin site's shared components as a package for /design-sync
// (Claude Design). The site is a CRA app (JSX in .js, process.env.REACT_APP_*,
// imported images), so esbuild mirrors what react-scripts does. Output
// (gitignored): .design-sync/.cache/pkg/{package.json, dist/index.js, types/**}
// Run from the frontend root:  node .design-sync/build-ds.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const require = createRequire(join(ROOT, '.ds-sync', 'package.json'));
const esbuild = require('esbuild');

const PKG = join(ROOT, '.design-sync', '.cache', 'pkg');
rmSync(PKG, { recursive: true, force: true });
mkdirSync(join(PKG, 'dist'), { recursive: true });

const plugins = [
  {
    // React stays external (the converter maps it to the page's one React),
    // but CommonJS packages require() it - route every react import through a
    // tiny ESM wrapper whose own import is the external one.
    name: 'react-external',
    setup(b) {
      const filter = /^react(-dom)?(\/.*)?$/;
      b.onResolve({ filter }, (a) => (a.namespace === 'react-wrap'
        ? { path: a.path, external: true }
        : { path: a.path, namespace: 'react-wrap' }));
      b.onLoad({ filter: /.*/, namespace: 'react-wrap' }, (a) => ({
        contents: `import * as M from '${a.path}';\nexport * from '${a.path}';\nexport default (M.default ?? M);\n`,
        loader: 'js',
      }));
    },
  },
];

await esbuild.build({
  entryPoints: [join(ROOT, '.design-sync', 'kit', 'index.js')],
  outfile: join(PKG, 'dist', 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  nodePaths: [join(ROOT, 'node_modules')],
  mainFields: ['browser', 'module', 'main'],
  loader: { '.js': 'jsx', '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.svg': 'dataurl', '.gif': 'dataurl' },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': '{}',
    global: 'globalThis',
  },
  plugins,
  logLevel: 'warning',
  legalComments: 'none',
});

// Declarations from the JS sources (allowJs). Props come out loosely typed;
// config.dtsPropsFor carries the hand-written contracts.
const tsc = join(ROOT, '.ds-sync', 'node_modules', 'typescript', 'bin', 'tsc');
try {
  execFileSync(process.execPath, [tsc, '-p', join(ROOT, '.design-sync', 'tsconfig.ds.json')], { stdio: 'pipe' });
} catch (e) {
  const msg = String(e.stdout || '').split('\n').filter((l) => /error TS/.test(l));
  if (msg.length) console.error(`  tsc: ${msg.length} type error(s) reported (declarations still emitted)`);
}
const types = 'types/.design-sync/kit/index.d.ts';
if (!existsSync(join(PKG, types))) {
  console.error(`! declarations missing at ${types}`);
  process.exit(1);
}

// The Poppins web font import (config.cssEntry must live in the package).
copyFileSync(join(ROOT, '.design-sync', 'fonts.css'), join(PKG, 'fonts.css'));

writeFileSync(join(PKG, 'package.json'), JSON.stringify({
  name: '@yometel/dpp-admin',
  version: '1.0.0',
  private: true,
  module: 'dist/index.js',
  main: 'dist/index.js',
  types,
}, null, 2) + '\n');
console.error(`built ${resolve(PKG)}`);
