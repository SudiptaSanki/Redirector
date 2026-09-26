// Admin Users Management Endpoint
// GET /api/admin/users

import { getSessionUser } from '../../lib/auth';

interface Env {
  DB: any;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await getSessionUser(request, env.DB);

  if (!user || user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403 });
  }

  const results = await env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.status, u.created_at,
           COUNT(r.id) as link_count
    FROM users u
    LEFT JOIN redirects r ON u.id = r.user_id AND r.status != 'DELETED'
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT 100
  `).all();

  return new Response(JSON.stringify({ users: results.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
