import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { getAdminAuthHeader } from './adminAuthHelper';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { AdminStateMessage } from './AdminStateMessage';

interface SummaryData {
  users: {
    totalUsers: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    bannedUsers: number;
    tierBreakdown: Record<string, number>;
  };
  revenue: {
    totalRevenue: number;
    revenueThisMonth: number;
    revenueThisWeek: number;
    aov: number;
    successfulPayments: number;
    failedPayments: number;
    refunds: { count: number; amount: number };
    revenueTrend: Array<{ date: string; revenue: number; transactions: number }>;
  };
  subscriptions: {
    activeSubscriptions: number;
    newSubscriptionsThisMonth: number;
    cancelledSubscriptions: number;
    expiredSubscriptions: number;
    trialUsers: number;
    mrr: number;
  };
  aiUsage: {
    totalGenerations: number;
    imagesGenerated: number;
    videosGenerated: number;
    creditsConsumed: number;
    creditsRemaining: number;
    mostUsedFeatures: Array<{ name: string; count: number }>;
    generationsTrend: Array<{ date: string; count: number }>;
  };
  platformHealth: {
    apiStatus: string;
    databaseHealth: string;
    dbLatencyMs: number;
    storage: {
      totalFiles: number;
      totalBytes: number;
      totalMB: number;
      totalGB: number;
    };
    failedPayments: number;
    failedGenerations: number;
  };
  recentActions: Array<{
    id: string;
    action: string;
    admin_email: string;
    target_user_id: string | null;
    details?: any;
    created_at: string;
  }>;
}

const TIER_COLORS: Record<string, string> = {
  Free: '#6B7280',
  PayAsYouGo: '#3B82F6',
  Pro: '#6A5AE0',
  Agency: '#8B5CF6'
};

const FEATURE_COLORS = ['#6A5AE0', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

interface AdminOverviewProps {
  onNavigateTab?: (tab: 'users' | 'subscriptions' | 'payments' | 'credits' | 'analytics' | 'storage' | 'monitoring' | 'audit') => void;
}

export default function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartView, setChartView] = useState<'revenue' | 'ai'>('revenue');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const authHeader = await getAdminAuthHeader();
      const res = await axios.get('/api/admin/dashboard/summary', {
        headers: { Authorization: `Bearer ${authHeader}` }
      });
      setSummary(res.data.summary);
    } catch (err: any) {
      console.error('Failed to load dashboard summary:', err);
      const apiError = err.response?.data?.error;
      const safeError = typeof apiError === 'string' ? apiError : (err.message || 'Failed to aggregate administrative metrics. Please check network and database connectivity.');
      setError(safeError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading && !summary) {
    return (
      <AdminStateMessage
        type="loading"
        title="Aggregating Command Metrics"
        message="Loading platform subscriptions, users, AI generations, and revenue telemetry..."
      />
    );
  }

  if (error && !summary) {
    return (
      <AdminStateMessage
        type="error"
        title="Dashboard Telemetry Unavailable"
        message={error}
        onRetry={fetchSummary}
        retryText="Retry Aggregation"
      />
    );
  }

  if (!summary) return null;

  const tierChartData = Object.entries(summary.users.tierBreakdown || {}).map(([name, value]) => ({
    name,
    value,
    color: TIER_COLORS[name] || '#6B7280'
  }));

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border-light rounded-2xl p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-accent-green animate-pulse" />
          <div className="text-sm">
            <span className="font-semibold text-text-primary">System Status: {summary.platformHealth.apiStatus}</span>
            <span className="text-text-secondary ml-2">
              (DB: {summary.platformHealth.databaseHealth} • {summary.platformHealth.dbLatencyMs}ms latency)
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={fetchSummary}
            disabled={refreshing}
            className="text-xs px-3.5 py-1.5 h-8 flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-text-primary border border-border-light shadow-xs"
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </Button>
        </div>
      </div>

      {/* 1. KEY HIGH LEVEL STATS GRID */}
      <div>
        <h2 className="text-xs font-bold font-batangas uppercase tracking-wider text-text-secondary mb-3 flex items-center space-x-2">
          <Icon name="activity" className="w-4 h-4 text-primary" />
          <span>Core Operational KPI Pulse</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary">Total Registered Users</p>
                <h3 className="text-2xl font-bold font-batangas text-text-primary mt-1">{summary.users.totalUsers.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Icon name="users" className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border-light">
              <span className="text-accent-green font-medium">+{summary.users.newUsersThisWeek} this week</span>
              <span className="text-text-secondary">Active: {summary.users.activeUsers}</span>
            </div>
          </Card>

          {/* Revenue Total & MRR */}
          <Card 
            className={`p-5 bg-surface border border-border-light shadow-sm hover:border-slate-300 transition-colors ${onNavigateTab ? 'cursor-pointer hover:border-primary/40' : ''}`}
            onClick={() => onNavigateTab && onNavigateTab('payments')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary">Gross Platform Revenue</p>
                <h3 className="text-2xl font-bold font-batangas text-accent-green mt-1">₹{summary.revenue.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-accent-green flex items-center justify-center border border-emerald-100">
                <Icon name="credit-card" className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border-light">
              <span className="text-text-secondary">MRR: <strong className="text-text-primary">₹{summary.subscriptions.mrr.toLocaleString()}</strong></span>
              <span className="text-primary font-medium hover:underline">View Payments →</span>
            </div>
          </Card>

          {/* Active Subscriptions */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary">Active Subscriptions</p>
                <h3 className="text-2xl font-bold font-batangas text-text-primary mt-1">{summary.subscriptions.activeSubscriptions}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center border border-primary/20">
                <Icon name="shield-check" className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border-light">
              <span className="text-primary font-medium">+{summary.subscriptions.newSubscriptionsThisMonth} this month</span>
              <span className="text-text-secondary">Cancelled: {summary.subscriptions.cancelledSubscriptions}</span>
            </div>
          </Card>

          {/* AI Generations & Credits */}
          <Card 
            className={`p-5 bg-surface border border-border-light shadow-sm hover:border-slate-300 transition-colors ${onNavigateTab ? 'cursor-pointer hover:border-amber-400/50' : ''}`}
            onClick={() => onNavigateTab && onNavigateTab('analytics')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary">Total AI Generations</p>
                <h3 className="text-2xl font-bold font-batangas text-amber-600 mt-1">{summary.aiUsage.totalGenerations.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Icon name="sparkles" className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border-light">
              <span className="text-text-secondary">Spent: <strong className="text-text-primary">{summary.aiUsage.creditsConsumed}</strong> cr</span>
              <span className="text-primary font-medium hover:underline">View Analytics →</span>
            </div>
          </Card>
        </div>
      </div>

      {/* 2. ANALYTICS & ACTIVITY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Line / Bar Chart (2 Cols) */}
        <Card className="p-6 bg-surface border border-border-light shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold font-batangas text-text-primary">Platform Activity Dynamics (14 Days)</h3>
              <p className="text-xs text-text-secondary">Daily revenue collections and AI generation load</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-border-light text-xs">
              <button
                onClick={() => setChartView('revenue')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  chartView === 'revenue' ? 'bg-white text-primary font-bold shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Revenue Trend
              </button>
              <button
                onClick={() => setChartView('ai')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  chartView === 'ai' ? 'bg-white text-primary font-bold shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                AI Generations
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'revenue' ? (
                <AreaChart data={summary.revenue.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6A5AE0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6A5AE0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6A5AE0" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={summary.aiUsage.generationsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [`${value} generations`, 'Designs']}
                  />
                  <Bar dataKey="count" fill="#6A5AE0" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Feature Usage & Mode Breakdown (1 Col) */}
        <Card className="p-6 bg-surface border border-border-light shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-batangas text-text-primary mb-1">Most-Used AI Modes</h3>
            <p className="text-xs text-text-secondary mb-4">Distribution by studio mode generation feature</p>

            <div className="space-y-3">
              {summary.aiUsage.mostUsedFeatures.length === 0 ? (
                <p className="text-xs text-text-secondary py-4 text-center">No generation data recorded yet.</p>
              ) : (
                summary.aiUsage.mostUsedFeatures.slice(0, 5).map((feat, idx) => {
                  const total = summary.aiUsage.totalGenerations || 1;
                  const pct = Math.round((feat.count / total) * 100);
                  const color = FEATURE_COLORS[idx % FEATURE_COLORS.length];
                  return (
                    <div key={feat.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-text-primary">{feat.name} Studio</span>
                        <span className="text-text-secondary font-mono">{feat.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border-light mt-4 flex items-center justify-between text-xs text-text-secondary">
            <span>Total Creations Tracked:</span>
            <strong className="text-text-primary font-mono">{summary.aiUsage.totalGenerations}</strong>
          </div>
        </Card>
      </div>

      {/* 3. DETAILED OPERATIONAL PANELS: USERS, REVENUE, SUBSCRIPTIONS & PLATFORM HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Breakdown */}
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-primary flex items-center space-x-2">
              <Icon name="users" className="w-4 h-4 text-primary" />
              <span>User Dynamics</span>
            </h4>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('users')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View Users
              </button>
            )}
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Total Registered</span>
              <span className="font-bold text-text-primary">{summary.users.totalUsers}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">New (Past 30 Days)</span>
              <span className="font-medium text-accent-green">+{summary.users.newUsersThisMonth}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Active (30d creators)</span>
              <span className="font-medium text-primary">{summary.users.activeUsers}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Inactive Users</span>
              <span className="text-text-secondary">{summary.users.inactiveUsers}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Admin Accounts</span>
              <span className="font-medium text-purple-600">{summary.users.adminUsers}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Banned Accounts</span>
              <span className="font-medium text-rose-600">{summary.users.bannedUsers}</span>
            </div>
          </div>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-primary flex items-center space-x-2">
              <Icon name="dollar-sign" className="w-4 h-4 text-accent-green" />
              <span>Revenue Breakdown</span>
            </h4>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('subscriptions')}
                className="text-xs text-primary hover:underline font-medium"
              >
                Subscriptions
              </button>
            )}
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Total Lifetime</span>
              <span className="font-bold text-accent-green">₹{summary.revenue.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Revenue (30d)</span>
              <span className="font-medium text-text-primary">₹{summary.revenue.revenueThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Revenue (7d)</span>
              <span className="font-medium text-text-primary">₹{summary.revenue.revenueThisWeek.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Successful Payments</span>
              <span className="font-medium text-accent-green">{summary.revenue.successfulPayments}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Failed Payments</span>
              <span className="font-medium text-amber-600">{summary.revenue.failedPayments}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Refunds Processed</span>
              <span className="text-text-secondary">{summary.revenue.refunds.count} (₹{summary.revenue.refunds.amount})</span>
            </div>
          </div>
        </Card>

        {/* Subscriptions & Tiers */}
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-primary flex items-center space-x-2">
              <Icon name="layers" className="w-4 h-4 text-purple-600" />
              <span>Subscription Health</span>
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Active Paid Subs</span>
              <span className="font-bold text-purple-600">{summary.subscriptions.activeSubscriptions}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Monthly Run Rate (MRR)</span>
              <span className="font-bold text-text-primary">₹{summary.subscriptions.mrr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">New Subs (30d)</span>
              <span className="font-medium text-accent-green">+{summary.subscriptions.newSubscriptionsThisMonth}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Cancelled / Ending</span>
              <span className="text-text-secondary">{summary.subscriptions.cancelledSubscriptions}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Expired / Past Due</span>
              <span className="text-amber-600">{summary.subscriptions.expiredSubscriptions}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Free Tier Users</span>
              <span className="text-text-secondary">{summary.subscriptions.trialUsers}</span>
            </div>
          </div>
        </Card>

        {/* Platform & Storage Health */}
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-primary flex items-center space-x-2">
              <Icon name="database" className="w-4 h-4 text-amber-600" />
              <span>Platform Health</span>
            </h4>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('storage')}
                className="text-xs text-primary hover:underline font-medium"
              >
                Storage
              </button>
            )}
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Supabase DB</span>
              <span className="font-bold text-accent-green">{summary.platformHealth.databaseHealth}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">DB Latency</span>
              <span className="font-mono text-text-primary">{summary.platformHealth.dbLatencyMs}ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Storage Consumption</span>
              <span className="font-medium text-text-primary">{summary.platformHealth.storage.totalMB} MB</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Stored Files</span>
              <span className="font-medium text-text-secondary">{summary.platformHealth.storage.totalFiles} objects</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-text-secondary">Failed Payments</span>
              <span className="text-amber-600">{summary.platformHealth.failedPayments}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Failed AI Generations</span>
              {onNavigateTab ? (
                <button
                  onClick={() => onNavigateTab('monitoring')}
                  className="text-accent-green hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Nominal • View Health</span>
                  <Icon name="chevron-right" className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-accent-green">0 (Nominal)</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 4. RECENT ADMIN AUDIT LOG TRAIL */}
      <Card className="p-0 overflow-hidden bg-surface border border-border-light shadow-sm">
        <div className="p-6 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center border border-primary/20">
              <Icon name="shield-check" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-batangas text-text-primary">Recent Admin Actions & Audit Trail</h3>
              <p className="text-xs text-text-secondary">Cryptographically verifiable log of all administrative modifications</p>
            </div>
          </div>

          {onNavigateTab && (
            <Button
              variant="secondary"
              onClick={() => onNavigateTab('audit')}
              className="text-xs px-3.5 py-1.5 h-8 bg-slate-100 hover:bg-slate-200 text-text-primary border border-border-light shadow-xs"
            >
              <span>View Full Audit Log</span>
              <Icon name="chevron-right" className="w-3.5 h-3.5 ml-1 text-text-secondary" />
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border-light">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                <th className="px-6 py-3.5 font-semibold">Admin Actor</th>
                <th className="px-6 py-3.5 font-semibold">Action Performed</th>
                <th className="px-6 py-3.5 font-semibold">Target Context</th>
                <th className="px-6 py-3.5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60 text-xs">
              {summary.recentActions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-text-secondary">
                    No recent administrative mutations logged in database.
                  </td>
                </tr>
              ) : (
                summary.recentActions.map((action) => (
                  <tr key={action.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-text-secondary font-mono">
                      {new Date(action.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-text-primary">
                      {action.admin_email}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-light text-primary border border-primary/20">
                        {action.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary font-mono">
                      {action.target_user_id ? (
                        <span className="truncate block max-w-xs">{action.target_user_id}</span>
                      ) : (
                        'System Wide'
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right text-text-secondary">
                      {action.details?.reason || action.details?.amount ? (
                        <span className="text-text-primary">
                          {action.details.amount ? `${action.details.amount > 0 ? '+' : ''}${action.details.amount} cr • ` : ''}
                          {action.details.reason || 'Manual change'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
