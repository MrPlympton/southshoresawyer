export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  const posts = (await kv.get('posts', { type: 'json' })) as any[] ?? [];
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const kv = locals.runtime.env.BLOG_KV;
  const post = await request.json();
  const posts = (await kv.get('posts', { type: 'json' })) as any[] ?? [];
  posts.unshift(post);
  await kv.put('posts', JSON.stringify(posts));
  return new Response(JSON.stringify(post), { status: 201 });
};
