// High-Performance Edge Redirect Fast Path
// Endpoint: GET /r/:slug

import { generateId } from '../lib/crypto';

interface Env {
  DB: any;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env, request, waitUntil } = context;
  const slug = params.slug as string;

  if (!slug) {
    return new Response('Slug required', { status: 400 });
  }

  // Fast Edge Query to D1
  const redirect = await env.DB.prepare(`
    SELECT id, destination_url, status
    FROM redirects
    WHERE slug = ?
  `).bind(slug).first();

  if (!redirect) {
    return new Response(renderNotFoundPage(slug), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (redirect.status === 'SUSPENDED') {
    return new Response(renderSuspendedPage(slug), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (redirect.status !== 'ACTIVE') {
    return new Response(renderDisabledPage(slug), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const destination = redirect.destination_url;

  // Asynchronously record click event without delaying the 302 response!
  waitUntil(
    (async () => {
      try {
        const cf = (request as any).cf || {};
        const country = cf.country || 'Unknown';
        const userAgent = request.headers.get('User-Agent') || '';
        const referrer = request.headers.get('Referer') || 'Direct';

        // Categorize device & browser
        let device = 'Desktop';
        if (/Mobi|Android/i.test(userAgent)) device = 'Mobile';
        else if (/Tablet|iPad/i.test(userAgent)) device = 'Tablet';

        let browser = 'Other';
        if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
        else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
        else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
        else if (/Edg/i.test(userAgent)) browser = 'Edge';

        const eventId = generateId('evt');

        // Batch update: increment count and append event
        await env.DB.batch([
          env.DB.prepare(`
            UPDATE redirects
            SET click_count = click_count + 1, last_accessed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(redirect.id),
          env.DB.prepare(`
            INSERT INTO redirect_events (id, redirect_id, country, device, browser, referrer)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(eventId, redirect.id, country, device, browser, referrer.slice(0, 255)),
        ]);
      } catch (err) {
        console.error('Async analytics error:', err);
      }
    })()
  );

  // 302 Found Temporary Redirect (Browser will not cache, preserving mutability)
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Redirector-Slug': slug,
    },
  });
};

function renderNotFoundPage(slug: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Link Not Found - Redirector</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background-color: #030712; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: rgba(17, 24, 39, 0.8); border: 1px solid #374151; border-radius: 16px; padding: 36px; max-width: 480px; text-align: center; backdrop-filter: blur(12px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    h1 { font-size: 28px; margin: 0 0 12px; color: #ef4444; }
    p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
    .slug-badge { background: #1f2937; color: #60a5fa; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 15px; }
    .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>404 — Redirect Not Found</h1>
    <p>The link <span class="slug-badge">/r/${slug}</span> does not exist or has been removed by its creator.</p>
    <a href="/" class="btn">Create Your Own Link</a>
  </div>
</body>
</html>`;
}

function renderSuspendedPage(slug: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Link Suspended - Redirector</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background-color: #030712; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: rgba(17, 24, 39, 0.8); border: 1px solid #7f1d1d; border-radius: 16px; padding: 36px; max-width: 480px; text-align: center; backdrop-filter: blur(12px); }
    h1 { font-size: 26px; margin: 0 0 12px; color: #f87171; }
    p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: #374151; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Security Warning</h1>
    <p>The link <code>/r/${slug}</code> has been suspended by administration due to a community report or security violation.</p>
    <a href="/report/${slug}" class="btn">View or Contest Report</a>
  </div>
</body>
</html>`;
}

function renderDisabledPage(slug: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Link Inactive - Redirector</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background-color: #030712; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: rgba(17, 24, 39, 0.8); border: 1px solid #374151; border-radius: 16px; padding: 36px; max-width: 480px; text-align: center; }
    h1 { font-size: 24px; margin: 0 0 12px; color: #fbbf24; }
    p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Link Paused</h1>
    <p>The owner of <code>/r/${slug}</code> has temporarily disabled this redirect.</p>
    <a href="/" style="color:#60a5fa; text-decoration:none;">Go to Redirector &rarr;</a>
  </div>
</body>
</html>`;
}

export const onRequest = onRequestGet;
