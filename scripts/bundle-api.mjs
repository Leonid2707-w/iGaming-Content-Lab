import * as esbuild from 'esbuild'
import { mkdirSync } from 'node:fs'

mkdirSync('api', { recursive: true })

await esbuild.build({
  entryPoints: ['server/src/vercel-handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  // Catch-all keeps /api/* path intact for Hono (no rewrite stripping).
  outfile: 'api/[[...route]].mjs',
  sourcemap: false,
  logLevel: 'info',
  packages: 'bundle',
  banner: {
    js: `
import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirnameFn } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirnameFn(__filename);
`.trim(),
  },
})

console.log('[bundle-api] wrote api/[[...route]].mjs')
