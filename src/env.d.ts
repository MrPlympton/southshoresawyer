/// <reference types="astro/client" />

interface Env {
  BLOG_KV: KVNamespace;
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
