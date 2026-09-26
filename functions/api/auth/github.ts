// GitHub OAuth Initiation Endpoint
// GET /api/auth/github

interface Env {
  GITHUB_CLIENT_ID: string;
  APP_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response(JSON.stringify({ 
      error: 'GitHub OAuth is not configured on this instance. Please set GITHUB_CLIENT_ID.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/api/auth/github/callback`;

  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: githubAuthUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
};
