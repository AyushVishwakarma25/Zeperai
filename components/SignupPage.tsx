import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button.js';
import { Icon } from './ui/Icon.js';
import { BrandLogo } from './ui/BrandLogo.js';
import { FormInput } from './ui/Form.js';
import { AuthSession } from '../services/authService.js';
import { useAuth } from '../contexts/AuthContext.js';

export const SignupPage: React.FC<{ onLoginSuccess: (session: AuthSession) => void }> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        : err?.error_description || err?.error || 'Registration failed';

    const lower = msg.toLowerCase();
    if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('email already')) {
      return 'An account with this email already exists. Please log in instead.';
    }
    if (lower.includes('password') && (lower.includes('short') || lower.includes('least') || lower.includes('characters'))) {
      return 'Password must be at least 6 characters long.';
    }
    if (lower.includes('too many requests') || lower.includes('rate limit')) {
      return 'Too many attempts. Please wait a minute before trying again.';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }
    if (!cleanEmail) {
      setError("Email address is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const session = await signUp(cleanName, cleanEmail, password);
      onLoginSuccess(session);
      navigate(getReturnPath(), { replace: true });
    } catch (err: any) {
      setError(sanitizeAuthError(err));
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-slate-500 mt-2">Start your creative journey today.</p>
          </div>

          {/* Social Signup Section */}
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
            <span>Sign up with Google</span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 absolute">
              or
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput 
              label="Full Name" 
              id="signup-name" 
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <FormInput 
              label="Email Address" 
              id="signup-email" 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <FormInput 
                label="Password" 
                id="signup-password" 
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

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3.5 rounded-xl border border-red-100 flex items-start gap-2">
                <Icon name="close" className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                <span className="break-words font-medium">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              fullWidth 
              isLoading={isLoading} 
              className="!py-3.5 !text-base bg-[#4452FB] hover:bg-[#3641C9] text-white rounded-xl w-full mt-2 font-bold shadow-md hover:shadow-lg transition-all"
            >
              Sign Up
            </Button>

            <div className="mt-8 text-center text-sm">
              <span className="text-slate-500">Already have an account?</span>
              <Link to="/login" className="text-[#4452FB] font-bold hover:underline transition-colors ml-2">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};