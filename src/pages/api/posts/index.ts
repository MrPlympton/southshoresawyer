export const prerender = false;
import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const dataPath = resolve('src/data/posts.json');

export const GET: APIRoute = async () => {
  const posts = JSON.parse(readFileSync(dataPath, 'utf-8'));
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const post = await request.json();
  const posts = JSON.parse(readFileSync(dataPath, 'utf-8'));
  posts.unshift(post);
  writeFileSync(dataPath, JSON.stringify(posts, null, 2));
  return new Response(JSON.stringify(post), { status: 201 });
};
