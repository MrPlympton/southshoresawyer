import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Cloudflare Pages reserves the 'ASSETS' binding name. The @astrojs/cloudflare
// adapter auto-injects it into dist/server/.prerender/wrangler.json, which
// causes a build error. This integration strips it out after the build — Pages
// provides the ASSETS binding automatically at runtime without a declaration.
const stripPagesAssetsBinding = {
  name: 'strip-pages-assets-binding',
  hooks: {
    'astro:build:done': () => {
      const configPath = resolve('dist/server/.prerender/wrangler.json');
      if (!existsSync(configPath)) return;
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.assets) {
        delete config.assets;
        writeFileSync(configPath, JSON.stringify(config, null, 2));
      }
    },
  },
};

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://southshoresawyer.com',
  integrations: [tailwind(), sitemap(), stripPagesAssetsBinding],
});
