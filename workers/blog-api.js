/**
 * Cloudflare Worker: Blog API
 * Handles all blog post management with KV storage
 *
 * Environment variables to set via wrangler secret:
 *   ADMIN_PASSWORD  — the admin login password
 *   JWT_SECRET      — a random string (32+ chars) for signing session tokens
 *
 * KV Namespace to create:
 *   BLOG_KV         — bound to this worker in wrangler.toml
 *
 * Routes (all under /api/blog/):
 *   POST   /api/blog/login       — authenticate, returns session token
 *   GET    /api/blog/posts       — list all posts (public)
 *   GET    /api/blog/posts/:slug — get single post (public)
 *   POST   /api/blog/posts       — create post (auth required)
 *   PUT    /api/blog/posts/:slug — update post (auth required)
 *   DELETE /api/blog/posts/:slug — delete post (auth required)
 */

const CORS = {
  'Access-Control-Allow-Origin': 'https://southshoresawyer.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── Minimal JWT (HMAC-SHA256) ──────────────────────────────────────────────

async function signToken(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const key    = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${data}.${sigB64}`;
}

async function verifyToken(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    const data = `${header}.${body}`;
    const key  = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Auth middleware ────────────────────────────────────────────────────────

async function requireAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return false;
  const payload = await verifyToken(token, env.JWT_SECRET);
  return !!payload;
}

// ── Slug generator ─────────────────────────────────────────────────────────

function slugify(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── Response helpers ───────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// ── Main handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // ── POST /api/blog/login ──────────────────────────────────────────────
    if (path === '/api/blog/login' && method === 'POST') {
      const { password } = await request.json().catch(() => ({}));
      if (!password || password !== env.ADMIN_PASSWORD) {
        return err('Invalid password', 401);
      }
      const token = await signToken(
        { admin: true, exp: Date.now() + 8 * 60 * 60 * 1000 }, // 8hr expiry
        env.JWT_SECRET
      );
      return json({ token });
    }

    // ── GET /api/blog/posts ───────────────────────────────────────────────
    if (path === '/api/blog/posts' && method === 'GET') {
      const index = await env.BLOG_KV.get('__index__', 'json') || [];
      const posts = await Promise.all(
        index.map(slug => env.BLOG_KV.get(`post:${slug}`, 'json'))
      );
      const sorted = posts
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return json(sorted);
    }

    // ── GET /api/blog/posts/:slug ─────────────────────────────────────────
    const singleMatch = path.match(/^\/api\/blog\/posts\/([^/]+)$/);
    if (singleMatch && method === 'GET') {
      const slug = singleMatch[1];
      const post = await env.BLOG_KV.get(`post:${slug}`, 'json');
      if (!post) return err('Post not found', 404);
      return json(post);
    }

    // ── POST /api/blog/posts — create ─────────────────────────────────────
    if (path === '/api/blog/posts' && method === 'POST') {
      if (!await requireAuth(request, env)) return err('Unauthorized', 401);

      const body = await request.json().catch(() => null);
      if (!body || !body.title || !body.content) {
        return err('title and content are required');
      }

      const slug = body.slug || slugify(body.title);
      const existing = await env.BLOG_KV.get(`post:${slug}`);
      if (existing) return err('A post with this slug already exists. Choose a different title or provide a custom slug.');

      const post = {
        slug,
        title:    body.title,
        excerpt:  body.excerpt || body.content.slice(0, 160).replace(/[#*_]/g, '') + '…',
        content:  body.content,
        category: body.category || 'Field Notes',
        author:   body.author   || 'South Shore Sawyer',
        featured: body.featured || false,
        date:     new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        readTime: Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200)) + ' min',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Update the index
      const index = await env.BLOG_KV.get('__index__', 'json') || [];
      if (!index.includes(slug)) index.unshift(slug);
      await env.BLOG_KV.put('__index__', JSON.stringify(index));
      await env.BLOG_KV.put(`post:${slug}`, JSON.stringify(post));

      return json({ success: true, slug, post }, 201);
    }

    // ── PUT /api/blog/posts/:slug — update ────────────────────────────────
    if (singleMatch && method === 'PUT') {
      if (!await requireAuth(request, env)) return err('Unauthorized', 401);

      const slug = singleMatch[1];
      const existing = await env.BLOG_KV.get(`post:${slug}`, 'json');
      if (!existing) return err('Post not found', 404);

      const body = await request.json().catch(() => null);
      if (!body) return err('Invalid JSON body');

      const updated = {
        ...existing,
        title:    body.title    || existing.title,
        excerpt:  body.excerpt  || existing.excerpt,
        content:  body.content  || existing.content,
        category: body.category || existing.category,
        featured: body.featured !== undefined ? body.featured : existing.featured,
        readTime: body.content
          ? Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200)) + ' min'
          : existing.readTime,
        updatedAt: new Date().toISOString(),
      };

      await env.BLOG_KV.put(`post:${slug}`, JSON.stringify(updated));
      return json({ success: true, slug, post: updated });
    }

    // ── DELETE /api/blog/posts/:slug ──────────────────────────────────────
    if (singleMatch && method === 'DELETE') {
      if (!await requireAuth(request, env)) return err('Unauthorized', 401);

      const slug = singleMatch[1];
      const existing = await env.BLOG_KV.get(`post:${slug}`);
      if (!existing) return err('Post not found', 404);

      await env.BLOG_KV.delete(`post:${slug}`);
      const index = (await env.BLOG_KV.get('__index__', 'json') || []).filter(s => s !== slug);
      await env.BLOG_KV.put('__index__', JSON.stringify(index));

      return json({ success: true, deleted: slug });
    }

    return err('Not found', 404);
  },
};
