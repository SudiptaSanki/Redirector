import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Lightfall from '../components/Lightfall';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightLeft,
  ShieldCheck,
  Zap,
  History,
  BarChart3,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [demoDestination, setDemoDestination] = useState('https://github.com/new-username');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const simulateRedirect = () => {
    setTestResult(`302 Found ➔ Instant edge redirect to: ${demoDestination}`);
    setTimeout(() => setTestResult(null), 4000);
  };

  const demoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/resume`
    : 'https://redirectome.pages.dev/r/resume';

  const copyDemoLink = () => {
    navigator.clipboard.writeText(demoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Lightfall WebGL Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <Lightfall
          colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
          backgroundColor="#020617"
          speed={0.4}
          streakCount={2}
          streakWidth={1}
          streakLength={1}
          glow={1}
          density={0.5}
          twinkle={1}
          zoom={3}
          backgroundGlow={0.4}
          opacity={0.85}
          mouseInteraction
          mouseStrength={0.5}
          mouseRadius={1}
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 backdrop-blur-xl mb-6 shadow-lg shadow-blue-900/10">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Cloudflare Pages + D1 Edge Database + Turnstile</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="block text-slate-100">One Permanent Link.</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Change Destination Anytime.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-400 leading-relaxed mb-10">
          Stop worrying about outdated resumes, portfolios, hackathon projects, or printed business cards.
          Publish a stable Redirector link once, and update where it points whenever your life evolves.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 text-base"
          >
            <span>{user ? 'Open Dashboard' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/SudiptaSanki/Redirector"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 backdrop-blur-xl transition-all hover:text-white"
          >
            <span>Open Source Core</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Interactive Simulator Card */}
        <div className="max-w-2xl mx-auto rounded-2xl glass-panel p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-slate-200 text-sm">Interactive Edge Simulator</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              302 Found
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Permanent Published URL (Never changes):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={demoUrl}
                  className="flex-1 bg-slate-950/80 border border-slate-800 text-blue-400 font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none"
                />
                <button
                  onClick={copyDemoLink}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Current Destination in D1 Database:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={demoDestination}
                  onChange={(e) => setDemoDestination(e.target.value)}
                  placeholder="https://github.com/your-username"
                  className="flex-1 bg-slate-950/80 border border-slate-800 text-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:border-blue-500 outline-none transition-colors"
                />
                <button
                  onClick={simulateRedirect}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors"
                >
                  Simulate
                </button>
              </div>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono">{testResult}</span>
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 text-left">
          <div className="glass-card p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base mb-1">Sub-10ms Edge Fast Path</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Global routing powered by Cloudflare edge functions for instant 302 redirects with zero cold start.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base mb-1">Turnstile Bot Shield</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated Cloudflare Turnstile blocks automated abuse, spam redirects, and phishing bots effortlessly.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base mb-1">Cloudflare D1 Database</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serverless SQLite distributed right at the edge with version history tracking every destination edit.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base mb-1">Privacy Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Non-invasive click counts, geographic origins, and device statistics recorded asynchronously.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Redirector — Open source, edge-native redirect layer. Deployed on Cloudflare Pages & Workers.</p>
      </footer>
    </div>
  );
};
