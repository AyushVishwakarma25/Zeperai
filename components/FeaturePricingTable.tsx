import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { ImageModel } from '../types';

interface FeaturePricingTableProps {
  onOpenPricingModal?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

export const ALL_IMAGE_MODELS = [
  {
    value: ImageModel.Imagen3Fast,
    name: 'Imagen 3 Fast',
    apiModel: 'Google Gemini 2.5 Flash',
    credits: 1,
    badge: 'Eco / Speed',
    badgeColor: 'bg-[#4452FB]/10 text-[#4452FB]',
    description: 'Fastest generation speed. Ideal for rapid iteration, drafts, and high-volume concept testing.',
  },
  {
    value: ImageModel.Imagen3HighQuality,
    name: 'Imagen 3 High Quality',
    apiModel: 'Google Gemini 3.1 Flash',
    credits: 2,
    badge: 'Recommended',
    badgeColor: 'bg-[#4452FB]/10 text-[#4452FB]',
    description: 'Balanced photorealism, enhanced lighting, fine textures, and accurate text overlay.',
  },
  {
    value: ImageModel.NanoBananaPro,
    name: 'Nano Banana Pro',
    apiModel: 'Gemini 3 Pro Vision',
    credits: 3,
    badge: 'New 🍌',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    description: 'Advanced vision engine with exceptional prompt adherence and natural artistic composition.',
  },
  {
    value: ImageModel.Imagen3Pro,
    name: 'Imagen 3 Pro',
    apiModel: 'Google Gemini 3 Pro',
    credits: 4,
    badge: 'Pro Flagship',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Google\'s flagship model for hyper-realistic lighting, intricate textures, and ultra-high details.',
  },
  {
    value: ImageModel.NanoBanana2,
    name: 'Nano Banana 2',
    apiModel: 'Banana V2 Creative',
    credits: 5,
    badge: 'New 🍌',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    description: 'Next-gen creative engine tuned for hyper-vivid colors, striking contrasts, and cinematic style.',
  },
  {
    value: ImageModel.DallE3,
    name: 'DALL-E 3',
    apiModel: 'OpenAI ChatGPT DALL-E 3',
    credits: 6,
    badge: 'OpenAI',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'OpenAI\'s premium creative model. Excellent for complex multi-element compositions and graphic layout.',
  },
];

export const FEATURE_CREDIT_RATES = [
  {
    feature: 'Product Studio Photography',
    cost: '1 - 6 Credits / image',
    details: 'Varies by selected AI Model (Fast=1, HQ=2, Pro=4, DALL-E 3=6).',
  },
  {
    feature: 'Fashion & Ghost Mannequin Shoot',
    cost: '1 - 6 Credits / pose',
    details: 'Generates model or mannequin poses across all selected aspect ratios.',
  },
  {
    feature: 'AI Influencer & Persona Studio',
    cost: '1 - 6 Credits / image',
    details: 'Supports hyper-realistic facial consistency and custom model seeds.',
  },
  {
    feature: 'Ad Creative & Marketing Banners',
    cost: '1 - 6 Credits / ad',
    details: 'Auto-generates layout, CTA badges, and brand color alignment.',
  },
  {
    feature: 'Pro Background Removal',
    cost: '2 Credits / process',
    details: 'HD AI cutout with precision edge detection for hair and intricate details.',
  },
  {
    feature: 'AI Content & Copywriting',
    cost: '1 - 2 Credits / generation',
    details: 'Produces Instagram captions, ad headlines, hashtags, and rewrites.',
  },
  {
    feature: 'Brand Strategy & Moodboard Analysis',
    cost: '1 Credit / analysis',
    details: 'Analyzes logos and outputs full brand identity token sheets.',
  },
  {
    feature: 'A/B Testing & Image Remixing',
    cost: '1 - 2 Credits / test',
    details: 'Generates split-test visual hypotheses and element swaps.',
  },
];

export const FeaturePricingTable: React.FC<FeaturePricingTableProps> = ({
  onOpenPricingModal,
  onClose,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'features'>('models');

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${compact ? 'p-3' : 'p-4 sm:p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4452FB]/10 text-[#4452FB] flex items-center justify-center font-bold">
            <Icon name="sparkles" className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Feature & Model Pricing Table
            </h3>
            <p className="text-xs text-slate-500">
              Transparent credit rates across all AI models and studio tools
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenPricingModal && (
            <Button
              variant="primary"
              onClick={onOpenPricingModal}
              className="!py-1.5 !px-3 !text-xs font-bold"
            >
              Get More Credits
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'models'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          AI Generation Models (6 Offered)
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'features'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Studio Features & Rates
        </button>
      </div>

      {/* Tab 1: AI Models */}
      {activeTab === 'models' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_IMAGE_MODELS.map((model) => (
              <div
                key={model.value}
                className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 flex flex-col justify-between hover:border-[#4452FB]/30 hover:bg-slate-50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                    <span className="text-xs font-black text-[#4452FB] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                      {model.credits} {model.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mb-0.5">{model.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">{model.apiModel}</p>
                  <p className="text-[11px] text-slate-600 leading-snug">{model.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic text-center pt-2">
            * Select your preferred model in any image studio before generating.
          </p>
        </div>
      )}

      {/* Tab 2: Feature Rates */}
      {activeTab === 'features' && (
        <div className="space-y-3">
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            {FEATURE_CREDIT_RATES.map((item, idx) => (
              <div key={idx} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{item.feature}</h4>
                  <p className="text-[11px] text-slate-500">{item.details}</p>
                </div>
                <span className="text-xs font-extrabold text-[#4452FB] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0 self-start sm:self-center">
                  {item.cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturePricingTable;
