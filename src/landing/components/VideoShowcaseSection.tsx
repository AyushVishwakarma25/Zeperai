import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

interface VideoShowcaseSectionProps {
  /**
   * Optional video URL. You can pass a YouTube/Vimeo embed or a direct MP4 URL here.
   */
  videoUrl?: string;
}

export const VideoShowcaseSection: React.FC<VideoShowcaseSectionProps> = ({ videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  return (
    <section id="video-showcase" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Section Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          See ZeperAI Studio in Action
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          Watch how Indian D2C brands turn simple phone photos into high-converting 4K ad variations in under 2 minutes.
        </p>
      </div>

      {/* Main Video Container */}
      <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-gray-200 bg-gray-950 shadow-2xl group">
        
        {/* If user drops in an iframe/video url in future */}
        {videoUrl ? (
          <div className="relative w-full aspect-video">
            <iframe
              src={videoUrl}
              title="ZeperAI Studio Demo Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          /* High-Fidelity Video Showcase Frame (Ready for video drop) */
          <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
            {/* Background Studio Poster Image */}
            <img
              src={landingAssets.productStudio}
              alt="ZeperAI Studio Product Demo Preview"
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105 filter brightness-105' : 'opacity-80 group-hover:scale-102'
              }`}
            />
            
            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 pointer-events-none" />

            {/* Center Play Button Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="group/btn relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white flex items-center justify-center shadow-2xl shadow-[#4452FB]/50 transition-all hover:scale-110 active:scale-95 cursor-pointer mb-4"
                title={isPlaying ? 'Pause demo' : 'Play demo'}
                aria-label={isPlaying ? 'Pause demo' : 'Play demo'}
              >
                {/* Ping wave effect around button */}
                <span className="absolute -inset-2 rounded-full border-2 border-[#4452FB]/50 animate-ping pointer-events-none" />
                
                {isPlaying ? (
                  <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                ) : (
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                )}
              </button>

              <p className="text-white font-poppins font-semibold text-base sm:text-lg tracking-tight">
                Watch 90-Second Product Walkthrough
              </p>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-md">
                Raw Photo Upload → Automated Brand Extraction → 50+ Ad Creatives
              </p>
            </div>

            {/* Top Video Overlay Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs z-20 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 font-medium">
                ZeperAI Studio 2.0 Walkthrough
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 font-mono">
                1:45
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs font-mono text-gray-300 hidden sm:inline-block">
                  {isPlaying ? '0:24 / 1:45' : '0:00 / 1:45'}
                </span>
              </div>

              {/* Progress bar line */}
              <div className="flex-1 mx-4 h-1.5 bg-white/20 rounded-full overflow-hidden hidden sm:block">
                <div 
                  className="bg-[#4452FB] h-full rounded-full transition-all duration-300" 
                  style={{ width: isPlaying ? '35%' : '0%' }}
                />
              </div>

              <div className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>4K Ultra-HD Demo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Under Video */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
          <CheckCircle2 className="w-5 h-5 text-[#4452FB] shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-gray-900 font-poppins">Zero Studio Reshoots</p>
            <p className="text-[11px] text-gray-500">Save ₹50,000+ per catalog shoot</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
          <CheckCircle2 className="w-5 h-5 text-[#4452FB] shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-gray-900 font-poppins">Accurate Product Geometry</p>
            <p className="text-[11px] text-gray-500">Labels, logos and shapes preserved 100%</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
          <CheckCircle2 className="w-5 h-5 text-[#4452FB] shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-gray-900 font-poppins">Multi-Channel Ready</p>
            <p className="text-[11px] text-gray-500">Export in 1:1, 4:5, and 9:16 simultaneously</p>
          </div>
        </div>
      </div>
    </section>
  );
};
