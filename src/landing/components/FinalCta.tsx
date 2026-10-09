import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const FinalCta: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Dark Magnetic Card */}
      <div className="relative bg-gray-950 text-white rounded-3xl sm:rounded-[40px] p-8 sm:p-16 lg:p-20 text-center overflow-hidden shadow-2xl border border-gray-800">
        
        {/* Logo Blue Ambient Gradients */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] sm:w-[850px] h-[350px] bg-gradient-to-b from-[#4452FB]/35 via-[#3442E8]/15 to-transparent rounded-full blur-[110px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#4452FB]/20 rounded-full blur-[90px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Headline - Poppins, No Eyebrow */}
          <h2 className="font-poppins text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Start Generating Studio-Quality <br className="hidden sm:inline" />
            <span className="text-[#4452FB]">Ad Creatives Today</span>
          </h2>

          <p className="font-inter text-base sm:text-lg text-gray-300 max-w-xl mx-auto mt-5 leading-relaxed">
            Upload your first raw product photo. Render high-converting variations across 1:1, 4:5, and 9:16 in under 2 minutes.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-9 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white font-inter font-bold text-base shadow-lg shadow-[#4452FB]/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto h-13 sm:h-14 px-7 sm:px-8 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 font-inter font-semibold text-base flex items-center justify-center transition-all cursor-pointer"
            >
              <span>View Plans from ₹499/mo</span>
            </button>
          </div>

          {/* Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10 pt-8 border-t border-white/10 text-xs font-inter text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#4452FB]" />
              Free trial credits on signup
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#4452FB]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#4452FB]" />
              Full commercial IP ownership
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#4452FB]" />
              100% Geometry Fidelity Guaranteed
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
