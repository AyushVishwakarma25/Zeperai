import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon.js';
import { BrandLogo } from '../../components/ui/BrandLogo.js';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 font-manrope">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
        {/* Col 1: Brand & Bio */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-4">
            <BrandLogo variant="full" color="white" className="w-32 md:w-36 h-auto" />
          </div>
          <p className="text-xs sm:text-sm max-w-sm mb-5 text-zinc-400 font-normal leading-relaxed">
            ZeperAI is the AI creative platform for D2C brands and e-commerce leaders. Instantly generate high-converting ad creatives, product visuals, and campaigns that drive real ROAS.
          </p>
          <div className="flex gap-2.5">
            <a 
              href="https://www.linkedin.com/company/zeperai/" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="ZeperAI on LinkedIn"
              aria-label="Visit ZeperAI on LinkedIn"
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <span className="sr-only">LinkedIn</span>
              <Icon name="linkedin" className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        
        {/* Col 2: Product */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Product</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
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
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            <li><Link to="/signup" className="hover:text-white transition-colors">Get Started Free</Link></li>
          </ul>
        </div>

        {/* Col 3: Free Calculators & Tools */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>Calculators &amp; Tools</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold normal-case">
              Free
            </span>
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li>
              <Link to="/tools" className="hover:text-white transition-colors text-emerald-400 font-medium">
                Free Tools Directory
              </Link>
            </li>
            <li>
              <Link to="/tools/roas-rto-calculator" className="hover:text-white transition-colors">
                D2C ROAS &amp; RTO Calculator
              </Link>
            </li>
            <li>
              <Link to="/tools/meta-creative-fatigue" className="hover:text-white transition-colors">
                Meta Ad Creative Fatigue
              </Link>
            </li>
            <li>
              <Link to="/tools/quick-commerce-margin-calculator" className="hover:text-white transition-colors">
                Quick-Commerce Margins
              </Link>
            </li>
            <li>
              <Link to="/tools/background-remover" className="hover:text-white transition-colors">
                AI Background Remover
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Company & Legal */}
        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Company &amp; Legal</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
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
