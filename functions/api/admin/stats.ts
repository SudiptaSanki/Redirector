// Admin System Metrics Endpoint
// GET /api/admin/stats

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

  // Aggregate statistics
  const [totalLinks, activeLinks, suspendedLinks, totalClicks, totalUsers, pendingReports] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM redirects WHERE status != "DELETED"').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM redirects WHERE status = "ACTIVE"').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM redirects WHERE status = "SUSPENDED"').first(),
    env.DB.prepare('SELECT SUM(click_count) as total FROM redirects').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM abuse_reports WHERE status = "PENDING"').first(),
  ]);

  return new Response(JSON.stringify({
    totalLinks: totalLinks?.count || 0,
    activeLinks: activeLinks?.count || 0,
    suspendedLinks: suspendedLinks?.count || 0,
    totalClicks: totalClicks?.total || 0,
    totalUsers: totalUsers?.count || 0,
    pendingReports: pendingReports?.count || 0,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
