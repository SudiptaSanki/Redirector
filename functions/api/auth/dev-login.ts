// Development & Demo Login Endpoint
// POST /api/auth/dev-login

import { createSession } from '../../lib/auth';
import { generateId } from '../../lib/crypto';
import { recordAudit } from '../../lib/audit';

interface Env {
  DB: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const role = body.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const email = role === 'ADMIN' ? 'admin@redirector.dev' : 'developer@redirector.dev';
  const name = role === 'ADMIN' ? 'Demo Admin' : 'Demo Developer';
  const avatarUrl = role === 'ADMIN'
    ? 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'
    : 'https://api.dicebear.com/7.x/bottts/svg?seed=developer';

  // Find or create user
  let user = await env.DB.prepare(`
    SELECT id, email, name, role, status FROM users WHERE email = ?
  `).bind(email).first();

  let userId: string;

  if (!user) {
    userId = generateId('usr');
    await env.DB.prepare(`
      INSERT INTO users (id, email, name, avatar_url, role, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).bind(userId, email, name, avatarUrl, role).run();
  } else {
    userId = user.id;
    // ensure role is set
    if (user.role !== role) {
      await env.DB.prepare(`UPDATE users SET role = ? WHERE id = ?`).bind(role, userId).run();
    }
  }

  const { cookie } = await createSession(userId, env.DB);

  await recordAudit(env.DB, {
    actorUserId: userId,
    action: `DEV_LOGIN_${role}`,
    resourceType: 'user',
    resourceId: userId,
    metadata: { role },
  });

  return new Response(JSON.stringify({ success: true, userId, role }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
};
