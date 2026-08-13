import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Spinner } from '../ui/Spinner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/admin/login', {
        username: username.trim(),
        password: password.trim()
      });

      if (res.data?.token) {
        localStorage.setItem('zeperai_admin_token', res.data.token);
        navigate('/admin');
      } else {
        setError('Login failed: Invalid server response.');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      const message = err.response?.data?.error || 'Invalid admin credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 mb-4">
            <Icon name="lock" className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
            ZeperAI Admin Portal
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Restricted environment for authorized personnel only
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-border-light">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl border border-border-light bg-slate-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border-light bg-slate-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              variant="primary"
              disabled={loading}
              className="py-3 mt-2"
            >
              {loading ? <Spinner className="w-5 h-5" /> : 'Enter Admin Panel'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            ← Return to ZeperAI App
          </button>
        </div>
      </div>
    </div>
  );
}
