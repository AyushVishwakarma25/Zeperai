import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../../../components/ui/BrandLogo.js';
import { Icon } from '../../../components/ui/Icon.js';
import { useAuth } from '../../../contexts/AuthContext.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Subtle border & background blur only when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      if (targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      if (targetId === 'top') {
        navigate('/');
      } else {
        navigate('/', { state: { scrollTo: targetId } });
      }
    }
  };

  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={(e) => handleNavClick(e, 'top')}
          className="flex items-center gap-2.5 group cursor-pointer"
          title="ZeperAI Studio Home"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#4452FB] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-sm">
            <BrandLogo variant="icon" color="white" className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <span className="font-poppins font-bold text-lg sm:text-xl tracking-tight text-[#111827]">
            ZeperAI
            <span className="font-inter text-[#4452FB] font-medium text-xs ml-1.5 px-2 py-0.5 rounded-full border border-[#4452FB]/20 bg-[#4452FB]/5 hidden sm:inline-block">
              Studio
            </span>
          </span>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-inter font-medium text-gray-600">
          <button
            onClick={(e) => handleNavClick(e, 'dashboard-snapshot')}
            className="hover:text-[#4452FB] transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={(e) => handleNavClick(e, 'video-showcase')}
            className="hover:text-[#4452FB] transition-colors cursor-pointer"
          >
            Product Tour
          </button>
          <button
            onClick={(e) => handleNavClick(e, 'workflow')}
            className="hover:text-[#4452FB] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={(e) => handleNavClick(e, 'comparison')}
            className="hover:text-[#4452FB] transition-colors cursor-pointer"
          >
            Why ZeperAI
          </button>
          <Link
            to="/pricing"
            className="hover:text-[#4452FB] transition-colors cursor-pointer"
          >
            Pricing
          </Link>
        </nav>

        {/* Right CTA / Session Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2.5 relative" ref={accountMenuRef}>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#111827] hover:bg-black text-white font-inter font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
              >
                <span>Dashboard</span>
                <Icon name="arrow-right" className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-[#4452FB] flex items-center justify-center text-[#111827] font-inter font-bold text-xs transition-colors cursor-pointer shadow-xs"
                title="Account Settings"
                aria-label="Account Settings"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{(user.name || user.email || 'U').charAt(0).toUpperCase()}</span>
                )}
              </button>

              {/* Account Dropdown */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 shadow-xl rounded-2xl p-2 z-50 text-left font-inter">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-[#111827] truncate">{user.name || 'Account'}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-50 border border-gray-200 text-[#111827] text-[10px] font-mono font-medium rounded-full uppercase">
                      {user.tier || 'Free'} Tier
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setIsAccountMenuOpen(false); navigate('/dashboard'); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#111827] hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <Icon name="layout" className="w-3.5 h-3.5 text-gray-500" />
                      <span>Go to Dashboard</span>
                    </button>
                    <button
                      onClick={() => { setIsAccountMenuOpen(false); navigate('/dashboard'); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#111827] hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <Icon name="settings" className="w-3.5 h-3.5 text-gray-500" />
                      <span>Account Settings</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                    >
                      <Icon name="log-out" className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-inter font-medium text-gray-700 hover:text-[#4452FB] transition-colors px-2 py-1"
              >
                Log in
              </Link>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 h-10 px-5 sm:px-6 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white font-inter font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Start creating free</span>
                <span aria-hidden="true" className="text-white/80">→</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-[#111827] hover:bg-gray-50 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Icon name={isMobileMenuOpen ? 'x' : 'menu'} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-5 pt-3 pb-6 flex flex-col gap-2 font-inter shadow-md">
          <button
            onClick={(e) => handleNavClick(e, 'dashboard-snapshot')}
            className="text-left text-sm font-medium text-[#111827] py-2 border-b border-gray-100"
          >
            Dashboard
          </button>
          <button
            onClick={(e) => handleNavClick(e, 'video-showcase')}
            className="text-left text-sm font-medium text-[#111827] py-2 border-b border-gray-100"
          >
            Product Tour
          </button>
          <button
            onClick={(e) => handleNavClick(e, 'workflow')}
            className="text-left text-sm font-medium text-[#111827] py-2 border-b border-gray-100"
          >
            How it works
          </button>
          <button
            onClick={(e) => handleNavClick(e, 'comparison')}
            className="text-left text-sm font-medium text-[#111827] py-2 border-b border-gray-100"
          >
            Why ZeperAI
          </button>
          <Link
            to="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-left text-sm font-medium text-[#111827] py-2 border-b border-gray-100"
          >
            Pricing
          </Link>
          <div className="pt-3 flex flex-col gap-2.5">
            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium text-gray-700 py-2 hover:text-[#4452FB]"
                >
                  Log in
                </Link>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  className="w-full h-11 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Start creating free</span>
                  <span aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                className="w-full h-11 rounded-full bg-[#111827] text-white text-sm font-medium flex items-center justify-center"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
