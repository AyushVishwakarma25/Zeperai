import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAdminAuthSession, getAdminAuthToken } from './adminAuthHelper';
import { BrandLogo } from '../ui/BrandLogo';
import { Icon } from '../ui/Icon';
import { Spinner } from '../ui/Spinner';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('MadMan');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in with admin token, verify and redirect to /admin
    const token = getAdminAuthToken();
    if (token) {
      axios.get('/api/admin/check', {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        if (res.data?.is_admin) {
          navigate('/admin', { replace: true });
        }
      }).catch(() => {
        // Token expired or invalid, let them log in
      });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.post('/api/admin/login', {
        username: username.trim(),
        password: password.trim()
      });

      if (res.data?.success && res.data?.token) {
        setAdminAuthSession(res.data.token, res.data.user, rememberMe);
        navigate('/admin', { replace: true });
      } else {
        setError(res.data?.error || 'Authentication failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please verify username and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans selection:bg-[#C8CEFE]">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="full" color="primary" className="h-9 w-auto" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4452FB]/10 text-[#4452FB] border border-[#4452FB]/20 mb-2">
            <Icon name="shield-check" className="w-3.5 h-3.5 text-[#4452FB]" />
            <span>Admin Operations Portal</span>
          </div>
          <p className="text-sm text-slate-500">
            Secure operations & platform management console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-600 text-sm">
              <Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium text-xs">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Admin Username
              </label>
              <div className="relative">
                <Icon name="user" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB] text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB] text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-500 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#4452FB] focus:ring-[#4452FB]"
                />
                <span>Remember active session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#4452FB] hover:bg-[#3442e5] text-white font-bold text-sm shadow-lg shadow-[#4452FB]/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin</span>
                  <Icon name="arrow-right" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-900 transition-colors flex items-center space-x-1.5 font-medium"
          >
            <Icon name="arrow-left" className="w-3.5 h-3.5" />
            <span>Return to User App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
