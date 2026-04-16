import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = context.cookies.get('admin_session');
    if (!session?.value || session.value !== import.meta.env.ADMIN_SECRET) {
      return context.redirect('/admin/login');
    }
  }

  return next();
});
