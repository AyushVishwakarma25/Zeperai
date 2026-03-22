import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Icon } from '../../components/ui/Icon';
import { useScrollDirection } from '../../hooks/useScrollDirection';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  const isHeaderVisible = useScrollDirection();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#4452FB] selection:text-white flex flex-col">
      {/* HEADER */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo variant="full" className="w-24 md:w-40 h-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <a href="/#features" className="hover:text-[#4452FB] transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-[#4452FB] transition-colors">How it Works</a>
            <a href="/blog" className="hover:text-[#4452FB] transition-colors">Blog</a>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors">Log in</button>
            <button onClick={() => navigate('/login')} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm">Get Access</button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Terms and Conditions</h1>
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
          <p>Last updated: March 2026</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using ZeperAi's website and services, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. Description of Service</h2>
          <p>ZeperAi provides users with access to a rich collection of resources, including various communications tools, search services, and personalized content through its network of properties (the "Service"). You also understand and agree that the Service may include advertisements and that these advertisements are necessary for ZeperAi to provide the Service.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. User Conduct</h2>
          <p>You understand that all information, data, text, software, music, sound, photographs, graphics, video, messages or other materials ("Content"), whether publicly posted or privately transmitted, are the sole responsibility of the person from which such Content originated. This means that you, and not ZeperAi, are entirely responsible for all Content that you upload, post, email, transmit or otherwise make available via the Service.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Intellectual Property</h2>
          <p>You acknowledge and agree that the Service and any necessary software used in connection with the Service ("Software") contain proprietary and confidential information that is protected by applicable intellectual property and other laws. Except as expressly authorized by ZeperAi, you agree not to modify, rent, lease, loan, sell, distribute or create derivative works based on the Service or the Software, in whole or in part.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Modifications to Service</h2>
          <p>ZeperAi reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that ZeperAi shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.</p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="mb-6 cursor-pointer" onClick={() => navigate('/')}>
              <BrandLogo variant="full" color="white" className="w-32 md:w-40 h-auto" />
            </div>
            <p className="text-sm">Built for creatives, by people who respect your craft.</p>
          </div>
          
          <div className="flex flex-col md:items-center">
            <div className="flex gap-6">
              <a href="/#features" className="hover:text-white transition-colors">Features</a>
              <a href="/blog" className="hover:text-white transition-colors">Blog</a>
            </div>
          </div>
          
          <div className="flex md:justify-end gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
              <Icon name="twitter" className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
              <Icon name="linkedin" className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div>© 2026 ZeperAi · <a href="/privacy" className="hover:text-white">Privacy</a> · <a href="/terms" className="hover:text-white">Terms</a></div>
          <div className="font-medium text-slate-500">AI is your partner, not your replacement.</div>
        </div>
      </footer>
    </div>
  );
};
