
import React, { useMemo } from 'react';
import { Icon } from './ui/Icon';
import type { GenerateImageParams } from '../types';
import { AspectRatio } from '../types';

interface CreativeScorecardProps {
  params: GenerateImageParams;
}

export const CreativeScorecard: React.FC<CreativeScorecardProps> = ({ params }) => {
  // Simulate BI Logic based on params
  const analytics = useMemo(() => {
    let score = 65; // Base score
    const recommendations: string[] = [];
    const metrics = {
      predictedCTR: '0.85%',
      conversionScore: 'Avg',
      attentionIndex: 'Medium'
    };

    // Analyze Title
    if (params.adTitle && params.adTitle.length > 0) {
      if (params.adTitle.length < 15) {
        score += 5;
        recommendations.push("Short headlines perform 12% better on Instagram.");
      } else if (params.adTitle.length > 50) {
        score -= 5;
        recommendations.push("Headline is too long. Try shortening under 7 words for higher impact.");
      } else {
        score += 10;
      }
    } else {
        recommendations.push("Add a strong headline to capture attention.");
    }

    // Analyze CTA
    if (params.adCta) {
        score += 10;
        metrics.conversionScore = 'High';
        if (params.adCta.toLowerCase().includes('now') || params.adCta.toLowerCase().includes('free')) {
            score += 5;
            metrics.predictedCTR = '1.2%';
        }
    } else {
        score -= 10;
        metrics.conversionScore = 'Low';
        recommendations.push("Missing Call-to-Action (CTA). This significantly lowers conversion probability.");
    }

    // Analyze Format
    const ratio = params.aspectRatios?.[0];
    if (ratio === AspectRatio.Portrait || ratio === AspectRatio.PortraitPost) {
        score += 5;
        metrics.attentionIndex = 'High';
        recommendations.push("Vertical formats occupy 30% more screen real estate, increasing brand recall.");
    }

    // Cap score
    score = Math.min(98, Math.max(10, score));

    return { score, recommendations, metrics };
  }, [params]);

  const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
  };

  const getRingColor = (score: number) => {
      if (score >= 80) return 'stroke-green-500';
      if (score >= 60) return 'stroke-yellow-500';
      return 'stroke-red-500';
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mt-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
                <Icon name="trending-up" className="w-4 h-4 mr-2 text-primary" />
                Predictive Performance
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">BETA</span>
        </div>

        <div className="flex flex-row gap-6">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center w-24 flex-shrink-0">
                <div className="relative w-20 h-20">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                            className="text-slate-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className={`${getRingColor(analytics.score)} transition-all duration-1000 ease-out`}
                            strokeDasharray={`${analytics.score}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-xl font-bold ${getScoreColor(analytics.score)}`}>{analytics.score}</span>
                        <span className="text-[8px] text-slate-400 uppercase">Score</span>
                    </div>
                </div>
            </div>

            {/* Metrics & Recommendations */}
            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase">Pred. CTR</p>
                        <p className="text-sm font-bold text-slate-800">{analytics.metrics.predictedCTR}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase">Conv. Potential</p>
                        <p className="text-sm font-bold text-slate-800">{analytics.metrics.conversionScore}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase">Attention</p>
                        <p className="text-sm font-bold text-slate-800">{analytics.metrics.attentionIndex}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">AI Optimization Insights</h4>
                    <ul className="space-y-2">
                        {analytics.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start text-xs text-slate-600">
                                <Icon name="lightbulb" className="w-3 h-3 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                                {rec}
                            </li>
                        ))}
                        {analytics.recommendations.length === 0 && (
                            <li className="flex items-start text-xs text-green-600">
                                <Icon name="check-circle" className="w-3 h-3 mr-2 mt-0.5" />
                                Configuration looks optimal for high engagement!
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};
