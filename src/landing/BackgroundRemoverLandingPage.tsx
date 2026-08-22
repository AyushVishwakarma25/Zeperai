import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import BackgroundRemoverPro from '../../components/tools/BackgroundRemoverPro.js';
import BackgroundRemover from '../../components/tools/BackgroundRemover.js';

interface Props {
  user: any;
  onDeductCredits?: (cost: number) => boolean;
  onRefundCredits?: (cost: number) => void;
}

export const BackgroundRemoverLandingPage: React.FC<Props> = ({ user, onDeductCredits, onRefundCredits }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'pro' ? 'pro' : 'free';
  const [activeTab, setActiveTab] = useState<'free' | 'pro'>(initialTab);

  useEffect(() => {
    if (searchParams.get('tab') === 'pro') {
      setActiveTab('pro');
    } else {
      setActiveTab('free');
    }
  }, [searchParams]);

  const handleTabClick = (tab: 'free' | 'pro') => {
    if (tab === 'pro' && !user) {
      navigate('/login?returnTo=%2Ftools%2Fbackground-remover%3Ftab%3Dpro');
      return;
    }
    setActiveTab(tab);
    setSearchParams(tab === 'pro' ? { tab: 'pro' } : {});
  };

  const handleDeductCredits = (cost: number) => {
    if (!user) {
      navigate('/login?returnTo=%2Ftools%2Fbackground-remover%3Ftab%3Dpro');
      return false;
    }
    if (onDeductCredits) {
      return onDeductCredits(cost);
    }
    return false;
  };

  const handleRefundCredits = (cost: number) => {
    if (user && onRefundCredits) {
      onRefundCredits(cost);
    }
  };

  const scrollToTool = () => {
    const el = document.getElementById('remover-tool');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE] flex flex-col">
      <LandingHeader />

      {/* Hero Section with Tool */}
      <section id="remover-tool" className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4452FB]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-5">
            Products in.<br />
            <span className="bg-gradient-to-r from-[#3641C9] to-[#4452FB] bg-clip-text text-transparent">
              Backgrounds gone.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Drop a product photo and get a clean, transparent cutout in seconds.
          </p>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/60 max-w-4xl mx-auto text-left">
            <div className="flex items-center justify-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 w-fit mx-auto mb-8">
              <button
                onClick={() => handleTabClick('free')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'free'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Free Tier
              </button>
              <button
                onClick={() => handleTabClick('pro')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'pro'
                    ? 'bg-[#4452FB] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Pro Tier
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    activeTab === 'pro' ? 'bg-white/20 text-white' : 'bg-[#4452FB]/10 text-[#4452FB]'
                  }`}
                >
                  HD
                </span>
              </button>
            </div>

            {activeTab === 'free' ? (
              <BackgroundRemover />
            ) : (
              <BackgroundRemoverPro
                onDeductCredits={handleDeductCredits}
                onRefundCredits={handleRefundCredits}
              />
            )}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="border-y border-slate-200/80 bg-slate-50/80 py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 text-center">

          {[
            { value: '<2s', label: 'Average processing time' },
            { value: '99.2%', label: 'Edge accuracy on hair & fur' },
            { value: 'HD', label: 'Full resolution export' },
            { value: '0', label: 'Signups needed for free tier' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#3641C9] text-xs font-bold uppercase tracking-wider mb-2 block">
              Simple Workflow
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              From photo to cutout in three steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Drop your photo',
                desc: 'Upload any JPEG, PNG, or WEBP image — product shots, packaging, or lifestyle photos.',
              },
              {
                step: '02',
                title: 'Automatic edge detection',
                desc: 'The model isolates your subject pixel by pixel, preserving fine details like fabric textures and hair.',
              },
              {
                step: '03',
                title: 'Download transparent PNG',
                desc: 'Get an instant high-resolution transparent image ready for your website or ad campaign.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="text-xs font-bold text-[#4452FB] bg-[#4452FB]/10 px-2.5 py-1 rounded-md w-fit mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="px-4 sm:px-6 pb-20 bg-white">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white p-10 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              Get your first cutout in seconds
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto text-base sm:text-lg font-light leading-relaxed">
              No credit card needed for the free tier. Drop an image above to get a clean transparent background right now.
            </p>
            <button
              onClick={scrollToTool}
              className="bg-[#4452FB] hover:bg-[#3641C9] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#4452FB]/30 text-base"
            >
              Remove background now
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};


