import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, Lightbulb, CheckCircle2, Wand2, Film, ArrowRight } from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

interface WorkflowStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  image: string;
  metaBadge: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'step-1',
    stepNumber: '01',
    title: 'Store & Catalog Ingestion',
    subtitle: 'Sync your Shopify or upload photos',
    description: 'Paste your product URL or upload raw smartphone packshots. Product details and labels are extracted automatically.',
    icon: <Globe className="w-5 h-5 text-[#4452FB]" />,
    tag: 'INPUT',
    image: landingAssets.productStudio,
    metaBadge: 'Raw Photo Ingestion',
  },
  {
    id: 'step-2',
    stepNumber: '02',
    title: 'Brand DNA & Visual Style',
    subtitle: 'Brand colors and aesthetic matching',
    description: 'Identifies brand colors, packaging textures, and audience visual preferences to ensure on-brand consistency.',
    icon: <Search className="w-5 h-5 text-[#4452FB]" />,
    tag: 'BRANDING',
    image: landingAssets.perfume,
    metaBadge: 'Color & Font Alignment',
  },
  {
    id: 'step-3',
    stepNumber: '03',
    title: 'Creative Angle Strategy',
    subtitle: 'Hook ideation for Indian buyers',
    description: 'Generates proven performance hooks, value props, and seasonal themes built specifically for Indian D2C shoppers.',
    icon: <Lightbulb className="w-5 h-5 text-[#4452FB]" />,
    tag: 'STRATEGY',
    image: landingAssets.watch,
    metaBadge: 'High-CTR Angles',
  },
  {
    id: 'step-4',
    stepNumber: '04',
    title: 'Human Review & Approval',
    subtitle: 'You stay in full creative control',
    description: 'Review drafted scenes and shot lists before generation. Approve or tweak with a single click.',
    icon: <CheckCircle2 className="w-5 h-5 text-[#4452FB]" />,
    tag: 'CONTROL',
    image: landingAssets.skincare,
    metaBadge: '100% Control',
  },
  {
    id: 'step-5',
    stepNumber: '05',
    title: 'Studio Lighting & Staging',
    subtitle: 'Photorealistic studio physics',
    description: 'Adds professional softbox lighting, real marble reflections, and cast shadows while locking 100% product geometry.',
    icon: <Wand2 className="w-5 h-5 text-[#4452FB]" />,
    tag: 'RENDERING',
    image: landingAssets.shoe,
    metaBadge: '4K Studio Quality',
  },
  {
    id: 'step-6',
    stepNumber: '06',
    title: 'Multi-Format Ad Export',
    subtitle: 'Download ready-to-run variations',
    description: 'Get dozens of variations exported simultaneously in 1:1 (Amazon/PDP), 4:5 (Feed), and 9:16 (Reels/Stories).',
    icon: <Film className="w-5 h-5 text-[#4452FB]" />,
    tag: 'EXPORT',
    image: landingAssets.aiInfluencer,
    metaBadge: '1:1 · 4:5 · 9:16 Bundles',
  },
];

export const WorkflowSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeStepId, setActiveStepId] = useState<string>('step-1');
  const activeStep = WORKFLOW_STEPS.find((s) => s.id === activeStepId) || WORKFLOW_STEPS[0];

  return (
    <section id="workflow" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          How ZeperAI Studio Works
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          From a raw photo on your phone to hundreds of studio-grade ad variations in 6 simple steps.
        </p>
      </div>

      {/* Interactive Step-by-Step Walkthrough Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm">
        
        {/* Left Column: Interactive Step Selector */}
        <div className="lg:col-span-6 space-y-3">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = step.id === activeStep.id;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex items-start gap-4 ${
                  isActive
                    ? 'bg-[#EEF0FF] border-[#4452FB] shadow-xs'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Step Number Circle */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-poppins font-bold text-sm transition-colors ${
                    isActive
                      ? 'bg-[#4452FB] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {step.stepNumber}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-poppins font-bold text-base truncate ${
                      isActive ? 'text-gray-900' : 'text-gray-800'
                    }`}>
                      {step.title}
                    </h3>
                    <span className="font-mono text-[10px] font-semibold text-[#4452FB] uppercase px-2 py-0.5 rounded-full bg-[#4452FB]/10">
                      {step.tag}
                    </span>
                  </div>
                  <p className="font-inter text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Step Preview Visual Card */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8 shadow-sm">
            
            {/* Top Bar inside preview */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4452FB]" />
                <span className="font-mono text-xs font-bold text-gray-900 uppercase tracking-wider">
                  STAGE {activeStep.stepNumber} · {activeStep.tag}
                </span>
              </div>
              <span className="font-inter text-xs text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-2xs font-medium">
                {activeStep.metaBadge}
              </span>
            </div>

            {/* Featured Image Screen */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-gray-200 relative shadow-sm group">
              <img
                src={activeStep.image}
                alt={activeStep.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                <span className="text-[11px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  Workflow Preview
                </span>
                <p className="font-poppins text-lg sm:text-xl font-bold mt-0.5">
                  {activeStep.title}
                </p>
                <p className="font-inter text-xs text-white/80 mt-1">
                  {activeStep.subtitle}
                </p>
              </div>
            </div>

            {/* Action Bar below preview */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <p className="font-inter text-xs text-gray-600">
                Test this workflow on your own products with free credits.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto h-10 px-5 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white font-inter font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Try Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
