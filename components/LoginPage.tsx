import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { BrandLogo } from './ui/BrandLogo';
import { FormInput } from './ui/Form';
import { authService, AuthSession } from '../services/authService';
import { SUPABASE_SETUP_SQL } from '../infra/supabaseSetup';
import { SqlHelper } from './dev/SqlHelper';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isDev = (window as any).process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowSql(false);

    // Safety timeout for login UI
    const loginTimeout = setTimeout(() => {
        if (isLoading) {
            setIsLoading(false);
            setError("Login request timed out. The server is taking too long to respond. Please check your internet connection and try again.");
        }
    }, 35000); // Slightly longer than authService timeout

    try {
      const session = await authService.signInWithPassword(email, password);
      clearTimeout(loginTimeout);
      onLoginSuccess(session);
    } catch (err: any) {
      clearTimeout(loginTimeout);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      
      // Check for common Supabase infrastructure errors
      if (
        msg.includes("relation") || 
        msg.includes("trigger") || 
        msg.includes("42P01") || 
        msg.includes("not found")
      ) {
          setShowSql(true);
      }
    } finally {
      // Only clear loading if we haven't timed out (which clears it)
      // But actually, we can just clear it here safely because if timeout fired, isLoading is already false (or will be set to false again, which is fine)
      // Wait, if success, we want to keep loading until unmount? No, usually fine.
      // But if onLoginSuccess triggers unmount, this finally block might run on unmounted component.
      // React handles this gracefully usually, but let's be safe.
      setIsLoading(false);
      clearTimeout(loginTimeout);
    }
  };

  const handleSkip = () => {
    const guestSession: AuthSession = {
        user: {
            id: 'guest-user-id',
            name: 'Guest User',
            email: 'guest@zeperai.com',
            role: 'Creator',
            bio: 'Exploring the studio as a guest.',
            location: 'The Cloud',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`,
            tier: 'Free',
        },
        token: 'guest-token',
        expiresAt: Date.now() + (3600 * 1000), 
    };
    onLoginSuccess(guestSession);
  };

  const handleAdminAccess = () => {
    const adminSession: AuthSession = {
        user: {
            id: 'admin-user-id',
            name: 'Admin User',
            email: 'admin@zeperai.com',
            role: 'Administrator',
            bio: 'Super user with max tier access.',
            location: 'HQ',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`,
            tier: 'Agency', 
        },
        token: 'admin-token',
        expiresAt: Date.now() + (24 * 3600 * 1000), 
    };
    onLoginSuccess(adminSession);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo aligned to the left of the card */}
        <div className="mb-6 flex items-center">
          <Link to="/">
            <BrandLogo variant="full" color="black" className="w-32 h-auto" />
          </Link>
        </div>
        
        <div className="bg-white w-full rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Log in</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput 
              label="Email" 
              id="login-email" 
              type="email" 
              placeholder="Enter email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <FormInput 
              label="Password" 
              id="login-password" 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-slate-300 text-[#4452FB] focus:ring-[#4452FB]" />
                Remember me
              </label>
              <a href="#" className="text-slate-500 hover:text-[#4452FB] transition-colors">Forgot password?</a>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex flex-col items-start">
                <div className="flex items-center">
                  <Icon name="close" className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
                {showSql && isDev && (
                  <SqlHelper sql={SUPABASE_SETUP_SQL} />
                )}
              </div>
            )}

            <Button 
              type="submit" 
              fullWidth 
              isLoading={isLoading} 
              className="!py-3 !text-base bg-[#4452FB] hover:bg-[#3641C9] text-white rounded-xl w-full mt-2"
            >
              Log in
            </Button>
            
            <div className="flex items-center justify-start gap-4 pt-2">
              <span className="text-sm text-slate-500">Log in with</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#4452FB] hover:text-white transition-colors"
                  title="Guest Mode"
                >
                  <Icon name="user" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleAdminAccess}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#4452FB] hover:text-white transition-colors"
                  title="Admin Bypass"
                >
                  <Icon name="shield" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-500">Not registered yet?</span>
            <Link to="/signup" className="text-slate-900 font-semibold hover:text-[#4452FB] transition-colors flex items-center">
              Register <Icon name="arrow-right" className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};