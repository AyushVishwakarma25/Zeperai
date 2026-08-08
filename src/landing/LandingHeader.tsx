import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../../contexts/AuthContext';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHeaderVisible = useScrollDirection();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <div className={`sticky top-2 md:top-6 z-50 px-4 md:px-[10%] lg:px-[15%] xl:px-[25%] transition-transform duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
        <nav className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl shadow-black/5 rounded-full px-4 py-2 md:px-6 md:py-3 relative z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <BrandLogo variant="full" color="black" className="w-24 md:w-32 h-auto" />
            </div>
            
            <div className="hidden md:flex space-x-6 items-center">
              <Link 
                to="/#features" 
                onClick={(e) => handleScrollTo(e, 'features')}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Features
              </Link>
              <Link 
                to="/#how-it-works" 
                onClick={(e) => handleScrollTo(e, 'how-it-works')}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                How It Works
              </Link>
              <Link 
                to="/tools/background-remover" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Background Remover
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2 relative" ref={accountMenuRef}>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-[#4452FB] hover:bg-[#3641C9] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-1.5"
                  >
                    <span>Dashboard</span>
                    <Icon name="arrow-right" className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#4452FB]/30"
                    title="Account Settings"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{(user.name || user.email || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </button>

                  {/* Account Settings Dropdown */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 top-12 w-60 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 animate-fade-in text-left">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'Account'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-[#4452FB] text-[10px] font-extrabold rounded uppercase tracking-wider">
                          {user.tier || 'Free'} Tier
                        </span>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setIsAccountMenuOpen(false); navigate('/dashboard'); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                        >
                          <Icon name="layout" className="w-4 h-4 text-slate-500" />
                          <span>Go to Dashboard</span>
                        </button>
                        <button
                          onClick={() => { setIsAccountMenuOpen(false); navigate('/dashboard'); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                        >
                          <Icon name="settings" className="w-4 h-4 text-slate-500" />
                          <span>Account Settings</span>
                        </button>
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                        >
                          <Icon name="log-out" className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-[#4452FB] hover:bg-[#3641C9] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Get Access
                </button>
              )}
              
              <button 
                className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Icon name={isMobileMenuOpen ? "x" : "menu"} className="w-6 h-6" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-4 right-4 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 text-center z-40 md:hidden animate-fade-in">
            <Link 
              to="/#features" 
              onClick={(e) => handleScrollTo(e, 'features')}
              className="text-base font-medium text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100"
            >
              Features
            </Link>
            <Link 
              to="/#how-it-works" 
              onClick={(e) => handleScrollTo(e, 'how-it-works')}
              className="text-base font-medium text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100"
            >
              How It Works
            </Link>
            <Link 
              to="/tools/background-remover" 
              className="text-base font-medium text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Background Remover
            </Link>
            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                  className="w-full bg-[#4452FB] text-white py-2.5 rounded-xl font-bold text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                  className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold text-sm"
                >
                  Account Settings ({user.name || user.email})
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-red-600 py-2 font-semibold text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                className="w-full bg-[#4452FB] text-white py-2.5 rounded-xl font-bold text-sm mt-2"
              >
                Get Access
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Overlay to catch clicks outside mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};
