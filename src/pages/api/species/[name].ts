export const getStaticPaths = () => [];
import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const dataPath = resolve('src/data/species.json');

export const PUT: APIRoute = async ({ params, request }) => {
  const species = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const updated = await request.json();
  const idx = species.findIndex((s: any) => s.name === decodeURIComponent(params.name!));
  if (idx === -1) return new Response('Not found', { status: 404 });
  species[idx] = updated;
  writeFileSync(dataPath, JSON.stringify(species, null, 2));
  return new Response(JSON.stringify(updated));
};

export const DELETE: APIRoute = async ({ params }) => {
  let species = JSON.parse(readFileSync(dataPath, 'utf-8'));
  species = species.filter((s: any) => s.name !== decodeURIComponent(params.name!));
  writeFileSync(dataPath, JSON.stringify(species, null, 2));
  return new Response(null, { status: 204 });
};
