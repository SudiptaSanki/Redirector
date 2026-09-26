// Redirect Analytics Endpoint
// GET /api/redirects/:id/analytics

import { getSessionUser } from '../../../lib/auth';

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
    SELECT id, user_id, slug, destination_url, title, click_count, created_at, last_accessed_at
    FROM redirects
    WHERE id = ?
  `).bind(id).first();

  if (!redirect) {
    return new Response(JSON.stringify({ error: 'Redirect not found' }), { status: 404 });
  }

  if (redirect.user_id !== user.id && user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // Country breakdown
  const countries = await env.DB.prepare(`
    SELECT country, COUNT(*) as count
    FROM redirect_events
    WHERE redirect_id = ?
    GROUP BY country
    ORDER BY count DESC
    LIMIT 6
  `).bind(id).all();

  // Device breakdown
  const devices = await env.DB.prepare(`
    SELECT device, COUNT(*) as count
    FROM redirect_events
    WHERE redirect_id = ?
    GROUP BY device
    ORDER BY count DESC
  `).bind(id).all();

  // Top referrers
  const referrers = await env.DB.prepare(`
    SELECT referrer, COUNT(*) as count
    FROM redirect_events
    WHERE redirect_id = ?
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 6
  `).bind(id).all();

  // Recent 10 events
  const recentEvents = await env.DB.prepare(`
    SELECT timestamp, country, device, browser, referrer
    FROM redirect_events
    WHERE redirect_id = ?
    ORDER BY timestamp DESC
    LIMIT 10
  `).bind(id).all();

  return new Response(JSON.stringify({
    redirect,
    analytics: {
      totalClicks: redirect.click_count,
      lastAccessedAt: redirect.last_accessed_at,
      countries: countries.results || [],
      devices: devices.results || [],
      referrers: referrers.results || [],
      recentEvents: recentEvents.results || [],
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
