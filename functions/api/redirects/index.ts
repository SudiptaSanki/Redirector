// Redirects Collection Endpoint
// GET /api/redirects (List user's redirects)
// POST /api/redirects (Create a redirect)

import { getSessionUser } from '../../lib/auth';
import { generateId, generateSlug } from '../../lib/crypto';
import { recordAudit } from '../../lib/audit';
import { verifyTurnstile } from '../../lib/turnstile';

interface Env {
  DB: any;
  TURNSTILE_SECRET_KEY?: string;
  APP_URL?: string;
}

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'auth', 'login', 'logout', 'dashboard', 'settings',
  'report', 'r', 'health', 'status', 'docs', 'about', 'privacy', 'terms'
]);

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await getSessionUser(request, env.DB);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('q') || '';

  let query = `
    SELECT id, slug, destination_url, title, status, click_count, created_at, updated_at, last_accessed_at
    FROM redirects
    WHERE user_id = ? AND status != 'DELETED'
  `;
  const params: any[] = [user.id];

  if (search) {
    query += ` AND (title LIKE ? OR slug LIKE ? OR destination_url LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const results = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ redirects: results.results || [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await getSessionUser(request, env.DB);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { destinationUrl, title, customSlug, turnstileToken } = body;

  // Turnstile Bot Protection Verification
  if (turnstileToken && env.TURNSTILE_SECRET_KEY) {
    const cf = (request as any).cf;
    const botCheck = await verifyTurnstile(
      turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      request.headers.get('CF-Connecting-IP') || undefined
    );
    if (!botCheck.success) {
      return new Response(JSON.stringify({ error: botCheck.error || 'Bot verification failed' }), { status: 400 });
    }
  }

  if (!destinationUrl || typeof destinationUrl !== 'string') {
    return new Response(JSON.stringify({ error: 'Destination URL is required' }), { status: 400 });
  }

  // Validate URL protocol strictly
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(destinationUrl.trim());
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Only HTTP and HTTPS destination URLs are allowed.' }), { status: 400 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid destination URL format.' }), { status: 400 });
  }

  let slug = '';
  if (customSlug && typeof customSlug === 'string') {
    const cleaned = customSlug.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(cleaned)) {
      return new Response(JSON.stringify({ error: 'Custom slug must be 3-32 alphanumeric characters, dashes, or underscores.' }), { status: 400 });
    }
    if (RESERVED_SLUGS.has(cleaned)) {
      return new Response(JSON.stringify({ error: `The slug "${cleaned}" is reserved for system routes.` }), { status: 400 });
    }
    // Check uniqueness
    const existing = await env.DB.prepare('SELECT id FROM redirects WHERE slug = ?').bind(cleaned).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'This slug is already in use. Please choose another.' }), { status: 409 });
    }
    slug = cleaned;
  } else {
    // Generate crypto-secure 8 character slug
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateSlug(8);
      if (RESERVED_SLUGS.has(candidate)) continue;
      const existing = await env.DB.prepare('SELECT id FROM redirects WHERE slug = ?').bind(candidate).first();
      if (!existing) {
        slug = candidate;
        break;
      }
    }
    if (!slug) {
      slug = generateSlug(10);
    }
  }

  const redirectId = generateId('rd');
  const redirectTitle = title && typeof title === 'string' ? title.trim().slice(0, 100) : (parsedUrl.hostname || 'My Redirect');
  const validDestination = parsedUrl.toString();

  // Insert into DB
  const versionId = generateId('ver');
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO redirects (id, user_id, slug, destination_url, title, status, click_count)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', 0)
    `).bind(redirectId, user.id, slug, validDestination, redirectTitle),
    env.DB.prepare(`
      INSERT INTO redirect_versions (id, redirect_id, destination_url, changed_by)
      VALUES (?, ?, ?, ?)
    `).bind(versionId, redirectId, validDestination, user.id),
  ]);

  await recordAudit(env.DB, {
    actorUserId: user.id,
    action: 'USER_CREATED_REDIRECT',
    resourceType: 'redirect',
    resourceId: redirectId,
    metadata: { slug, destination: validDestination },
    ip: request.headers.get('CF-Connecting-IP') || undefined,
  });

  return new Response(JSON.stringify({
    success: true,
    redirect: {
      id: redirectId,
      slug,
      destination_url: validDestination,
      title: redirectTitle,
      status: 'ACTIVE',
      click_count: 0,
    },
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
