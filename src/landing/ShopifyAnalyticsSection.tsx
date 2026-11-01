import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  UploadCloud, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  CheckCircle2, 
  FileSpreadsheet, 
  ChevronRight,
  Layers
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export const ShopifyAnalyticsSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll trigger listener to automatically switch active steps/dashboard focus as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll progress within the container
      if (rect.top < viewportHeight * 0.7 && rect.bottom > 0) {
        const totalHeight = rect.height;
        const scrolled = viewportHeight * 0.5 - rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalHeight));
        
        if (progress < 0.33) {
          setActiveStep(0);
        } else if (progress < 0.66) {
          setActiveStep(1);
        } else {
          setActiveStep(2);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const steps = [
    {
      id: 0,
      title: '1. Drag & Drop Store CSV / Export',
      badge: 'Zero API Setup Required',
      description: 'No store admin permissions or complex OAuth tokens needed. Just export your sales or order CSV from Shopify, Amazon, or WooCommerce and upload it in seconds.',
      icon: UploadCloud,
      highlightText: 'Instant 1-Click CSV Import'
    },
    {
      id: 1,
      title: '2. Automated AI Revenue & ROAS Breakdown',
      badge: 'Real-Time Insights',
      description: 'ZeperAi instantly parses order velocity, Average Order Value (AOV), ROAS benchmarks, and repeat customer ratios to surface hidden profit levers.',
      icon: TrendingUp,
      highlightText: 'Calculates ROAS & CAC Automatically'
    },
    {
      id: 2,
      title: '3. Auto-Generated Creative Ad Concepts',
      badge: 'Data-Driven Creatives',
      description: 'Our multi-agent pipeline connects winning SKU trends directly to targeted creative hooks, studio packshots, and high-converting ad angles.',
      icon: Sparkles,
      highlightText: 'Converts Store Metrics into High-ROAS Creatives'
    }
  ];

  // Minified Revenue Trend Chart Data matching ShopifyDashboard.tsx
  const trendChartData = {
    labels: ['Oct 1', 'Oct 5', 'Oct 10', 'Oct 15', 'Oct 20', 'Oct 25', 'Oct 30', 'Nov 5', 'Nov 10', 'Nov 12'],
    datasets: [{
      label: 'Revenue',
      data: [2800, 4200, 3900, 6100, 5400, 7800, 8900, 9500, 11200, 12850],
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(79, 70, 229, 0.04)',
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#4F46E5',
      fill: true,
    }]
  };

  const trendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181B',
        padding: 10,
        cornerRadius: 8,
        callbacks: { 
          label: (ctx) => 'Revenue: $' + (ctx.parsed.y ? ctx.parsed.y.toLocaleString() : '0') 
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#A8A29E', font: { size: 10, weight: 'bold' } }, 
        border: { display: false } 
      },
      y: {
        grid: { color: '#F5F5F4' },
        ticks: { 
          color: '#A8A29E', 
          font: { size: 10 }, 
          callback: (v) => '$' + Math.round(Number(v) / 1000) + 'k' 
        },
        border: { display: false }
      }
    }
  };

  return (
    <section 
      id="shopify-analytics" 
      ref={containerRef}
      className="py-14 sm:py-24 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200 bg-white font-manrope"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-stone-100 text-zinc-900 border border-stone-200 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-zinc-700" />
          <span>Shopify &amp; D2C Store Analytics</span>
        </div>
        <h2 className="font-lora text-2xl xs:text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-tight">
          Turn Raw Store Data into High-Converting Creatives
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-stone-600 leading-relaxed font-normal">
          No Shopify app installations or API keys needed. Simply upload your store data CSV and let ZeperAI reveal winning products, ROAS metrics, and AI ad concepts.
        </p>
      </div>

      {/* Split Process + Minified Dashboard Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: Process Steps */}
        <div className="lg:col-span-5 space-y-3.5 sm:space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 sm:mb-2">
            How It Works · 3 Simple Steps
          </div>

          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  isActive 
                    ? 'bg-white border-zinc-900 shadow-sm scale-[1.01]' 
                    : 'bg-stone-50/70 border-stone-200 hover:border-stone-300 hover:bg-white'
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-900" />
                )}

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-colors ${
                    isActive ? 'bg-zinc-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3 className={`font-bold text-sm sm:text-lg transition-colors leading-tight ${
                        isActive ? 'text-zinc-900' : 'text-stone-700'
                      }`}>
                        {step.title}
                      </h3>
                      <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 shrink-0">
                        {step.badge}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                      {step.description}
                    </p>

                    <div className="pt-1.5 sm:pt-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-900">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{step.highlightText}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2 sm:pt-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white font-bold text-sm sm:text-base transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span>Analyze Your Store Data Free</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Right Side: Minified Authentic Shopify Dashboard Replica */}
        <div className="lg:col-span-7">
          
          {/* Mobile Quick Step Switcher Tab Bar */}
          <div className="lg:hidden flex items-center justify-between bg-stone-100 p-1 rounded-2xl border border-stone-200 mb-3 text-center">
            {[
              { id: 0, label: '1. CSV Ingest' },
              { id: 1, label: '2. Analytics' },
              { id: 2, label: '3. AI Hooks' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStep === s.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-zinc-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden relative transition-all duration-300">
            
            {/* Top Minified Header Bar */}
            <div className="bg-white px-3.5 sm:px-6 py-3 sm:py-4 border-b border-stone-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-100 flex items-center justify-center text-zinc-800 font-bold border border-stone-200 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 uppercase tracking-tight font-manrope truncate">Active Analytics Report</h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium truncate">
                    Parsed 1,248 Orders · Updated today
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-mono px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Loaded
                </span>
              </div>
            </div>

            {/* Dashboard Body Content */}
            <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">

              {/* View 1: Step 0 CSV Upload Simulation */}
              {activeStep === 0 && (
                <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                  <div className="border border-dashed border-stone-300 hover:border-stone-400 bg-white rounded-2xl p-4 sm:p-8 text-center space-y-3 sm:space-y-4 transition-all shadow-2xs">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-stone-100 text-zinc-800 rounded-full flex items-center justify-center mx-auto border border-stone-200">
                      <UploadCloud className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-zinc-900">Drop your Shopify CSV reports here</h4>
                      <p className="text-[11px] sm:text-xs text-stone-500 font-normal mt-0.5 sm:mt-1 max-w-sm mx-auto">
                        Integrate raw export sales trends, bestsellers lists, or orders logs.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {['orders_2026.csv', 'products_sales.csv', 'store_analytics.csv'].map((f) => (
                        <span key={f} className="text-[9px] sm:text-[10px] select-none font-bold tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-600 flex items-center gap-1 font-mono">
                          <FileSpreadsheet className="w-2.5 h-2.5 text-stone-500" />
                          {f}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
                    >
                      <span>Analyze Store Metrics</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-2xs gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-stone-100 text-zinc-700 shrink-0">
                        <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-zinc-900 truncate">Parsing 1,248 Orders &amp; SKUs</div>
                        <div className="text-[10px] sm:text-[11px] text-stone-500 font-normal truncate">Zero passwords or API keys needed</div>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">Secure</span>
                  </div>
                </div>
              )}

              {/* View 2 & 3: KPI Cards and Sales Trend Line Chart */}
              {activeStep !== 0 && (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                  {/* Core KPI Cards Grid: 3-column micro stats on mobile */}
                  <div className="grid grid-cols-3 gap-1.5 xs:gap-2.5 sm:gap-4">
                    
                    {/* KPI 1: Gross Income */}
                    <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 tracking-wider uppercase mb-0.5">Gross Income</p>
                        <h4 className="text-sm xs:text-base sm:text-xl font-bold text-zinc-900 leading-tight">$42,850</h4>
                        <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5">
                          +28.4%
                        </span>
                      </div>
                      <div className="hidden xs:flex p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-stone-100 text-zinc-800 shrink-0 border border-stone-200">
                        <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    {/* KPI 2: Total Processed Orders */}
                    <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 tracking-wider uppercase mb-0.5">Orders</p>
                        <h4 className="text-sm xs:text-base sm:text-xl font-bold text-zinc-900 leading-tight">1,248</h4>
                        <span className="text-[8px] sm:text-[10px] font-bold text-zinc-700 block mt-0.5">
                          High Velocity
                        </span>
                      </div>
                      <div className="hidden xs:flex p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-stone-100 text-zinc-800 shrink-0 border border-stone-200">
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    {/* KPI 3: Average Order Value */}
                    <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 tracking-wider uppercase mb-0.5">Avg Order</p>
                        <h4 className="text-sm xs:text-base sm:text-xl font-bold text-zinc-900 leading-tight">$68.50</h4>
                        <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5">
                          +$14.20 Lift
                        </span>
                      </div>
                      <div className="hidden xs:flex p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-stone-100 text-zinc-800 shrink-0 border border-stone-200">
                        <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                  </div>

                  {/* Gross Revenue Trend Chart Card */}
                  <div className="bg-white p-3.5 sm:p-5 border border-stone-200 rounded-2xl shadow-2xs space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider font-manrope truncate">Revenue Trend</h4>
                        <p className="text-[10px] sm:text-[11px] text-stone-400 font-normal truncate">Calculated from order CSV trajectory</p>
                      </div>
                      <span className="text-[9px] sm:text-[11px] font-mono font-medium text-zinc-700 bg-stone-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-stone-200 shrink-0">
                        30-Day
                      </span>
                    </div>

                    <div className="relative w-full h-[150px] xs:h-[170px] sm:h-[210px] pt-1">
                      <Line options={trendOptions} data={trendChartData} />
                    </div>
                  </div>

                  {/* Step 2 AI Creative Recommendations Overlay */}
                  {activeStep === 2 && (
                    <div className="bg-zinc-900 border border-zinc-800 p-3.5 sm:p-5 rounded-2xl text-white shadow-sm space-y-2.5 sm:space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-200 font-manrope">Strategy Assistant</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] bg-stone-100 text-zinc-900 font-bold px-2 py-0.5 rounded-md shrink-0">
                          AI Concepts
                        </span>
                      </div>

                      <div className="bg-zinc-800/80 p-2.5 sm:p-3 rounded-xl border border-zinc-700 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">Hydrating Glow Serum (Hero SKU)</div>
                          <div className="text-zinc-300 text-[10px] sm:text-[11px] mt-0.5">Top Hook: "Why 8,000+ Indian women swapped 3 bottles for this 1 serum"</div>
                        </div>
                        <button 
                          onClick={() => navigate('/login')}
                          className="w-full xs:w-auto px-3.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-zinc-900 font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-98 text-center"
                        >
                          Generate Ad
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Bottom Footer Control Bar */}
            <div className="bg-white px-3.5 sm:px-6 py-2.5 sm:py-3 border-t border-stone-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-stone-400 font-normal hidden xs:inline">Step:</span>
                <span className="font-bold text-zinc-800 text-[11px] sm:text-xs truncate">
                  {activeStep === 0 && '1. CSV Ingestion'}
                  {activeStep === 1 && '2. Store Analytics'}
                  {activeStep === 2 && '3. Creative Generation'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeStep === idx ? 'w-5 sm:w-6 bg-zinc-900' : 'w-2 bg-stone-200 hover:bg-stone-300'
                    }`}
                    title={`View Step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
