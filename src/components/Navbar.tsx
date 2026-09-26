import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRightLeft, ShieldCheck, LayoutDashboard, Shield, LogOut, LogIn, ExternalLink } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Redirector
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                Edge D1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Permanent Link Layer</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Explore
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
                isActive('/admin')
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-900/30'
                  : 'bg-purple-950/20 text-purple-400 border-purple-800/30 hover:bg-purple-900/40 hover:text-purple-200'
              }`}
            >
              <Shield className="w-4 h-4 text-purple-400" />
              Admin Portal
              <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold bg-purple-500 text-purple-950 rounded uppercase">
                Staff
              </span>
            </Link>
          )}

          <Link
            to="/report"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive('/report') ? 'text-amber-300 bg-amber-950/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Report Abuse
          </Link>
        </nav>

        {/* User state / Auth actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700"
                />
                <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate hidden sm:inline">
                  {user.name}
                </span>
                {user.role === 'ADMIN' && (
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/40">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
