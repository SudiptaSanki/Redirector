// Check Current Session User
// GET /api/auth/me

import { getSessionUser } from '../../lib/auth';

interface Env {
  DB: any;
  TURNSTILE_SITE_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await getSessionUser(request, env.DB);

  return new Response(
    JSON.stringify({
      authenticated: !!user,
      user: user || null,
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};
