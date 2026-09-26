// Admin Redirects Management Endpoint
// GET /api/admin/redirects

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

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');
  const search = url.searchParams.get('q');

  let query = `
    SELECT r.id, r.slug, r.destination_url, r.title, r.status, r.click_count, r.created_at, r.updated_at,
           u.email as owner_email, u.name as owner_name
    FROM redirects r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (statusFilter && statusFilter !== 'ALL') {
    query += ` AND r.status = ?`;
    params.push(statusFilter);
  }

  if (search) {
    query += ` AND (r.slug LIKE ? OR r.destination_url LIKE ? OR r.title LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY r.created_at DESC LIMIT 100`;

  const results = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ redirects: results.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
