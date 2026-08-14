import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAdminAuthSession, getAdminAuthToken } from './adminAuthHelper';
import { Icon } from '../ui/Icon';
import { Spinner } from '../ui/Spinner';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
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
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.post('/api/admin/login', {
        username: username.trim(),
        password: password
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
    <div className="min-h-screen bg-main text-text-primary flex items-center justify-center p-4 font-sans selection:bg-primary selection:text-white">
      <div className="w-full max-w-md">
        {/* Top Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-light border border-primary/20 text-primary shadow-xs mb-4">
            <Icon name="lock" className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-batangas tracking-tight text-text-primary">
            ZeperAI Admin Portal
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Centralized operations & platform control center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border-light rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-600 text-sm">
              <Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <Icon name="user" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-light rounded-xl text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-border-light rounded-xl text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-light bg-white text-primary focus:ring-primary focus:ring-offset-main"
                />
                <span>Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
        <div className="mt-8 text-center text-xs text-text-secondary flex items-center justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center space-x-1"
          >
            <Icon name="arrow-left" className="w-3.5 h-3.5" />
            <span>Return to User App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
