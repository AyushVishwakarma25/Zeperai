import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon.js';
import { BrandLogo } from '../../components/ui/BrandLogo.js';

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-950 text-white/70 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800 font-inter">
      <div className="max-w-[1360px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-14 sm:mb-16 text-left">
        
        {/* Brand Column */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-900 shadow-xs">
              <BrandLogo variant="icon" color="dark" className="w-4.5 h-4.5" />
            </div>
            <span className="font-poppins font-bold text-xl tracking-tight text-white">
              ZeperAI <span className="font-inter text-xs text-[#4452FB] font-normal border border-[#4452FB]/30 bg-[#4452FB]/10 px-2 py-0.5 rounded-full">Studio</span>
            </span>
          </div>

          <p className="font-inter text-sm text-gray-400 max-w-sm leading-relaxed mb-6">
            The creative production engine for modern Indian D2C brands. Turn raw product photos into studio-grade campaigns in minutes.
          </p>

          <div className="flex gap-2.5">
            <a
              href="https://www.linkedin.com/company/zeperai/"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              aria-label="Visit ZeperAI on LinkedIn"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-[#4452FB] hover:bg-[#4452FB]/15 transition-all"
            >
              <Icon name="linkedin" className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/zeperai/"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              aria-label="Visit ZeperAI on Instagram"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-[#4452FB] hover:bg-[#4452FB]/15 transition-all"
            >
              <Icon name="instagram" className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Product Column */}
        <div>
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
            Platform
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm font-inter">
            <li>
              <button
                onClick={() => scrollTo('dashboard-snapshot')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Dashboard Studio
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('video-showcase')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Video Walkthrough
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('workflow')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                How It Works
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('comparison')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Why ZeperAI
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('portfolio')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Creative Showcase
              </button>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-[#4452FB] transition-colors block">
                Pricing & Credits
              </Link>
            </li>
          </ul>
        </div>

        {/* Use Cases Column */}
        <div>
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
            Use Cases
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm font-inter">
            <li>
              <button
                onClick={() => scrollTo('use-cases')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                D2C Brand Founders
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('use-cases')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Performance Marketers
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('use-cases')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Creative Agencies
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo('use-cases')}
                className="hover:text-[#4452FB] transition-colors text-left cursor-pointer"
              >
                Amazon & Shopify Stores
              </button>
            </li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
            Legal & Support
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm font-inter">
            <li>
              <Link to="/privacy" className="hover:text-[#4452FB] transition-colors block">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-[#4452FB] transition-colors block">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/cancellation-and-refund" className="hover:text-[#4452FB] transition-colors block">
                Refunds & Cancellations
              </Link>
            </li>
            <li>
              <a href="mailto:support@zeperai.in" className="hover:text-[#4452FB] transition-colors block">
                Contact Support
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-[1360px] mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-inter text-gray-500">
        <div>© {new Date().getFullYear()} ZeperAI Studio. All rights reserved.</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>All generation systems operational</span>
        </div>
      </div>
    </footer>
  );
};
