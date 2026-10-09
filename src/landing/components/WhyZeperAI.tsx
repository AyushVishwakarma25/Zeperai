import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  traditionalAgency: string;
  genericAiTools: string;
  zeperaiStudio: string;
  isHighlight?: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: 'Cost Per Campaign Set',
    traditionalAgency: '₹50,000 – ₹1,50,000 per shoot',
    genericAiTools: '₹1,500 – ₹3,500 / mo',
    zeperaiStudio: 'From ₹499/mo (Free trial included)',
    isHighlight: true,
  },
  {
    dimension: 'Turnaround Time',
    traditionalAgency: '2 – 4 weeks delivery',
    genericAiTools: 'Instant output',
    zeperaiStudio: 'Under 2 minutes for 50+ variations',
    isHighlight: true,
  },
  {
    dimension: 'Product Geometry & Label Fidelity',
    traditionalAgency: 'Accurate (physical photos)',
    genericAiTools: 'Warps labels, fonts & packaging',
    zeperaiStudio: '100% Geometry Fidelity Guaranteed',
    isHighlight: true,
  },
  {
    dimension: 'Approval Control',
    traditionalAgency: 'Slow email revision rounds',
    genericAiTools: 'Random slot-machine output',
    zeperaiStudio: 'Review & approve before rendering',
    isHighlight: true,
  },
  {
    dimension: 'Performance Ad Angles',
    traditionalAgency: 'Manual brief preparation',
    genericAiTools: 'Generic art prompts only',
    zeperaiStudio: 'Built-in high-CTR angles for D2C',
  },
  {
    dimension: 'Multi-Format Export',
    traditionalAgency: 'Extra fee for each resize',
    genericAiTools: 'Limited to single ratio',
    zeperaiStudio: 'Simultaneous 1:1, 4:5, and 9:16 export',
  },
  {
    dimension: 'Commercial IP Rights',
    traditionalAgency: 'Complex model usage contracts',
    genericAiTools: 'Unclear commercial licensing',
    zeperaiStudio: '100% Full Commercial Ownership',
  },
];

export const WhyZeperAI: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="comparison" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Why Indian D2C Brands Choose ZeperAI
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          Generic AI hallucinates your product packaging. Agencies take weeks. ZeperAI Studio gives you studio-grade accuracy at software speed.
        </p>
      </div>

      {/* Comparison Table Card */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="py-5 px-6 sm:px-8 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                  Feature / Capability
                </th>
                <th className="py-5 px-6 sm:px-8 text-xs sm:text-sm font-semibold text-gray-600 w-1/4">
                  Traditional Agency
                </th>
                <th className="py-5 px-6 sm:px-8 text-xs sm:text-sm font-semibold text-gray-600 w-1/4">
                  Generic AI Generators
                </th>
                <th className="py-5 px-6 sm:px-8 bg-[#EEF0FF] border-x border-[#D4D9FF] text-gray-900 w-1/4">
                  <div className="inline-block bg-[#4452FB] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                    RECOMMENDED
                  </div>
                  <div className="font-poppins font-bold text-base sm:text-lg text-[#4452FB]">
                    ZeperAI Studio
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-gray-50/60 transition-colors ${
                    row.isHighlight ? 'bg-gray-50/30' : ''
                  }`}
                >
                  {/* Dimension Name */}
                  <td className="py-4.5 px-6 sm:px-8 text-xs sm:text-sm font-semibold text-gray-900 font-poppins">
                    {row.dimension}
                  </td>

                  {/* Traditional Agency */}
                  <td className="py-4.5 px-6 sm:px-8 text-xs sm:text-sm text-gray-600">
                    {row.traditionalAgency}
                  </td>

                  {/* Generic AI Tools */}
                  <td className="py-4.5 px-6 sm:px-8 text-xs sm:text-sm text-gray-500">
                    {row.genericAiTools}
                  </td>

                  {/* ZeperAI Studio (Highlighted Column) */}
                  <td className="py-4.5 px-6 sm:px-8 bg-[#EEF0FF]/40 border-x border-[#D4D9FF] text-xs sm:text-sm font-semibold text-gray-900">
                    <span className="text-[#4452FB] font-bold">
                      {row.zeperaiStudio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Footer Banner */}
        <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-poppins font-bold text-base sm:text-lg text-gray-900">
              Scale your creatives without blowing your marketing budget.
            </p>
            <p className="font-inter text-xs text-gray-600 mt-0.5">
              No credit card required. Generate your first ad batch with free trial credits.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto h-11 px-6 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white font-inter font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Start Creating Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </section>
  );
};
