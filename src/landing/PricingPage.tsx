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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col group hover:border-[#4452FB]/30">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Trial</h3>
            <p className="text-slate-500 mb-6 text-sm">Perfect for exploring our AI capabilities.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900">₹0</span>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100 flex items-center justify-center">
                <Icon name="stack" className="w-5 h-5 mr-2 text-[#4452FB]" />
                <span className="font-bold text-slate-700">50 Credits</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">50 Credits on signup</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">Access to standard models</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">Community support</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <Icon name="info" className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-xs italic">Restricted Pro Features</span>
              </li>
            </ul>
            <button onClick={() => navigate('/signup')} className="w-full py-4 px-4 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl transition-all shadow-lg shadow-slate-200">
              Try for Free
            </button>
          </div>

          {/* Pay As You Go (Highlight) */}
          <div className="bg-[#4452FB] border border-[#4452FB] rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-6">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-[#4452FB] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl">
              All Features Unlocked
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pay As You Go</h3>
            <p className="text-blue-100 mb-6 text-sm opacity-90">No monthly commitment. Professional results.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">₹499</span>
              <span className="text-blue-100 text-sm ml-1">one-time</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 mb-6 text-center border border-white/20 flex items-center justify-center">
                <Icon name="sparkles" className="w-5 h-5 mr-2 text-white" />
                <span className="font-bold text-white text-lg">150 Credits</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="text-white text-sm">150 Credits instantly</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="text-white text-sm font-semibold">Unlock all Pro models</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="text-white text-sm">Priority Generation Speed</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="text-white text-sm">Commercial Usage Rights</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="check" className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="text-white text-sm">Full Batch Generation Support</span>
              </li>
            </ul>
            <button onClick={() => navigate('/signup')} className="w-full py-4 px-4 bg-white text-[#4452FB] hover:bg-blue-50 font-black rounded-xl transition-all shadow-xl">
              Buy 150 Credits
            </button>
          </div>
        </div>

        {/* Pay As You Go Section */}
        <div className="mt-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
             <h4 className="font-bold text-slate-800 mb-6 flex items-center text-sm uppercase tracking-wide">
                <Icon name="info" className="w-4 h-4 mr-2 text-[#4452FB]"/>
                Credit Cost Estimation
            </h4>
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Standard Image Generation</span> 
                    <span className="font-bold text-slate-900">1 Credit</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Pro Image (High Res / High Context)</span> 
                    <span className="font-bold text-slate-900">4 Credits</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">AI Copywriting / Content Assist</span> 
                    <span className="font-bold text-slate-900">2 Credits</span>
                </div>
                <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 italic">
                  * Bulk generations are calculated per image. Pro models provide better adherence to details.
                </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 flex flex-col justify-center relative overflow-hidden group hover:border-[#4452FB]/50 transition-colors shadow-sm">
            <div className="flex justify-between items-center mb-2 relative z-10">
                <h4 className="font-bold text-slate-800 text-lg">Pay As You Go</h4>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full border border-green-200 uppercase tracking-widest">No Expiry</span>
            </div>
            <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                <p className="text-sm text-slate-500 max-w-[200px]">Instant top-up credits. Perfect for testing or one-off projects.</p>
                <div className="text-right">
                    <span className="block font-black text-slate-900 text-3xl">₹200</span>
                    <span className="text-sm font-bold text-slate-400">25 Credits</span>
                </div>
            </div>
            <button onClick={() => navigate('/signup')} className="w-full py-4 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-1 shadow-sm relative z-10">
                Top Up Now
            </button>
            <Icon name="sparkles" className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 group-hover:text-[#4452FB]/5 transition-colors z-0" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
