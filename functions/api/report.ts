// Community Abuse & Phishing Reporting Endpoint
// POST /api/report

import { generateId, hashIp } from '../lib/crypto';
import { verifyTurnstile } from '../lib/turnstile';

interface Env {
  DB: any;
  TURNSTILE_SECRET_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), { status: 400 });
  }

  const { slug, reason, turnstileToken } = body;

  if (!slug || typeof slug !== 'string') {
    return new Response(JSON.stringify({ error: 'Slug is required' }), { status: 400 });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return new Response(JSON.stringify({ error: 'Please provide a clear reason for the report (at least 5 characters).' }), { status: 400 });
  }

  // Verify Turnstile bot check
  const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const botCheck = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!botCheck.success) {
    return new Response(JSON.stringify({ error: botCheck.error || 'Bot verification failed.' }), { status: 400 });
  }

  // Find redirect
  const redirect = await env.DB.prepare(`
    SELECT id, destination_url FROM redirects WHERE slug = ?
  `).bind(slug.trim()).first();

  const destinationUrl = redirect ? redirect.destination_url : 'Unknown (Slug not found)';
  const reportId = generateId('rep');
  const ipHash = await hashIp(ip);

  await env.DB.prepare(`
    INSERT INTO abuse_reports (id, slug, destination_url, reporter_ip_hash, reason, status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `).bind(reportId, slug.trim(), destinationUrl, ipHash, reason.trim().slice(0, 500)).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Report submitted successfully. Our security team will review it shortly.',
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
