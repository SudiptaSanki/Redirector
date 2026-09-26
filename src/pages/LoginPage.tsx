import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { ArrowRightLeft, ShieldCheck, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, loginWithOAuth, devLogin, turnstileSiteKey } = useAuth();
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleDevLogin = async (role: 'USER' | 'ADMIN') => {
    setLoading(true);
    await devLogin(role);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border border-slate-800 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Sign In to Redirector</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Manage your permanent links, destinations, and telemetry
          </p>
        </div>

        {/* Turnstile Bot Protection */}
        <div className="mb-6">
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onVerify={(token) => setTurnstileToken(token)}
          />
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => loginWithOAuth('github')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>

          <button
            onClick={() => loginWithOAuth('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.26 21.3 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.98 0 12s.46 3.82 1.26 5.41l4.02-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Demo / Sandbox Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Demo / Sandbox Mode
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.5 rounded font-mono">
              instant
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Test the application immediately without configuring live Google or GitHub OAuth secrets:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDevLogin('USER')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Standard User</span>
            </button>
            <button
              onClick={() => handleDevLogin('ADMIN')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 text-xs font-semibold border border-purple-800/40 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
