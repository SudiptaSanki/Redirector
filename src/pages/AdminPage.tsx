import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  Link as LinkIcon,
  AlertOctagon,
  BarChart2,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Power,
  RotateCcw,
  KeyRound
} from 'lucide-react';

interface AdminStats {
  totalLinks: number;
  activeLinks: number;
  suspendedLinks: number;
  totalClicks: number;
  totalUsers: number;
  pendingReports: number;
}

export const AdminPage: React.FC = () => {
  const { user, devLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'redirects' | 'users' | 'reports' | 'audit'>('redirects');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Tab Data States
  const [redirects, setRedirects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTabData = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'redirects') {
        const query = `?status=${statusFilter}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
        const res = await fetch(`/api/admin/redirects${query}`);
        if (res.ok) {
          const d = await res.json();
          setRedirects(d.redirects || []);
        }
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const d = await res.json();
          setUsers(d.users || []);
        }
      } else if (activeTab === 'reports') {
        const res = await fetch('/api/admin/reports');
        if (res.ok) {
          const d = await res.json();
          setReports(d.reports || []);
        }
      } else if (activeTab === 'audit') {
        const res = await fetch('/api/admin/audit-logs');
        if (res.ok) {
          const d = await res.json();
          setAuditLogs(d.auditLogs || []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch tab data:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchStats();
      fetchTabData();
    }
  }, [user, activeTab, statusFilter, search]);

  // Actions
  const handleToggleRedirectStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/admin/redirects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchTabData();
        await fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchTabData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        await fetchTabData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED', suspendLink: boolean) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, suspendLink }),
      });
      if (res.ok) {
        await fetchTabData();
        await fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Guard for non-admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-purple-900/40 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center mx-auto mb-4 text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Staff Access Required</h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            The Administration Command Center is restricted to users with the <code className="text-purple-400">ADMIN</code> role.
          </p>
          <button
            onClick={() => devLogin('ADMIN')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Switch to Demo Admin Session</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Administration Portal
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800/50">
              Edge D1 Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global moderation, user controls, abuse prevention, and real-time security audit trails
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchTabData();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 mb-8">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] uppercase font-semibold text-slate-400">Total Links</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">{stats?.totalLinks ?? '-'}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] uppercase font-semibold text-emerald-400">Active Links</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats?.activeLinks ?? '-'}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] uppercase font-semibold text-rose-400">Suspended</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats?.suspendedLinks ?? '-'}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] uppercase font-semibold text-blue-400">System Clicks</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats?.totalClicks ?? '-'}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] uppercase font-semibold text-purple-400">Total Users</span>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats?.totalUsers ?? '-'}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] uppercase font-semibold text-amber-400">Abuse Reports</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats?.pendingReports ?? '-'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('redirects')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'redirects'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>All Redirects</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Abuse Reports Queue</span>
          {stats && stats.pendingReports > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold">
              {stats.pendingReports}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB CONTENT: REDIRECTS */}
      {activeTab === 'redirects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by slug, owner, or URL..."
                className="w-full bg-slate-900 border border-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl focus:border-blue-500 outline-none text-slate-200"
              />
            </div>
            <div className="flex gap-1.5 w-full sm:w-auto">
              {['ALL', 'ACTIVE', 'SUSPENDED', 'DISABLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Title & Destination</th>
                    <th className="p-3.5">Owner</th>
                    <th className="p-3.5">Clicks</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {redirects.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono text-blue-400">/r/{r.slug}</td>
                      <td className="p-3.5 max-w-xs">
                        <p className="font-semibold text-slate-200 truncate">{r.title}</p>
                        <a
                          href={r.destination_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-400 truncate flex items-center gap-1 mt-0.5"
                        >
                          <span className="truncate">{r.destination_url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        <span className="truncate block max-w-[140px]">{r.owner_email || 'Unknown'}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{r.click_count}</td>
                      <td className="p-3.5">
                        {r.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            ACTIVE
                          </span>
                        )}
                        {r.status === 'SUSPENDED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/40">
                            SUSPENDED
                          </span>
                        )}
                        {r.status === 'DISABLED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            DISABLED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleRedirectStatus(r.id, r.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            r.status === 'SUSPENDED'
                              ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                              : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30'
                          }`}
                        >
                          {r.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {redirects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No links found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Links Created</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 flex items-center gap-2">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`}
                        alt={u.name}
                        className="w-6 h-6 rounded-full bg-slate-800"
                      />
                      <span className="font-semibold text-slate-200">{u.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{u.email}</td>
                    <td className="p-3.5 font-mono text-slate-300">{u.link_count}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleUserRole(u.id, u.role)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                      >
                        {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          u.status === 'SUSPENDED'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ABUSE REPORTS */}
      {activeTab === 'reports' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Report Reason</th>
                  <th className="p-3.5">Destination URL</th>
                  <th className="p-3.5">Link Status</th>
                  <th className="p-3.5">Report Status</th>
                  <th className="p-3.5 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-blue-400">/r/{rep.slug}</td>
                    <td className="p-3.5 text-slate-300 max-w-xs">{rep.reason}</td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">{rep.destination_url}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] text-slate-400">{rep.link_status || 'NOT FOUND'}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rep.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : rep.status === 'RESOLVED'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {rep.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'RESOLVED', true)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-[11px] font-semibold border border-rose-500/30"
                          >
                            Suspend & Resolve
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'DISMISSED', false)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 text-[11px]"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Zero abuse reports in queue. Clean record!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Resource</th>
                  <th className="p-3.5">IP Hash</th>
                  <th className="p-3.5">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-emerald-400 font-semibold">{log.action}</td>
                    <td className="p-3.5 text-slate-300 truncate max-w-[120px]">
                      {log.actor_name || log.actor_email || log.actor_user_id}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {log.resource_type}: {log.resource_id}
                    </td>
                    <td className="p-3.5 text-slate-500">{log.ip_hash}</td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
                      {log.metadata || '-'}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No security audit logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
