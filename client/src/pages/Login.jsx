import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo.analyst@trustshield.io');
    setPassword('TrustShield2026!');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gradients for subtle cyber aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-white">
          Sign In to <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">TrustShield AI</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          AI-Powered Threat Detection & Contextual PII Redaction
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#111827]/90 border border-slate-800/80 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-xl">
          
          {/* Quick Demo Pre-fill helper */}
          <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Testing out? Click to fill test credentials</span>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 rounded font-medium border border-indigo-500/30 transition"
            >
              Fill Demo
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@enterprise.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0B0F19] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#0B0F19] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/25 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Access Suite</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-5">
            <p className="text-xs text-slate-400">
              Need a new enterprise tenant account?{' '}
              <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;

