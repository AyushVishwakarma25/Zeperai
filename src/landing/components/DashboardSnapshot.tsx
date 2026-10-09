import React, { useState } from 'react';
import { 
  Sliders, 
  Layers, 
  Download, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Maximize2, 
  Camera, 
  SunMedium, 
  ArrowRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

export const DashboardSnapshot: React.FC = () => {
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [selectedScene, setSelectedScene] = useState<string>('Marble Pedestal');
  const [selectedLighting, setSelectedLighting] = useState<string>('Studio Softbox');

  const SCENES = [
    { id: 'Marble Pedestal', label: 'Marble Pedestal' },
    { id: 'Botanical Leaf', label: 'Botanical Leaf' },
    { id: 'Sunlit Vanity', label: 'Sunlit Vanity' },
    { id: 'Minimalist Studio', label: 'Minimalist Studio' },
  ];

  const LIGHTINGS = [
    { id: 'Studio Softbox', label: 'Studio Softbox' },
    { id: 'Golden Hour Sun', label: 'Golden Hour Sun' },
    { id: 'Warm Ambient', label: 'Warm Ambient' },
  ];

  return (
    <section id="dashboard-snapshot" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Section Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Inside the ZeperAI Studio Dashboard
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          Upload 1 product photo. Choose your scene and lighting preset. Render 50+ conversion-focused ad variations in under 60 seconds.
        </p>
      </div>

      {/* Snapshot Mockup Wrapper */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        {/* Top Window Header / Mac-style traffic lights & breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            </div>
            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
              <span className="font-semibold text-gray-900 font-poppins">ZeperAI Studio</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 truncate max-w-[200px] sm:max-w-none">Summer Glow Vitamin C Serum (30ml)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Catalog Ingested</span>
            </span>
            <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md hidden md:inline-block">
              4K Ultra-HD
            </span>
          </div>
        </div>

        {/* Dashboard Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Panel: Controls & Presets */}
          <div className="lg:col-span-4 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              
              {/* Product Asset Preview */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                  1. Raw Product Asset
                </label>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
                    <img 
                      src={landingAssets.skincare} 
                      alt="Raw product asset" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">serum_bottle_raw.png</p>
                    <p className="text-xs text-gray-500">Auto background removed · 100% Geometry Match</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#4452FB] shrink-0" />
                </div>
              </div>

              {/* Scene Environment Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    2. Studio Scene Style
                  </label>
                  <span className="text-xs text-[#4452FB] font-medium">85+ Styles</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SCENES.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border cursor-pointer ${
                        selectedScene === scene.id
                          ? 'bg-[#EEF0FF] border-[#4452FB] text-[#4452FB] font-semibold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {scene.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lighting Preset Selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                  3. Studio Lighting Rig
                </label>
                <div className="flex flex-wrap gap-2">
                  {LIGHTINGS.map((light) => (
                    <button
                      key={light.id}
                      onClick={() => setSelectedLighting(light.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        selectedLighting === light.id
                          ? 'bg-[#4452FB] border-[#4452FB] text-white font-semibold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {light.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Switcher */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                  4. Export Format (Multi-Channel)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1:1', '4:5', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setSelectedRatio(ratio)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium text-center border transition-all cursor-pointer ${
                        selectedRatio === ratio
                          ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ratio} {ratio === '1:1' ? '(Amazon)' : ratio === '4:5' ? '(Feed)' : '(Reel)'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Batch Action Button */}
            <div className="pt-4 border-t border-gray-200">
              <button className="w-full h-11 rounded-xl bg-[#4452FB] hover:bg-[#3442E8] text-white font-semibold text-sm shadow-md shadow-[#4452FB]/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>Render 12 New Variations</span>
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                Turnaround: ~15 seconds · Zero reshoots required
              </p>
            </div>

          </div>

          {/* Center Column: Live 4K Render Viewport */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between items-center bg-gray-100/60 border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Viewport Top Bar */}
            <div className="w-full flex items-center justify-between text-xs text-gray-500 mb-3">
              <span className="font-mono">Viewport: 3840 x 3840 px (4K)</span>
              <div className="flex items-center gap-1.5 text-[#4452FB] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#4452FB] animate-pulse" />
                <span>Live Studio Render</span>
              </div>
            </div>

            {/* Render Canvas Image */}
            <div className="relative w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-200 group">
              <img
                src={landingAssets.skincare}
                alt="ZeperAI Studio Active Render"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Overlay guides */}
              <div className="absolute inset-0 border border-white/20 pointer-events-none" />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                Active: {selectedScene} · {selectedLighting}
              </div>
              <div className="absolute bottom-3 right-3 bg-white/95 text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow-xs border border-gray-200">
                Ratio: {selectedRatio}
              </div>
            </div>

            {/* Quick Action Pills Under Viewport */}
            <div className="w-full mt-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 shadow-2xs font-medium">
                Label geometry: 100% sharp
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 shadow-2xs font-medium">
                Color calibration: D65 standard
              </span>
            </div>
          </div>

          {/* Right Column: Output Batch variations */}
          <div className="lg:col-span-4 p-5 sm:p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-poppins font-bold text-sm text-gray-900">
                  Ready Ad Variations (4)
                </h3>
                <span className="text-xs font-semibold text-emerald-600">All Approved</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Generated across high-converting creative formats for your campaign.
              </p>

              {/* 2x2 Variation Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1.5 hover:border-[#4452FB] transition-all">
                  <div className="aspect-square rounded-lg overflow-hidden relative mb-1.5">
                    <img src={landingAssets.skincare} alt="Variation 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded">1:1 Feed</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 truncate">Clean Studio White</p>
                  <p className="text-[10px] text-gray-500">Amazon & Catalog</p>
                </div>

                <div className="group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1.5 hover:border-[#4452FB] transition-all">
                  <div className="aspect-square rounded-lg overflow-hidden relative mb-1.5">
                    <img src={landingAssets.perfume} alt="Variation 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded">4:5 Feed</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 truncate">Sunlit Water Ripples</p>
                  <p className="text-[10px] text-gray-500">Meta Instagram Ad</p>
                </div>

                <div className="group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1.5 hover:border-[#4452FB] transition-all">
                  <div className="aspect-square rounded-lg overflow-hidden relative mb-1.5">
                    <img src={landingAssets.watch} alt="Variation 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded">9:16 Reel</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 truncate">Luxury Dark Mood</p>
                  <p className="text-[10px] text-gray-500">Meta Reel & Story</p>
                </div>

                <div className="group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1.5 hover:border-[#4452FB] transition-all">
                  <div className="aspect-square rounded-lg overflow-hidden relative mb-1.5">
                    <img src={landingAssets.productStudio} alt="Variation 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded">4:5 Feed</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 truncate">Botanical Marble</p>
                  <p className="text-[10px] text-gray-500">Carousel Ad Set</p>
                </div>
              </div>
            </div>

            {/* Download and Export Buttons */}
            <div className="pt-4 border-t border-gray-200 space-y-2 mt-4">
              <button className="w-full h-10 rounded-xl bg-gray-900 hover:bg-black text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span>Download All 4K Assets (ZIP)</span>
              </button>
              <button className="w-full h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Sync to Meta Ads Manager</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
