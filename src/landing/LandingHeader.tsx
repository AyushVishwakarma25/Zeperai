import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo.js';
import { useScrollDirection } from '../../hooks/useScrollDirection.js';
import { Icon } from '../../components/ui/Icon.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: targetId } });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const isRouteActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <div 
        className={`sticky top-2 md:top-5 z-50 px-3 sm:px-4 max-w-6xl mx-auto transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <nav className="bg-black/95 backdrop-blur-xl border border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-zinc-700/80 rounded-full px-3 py-1.5 md:px-5 md:py-2 relative z-50 transition-all duration-300">
          <div className="flex justify-between items-center gap-2">
            
            {/* Logo with micro-interaction */}
            <div 
              className="flex items-center cursor-pointer shrink-0 transition-transform duration-200 hover:scale-[1.03] active:scale-95 pl-1"
              onClick={handleLogoClick}
              role="button"
              aria-label="ZeperAi Home"
            >
              <BrandLogo variant="full" color="white" className="w-24 md:w-28 h-auto" />
            </div>
            
            {/* Desktop Navigation Links with animated hover triggers from left to right */}
            <div className="hidden lg:flex items-center space-x-1 text-sm font-medium">
              {/* Features Anchor */}
              <Link 
                to="/#features" 
                onClick={(e) => handleScrollTo(e, 'features')}
                className="group relative px-3.5 py-1.5 rounded-full text-zinc-300 hover:text-white transition-colors duration-200 overflow-hidden"
              >
                <span className="relative z-10">Features</span>
                {/* Left-to-right animated hover underline */}
                <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#4452FB] via-indigo-400 to-[#4452FB] rounded-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 pointer-events-none" />
                {/* Left-to-right sheen sweep on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out pointer-events-none rounded-full" />
              </Link>

              {/* Background Remover Free Tool with animated micro-badge */}
              <Link 
                to="/tools/background-remover" 
                className={`group relative px-3.5 py-1.5 rounded-full transition-colors duration-200 overflow-hidden flex items-center gap-1.5 ${
                  isRouteActive('/tools/background-remover') || isRouteActive('/background-remover')
                    ? 'text-white font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <span className="relative z-10">Background Remover</span>
                <span className="relative z-10 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4452FB]/25 text-indigo-300 border border-[#4452FB]/50">
                  Free
                </span>
                {/* Left-to-right animated hover underline */}
                <span className={`absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#4452FB] via-indigo-400 to-[#4452FB] rounded-full origin-left transition-transform duration-300 ease-out pointer-events-none ${
                  isRouteActive('/tools/background-remover') || isRouteActive('/background-remover')
                    ? 'scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100'
                }`} />
                {/* Left-to-right sheen sweep on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out pointer-events-none rounded-full" />
              </Link>

              {/* Pricing Page */}
              <Link 
                to="/pricing" 
                className={`group relative px-3.5 py-1.5 rounded-full transition-colors duration-200 overflow-hidden ${
                  isRouteActive('/pricing')
                    ? 'text-white font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <span className="relative z-10">Pricing</span>
                {/* Left-to-right animated hover underline */}
                <span className={`absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#4452FB] via-indigo-400 to-[#4452FB] rounded-full origin-left transition-transform duration-300 ease-out pointer-events-none ${
                  isRouteActive('/pricing')
                    ? 'scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100'
                }`} />
                {/* Left-to-right sheen sweep on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out pointer-events-none rounded-full" />
              </Link>

              {/* About Us Page */}
              <Link 
                to="/about" 
                className={`group relative px-3.5 py-1.5 rounded-full transition-colors duration-200 overflow-hidden ${
                  isRouteActive('/about')
                    ? 'text-white font-semibold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <span className="relative z-10">About Us</span>
                {/* Left-to-right animated hover underline */}
                <span className={`absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#4452FB] via-indigo-400 to-[#4452FB] rounded-full origin-left transition-transform duration-300 ease-out pointer-events-none ${
                  isRouteActive('/about')
                    ? 'scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100'
                }`} />
                {/* Left-to-right sheen sweep on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out pointer-events-none rounded-full" />
              </Link>
            </div>

            {/* Right Action: Logged In User OR High-Converting Free Credits CTA */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-2 relative" ref={accountMenuRef}>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="group relative overflow-hidden bg-[#4452FB] hover:bg-[#3641C9] text-white px-4 py-2 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow-lg hover:shadow-[#4452FB]/30 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    {/* Left-to-right hover shimmer light beam */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                    <span className="relative z-10">Dashboard</span>
                    <Icon name="arrow-right" className="w-3.5 h-3.5 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>

                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#4452FB]/50 cursor-pointer"
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
                    <div className="absolute right-0 top-12 w-60 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-2 z-50 animate-fade-in text-left">
                      <div className="px-3 py-2.5 border-b border-zinc-800">
                        <p className="text-sm font-bold text-white truncate">{user.name || 'Account'}</p>
                        <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#4452FB]/20 text-indigo-300 text-[10px] font-extrabold rounded uppercase tracking-wider">
                          {user.tier || 'Free'} Tier
                        </span>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setIsAccountMenuOpen(false); navigate('/dashboard'); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Icon name="layout" className="w-4 h-4 text-zinc-400" />
                          <span>Go to Dashboard</span>
                        </button>
                        <button
                          onClick={() => { setIsAccountMenuOpen(false); navigate('/dashboard'); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Icon name="settings" className="w-4 h-4 text-zinc-400" />
                          <span>Account Settings</span>
                        </button>
                      </div>
                      <div className="pt-1 border-t border-zinc-800">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Icon name="log-out" className="w-4 h-4 text-rose-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Primary CTA: "Get 10 Free Credits" with Left-to-Right Hover Animation */
                <button 
                  onClick={() => navigate('/login')}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#4452FB] via-[#5b68ff] to-[#4452FB] bg-[length:200%_100%] text-white px-3.5 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#4452FB]/30 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {/* Left-to-Right light shimmer beam on hover */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative z-10">Get 10 Free Credits</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 shrink-0 hidden sm:inline relative z-10" />
                </button>
              )}
              
              {/* Mobile Animated Hamburger Button */}
              <button 
                className="lg:hidden p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              >
                <div className="w-5 h-4 flex flex-col justify-between items-center relative">
                  <span 
                    className={`h-0.5 w-5 bg-white rounded-full transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`} 
                  />
                  <span 
                    className={`h-0.5 w-5 bg-white rounded-full transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'opacity-0 -translate-x-2' : 'opacity-100'
                    }`} 
                  />
                  <span 
                    className={`h-0.5 w-5 bg-white rounded-full transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                    }`} 
                  />
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Dropdown with Glassmorphic Black Card */}
        {isMobileMenuOpen && (
          <div className="absolute top-14 sm:top-16 left-3 right-3 bg-black/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl rounded-3xl p-5 flex flex-col gap-4 text-left z-50 lg:hidden animate-fade-in transition-all">
            
            {/* Top Tagline */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Navigation</span>
              <span className="text-[11px] font-semibold text-indigo-300 bg-[#4452FB]/20 border border-[#4452FB]/40 px-2 py-0.5 rounded-full">
                ✨ 10 Free Credits on Signup
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              <Link 
                to="/#features" 
                onClick={(e) => handleScrollTo(e, 'features')}
                className="group flex items-center justify-between py-2.5 px-3 rounded-xl text-base font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <span>Features</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" />
              </Link>

              <Link 
                to="/tools/background-remover" 
                className="group flex items-center justify-between py-2.5 px-3 rounded-xl text-base font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span>Background Remover</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Free
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" />
              </Link>

              <Link 
                to="/pricing" 
                className="group flex items-center justify-between py-2.5 px-3 rounded-xl text-base font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Pricing</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" />
              </Link>

              <Link 
                to="/about" 
                className="group flex items-center justify-between py-2.5 px-3 rounded-xl text-base font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>About Us</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" />
              </Link>

              <Link 
                to="/contact" 
                className="group flex items-center justify-between py-2.5 px-3 rounded-xl text-base font-semibold text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Contact</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            </div>

            {/* Bottom User Controls */}
            {user ? (
              <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                  className="w-full bg-[#4452FB] text-white py-3 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <Icon name="arrow-right" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 py-2.5 rounded-2xl font-semibold text-sm cursor-pointer"
                >
                  Account: {user.name || user.email}
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-rose-400 py-2 font-semibold text-sm hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  className="group relative overflow-hidden w-full bg-gradient-to-r from-[#4452FB] to-indigo-600 hover:from-[#3641C9] hover:to-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#4452FB]/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  <Sparkles className="w-4 h-4 text-amber-300 relative z-10" />
                  <span className="relative z-10">Start Free with 10 Credits</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Overlay to catch clicks outside mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};
