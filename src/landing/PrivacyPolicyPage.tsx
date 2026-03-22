import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Icon } from '../../components/ui/Icon';
import { useScrollDirection } from '../../hooks/useScrollDirection';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const isHeaderVisible = useScrollDirection();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#4452FB] selection:text-white flex flex-col">
      {/* HEADER */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo variant="full" className="w-24 md:w-40 h-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link to="/#features" className="hover:text-[#4452FB] transition-colors">Features</Link>
            <Link to="/#how-it-works" className="hover:text-[#4452FB] transition-colors">How it Works</Link>
            <Link to="/blog" className="hover:text-[#4452FB] transition-colors">Blog</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors">Log in</button>
            <button onClick={() => navigate('/login')} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm">Get Access</button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
          <p>Last updated: March 2026</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Introduction</h2>
          <p>Welcome to ZeperAi. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. The Data We Collect About You</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
            <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. How We Use Your Personal Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Data Security</h2>
          <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Contact Us</h2>
          <p>If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@zeperai.com.</p>
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
              <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
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
          <div>© 2026 ZeperAi · <Link to="/privacy" className="hover:text-white">Privacy</Link> · <Link to="/terms" className="hover:text-white">Terms</Link></div>
          <div className="font-medium text-slate-500">AI is your partner, not your replacement.</div>
        </div>
      </footer>
    </div>
  );
};
