// Google OAuth Callback Endpoint
// GET /api/auth/google/callback

import { parseCookies, createSession } from '../../../lib/auth';
import { generateId } from '../../../lib/crypto';
import { recordAudit } from '../../../lib/audit';

interface Env {
  DB: any;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APP_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookies = parseCookies(request);
  const expectedState = cookies['oauth_state_google'];

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response('Invalid Google OAuth state or authorization code.', { status: 400 });
  }

  const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // Exchange code for Google tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenData.access_token) {
      return new Response(`Google token exchange failed: ${tokenData.error_description || tokenData.error || 'Unknown error'}`, { status: 400 });
    }

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const gUser = (await userRes.json()) as any;

    const email = gUser.email;
    const providerUserId = gUser.sub;
    const displayName = gUser.name || email.split('@')[0];
    const avatarUrl = gUser.picture || null;

    if (!email || !providerUserId) {
      return new Response('Could not retrieve email or user ID from Google account.', { status: 400 });
    }

    // Check if OAuth account exists
    let existingOAuth = await env.DB.prepare(`
      SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = ?
    `).bind(providerUserId).first();

    let userId = existingOAuth?.user_id;

    if (!userId) {
      // Check if user with same email exists
      let existingUser = await env.DB.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(email).first();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        userId = generateId('usr');
        await env.DB.prepare(`
          INSERT INTO users (id, email, name, avatar_url, role, status)
          VALUES (?, ?, ?, ?, 'USER', 'ACTIVE')
        `).bind(userId, email, displayName, avatarUrl).run();
      }

      // Link OAuth account
      const oauthId = generateId('oat');
      await env.DB.prepare(`
        INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email)
        VALUES (?, ?, 'google', ?, ?)
      `).bind(oauthId, userId, providerUserId, email).run();
    }

    // Create edge session
    const { cookie } = await createSession(userId, env.DB);

    await recordAudit(env.DB, {
      actorUserId: userId,
      action: 'USER_LOGIN_GOOGLE',
      resourceType: 'user',
      resourceId: userId,
      metadata: { googleEmail: email },
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard',
        'Set-Cookie': cookie,
      },
    });
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    return new Response(`Authentication Error: ${err.message}`, { status: 500 });
  }
};
