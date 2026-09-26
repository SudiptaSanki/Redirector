// Admin Link Moderation Action Endpoint
// PATCH /api/admin/redirects/:id

import { getSessionUser } from '../../../lib/auth';
import { recordAudit } from '../../../lib/audit';

interface Env {
  DB: any;
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const user = await getSessionUser(request, env.DB);
  const id = params.id as string;

  if (!user || user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), { status: 400 });
  }

  const { status } = body;
  if (!status || !['ACTIVE', 'DISABLED', 'SUSPENDED', 'DELETED'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status. Must be ACTIVE, DISABLED, SUSPENDED, or DELETED.' }), { status: 400 });
  }

  const redirect = await env.DB.prepare(`
    SELECT id, slug, status, destination_url FROM redirects WHERE id = ?
  `).bind(id).first();

  if (!redirect) {
    return new Response(JSON.stringify({ error: 'Redirect not found' }), { status: 404 });
  }

  await env.DB.prepare(`
    UPDATE redirects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(status, id).run();

  await recordAudit(env.DB, {
    actorUserId: user.id,
    action: `ADMIN_SET_STATUS_${status}`,
    resourceType: 'redirect',
    resourceId: id,
    metadata: { previousStatus: redirect.status, newStatus: status, slug: redirect.slug },
    ip: request.headers.get('CF-Connecting-IP') || undefined,
  });

  return new Response(JSON.stringify({ success: true, status }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
