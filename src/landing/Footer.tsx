import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon.js';
import { BrandLogo } from '../../components/ui/BrandLogo.js';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 font-manrope">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <div className="mb-6">
            <BrandLogo variant="full" color="white" className="w-32 md:w-40 h-auto" />
          </div>
          <p className="text-sm max-w-sm mb-6 text-zinc-400 font-normal">
            ZeperAI is the AI creative platform for D2C brands and e-commerce leaders. Instantly generate high-converting ad creatives, product visuals, and campaigns that drive real ROAS.
          </p>
          <div className="flex gap-3">
            <a 
              href="https://www.linkedin.com/company/zeperai/" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="ZeperAI on LinkedIn"
              aria-label="Visit ZeperAI on LinkedIn"
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <span className="sr-only">LinkedIn</span>
              <Icon name="linkedin" className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4 text-sm tracking-wide">Product</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link 
                to="/" 
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }} 
                className="hover:text-white transition-colors"
              >
                Features
              </Link>
            </li>
            <li><Link to="/tools/background-remover" className="hover:text-white transition-colors">Background Remover</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm tracking-wide">Company &amp; Legal</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms and Conditions</Link></li>
            <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        <div>© {new Date().getFullYear()} ZeperAI. All rights reserved.</div>
        <div className="font-medium text-zinc-500">AI is your partner, not your replacement.</div>
      </div>
    </footer>
  );
};
