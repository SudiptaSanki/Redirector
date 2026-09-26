// Admin Abuse Report Resolution Endpoint
// PATCH /api/admin/reports/:id

import { getSessionUser } from '../../../lib/auth';
import { recordAudit } from '../../../lib/audit';

interface Env {
  DB: any;
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const user = await getSessionUser(request, env.DB);
  const reportId = params.id as string;

  if (!user || user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), { status: 400 });
  }

  const { status, suspendLink } = body;
  if (!status || !['RESOLVED', 'DISMISSED'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Status must be RESOLVED or DISMISSED.' }), { status: 400 });
  }

  const report = await env.DB.prepare(`
    SELECT id, slug, destination_url FROM abuse_reports WHERE id = ?
  `).bind(reportId).first();

  if (!report) {
    return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404 });
  }

  const batch: any[] = [
    env.DB.prepare(`UPDATE abuse_reports SET status = ? WHERE id = ?`).bind(status, reportId)
  ];

  if (suspendLink && status === 'RESOLVED') {
    batch.push(
      env.DB.prepare(`UPDATE redirects SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP WHERE slug = ?`).bind(report.slug)
    );
  }

  await env.DB.batch(batch);

  await recordAudit(env.DB, {
    actorUserId: user.id,
    action: `ADMIN_${status}_REPORT`,
    resourceType: 'abuse_report',
    resourceId: reportId,
    metadata: { slug: report.slug, suspendLink },
    ip: request.headers.get('CF-Connecting-IP') || undefined,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
