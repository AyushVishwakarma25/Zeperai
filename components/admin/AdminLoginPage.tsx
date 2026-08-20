import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Activity, 
  Sparkles, 
  Cpu, 
  Server, 
  Fingerprint, 
  Database,
  HelpCircle,
  Clock
} from 'lucide-react';
import { setAdminAuthSession, getAdminAuthToken } from './adminAuthHelper';
import { BrandLogo } from '../ui/BrandLogo';
import { Spinner } from '../ui/Spinner';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showCredentialHint, setShowCredentialHint] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);

  // Check if session token already valid
  useEffect(() => {
    const token = getAdminAuthToken();
    if (token) {
      axios.get('/api/admin/check', {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        if (res.data?.is_admin) {
          navigate('/admin', { replace: true });
        }
      }).catch(() => {
        // Token invalid, stay on login page
      });
    }
  }, [navigate]);

  // Ping backend for server health check
  useEffect(() => {
    let isMounted = true;
    const checkServerHealth = async () => {
      const startTime = performance.now();
      try {
        await axios.get('/api/health');
        if (isMounted) {
          const latency = Math.round(performance.now() - startTime);
          setServerStatus('online');
          setLastPingTime(latency);
        }
      } catch (e) {
        if (isMounted) {
          setServerStatus('offline');
        }
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Detect Caps Lock
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // Quick fill helper for developers / operators
  const handleAutoFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please enter both administrator username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.post('/api/admin/login', {
        username: cleanUser,
        password: cleanPass
      });

      if (res?.data?.success && res?.data?.token) {
        setAdminAuthSession(res.data.token, res.data.user, rememberMe);
        navigate('/admin', { replace: true });
        return;
      }

      setError(res?.data?.error || 'Invalid administrator credentials.');
    } catch (err: any) {
      const msg = typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : 'Invalid credentials. Please verify your administrator username and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-stretch font-sans selection:bg-[#4452FB] selection:text-white">
      {/* LEFT PANEL: Enterprise Operations & Security Telemetry (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800/80 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4452FB]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Branding */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <BrandLogo variant="full" color="white" className="h-8 w-auto" />
            <span className="text-xs uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              OPS CONSOLE
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            Mission-Critical Platform Control
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md leading-relaxed">
            Centralized governance for user accounts, billing reconciliations, generation pipelines, and security controls.
          </p>
        </div>

        {/* Middle Telemetry & Feature Matrix */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">System Health</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : serverStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-xs font-mono text-slate-400">
                  {serverStatus === 'online' ? `API Online (${lastPingTime}ms)` : serverStatus === 'checking' ? 'Connecting...' : 'Unreachable'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">AUTH PROTOCOL</div>
                  <div className="font-semibold text-slate-200">HMAC-SHA256</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">DATABASE ENGINE</div>
                  <div className="font-semibold text-slate-200">PostgreSQL (RLS)</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <Cpu className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">AI PIPELINE</div>
                  <div className="font-semibold text-slate-200">Gemini 2.5 Flash</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <Fingerprint className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">AUDIT LOGGING</div>
                  <div className="font-semibold text-slate-200">Live Telemetry</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Role Operator Access Control</span>
            </div>
            <p className="leading-relaxed">
              Every administrative query is cryptographically signed and tracked with client fingerprinting, rate-limiting guards, and constant-time authentication.
            </p>
          </div>
        </div>

        {/* Bottom Compliance Tag */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <div className="flex items-center space-x-2">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Zeper AI v2.6 Enterprise Cloud</span>
          </div>
          <span className="font-mono text-slate-400">Strict TLS 1.3 / HSTS</span>
        </div>
      </div>

      {/* RIGHT PANEL: High-Precision Authentication Console */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative bg-slate-900/90 overflow-y-auto">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandLogo variant="full" color="white" className="h-9 w-auto" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Operations Portal</span>
            </div>
          </div>

          {/* Authentication Card */}
          <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/60 relative">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Admin Sign In</h2>
                    <p className="text-xs text-slate-400">Enter authorized credentials to continue</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCredentialHint(!showCredentialHint)}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all text-xs flex items-center space-x-1"
                  title="Credential Quick Help"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Collapsible Credential Quick Hint */}
              <AnimatePresence>
                {showCredentialHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-xs text-slate-300 overflow-hidden"
                  >
                    <div className="flex items-center justify-between font-semibold text-indigo-300 mb-1.5">
                      <span>Operator Fast Fill:</span>
                      <button
                        type="button"
                        onClick={() => handleAutoFill('MadMan', '197325')}
                        className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all"
                      >
                        Autofill Defaults
                      </button>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Accepts default <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">MadMan</code> / <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">197325</code> or custom credentials configured in your environment.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start space-x-3 text-rose-300 text-xs shadow-lg shadow-rose-950/30"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1 font-medium">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Admin Identifier / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. MadMan or admin"
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 hover:bg-slate-900/90 focus:bg-slate-900 border border-slate-800 focus:border-[#4452FB] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/30 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Secret Key / Password
                  </label>
                  {capsLockActive && (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      <span>CAPS LOCK ON</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-3 bg-slate-900 hover:bg-slate-900/90 focus:bg-slate-900 border border-slate-800 focus:border-[#4452FB] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/30 text-sm font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2.5 text-xs text-slate-400 hover:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#4452FB] focus:ring-[#4452FB]/30 focus:ring-offset-slate-950"
                  />
                  <span>Keep session active (7 days)</span>
                </label>

                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Rate Protected</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#4452FB] to-indigo-600 hover:from-[#3744eb] hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-[#4452FB]/25 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] border border-indigo-400/20"
              >
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    <span>Verifying Credentials & Session...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Footer Notice inside card */}
            <div className="mt-6 pt-5 border-t border-slate-900 text-center">
              <div className="inline-flex items-center space-x-1.5 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted with TLS 1.3 & HMAC-SHA256 Tokenization</span>
              </div>
            </div>
          </div>

          {/* Footer Back Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-900/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Zeper AI Public Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

