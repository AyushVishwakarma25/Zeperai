import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <div className="mb-6">
            <BrandLogo variant="full" color="white" className="w-32 md:w-40 h-auto" />
          </div>
          <p className="text-sm max-w-sm mb-6">
            ZeperAi is the ultimate Pinterest for ads. Instantly generate high-converting ad creatives, product visuals, and campaigns that drive real ROAS.
          </p>
          <div className="flex gap-4">
            <a href="https://www.linkedin.com/company/zeperai/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-[#4452FB] hover:text-white transition-colors">
              <Icon name="linkedin" className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/zeperai/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-[#4452FB] hover:text-white transition-colors">
              <Icon name="instagram" className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Product</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <div>© {new Date().getFullYear()} ZeperAi. All rights reserved.</div>
        <div className="font-medium text-slate-500">AI is your partner, not your replacement.</div>
      </div>
    </footer>
  );
};
