import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { AnalyticsModal } from './AnalyticsModal';
import { QrCodeModal } from '../components/QrCodeModal';
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Edit2,
  Trash2,
  QrCode,
  BarChart3,
  Power,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Link as LinkIcon
} from 'lucide-react';

interface RedirectItem {
  id: string;
  slug: string;
  destination_url: string;
  title: string;
  status: 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  click_count: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

export const DashboardPage: React.FC = () => {
  const { user, loading: authLoading, turnstileSiteKey } = useAuth();
  const navigate = useNavigate();

  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RedirectItem | null>(null);
  const [analyticsItem, setAnalyticsItem] = useState<RedirectItem | null>(null);
  const [qrItem, setQrItem] = useState<RedirectItem | null>(null);

  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createDest, setCreateDest] = useState('');
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [createSlug, setCreateSlug] = useState('');
  const [createTurnstile, setCreateTurnstile] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchRedirects = async () => {
    try {
      const res = await fetch(`/api/redirects${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      if (res.ok) {
        const json = await res.json();
        setRedirects(json.redirects || []);
      }
    } catch (e) {
      console.error('Failed to fetch redirects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRedirects();
    }
  }, [user, search]);

  const handleCopy = (slug: string) => {
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: createDest,
          title: createTitle,
          customSlug: useCustomSlug ? createSlug : undefined,
          turnstileToken: createTurnstile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create redirect');
        setSubmitting(false);
        return;
      }

      setShowCreateModal(false);
      setCreateTitle('');
      setCreateDest('');
      setCreateSlug('');
      setUseCustomSlug(false);
      await fetchRedirects();
    } catch (err: any) {
      setCreateError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/redirects/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: editDest,
          title: editTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update redirect');
        setSubmitting(false);
        return;
      }

      setEditingItem(null);
      await fetchRedirects();
    } catch (err: any) {
      setEditError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: RedirectItem) => {
    const newStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/redirects/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchRedirects();
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect? The slug will remain reserved to prevent URL hijacking.')) {
      return;
    }
    try {
      const res = await fetch(`/api/redirects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRedirects();
      }
    } catch (e) {
      console.error('Failed to delete redirect:', e);
    }
  };

  const totalClicks = redirects.reduce((sum, item) => sum + item.click_count, 0);
  const activeCount = redirects.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Links & Redirects
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your permanent URLs, change destinations, and monitor visitors
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Permanent Link</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs uppercase font-semibold text-slate-400">Total Links</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">{redirects.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs uppercase font-semibold text-emerald-400">Active Links</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs uppercase font-semibold text-blue-400">Total Clicks</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalClicks}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs uppercase font-semibold text-purple-400">Bot Shield</span>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-purple-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Turnstile Active</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search links by title, slug, or destination..."
          className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-blue-500 outline-none transition-colors"
        />
      </div>

      {/* Links List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading your redirects from Cloudflare D1...
        </div>
      ) : redirects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl glass-panel p-8 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No redirect links found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Create your first permanent link to protect resumes, portfolios, and projects from breaking.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Redirect</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {redirects.map((item) => {
            const isSuspended = item.status === 'SUSPENDED';
            const isInactive = item.status === 'DISABLED';
            const fullUrl = `${window.location.origin}/r/${item.slug}`;

            return (
              <div
                key={item.id}
                className={`glass-panel rounded-2xl p-5 border transition-all ${
                  isSuspended
                    ? 'border-rose-900/40 bg-rose-950/10'
                    : isInactive
                    ? 'border-slate-800/60 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-slate-100 text-base truncate">{item.title}</h3>
                      {/* Status Badges */}
                      {isSuspended ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/40">
                          Suspended by Admin
                        </span>
                      ) : isInactive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                          Paused
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Active
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.click_count} {item.click_count === 1 ? 'click' : 'clicks'}
                      </span>
                    </div>

                    {/* Permanent URL display */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-400 bg-blue-950/50 px-2 py-1 rounded-md border border-blue-800/30 truncate">
                        /r/{item.slug}
                      </span>
                      <button
                        onClick={() => handleCopy(item.slug)}
                        title="Copy Public URL"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        {copiedSlug === item.slug ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Destination details */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                      <span className="text-slate-500 text-[11px] uppercase font-semibold">Points to:</span>
                      <a
                        href={item.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-slate-300 hover:text-blue-400 flex items-center gap-1 transition-colors"
                      >
                        <span className="truncate">{item.destination_url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/60">
                    <button
                      onClick={() => handleCopy(item.slug)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedSlug === item.slug ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditTitle(item.title);
                        setEditDest(item.destination_url);
                      }}
                      disabled={isSuspended}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setAnalyticsItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Stats</span>
                    </button>

                    <button
                      onClick={() => setQrItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {!isSuspended && (
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          isInactive
                            ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/20 border-slate-800'
                            : 'text-emerald-400 hover:text-amber-400 hover:bg-amber-950/20 border-slate-800'
                        }`}
                        title={isInactive ? 'Enable Redirect' : 'Pause Redirect'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Delete Redirect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold text-slate-100 mb-1">Create Permanent Link</h2>
            <p className="text-xs text-slate-400 mb-6">
              Create a stable URL. You can change where it points at any time.
            </p>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Link Title (e.g. My Resume 2026, Portfolio, GitHub)
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Senior Software Engineer Resume"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Destination URL
                </label>
                <input
                  type="url"
                  required
                  value={createDest}
                  onChange={(e) => setCreateDest(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:border-blue-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Must be a valid HTTP or HTTPS web address.
                </span>
              </div>

              {/* Slug options */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Slug Assignment
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseCustomSlug(!useCustomSlug)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {useCustomSlug ? 'Generate Random Slug Instead' : 'Customize Slug (+)'}
                  </button>
                </div>

                {useCustomSlug ? (
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-800 text-slate-400 border border-r-0 border-slate-700 rounded-l-xl text-xs font-mono">
                      /r/
                    </span>
                    <input
                      type="text"
                      value={createSlug}
                      onChange={(e) => setCreateSlug(e.target.value)}
                      placeholder="resume-2026"
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3.5 py-2.5 rounded-r-xl focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    A cryptographically secure 8-character URL-safe slug will be generated automatically.
                  </p>
                )}
              </div>

              {/* Turnstile Bot Shield */}
              <div className="pt-2">
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onVerify={(token) => setCreateTurnstile(token)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Permanent Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold text-slate-100 mb-1">Update Destination</h2>
            <p className="text-xs text-slate-400 mb-6">
              The public link <code className="text-blue-400 font-mono">/r/{editingItem.slug}</code> will remain unchanged.
            </p>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Link Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Destination URL
                </label>
                <input
                  type="url"
                  required
                  value={editDest}
                  onChange={(e) => setEditDest(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:border-blue-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  This destination change will be saved to your version history for auditability.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save & Propagate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANALYTICS MODAL */}
      {analyticsItem && (
        <AnalyticsModal
          redirectId={analyticsItem.id}
          slug={analyticsItem.slug}
          title={analyticsItem.title}
          onClose={() => setAnalyticsItem(null)}
        />
      )}

      {/* QR MODAL */}
      {qrItem && (
        <QrCodeModal
          slug={qrItem.slug}
          url={`${window.location.origin}/r/${qrItem.slug}`}
          onClose={() => setQrItem(null)}
        />
      )}
    </div>
  );
};
