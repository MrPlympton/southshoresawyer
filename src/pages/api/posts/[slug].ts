export const prerender = false;
import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const dataPath = resolve('src/data/posts.json');

export const PUT: APIRoute = async ({ params, request }) => {
  const posts = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const updated = await request.json();
  const idx = posts.findIndex((p: any) => p.slug === params.slug);
  if (idx === -1) return new Response('Not found', { status: 404 });
  posts[idx] = updated;
  writeFileSync(dataPath, JSON.stringify(posts, null, 2));
  return new Response(JSON.stringify(updated));
};

export const DELETE: APIRoute = async ({ params }) => {
  let posts = JSON.parse(readFileSync(dataPath, 'utf-8'));
  posts = posts.filter((p: any) => p.slug !== params.slug);
  writeFileSync(dataPath, JSON.stringify(posts, null, 2));
  return new Response(null, { status: 204 });
};
