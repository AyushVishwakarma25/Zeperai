import React from 'react';
import { LandingHeader } from './LandingHeader';
import { Footer } from './Footer';
import { Icon } from '../../components/ui/Icon';
import { useNavigate } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE]">
      <LandingHeader />
      
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600">
            Choose the plan that fits your brand's growth. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
            <p className="text-slate-500 mb-6">Perfect for new brands testing the waters.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900">$29</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">100 AI Image Generations</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Standard Resolution</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">1 Brand Kit</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Basic Ad Copy Generation</span>
              </li>
            </ul>
            <button onClick={() => navigate('/signup')} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors">
              Start Free Trial
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#4452FB] text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <p className="text-slate-400 mb-6">For growing brands scaling their ad spend.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">$79</span>
              <span className="text-slate-400">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-[#4452FB] shrink-0 mt-0.5" />
                <span className="text-slate-300">500 AI Image Generations</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-[#4452FB] shrink-0 mt-0.5" />
                <span className="text-slate-300">High-Res Downloads (4K)</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-[#4452FB] shrink-0 mt-0.5" />
                <span className="text-slate-300">5 Brand Kits</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-[#4452FB] shrink-0 mt-0.5" />
                <span className="text-slate-300">Advanced Ad Copy & A/B Testing</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-[#4452FB] shrink-0 mt-0.5" />
                <span className="text-slate-300">Priority Support</span>
              </li>
            </ul>
            <button onClick={() => navigate('/signup')} className="w-full py-3 px-4 bg-[#4452FB] hover:bg-[#3641C9] text-white font-bold rounded-xl transition-colors">
              Get Pro
            </button>
          </div>

          {/* Agency Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Agency</h3>
            <p className="text-slate-500 mb-6">For agencies managing multiple clients.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900">$199</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Unlimited AI Generations</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Unlimited Brand Kits</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Shopify Analytics Integration</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">Custom API Access</span>
              </li>
            </ul>
            <button onClick={() => navigate('/signup')} className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
