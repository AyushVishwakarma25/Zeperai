import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Icon } from '../../components/ui/Icon';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { LandingHeader } from './LandingHeader';
import { Footer } from './Footer';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  const isHeaderVisible = useScrollDirection();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#4452FB] selection:text-white flex flex-col">
      <LandingHeader />

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
      <Footer />
    </div>
  );
};
