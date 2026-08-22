import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { AdminStateMessage } from './AdminStateMessage.js';
import {
  BarChart3,
  Image as ImageIcon,
  Video,
  Sparkles,
  Camera,
  Layers,
  Shirt,
  Users,
  Box,
  TrendingUp,
  RefreshCw,
  Info,
  Flame,
  Zap,
  Tag,
  Calendar,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface AIUsageAnalyticsProps {
  onSelectUser?: (userId: string) => void;
}

const STUDIO_COLORS: Record<string, string> = {
  'Product Studio': '#10B981',
  'Fashion Studio': '#8B5CF6',
  'Influencer Studio': '#EC4899',
  'CGI / 3D Render': '#3B82F6',
  'Catalog Mode': '#F59E0B',
  'Festival / Creative': '#06B6D4',
  'Other / General': '#64748B'
};

export default function AIUsageAnalytics({ onSelectUser }: AIUsageAnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setAnalyticsError(null);
      const res = await axios.get('/api/admin/analytics/generations', {
        headers: await getHeaders()
      });
      setData(res.data.analytics);
    } catch (err: any) {
      console.error('Error fetching AI generation analytics:', err);
      setAnalyticsError(err.response?.data?.error || err.message || 'Failed to aggregate AI studio analytics. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <AdminStateMessage
        type="loading"
        title="Aggregating Studio Telemetry"
        message="Calculating generation volumes, studio distributions, active user quotas, and preset popularity..."
      />
    );
  }

  if (analyticsError && !data) {
    return (
      <AdminStateMessage
        type="error"
        title="Failed to Load AI Analytics"
        message={analyticsError}
        onRetry={fetchAnalytics}
        retryText="Retry Aggregation"
      />
    );
  }

  if (!data) return null;

  const {
    totalGenerations = 0,
    images = 0,
    videos = 0,
    studioBreakdown = {},
    countsByStudio = {},
    mostUsedPresets = [],
    mostActiveUsers = [],
    dailyTrend = []
  } = data;

  const studioChartData = Object.entries(studioBreakdown || {}).map(([name, val]: [string, any]) => ({
    name,
    count: Number(val?.count || 0),
    creditsConsumed: Number(val?.creditsConsumed || 0),
    color: STUDIO_COLORS[name] || '#6A5AE0'
  })).filter(d => d.count > 0);

  const totalCreditsEstimated = (Object.values(studioBreakdown || {}) as any[]).reduce<number>((sum, val) => sum + (Number(val?.creditsConsumed) || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Generations</span>
            <div className="p-2 rounded-xl bg-primary-light text-primary border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{totalGenerations.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">Total model outputs completed</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Images Generated</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-accent-green border border-emerald-100">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-accent-green font-mono">{images.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">High-res commercial stills</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Videos Generated</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-purple-600 font-mono">{videos.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">Cinematic motion & camera pans</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Credits Consumed</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{totalCreditsEstimated.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">Computed via feature cost engine</p>
          </div>
        </Card>
      </div>

      {/* 2. STUDIO USAGE BREAKDOWN CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-surface border border-border-light rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-accent-green text-xs font-semibold">
            <Camera className="w-4 h-4" /> Product Studio
          </div>
          <div className="mt-2 text-xl font-bold font-batangas font-mono text-text-primary">{countsByStudio.productStudio || 0}</div>
          <p className="text-[10px] text-text-secondary mt-0.5">Commercial shoots</p>
        </div>

        <div className="p-4 bg-surface border border-border-light rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-semibold">
            <Shirt className="w-4 h-4" /> Fashion Studio
          </div>
          <div className="mt-2 text-xl font-bold font-batangas font-mono text-text-primary">{countsByStudio.fashionStudio || 0}</div>
          <p className="text-[10px] text-text-secondary mt-0.5">Apparel on-model</p>
        </div>

        <div className="p-4 bg-surface border border-border-light rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-pink-600 text-xs font-semibold">
            <Users className="w-4 h-4" /> Influencer Studio
          </div>
          <div className="mt-2 text-xl font-bold font-batangas font-mono text-text-primary">{countsByStudio.influencerStudio || 0}</div>
          <p className="text-[10px] text-text-secondary mt-0.5">UGC & Social feeds</p>
        </div>

        <div className="p-4 bg-surface border border-border-light rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
            <Box className="w-4 h-4" /> CGI / 3D Render
          </div>
          <div className="mt-2 text-xl font-bold font-batangas font-mono text-text-primary">{countsByStudio.cgiStudio || 0}</div>
          <p className="text-[10px] text-text-secondary mt-0.5">Studio lighting rigs</p>
        </div>

        <div className="p-4 bg-surface border border-border-light rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold">
            <Layers className="w-4 h-4" /> Catalog Mode
          </div>
          <div className="mt-2 text-xl font-bold font-batangas font-mono text-text-primary">{countsByStudio.catalogMode || 0}</div>
          <p className="text-[10px] text-text-secondary mt-0.5">Batch 4-pose runs</p>
        </div>

        <div className="p-4 bg-surface border border-border-light rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-cyan-600 text-xs font-semibold">
            <Sparkles className="w-4 h-4" /> Creative / Other
          </div>
          <div className="mt-2 text-xl font-bold font-batangas font-mono text-text-primary">{(countsByStudio.festivalStudio || 0) + (countsByStudio.other || 0)}</div>
          <p className="text-[10px] text-text-secondary mt-0.5">Ad campaigns & misc</p>
        </div>
      </div>

      {/* 3. CHARTS ROW: 14-DAY GENERATIONS TIMELINE & CREDITS CONSUMED BY FEATURE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Timeline */}
        <Card className="lg:col-span-2 p-6 bg-surface border border-border-light shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-batangas text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                14-Day Generation Volume
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">Daily generated images vs video renders</p>
            </div>
            <Button
              variant="secondary"
              onClick={fetchAnalytics}
              className="text-xs px-2.5 h-7 bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="imageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="videoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6A5AE0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6A5AE0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px',
                    color: '#111827'
                  }}
                />
                <Area type="monotone" dataKey="images" name="Images" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#imageGrad)" />
                <Area type="monotone" dataKey="videos" name="Videos" stroke="#6A5AE0" strokeWidth={2} fillOpacity={1} fill="url(#videoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Feature Credits Distribution */}
        <Card className="p-6 bg-surface border border-border-light shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold font-batangas text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Credits Consumed by Feature
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Feature breakdown based on pricing engine</p>
          </div>

          <div className="space-y-3 pt-2">
            {studioChartData.map((studio) => {
              const percent = totalCreditsEstimated > 0 ? Math.round((studio.creditsConsumed / totalCreditsEstimated) * 100) : 0;
              return (
                <div key={studio.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-primary flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: studio.color }} />
                      {studio.name}
                    </span>
                    <span className="font-mono text-text-primary">
                      {studio.creditsConsumed} CR <span className="text-text-secondary font-normal">({percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: studio.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 4. PRESETS & MOST ACTIVE USERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most-Used Presets */}
        <Card className="p-6 bg-surface border border-border-light shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold font-batangas text-text-primary flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              Most-Used Style Presets
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Top composition and lighting themes chosen by users</p>
          </div>

          {mostUsedPresets.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              No preset telemetry collected yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {mostUsedPresets.map((preset: any, idx: number) => {
                const maxCount = mostUsedPresets[0]?.count || 1;
                const ratio = Math.round((preset.count / maxCount) * 100);
                return (
                  <div key={preset.name} className="p-3 bg-slate-50 rounded-xl border border-border-light space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-primary flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-white border border-border-light flex items-center justify-center text-[10px] font-mono text-text-secondary">
                          #{idx + 1}
                        </span>
                        {preset.name}
                      </span>
                      <span className="font-mono text-primary font-bold">
                        {preset.count} <span className="text-[10px] text-text-secondary font-normal">uses</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Most Active Users */}
        <Card className="p-6 bg-surface border border-border-light shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold font-batangas text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Most-Active AI Creators
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Top customer accounts ranked by completed generations</p>
          </div>

          {mostActiveUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              No user generation activity found.
            </div>
          ) : (
            <div className="space-y-2">
              {mostActiveUsers.map((user: any, idx: number) => (
                <div
                  key={user.userId}
                  className="p-3 bg-slate-50 rounded-xl border border-border-light flex items-center justify-between hover:bg-slate-100/70 transition-colors cursor-pointer group"
                  onClick={() => onSelectUser && onSelectUser(user.userId)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-white border border-border-light flex items-center justify-center text-[10px] font-mono text-text-secondary shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors flex items-center gap-1">
                        {user.name}
                        {onSelectUser && (
                          <ExternalLink className="w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono">{user.email}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-accent-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {user.generationCount} gens
                    </span>
                    <div className="text-[10px] text-text-secondary mt-0.5 font-mono">
                      {user.tier} Plan
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 5. METRIC TRANSPARENCY NOTICE */}
      <div className="p-4 bg-slate-50 border border-border-light rounded-2xl flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary">Telemetry Authenticity Guarantee:</strong> Metrics displayed above are computed directly from Supabase <code>designs</code> generation rows and billing records. Unmonitored backend parameters such as GPU hardware execution duration and per-model latency are not stored in the database and have not been fabricated.
        </div>
      </div>
    </div>
  );
}
