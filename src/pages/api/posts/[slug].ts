export const prerender = false;
import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  const posts = (await kv.get('posts', { type: 'json' })) as any[] ?? [];
  const updated = await request.json();
  const idx = posts.findIndex((p: any) => p.slug === params.slug);
  if (idx === -1) return new Response('Not found', { status: 404 });
  posts[idx] = updated;
  await kv.put('posts', JSON.stringify(posts));
  return new Response(JSON.stringify(updated));
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  let posts = (await kv.get('posts', { type: 'json' })) as any[] ?? [];
  posts = posts.filter((p: any) => p.slug !== params.slug);
  await kv.put('posts', JSON.stringify(posts));
  return new Response(null, { status: 204 });
};
