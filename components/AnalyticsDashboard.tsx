
import React, { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    LineChart, Line, Area 
} from 'recharts';
import { Icon } from './ui/Icon';
import type { GeneratedImage } from '../types';
import { analyticsService } from '../services/analyticsService';
import { View } from '../types';
import { Button } from './ui/Button';

interface AnalyticsDashboardProps {
    savedDesigns: GeneratedImage[];
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

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ savedDesigns, onSetView, onToggleSidebar }) => {
    const analytics = useMemo(() => analyticsService.getAnalyticsData(savedDesigns), [savedDesigns]);

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold mb-1">{label}</p>
                    {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.color }}>
                            {p.name}: {p.value} {p.name === 'CTR' ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
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
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.performanceByFormat} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="format" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="ctr" fill="#6A5AE0" radius={[6, 6, 0, 0]} barSize={40} name="CTR" />
                                </BarChart>
                            </ResponsiveContainer>
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
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Clicks" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
