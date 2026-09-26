// Session and Authentication Utilities for Cloudflare Edge

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  created_at: string;
}

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const [key, ...values] = part.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(values.join('='));
    }
  }
  return cookies;
}

export function getSessionToken(request: Request): string | null {
  const cookies = parseCookies(request);
  if (cookies['redirector_session']) {
    return cookies['redirector_session'];
  }
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function getSessionUser(request: Request, db: any): Promise<User | null> {
  const token = getSessionToken(request);
  if (!token) return null;

  try {
    const result = await db.prepare(`
      SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.status, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now') AND u.status = 'ACTIVE'
    `).bind(token).first();

    return (result as User) || null;
  } catch (err) {
    console.error('Error fetching session user:', err);
    return null;
  }
}

export async function createSession(userId: string, db: any): Promise<{ token: string; cookie: string }> {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const sessionId = 'ses_' + token.slice(0, 16);

  // 30 days session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, userId, token, expiresAt).run();

  const cookie = `redirector_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
  return { token, cookie };
}

export function clearSessionCookie(): string {
  return `redirector_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
