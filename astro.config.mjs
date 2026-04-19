import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// The @astrojs/cloudflare adapter writes dist/server/wrangler.json with a mix
// of Workers-only fields and Pages fields. Cloudflare Pages validates it as a
// Pages config and rejects Workers-only keys. This integration strips them so
// only Pages-compatible bindings (kv_namespaces, compatibility_date, etc.) remain.
//
// Fields removed:
//   main, rules, no_bundle — Workers-specific; Pages uses _worker.js by convention
//   assets              — Pages serves static assets automatically
//   pages_build_output_dir — already in root wrangler.toml; duplicate causes conflict
//   triggers:{}         — invalid; Wrangler requires { crons:[] } or absent
//   kv_namespaces without "id" — auto-added SESSION binding with no real namespace
const sanitizeServerWranglerJson = {
  name: 'sanitize-server-wrangler-json',
  hooks: {
    'astro:build:done': () => {
      const p = resolve('dist/server/wrangler.json');
      if (!existsSync(p)) return;

      const cfg = JSON.parse(readFileSync(p, 'utf-8'));

      // Remove Workers-only fields Pages doesn't allow
      for (const key of ['main', 'rules', 'no_bundle', 'assets', 'pages_build_output_dir']) {
        delete cfg[key];
      }

      // Remove triggers:{} — Wrangler requires { crons:[] } or absent
      if (cfg.triggers !== undefined && !Array.isArray(cfg.triggers?.crons)) {
        delete cfg.triggers;
      }

      // Remove KV namespace stubs that have no "id" (e.g. the auto-added SESSION binding)
      if (Array.isArray(cfg.kv_namespaces)) {
        cfg.kv_namespaces = cfg.kv_namespaces.filter(
          (kv) => typeof kv.id === 'string' && kv.id.length > 0,
        );
        if (cfg.kv_namespaces.length === 0) delete cfg.kv_namespaces;
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
