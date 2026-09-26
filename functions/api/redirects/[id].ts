// Redirect Single Resource Endpoint
// GET /api/redirects/:id
// PATCH /api/redirects/:id
// DELETE /api/redirects/:id

import { getSessionUser } from '../../lib/auth';
import { generateId } from '../../lib/crypto';
import { recordAudit } from '../../lib/audit';

interface Env {
  DB: any;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const user = await getSessionUser(request, env.DB);
  const id = params.id as string;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const redirect = await env.DB.prepare(`
    SELECT id, user_id, slug, destination_url, title, status, click_count, created_at, updated_at, last_accessed_at
    FROM redirects
    WHERE id = ?
  `).bind(id).first();

  if (!redirect) {
    return new Response(JSON.stringify({ error: 'Redirect not found' }), { status: 404 });
  }

  // Authorization check (owner or admin)
  if (redirect.user_id !== user.id && user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const versions = await env.DB.prepare(`
    SELECT id, destination_url, changed_by, created_at
    FROM redirect_versions
    WHERE redirect_id = ?
    ORDER BY created_at DESC
  `).bind(id).all();

  return new Response(JSON.stringify({
    redirect,
    versions: versions.results || [],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const user = await getSessionUser(request, env.DB);
  const id = params.id as string;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const redirect = await env.DB.prepare(`
    SELECT id, user_id, slug, destination_url, title, status
    FROM redirects
    WHERE id = ?
  `).bind(id).first();

  if (!redirect) {
    return new Response(JSON.stringify({ error: 'Redirect not found' }), { status: 404 });
  }

  // Authorization check
  if (redirect.user_id !== user.id && user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const updates: string[] = [];
  const queryParams: any[] = [];
  const batchStatements: any[] = [];

  // Update Destination URL
  if (body.destinationUrl && body.destinationUrl !== redirect.destination_url) {
    try {
      const parsed = new URL(body.destinationUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return new Response(JSON.stringify({ error: 'Only HTTP and HTTPS destination URLs are allowed.' }), { status: 400 });
      }
      const newDest = parsed.toString();
      updates.push('destination_url = ?');
      queryParams.push(newDest);

      // Record Version History
      const verId = generateId('ver');
      batchStatements.push(
        env.DB.prepare(`
          INSERT INTO redirect_versions (id, redirect_id, destination_url, changed_by)
          VALUES (?, ?, ?, ?)
        `).bind(verId, id, newDest, user.id)
      );

      await recordAudit(env.DB, {
        actorUserId: user.id,
        action: 'DESTINATION_CHANGED',
        resourceType: 'redirect',
        resourceId: id,
        metadata: { old: redirect.destination_url, new: newDest },
        ip: request.headers.get('CF-Connecting-IP') || undefined,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid destination URL.' }), { status: 400 });
    }
  }

  // Update Title
  if (body.title && typeof body.title === 'string') {
    updates.push('title = ?');
    queryParams.push(body.title.trim().slice(0, 100));
  }

  // Update Status (ACTIVE or DISABLED)
  if (body.status && ['ACTIVE', 'DISABLED'].includes(body.status)) {
    // Only admin can lift a SUSPENDED status
    if (redirect.status === 'SUSPENDED' && user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'This link has been suspended by administration and cannot be activated.' }), { status: 403 });
    }
    updates.push('status = ?');
    queryParams.push(body.status);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ message: 'No changes provided', redirect }), { status: 200 });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  queryParams.push(id);

  batchStatements.unshift(
    env.DB.prepare(`
      UPDATE redirects
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...queryParams)
  );

  await env.DB.batch(batchStatements);

  const updatedRedirect = await env.DB.prepare(`
    SELECT id, slug, destination_url, title, status, click_count, created_at, updated_at
    FROM redirects
    WHERE id = ?
  `).bind(id).first();

  return new Response(JSON.stringify({ success: true, redirect: updatedRedirect }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const user = await getSessionUser(request, env.DB);
  const id = params.id as string;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const redirect = await env.DB.prepare(`
    SELECT id, user_id, slug FROM redirects WHERE id = ?
  `).bind(id).first();

  if (!redirect) {
    return new Response(JSON.stringify({ error: 'Redirect not found' }), { status: 404 });
  }

  if (redirect.user_id !== user.id && user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // Soft delete to preserve slug reservation and audit logs
  await env.DB.prepare(`
    UPDATE redirects SET status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();

  await recordAudit(env.DB, {
    actorUserId: user.id,
    action: 'USER_DELETED_REDIRECT',
    resourceType: 'redirect',
    resourceId: id,
    metadata: { slug: redirect.slug },
    ip: request.headers.get('CF-Connecting-IP') || undefined,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
