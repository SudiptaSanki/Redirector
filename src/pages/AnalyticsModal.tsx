import React, { useEffect, useState } from 'react';
import { X, Globe2, Smartphone, Monitor, ArrowUpRight, Clock, ShieldCheck, BarChart2 } from 'lucide-react';

interface AnalyticsData {
  totalClicks: number;
  lastAccessedAt: string | null;
  countries: { country: string; count: number }[];
  devices: { device: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  recentEvents: { timestamp: string; country: string; device: string; browser: string; referrer: string }[];
}

interface AnalyticsModalProps {
  redirectId: string;
  slug: string;
  title: string;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ redirectId, slug, title, onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/redirects/${redirectId}/analytics`);
        if (res.ok) {
          const json = await res.json();
          setData(json.analytics);
        }
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [redirectId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            </div>
            <p className="text-xs text-blue-400 font-mono mt-0.5">/r/{slug}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading edge telemetry...
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No telemetry data available for this link yet.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs uppercase font-semibold text-slate-400">Total Visits</span>
                <p className="text-3xl font-extrabold text-blue-400 mt-1">{data.totalClicks}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs uppercase font-semibold text-slate-400">Last Visited</span>
                <p className="text-sm font-medium text-slate-300 mt-2 truncate">
                  {data.lastAccessedAt ? new Date(data.lastAccessedAt).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>

            {/* Countries & Devices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Countries */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                  <span>Top Countries</span>
                </div>
                {data.countries.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No geo data recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {data.countries.map((c) => {
                      const pct = Math.round((c.count / (data.totalClicks || 1)) * 100);
                      return (
                        <div key={c.country} className="text-xs">
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>{c.country}</span>
                            <span className="font-mono text-slate-400">{c.count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Devices */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Device Types</span>
                </div>
                {data.devices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No device data recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {data.devices.map((d) => {
                      const pct = Math.round((d.count / (data.totalClicks || 1)) * 100);
                      return (
                        <div key={d.device} className="text-xs">
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>{d.device}</span>
                            <span className="font-mono text-slate-400">{d.count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Referrers */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                Top Traffic Sources (Referrers)
              </span>
              {data.referrers.length === 0 ? (
                <p className="text-xs text-slate-500">Direct or no referrer header</p>
              ) : (
                <div className="space-y-1.5">
                  {data.referrers.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-none">
                      <span className="text-slate-300 font-mono truncate max-w-[360px]">{r.referrer}</span>
                      <span className="text-slate-400 font-mono">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Click Activity */}
            {data.recentEvents.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                  Recent Visits Stream
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.recentEvents.map((evt, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-none">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono">{evt.country}</span>
                        <span>{evt.device} &bull; {evt.browser}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
