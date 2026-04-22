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


  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <BrandLogo variant="full" color="black" className="w-40 h-auto" />
          </Link>
        </div>
        
        <div className="bg-white w-full rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2">Log in to your ZeperAi account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput 
              label="Email" 
              id="login-email" 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <FormInput 
              label="Password" 
              id="login-password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-slate-300 text-[#4452FB] focus:ring-[#4452FB]" />
                Remember me
              </label>
              <a href="#" className="text-[#4452FB] font-medium hover:underline transition-colors">Forgot password?</a>
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
              className="!py-3.5 !text-base bg-[#4452FB] hover:bg-[#3641C9] text-white rounded-xl w-full mt-2 font-bold shadow-md hover:shadow-lg transition-all"
            >
              Log in
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">Don't have an account?</span>
            <Link to="/signup" className="text-[#4452FB] font-bold hover:underline transition-colors ml-2">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};