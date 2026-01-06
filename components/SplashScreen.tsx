import React from 'react';
import { BrandLogo } from './ui/BrandLogo';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white overflow-hidden">
        {/* Background Animated GIF */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
             <img
              src="https://i.pinimg.com/originals/e0/72/79/e072795e2df448bc05973c24237d002d.gif" 
              alt="Loading..."
              className="w-full h-full object-cover"
          />
        </div>
        
        {/* Centered Content */}
        <div className="relative z-10 flex flex-col items-center animate-fade-in-scale-up">
            <div className="mb-6 animate-pulse">
                <BrandLogo variant="full" color="black" className="w-64 h-auto" />
            </div>
            <p className="text-slate-400 text-xs font-semibold tracking-[0.3em] uppercase mt-2">Creative Studio</p>
        </div>
    </div>
  );
};
