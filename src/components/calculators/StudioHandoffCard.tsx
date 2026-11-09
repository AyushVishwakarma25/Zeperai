import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.js';

interface StudioHandoffCardProps {
  title: string;
  description: string;
  ctaText?: string;
  studioMode?: 'product' | 'influencer' | 'ugc' | 'batch';
  badge?: string;
  bulletPoints?: string[];
}

export const StudioHandoffCard: React.FC<StudioHandoffCardProps> = ({
  title,
  description,
  ctaText = 'Generate with 10 Free Credits',
  studioMode = 'product',
  badge = 'ZeperAI Studio Accelerator',
  bulletPoints = [
    '10 Free HD Studio Generations',
    'No credit card required',
    'Instant 4K export for Amazon, Blinkit & Meta',
  ],
}) => {
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    user = null;
  }

  const targetPath = user
    ? `/dashboard?mode=${studioMode}`
    : `/login?returnTo=${encodeURIComponent(`/dashboard?mode=${studioMode}`)}`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-6 sm:p-8 shadow-sm">
      {/* Decorative subtle background ambient blur */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>{badge}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {description}
          </p>

          {bulletPoints && bulletPoints.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600 font-medium">
              {bulletPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
          <Link
            to={targetPath}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <span className="text-center text-[11px] text-slate-500 font-medium">
            Takes under 15 seconds • No agency fees
          </span>
        </div>
      </div>
    </div>
  );
};
