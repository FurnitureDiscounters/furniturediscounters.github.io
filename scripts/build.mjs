import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
await rm('assets/dist', { recursive: true, force: true });
await mkdir('assets/dist', { recursive: true });
await build({
  entryPoints: ['assets/js/shared.js', 'assets/js/home.js', 'assets/js/store.js', 'assets/js/order.js'],
  bundle: true, splitting: true, format: 'esm', outdir: 'assets/dist',
  external: ['../firebase-config.js'], target: ['es2022'], minify: true,
  legalComments: 'linked', logLevel: 'info'
});
