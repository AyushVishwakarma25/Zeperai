import React, { useState } from 'react';
import BackgroundRemover from './BackgroundRemover';
import BackgroundRemoverPro from './BackgroundRemoverPro';
import { View } from '../../types';

interface BackgroundRemoverToolProps {
  onSetView: (view: View) => void;
  onToggleSidebar: () => void;
  userTier: 'Free' | 'PayAsYouGo' | 'Pro';
  onDeductCredits: (cost: number) => boolean;
  onRefundCredits: (cost: number) => void;
}

export const BackgroundRemoverTool: React.FC<BackgroundRemoverToolProps> = ({
  onToggleSidebar,
  userTier,
  onDeductCredits,
  onRefundCredits
}) => {
  const [activeTab, setActiveTab] = useState<'free' | 'pro'>('free');

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-border-light h-16 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 font-display">Background Remover</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Tab Switcher */}
          <div className="flex items-center justify-center space-x-2 bg-slate-200/50 p-1 rounded-xl w-fit mx-auto">
            <button
              onClick={() => setActiveTab('free')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'free' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Free Tier
            </button>
            <button
              onClick={() => setActiveTab('pro')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'pro' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Pro Tier
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${activeTab === 'pro' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                GPU
              </span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {activeTab === 'free' ? (
              <BackgroundRemover />
            ) : (
              <BackgroundRemoverPro 
                onDeductCredits={onDeductCredits} 
                onRefundCredits={onRefundCredits} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
