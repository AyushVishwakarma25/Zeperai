import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button.js';
import { Icon } from './ui/Icon.js';
import { BrandLogo } from './ui/BrandLogo.js';
import { FormInput } from './ui/Form.js';
import { AuthSession } from '../services/authService.js';
import { useAuth } from '../contexts/AuthContext.js';
import { SUPABASE_SETUP_SQL } from '../infra/supabaseSetup.js';
import { SqlHelper } from './dev/SqlHelper.js';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password mode
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('zeperai_remember_email') || '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('zeperai_remember_email');
  });

  const isDev = (window as any).process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  const getReturnPath = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo && returnTo.startsWith('/')) {
      return returnTo;
    }
    return '/dashboard';
  };

  const sanitizeAuthError = (err: any): string => {
    const msg = typeof err === 'string'
      ? err
      : err?.message
        ? String(err.message)
        : err?.error_description || err?.error || 'Failed to sign in';

    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
      return 'Invalid email or password. Please verify your details and try again.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please verify your email address. Check your inbox for the confirmation link.';
    }
    if (lower.includes('too many requests') || lower.includes('rate limit')) {
      return 'Too many login attempts. Please wait a minute before trying again.';
    }
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('timeout')) {
      return 'Connection timed out. Please check your internet connection and try again.';
    }
    return msg;
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(sanitizeAuthError(err));
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (forgotEmail || email).trim();
    if (!cleanEmail) {
      setError('Please enter your email address to reset password.');
      return;
    }

    setResetLoading(true);
    setError(null);
    setResetSuccess(false);

    try {
      await resetPassword(cleanEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setError(sanitizeAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSql(false);

    try {
      if (rememberMe) {
        localStorage.setItem('zeperai_remember_email', cleanEmail);
      } else {
        localStorage.removeItem('zeperai_remember_email');
      }

      const session = await signIn(cleanEmail, password);
      onLoginSuccess(session);
      navigate(getReturnPath(), { replace: true });
    } catch (err: any) {
      const friendlyMsg = sanitizeAuthError(err);
      setError(friendlyMsg);
      
      const rawStr = String(err?.message || err || '');
      if (
        rawStr.includes("relation") || 
        rawStr.includes("trigger") || 
        rawStr.includes("42P01") || 
        rawStr.includes("not found")
      ) {
        setShowSql(true);
      }
    } finally {
      setIsLoading(false);
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
          {!isForgotPassword ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-slate-500 mt-2">Log in to your ZeperAi account</p>
              </div>

              {/* Social Login Section */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                {isGoogleLoading ? (
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="google" className="w-5 h-5" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 absolute">
                  or
                </span>
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
                
                <div className="relative">
                  <FormInput 
                    label="Password" 
                    id="login-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 text-xs font-medium focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center text-slate-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="mr-2 rounded border-slate-300 text-[#4452FB] focus:ring-[#4452FB]" 
                    />
                    Remember me
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setError(null);
                      setForgotEmail(email);
                      setIsForgotPassword(true);
                    }}
                    className="text-[#4452FB] font-medium hover:underline transition-colors focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3.5 rounded-xl border border-red-100 flex flex-col items-start gap-1">
                    <div className="flex items-start gap-2">
                      <Icon name="close" className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                      <span className="break-words font-medium">{error}</span>
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
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
                <p className="text-slate-500 mt-2 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {resetSuccess ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm text-center">
                    <p className="font-semibold">Reset Link Sent!</p>
                    <p className="mt-1 text-emerald-700">Check your inbox for instructions to reset your password.</p>
                  </div>
                  <Button 
                    type="button" 
                    fullWidth 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetSuccess(false);
                      setError(null);
                    }}
                    className="!py-3 bg-[#4452FB] hover:bg-[#3641C9] text-white rounded-xl font-bold"
                  >
                    Back to Log in
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                  <FormInput 
                    label="Email Address" 
                    id="forgot-email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                      <Icon name="close" className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                      <span className="break-words font-medium">{error}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    fullWidth 
                    isLoading={resetLoading} 
                    className="!py-3.5 !text-base bg-[#4452FB] hover:bg-[#3641C9] text-white rounded-xl w-full font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Send Reset Link
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError(null);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                      ← Back to Log in
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};