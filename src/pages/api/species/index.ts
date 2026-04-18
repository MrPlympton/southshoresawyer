import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const dataPath = resolve('src/data/species.json');

export const GET: APIRoute = async () => {
  const species = JSON.parse(readFileSync(dataPath, 'utf-8'));
  return new Response(JSON.stringify(species), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const sp = await request.json();
  const species = JSON.parse(readFileSync(dataPath, 'utf-8'));
  species.push(sp);
  writeFileSync(dataPath, JSON.stringify(species, null, 2));
  return new Response(JSON.stringify(sp), { status: 201 });
};
