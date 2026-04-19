export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  const species = (await kv.get('species', { type: 'json' })) as any[] ?? [];
  return new Response(JSON.stringify(species), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  const sp = await request.json();
  const species = (await kv.get('species', { type: 'json' })) as any[] ?? [];
  species.push(sp);
  await kv.put('species', JSON.stringify(species));
  return new Response(JSON.stringify(sp), { status: 201 });
};
