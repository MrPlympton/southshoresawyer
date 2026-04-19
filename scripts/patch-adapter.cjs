#!/usr/bin/env node
// Patches @astrojs/cloudflare so it does NOT auto-inject an 'ASSETS' binding
// into the prerender wrangler.json. Cloudflare Pages reserves that name and
// rejects any config that explicitly defines it. The prerender entrypoint
// (server.js) never references env.ASSETS, so removing it is safe.
'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../node_modules/@astrojs/cloudflare/dist/wrangler.js');

if (!fs.existsSync(file)) {
  console.log('patch-adapter: @astrojs/cloudflare not installed yet, skipping');
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf-8');

if (src.includes('/* pages-assets-patch */')) {
  console.log('patch-adapter: already applied');
  process.exit(0);
}

// Replace the block that adds `assets: { binding: "ASSETS" }` with a no-op.
// The regex handles any whitespace between tokens for safety.
const patched = src.replace(
  /assets:\s*hasAssetsBinding\s*\?\s*void\s*0\s*:\s*\{\s*binding:\s*DEFAULT_ASSETS_BINDING_NAME\s*\}/,
  'assets: void 0 /* pages-assets-patch */'
);

if (patched === src) {
  console.log('patch-adapter: pattern not found — adapter may have changed, skipping');
  process.exit(0);
}

fs.writeFileSync(file, patched);
console.log('patch-adapter: removed auto-ASSETS binding from @astrojs/cloudflare ✓');
