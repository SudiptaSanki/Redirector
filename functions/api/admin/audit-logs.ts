// Admin Security Audit Trail Endpoint
// GET /api/admin/audit-logs

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

  const logs = await env.DB.prepare(`
    SELECT a.id, a.actor_user_id, a.action, a.resource_type, a.resource_id, a.metadata, a.ip_hash, a.created_at,
           u.email as actor_email, u.name as actor_name
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 100
  `).all();

  return new Response(JSON.stringify({ auditLogs: logs.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
