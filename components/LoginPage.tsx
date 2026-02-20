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
    <div className="min-h-screen w-full bg-main flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Left Side - Brand / Info */}
        <div className="w-full md:w-1/2 bg-black p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
                <div className="mb-8">
                    <BrandLogo variant="full" color="white" className="w-40 h-auto" />
                </div>
                <h1 className="text-4xl md:text-5xl font-batangas font-extrabold tracking-tight leading-tight mb-4 text-white">
                    Creative Intelligence <br/>for Growth.
                </h1>
                <p className="text-lg text-gray-400 font-medium max-w-md">
                    Intelligent, business-grade, brand-aware AI.
                </p>
            </div>
            
            <div className="relative z-10 mt-12 space-y-4">
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                    <div className="bg-white/10 p-1 rounded-full"><Icon name="check-circle" className="w-4 h-4 text-white" /></div>
                    <span>Brand-aware creative intelligence</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                    <div className="bg-white/10 p-1 rounded-full"><Icon name="check-circle" className="w-4 h-4 text-white" /></div>
                    <span>Learns your colors, fonts & tone</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                    <div className="bg-white/10 p-1 rounded-full"><Icon name="check-circle" className="w-4 h-4 text-white" /></div>
                    <span>Campaign-ready outputs in seconds</span>
                </div>
            </div>

            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center overflow-y-auto max-h-[90vh]">
            <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-slate-800 font-batangas">
                    Welcome Back
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    Please enter your details to sign in.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput 
                    label="Email Address" 
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
                    className="!py-3 !text-base mt-4"
                >
                    Sign In
                </Button>
                
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Alternative Access</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        type="button"
                        onClick={handleSkip}
                        fullWidth
                        variant="secondary"
                        className="!py-2 !text-[10px] uppercase tracking-wider"
                    >
                        Guest Mode
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAdminAccess}
                        fullWidth
                        variant="ghost"
                        className="!py-2 !text-[10px] uppercase tracking-wider !bg-slate-100 !text-slate-600 hover:!bg-slate-200"
                    >
                        Admin Bypass
                    </Button>
                </div>

                <div className="text-center pt-4">
                    <p className="text-sm text-slate-600">
                        Don't have an account?
                        <Link to="/signup" className="ml-1 text-primary font-semibold hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};