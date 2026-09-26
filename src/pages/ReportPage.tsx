import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { AlertOctagon, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const { turnstileSiteKey } = useAuth();

  const [slug, setSlug] = useState(paramSlug || '');
  const [reason, setReason] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          reason,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit report');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-8 border border-slate-800 shadow-2xl relative">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Report Received</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 mb-6">
              Thank you for keeping the Redirector ecosystem secure. Our automated security checks and admin moderation team have received this notification and will take necessary action.
            </p>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors inline-block"
            >
              Return to Redirector
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Report Suspicious Link</h1>
                <p className="text-xs text-slate-400">
                  Help prevent phishing, malicious malware, or spam redirects
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reported Slug / Identifier
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-800 text-slate-400 border border-r-0 border-slate-700 rounded-l-xl text-xs font-mono">
                    /r/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. suspicious-link"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3.5 py-2.5 rounded-r-xl focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reason for Report
                </label>
                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this destination is malicious, deceptive, or violates community guidelines..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Bot Check */}
              <div className="pt-2">
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onVerify={(token) => setTurnstileToken(token)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Submitting Report...' : 'Submit Abuse Report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
