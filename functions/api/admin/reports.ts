// Admin Abuse Reports Endpoint
// GET /api/admin/reports

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

  const reports = await env.DB.prepare(`
    SELECT r.id, r.slug, r.destination_url, r.reason, r.status, r.created_at, r.reporter_ip_hash,
           l.id as redirect_id, l.status as link_status
    FROM abuse_reports r
    LEFT JOIN redirects l ON r.slug = l.slug
    ORDER BY r.created_at DESC
    LIMIT 100
  `).all();

  return new Response(JSON.stringify({ reports: reports.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
