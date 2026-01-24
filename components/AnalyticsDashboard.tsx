import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Icon } from './ui/Icon';
import { analyticsService } from '../services/analyticsService';
import { View } from '../types';
import { Button } from './ui/Button';
import { useDesigns } from '../contexts/DesignsContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsDashboardProps {
    onSetView: (view: View) => void;
    onToggleSidebar: () => void;
}

const StatCard: React.FC<{ label: string; value: string; subtext?: string; trend?: 'up' | 'down'; trendValue?: string }> = ({ label, value, subtext, trend, trendValue }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        <div>
            <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
            {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        {trend && (
            <div className={`mt-3 flex items-center text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                <Icon name={trend === 'up' ? 'trending-up' : 'trending-down'} className="w-3 h-3 mr-1" />
                {trendValue} vs last week
            </div>
        )}
    </div>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onSetView, onToggleSidebar }) => {
    const { designs } = useDesigns();
    const analytics = useMemo(() => analyticsService.getAnalyticsData(designs), [designs]);

    const commonOptions: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1E293B',
                padding: 12,
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 12 },
                cornerRadius: 8,
                displayColors: false,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#64748B',
                    font: { family: 'Inter', size: 11 }
                },
                border: { display: false }
            },
            y: {
                grid: { color: '#F1F5F9', drawBorder: false },
                ticks: {
                    color: '#64748B',
                    font: { family: 'Inter', size: 11 }
                },
                border: { display: false }
            }
        }
    };

    const barData = {
        labels: analytics.performanceByFormat.map(d => d.format),
        datasets: [
            {
                label: 'CTR (%)',
                data: analytics.performanceByFormat.map(d => d.ctr),
                backgroundColor: '#6A5AE0',
                borderRadius: 4,
                barThickness: 40,
            }
        ]
    };

    const lineData = {
        labels: analytics.trends.map(d => d.date),
        datasets: [
            {
                label: 'Clicks',
                data: analytics.trends.map(d => d.clicks),
                borderColor: '#10B981',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    return (
        <div className="w-full h-full bg-main flex flex-col overflow-y-auto">
            <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-border-light bg-white/50 backdrop-blur-sm z-10 sticky top-0">
                <div className="flex items-center">
                    <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                        <Icon name="menu" className="w-6 h-6" />
                    </button>
                    <div className="p-2 bg-indigo-100 rounded-xl mr-3 text-indigo-600">
                        <Icon name="chart-bar" className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary font-batangas">Brand Intelligence</h1>
                        <p className="text-sm text-text-secondary">AI-driven performance analytics for your creative assets.</p>
                    </div>
                </div>
                <Button onClick={() => onSetView(View.MyDesigns)} variant="secondary" className="hidden sm:flex">
                    View Assets
                </Button>
            </header>

            <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
                {/* AI Insight Card */}
                <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-md shadow-inner">
                                <Icon name="brain" className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold uppercase tracking-wider opacity-80 mb-1">Key AI Insight</h2>
                                <p className="text-xl md:text-2xl font-medium leading-snug max-w-3xl">
                                    "{analytics.insight}"
                                </p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold backdrop-blur-md transition-colors border border-white/20 whitespace-nowrap">
                            View Details
                        </button>
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-colors duration-700"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Impressions" value={analytics.totalViews.toLocaleString()} trend="up" trendValue="12%" />
                    <StatCard label="Total Clicks" value={analytics.totalClicks.toLocaleString()} trend="up" trendValue="5%" />
                    <StatCard label="Avg. CTR" value={`${analytics.avgCtr}%`} subtext="Industry Avg: 0.9%" />
                    <StatCard label="Top Performing Format" value={analytics.performanceByFormat.sort((a,b) => b.ctr - a.ctr)[0]?.format || 'N/A'} subtext="Highest Conversion Rate" />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CTR by Format Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <span className="w-2 h-6 bg-primary rounded-full mr-3"></span>
                                CTR by Aspect Ratio
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <Bar options={commonOptions} data={barData} />
                        </div>
                    </div>

                    {/* Engagement Trends Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <span className="w-2 h-6 bg-accent-green rounded-full mr-3"></span>
                                Engagement Trends (7 Days)
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <Line options={commonOptions} data={lineData} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
