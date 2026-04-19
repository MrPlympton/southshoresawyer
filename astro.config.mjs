import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// The @astrojs/cloudflare adapter writes dist/server/wrangler.json with two
// fields that break Cloudflare Pages deployment:
//   1. kv_namespaces entry { binding:"SESSION" } with no "id" (auto-injected
//      session binding we don't use)
//   2. triggers:{} — invalid; Wrangler requires { crons:[] } or absent
// This integration sanitises the file after the build completes.
const sanitizeServerWranglerJson = {
  name: 'sanitize-server-wrangler-json',
  hooks: {
    'astro:build:done': () => {
      const p = resolve('dist/server/wrangler.json');
      if (!existsSync(p)) return;

      const cfg = JSON.parse(readFileSync(p, 'utf-8'));

      // Remove KV namespace stubs that have no "id" (the auto-added SESSION binding)
      if (Array.isArray(cfg.kv_namespaces)) {
        cfg.kv_namespaces = cfg.kv_namespaces.filter((kv) => typeof kv.id === 'string' && kv.id.length > 0);
        if (cfg.kv_namespaces.length === 0) delete cfg.kv_namespaces;
      }

      // Remove triggers:{} — invalid; Wrangler requires { crons:[] } or absent
      if (cfg.triggers !== undefined && !Array.isArray(cfg.triggers?.crons)) {
        delete cfg.triggers;
      }

      writeFileSync(p, JSON.stringify(cfg, null, 2));
    },
  },
};

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile', // use Vite's image pipeline; avoids adding an IMAGES binding
  }),
  site: 'https://southshoresawyer.com',
  integrations: [tailwind(), sitemap(), sanitizeServerWranglerJson],
});
