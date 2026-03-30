import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useScrollDirection } from '../../hooks/useScrollDirection';

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHeaderVisible = useScrollDirection();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`sticky top-2 md:top-6 z-50 px-4 md:px-[10%] lg:px-[20%] xl:px-[30%] transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
      <nav className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-full px-4 py-2 md:px-6 md:py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo variant="full" color="black" className="w-24 md:w-32 h-auto" />
          </div>
          
          <div className="hidden md:flex space-x-6">
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
            <Link to="/blog" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Blog</Link>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="bg-[#4452FB] hover:bg-[#3641C9] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            Get Access
          </button>
        </div>
      </nav>
    </div>
  );
};
