// Admin User Moderation Action Endpoint
// PATCH /api/admin/users/:id

import { getSessionUser } from '../../../lib/auth';
import { recordAudit } from '../../../lib/audit';

interface Env {
  DB: any;
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const user = await getSessionUser(request, env.DB);
  const targetUserId = params.id as string;

  if (!user || user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403 });
  }

  // Prevent self-demoting or self-suspending to avoid accidental lockout
  if (user.id === targetUserId) {
    return new Response(JSON.stringify({ error: 'Cannot modify your own administrative status.' }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), { status: 400 });
  }

  const { status, role } = body;
  const updates: string[] = [];
  const queryParams: any[] = [];

  if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) {
    updates.push('status = ?');
    queryParams.push(status);
  }

  if (role && ['USER', 'ADMIN'].includes(role)) {
    updates.push('role = ?');
    queryParams.push(role);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ message: 'No valid fields provided' }), { status: 400 });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  queryParams.push(targetUserId);

  await env.DB.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `).bind(...queryParams).run();

  await recordAudit(env.DB, {
    actorUserId: user.id,
    action: 'ADMIN_MODIFIED_USER',
    resourceType: 'user',
    resourceId: targetUserId,
    metadata: { updates: body },
    ip: request.headers.get('CF-Connecting-IP') || undefined,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
