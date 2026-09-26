// User Logout Endpoint
// POST /api/auth/logout

import { getSessionToken, clearSessionCookie } from '../../lib/auth';

interface Env {
  DB: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const token = getSessionToken(request);

  if (token) {
    try {
      await env.DB.prepare(`
        DELETE FROM sessions WHERE token = ?
      `).bind(token).run();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
