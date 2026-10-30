import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Scan,
  LayoutDashboard,
  History,
  LogOut,
  User as UserIcon,
  Sparkles,
  Lock
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Threat Scanner', path: '/scanner', icon: Scan },
    { name: 'Audit History', path: '/history', icon: History },
  ];

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition duration-300">
                <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  TrustShield <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                  Privacy & Threat Engine
                </span>
              </div>
            </Link>

            {/* Quick Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Zero Raw-Storage Privacy</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                    isActive
                      ? 'bg-indigo-600/15 text-cyan-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & User Profile */}
          <div className="flex items-center space-x-3">
            <Link
              to="/scanner"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition duration-150 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Scan</span>
            </Link>

            {/* User Dropdown / Info */}
            <div className="flex items-center pl-3 border-l border-slate-800 space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">
                  {user?.name || 'Security Analyst'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {user?.email || 'user@trustshield.io'}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4 text-slate-400" />
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-[#0B0F19]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 text-xs font-medium transition ${
                isActive ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;
