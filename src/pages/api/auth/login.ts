import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/admin/login');

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const contentType = request.headers.get('content-type') ?? '';
  let password = '';

  if (contentType.includes('application/json')) {
    const json = await request.json();
    password = json.password ?? '';
  } else {
    // Handle both x-www-form-urlencoded and multipart/form-data
    try {
      const data = await request.formData();
      password = data.get('password')?.toString() ?? '';
    } catch {
      const text = await request.text();
      password = new URLSearchParams(text).get('password') ?? '';
    }
  }

  if (password === import.meta.env.ADMIN_PASSWORD) {
    cookies.set('admin_session', import.meta.env.ADMIN_SECRET, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return redirect('/admin');
  }

  return redirect('/admin/login?error=1');
};
