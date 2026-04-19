export const prerender = false;
import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  const species = (await kv.get('species', { type: 'json' })) as any[] ?? [];
  const updated = await request.json();
  const idx = species.findIndex((s: any) => s.name === decodeURIComponent(params.name!));
  if (idx === -1) return new Response('Not found', { status: 404 });
  species[idx] = updated;
  await kv.put('species', JSON.stringify(species));
  return new Response(JSON.stringify(updated));
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  let species = (await kv.get('species', { type: 'json' })) as any[] ?? [];
  species = species.filter((s: any) => s.name !== decodeURIComponent(params.name!));
  await kv.put('species', JSON.stringify(species));
  return new Response(null, { status: 204 });
};
