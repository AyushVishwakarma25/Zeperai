
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { FormInput } from './ui/Form';
import { authService, AuthSession } from '../services/authService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let session;
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required");
        session = await authService.signUpWithPassword(name, email, password);
      } else {
        session = await authService.signInWithPassword(email, password);
      }
      onLoginSuccess(session);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <Icon name="close" className="w-5 h-5"/>
        </button>

        <div className="p-8 pb-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
                <Icon name="logo" className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
                {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
                {isSignUp ? 'Start creating stunning ads in seconds.' : 'Sign in to access your designs and credits.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {isSignUp && (
                <FormInput 
                    label="Full Name" 
                    id="auth-name" 
                    type="text" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            )}
            <FormInput 
                label="Email Address" 
                id="auth-email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            <FormInput 
                label="Password" 
                id="auth-password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />

            {error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded text-center">
                    {error}
                </div>
            )}

            <Button 
                type="submit" 
                fullWidth 
                isLoading={isLoading} 
                className="!py-3 !text-base mt-2"
            >
                {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="text-center mt-4">
                <p className="text-sm text-slate-600">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button 
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-1 text-primary font-semibold hover:underline"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </form>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">
                By continuing, you agree to KrackXai's Terms of Service and Privacy Policy.
            </p>
        </div>
      </div>
    </div>
  );
};
