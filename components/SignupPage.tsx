import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { BrandLogo } from './ui/BrandLogo';
import { FormInput } from './ui/Form';
import { authService, AuthSession } from '../services/authService';

export const SignupPage: React.FC<{ onLoginSuccess: (session: AuthSession) => void }> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        setError("Name is required");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const session = await authService.signUpWithPassword(name, email, password);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
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
                    Unlock Your <br/>Creative Potential.
                </h1>
                <p className="text-lg text-gray-400 font-medium max-w-md">
                    The only AI studio designed for high-impact brands.
                </p>
            </div>
            
            <div className="relative z-10 mt-12 space-y-4">
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                    <div className="bg-white/10 p-1 rounded-full"><Icon name="check-circle" className="w-4 h-4 text-white" /></div>
                    <span>Advanced on-model fashion shoots</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                    <div className="bg-white/10 p-1 rounded-full"><Icon name="check-circle" className="w-4 h-4 text-white" /></div>
                    <span>Shopify performance data analysis</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                    <div className="bg-white/10 p-1 rounded-full"><Icon name="check-circle" className="w-4 h-4 text-white" /></div>
                    <span>Global inspiration remixing</span>
                </div>
            </div>

            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center overflow-y-auto max-h-[90vh]">
            <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-slate-800 font-batangas">
                    Create Account
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    Start your creative journey today.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <FormInput 
                    label="Password" 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                {error && (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex items-center">
                        <Icon name="close" className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <Button 
                    type="submit" 
                    fullWidth 
                    isLoading={isLoading} 
                    className="!py-3 !text-base mt-4"
                >
                    Sign Up
                </Button>

                <div className="text-center pt-4">
                    <p className="text-sm text-slate-600">
                        Already have an account?
                        <Link to="/login" className="ml-1 text-primary font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};