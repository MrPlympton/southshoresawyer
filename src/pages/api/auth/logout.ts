import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/admin/login');

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('admin_session', { path: '/' });
  return redirect('/admin/login');
};
