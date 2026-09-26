// GitHub OAuth Callback Endpoint
// GET /api/auth/github/callback

import { parseCookies, createSession } from '../../../lib/auth';
import { generateId } from '../../../lib/crypto';
import { recordAudit } from '../../../lib/audit';

interface Env {
  DB: any;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  APP_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookies = parseCookies(request);
  const expectedState = cookies['oauth_state'];

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response('Invalid OAuth state or authorization code.', { status: 400 });
  }

  try {
    // Exchange code for GitHub access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Redirector-Cloudflare',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenData.access_token) {
      return new Response(`GitHub token exchange failed: ${tokenData.error_description || 'Unknown error'}`, { status: 400 });
    }

    // Fetch user profile from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Redirector-Cloudflare',
      },
    });
    const ghUser = (await userRes.json()) as any;

    let email = ghUser.email;
    if (!email) {
      // Fetch primary email if private
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Redirector-Cloudflare',
        },
      });
      const emails = (await emailRes.json()) as any[];
      if (Array.isArray(emails)) {
        const primary = emails.find(e => e.primary && e.verified) || emails[0];
        if (primary) email = primary.email;
      }
    }

    if (!email) {
      email = `${ghUser.id}+${ghUser.login}@users.noreply.github.com`;
    }

    const providerUserId = String(ghUser.id);
    const displayName = ghUser.name || ghUser.login || 'GitHub User';
    const avatarUrl = ghUser.avatar_url || null;

    // Check if account already exists
    let existingOAuth = await env.DB.prepare(`
      SELECT user_id FROM oauth_accounts WHERE provider = 'github' AND provider_user_id = ?
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
        // Create new user
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
        VALUES (?, ?, 'github', ?, ?)
      `).bind(oauthId, userId, providerUserId, email).run();
    }

    // Create edge session
    const { cookie } = await createSession(userId, env.DB);

    await recordAudit(env.DB, {
      actorUserId: userId,
      action: 'USER_LOGIN_GITHUB',
      resourceType: 'user',
      resourceId: userId,
      metadata: { githubLogin: ghUser.login },
    });

    const destination = '/dashboard';
    return new Response(null, {
      status: 302,
      headers: {
        Location: destination,
        'Set-Cookie': cookie,
      },
    });
  } catch (err: any) {
    console.error('GitHub OAuth error:', err);
    return new Response(`Authentication Error: ${err.message}`, { status: 500 });
  }
};
