import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { AdminStateMessage } from './AdminStateMessage.js';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  DollarSign, 
  Receipt, 
  User, 
  ExternalLink, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ArrowDownRight, 
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Download
} from 'lucide-react';

interface PaymentsManagerProps {
  onSelectUser?: (userId: string) => void;
}

interface PaymentTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  user_tier: string;
  amount: number;
  currency: string;
  plan_id: string;
  credits_added: number;
  payment_method: string;
  payment_status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  refund_status: string;
  refund_id?: string;
  refunded_at?: string;
  refund_reason?: string;
  refund_amount?: number;
  created_at: string;
  updated_at?: string;
}

interface RevenueSummary {
  totalRevenue: number;
  netRevenue: number;
  revenueThisMonth: number;
  revenueThisWeek: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  totalRefundedAmount: number;
  avgOrderValue: number;
  successRate: number;
  planBreakdown: Record<string, { count: number; revenue: number }>;
  revenueTrend: Array<{ date: string; revenue: number; transactions: number }>;
}

export default function PaymentsManager({ onSelectUser }: PaymentsManagerProps) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Selected Transaction Modal
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);

  // Refund Modal State
  const [refundModalTx, setRefundModalTx] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState('');
  const [reverseCredits, setReverseCredits] = useState(true);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchPayments();
  }, [page, debouncedSearch, statusFilter, planFilter, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setPaymentsError(null);
      const res = await axios.get('/api/admin/payments', {
        headers: await getHeaders(),
        params: {
          search: debouncedSearch,
          status: statusFilter,
          plan: planFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit,
          offset: (page - 1) * limit,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      });
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setPaymentsError(err.response?.data?.error || err.message || 'Failed to retrieve payment records. Please verify gateway and database connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await axios.get('/api/admin/payments/summary', {
        headers: await getHeaders()
      });
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.warn('Error fetching revenue summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleOpenRefundModal = (tx: PaymentTransaction) => {
    setRefundModalTx(tx);
    setRefundAmount(String(tx.amount || ''));
    setRefundReason('');
    setReverseCredits(true);
    setRefundError(null);
  };

  const handleProcessRefund = async () => {
    if (!refundModalTx) return;
    if (!refundReason.trim()) {
      setRefundError('Please provide a reason for the refund.');
      return;
    }
    const numAmt = Number(refundAmount);
    if (!numAmt || numAmt <= 0 || numAmt > refundModalTx.amount) {
      setRefundError(`Refund amount must be between 1 and ₹${refundModalTx.amount}`);
      return;
    }

    try {
      setRefundLoading(true);
      setRefundError(null);
      const res = await axios.post(`/api/admin/payments/${refundModalTx.id}/refund`, {
        amount: numAmt,
        reason: refundReason.trim(),
        reverseCredits
      }, {
        headers: await getHeaders()
      });

      alert(res.data.message || 'Refund successfully processed via Razorpay.');
      setRefundModalTx(null);
      if (selectedTx?.id === refundModalTx.id) {
        setSelectedTx(null);
      }
      fetchPayments();
      fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Refund failed to execute on server.';
      setRefundError(msg);
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-accent-green border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3" /> Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-text-secondary border border-border-light">
            {status || 'Pending'}
          </span>
        );
    }
  };

  const formatPlanName = (planId?: string) => {
    switch (planId?.toLowerCase()) {
      case 'pro':
        return 'Pro Subscription';
      case 'payg':
      case 'pay-as-you-go':
        return 'Pay As You Go';
      case 'agency':
        return 'Agency Plan';
      default:
        return planId ? planId.toUpperCase() : 'Custom Pack';
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. REVENUE KPI SUMMARY METRICS */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Gross Revenue */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Gross Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-accent-green border border-emerald-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-batangas text-text-primary font-mono">₹{summary.totalRevenue.toLocaleString()}</span>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                <span className="text-accent-green font-semibold">₹{summary.revenueThisMonth.toLocaleString()}</span>
                <span>past 30 days</span>
              </div>
            </div>
          </Card>

          {/* Net Revenue */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Net Revenue (After Refunds)</span>
              <div className="p-2 rounded-xl bg-primary-light text-primary border border-primary/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-batangas text-text-primary font-mono">₹{summary.netRevenue.toLocaleString()}</span>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                <span>Refunded: </span>
                <span className="text-purple-600 font-semibold">₹{summary.totalRefundedAmount.toLocaleString()} ({summary.refundedTransactions})</span>
              </div>
            </div>
          </Card>

          {/* Average Order Value (AOV) */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Avg Order Value (AOV)</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-batangas text-text-primary font-mono">₹{summary.avgOrderValue.toLocaleString()}</span>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                <span className="text-blue-600 font-semibold">{summary.successfulTransactions}</span>
                <span>successful payments</span>
              </div>
            </div>
          </Card>

          {/* Payment Success Rate */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Success Rate</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{summary.successRate}%</span>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                <span>Failed: </span>
                <span className="text-rose-600 font-semibold">{summary.failedTransactions} attempts</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. REVENUE TREND CHART & PLAN BREAKDOWN */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 14-Day Revenue Trend */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold font-batangas text-text-primary text-sm">Revenue Ingestion Trend</h3>
                <p className="text-xs text-text-secondary">Daily collections over past 14 days (INR)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-accent-green border border-emerald-200">
                ₹{summary.revenueThisWeek.toLocaleString()} this week
              </span>
            </div>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6A5AE0" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6A5AE0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6A5AE0" strokeWidth={2.5} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue by Plan Distribution */}
          <Card className="p-5 bg-surface border border-border-light shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold font-batangas text-text-primary text-sm">Plan Breakdown</h3>
              <p className="text-xs text-text-secondary">Revenue split across subscription packages</p>
            </div>

            <div className="space-y-3 my-auto">
              {Object.entries(summary.planBreakdown).map(([planKey, data]) => {
                const percent = summary.totalRevenue > 0 ? Math.round((data.revenue / summary.totalRevenue) * 100) : 0;
                return (
                  <div key={planKey} className="p-3 rounded-xl bg-slate-50 border border-border-light">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-text-primary">{formatPlanName(planKey)}</span>
                      <span className="font-mono text-accent-green font-bold">₹{data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                      <span>{data.count} purchases</span>
                      <span>{percent}% total</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border-light text-[11px] text-text-secondary text-center">
              Payments reconciled in real time via Razorpay webhook stream
            </div>
          </Card>
        </div>
      )}

      {/* 3. FILTERS & SEARCH CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-surface border border-border-light p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search Payment ID, Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid / Success</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs font-medium"
          >
            <option value="">All Plans</option>
            <option value="pro">Pro Subscription</option>
            <option value="payg">Pay As You Go</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              title="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                className="p-1.5 text-text-secondary hover:text-text-primary"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const authHeader = await getAdminAuthHeader();
              window.open(`/api/admin/export/csv?type=payments&token=${encodeURIComponent(authHeader || '')}`, '_blank');
            }}
            className="text-xs px-3 h-8 bg-slate-100 border-border-light text-text-primary hover:bg-slate-200 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => { fetchPayments(); fetchSummary(); }}
            className="text-xs px-3 h-8 bg-slate-100 border-border-light text-text-primary hover:bg-slate-200 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4. TRANSACTIONS TABLE */}
      <Card className="p-0 overflow-hidden border border-border-light shadow-sm bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary uppercase text-[11px] tracking-wider font-semibold border-b border-border-light">
              <tr>
                <th className="px-4 py-3.5">Payment ID & Gateway</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Package / Plan</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5">Refund Status</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <AdminStateMessage
                      type="loading"
                      title="Loading Payment Records"
                      message="Querying transactions, Razorpay gateway identifiers, and payment allocations..."
                    />
                  </td>
                </tr>
              ) : paymentsError && transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4">
                    <AdminStateMessage
                      type="error"
                      title="Failed to Load Payments"
                      message={paymentsError}
                      onRetry={fetchPayments}
                      retryText="Retry Loading Payments"
                    />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <AdminStateMessage
                      type="empty"
                      title="No Payment Transactions"
                      message={search || statusFilter || planFilter || startDate || endDate ? "No transactions match your current search and date filters." : "No payment records found in the database."}
                      onClearFilters={search || statusFilter || planFilter || startDate || endDate ? () => {
                        setSearch('');
                        setStatusFilter('');
                        setPlanFilter('');
                        setStartDate('');
                        setEndDate('');
                        setPage(1);
                      } : undefined}
                      clearFiltersText="Reset All Filters"
                    />
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isRefunded = tx.payment_status === 'refunded' || tx.refund_status === 'refunded';
                  return (
                    <tr 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Payment ID & Order */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-medium text-xs text-text-primary">
                          {tx.razorpay_payment_id || tx.id.substring(0, 16)}
                        </div>
                        <div className="text-[11px] text-text-secondary font-mono mt-0.5">
                          Order: {tx.razorpay_order_id || 'Direct'}
                        </div>
                      </td>

                      {/* Customer */}
                      <td 
                        className="px-4 py-3.5"
                        onClick={(e) => {
                          if (onSelectUser && tx.user_id) {
                            e.stopPropagation();
                            onSelectUser(tx.user_id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {tx.user_name?.charAt(0)?.toUpperCase() || tx.user_email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-text-primary group-hover:text-primary transition-colors flex items-center gap-1">
                              {tx.user_name}
                              {onSelectUser && tx.user_id && (
                                <ExternalLink className="w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                            <div className="text-[11px] text-text-secondary font-mono">{tx.user_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Amount & Currency */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-sm text-text-primary font-mono">
                          ₹{tx.amount?.toLocaleString()} <span className="text-[11px] font-normal text-text-secondary">{tx.currency}</span>
                        </div>
                        {tx.credits_added > 0 && (
                          <div className="text-[11px] text-primary">+{tx.credits_added} credits</div>
                        )}
                      </td>

                      {/* Package / Plan */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-text-primary border border-border-light">
                          {formatPlanName(tx.plan_id)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(tx.payment_status)}
                      </td>

                      {/* Refund Status */}
                      <td className="px-4 py-3.5 text-xs">
                        {isRefunded ? (
                          <div>
                            <span className="text-purple-700 font-semibold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> ₹{tx.refund_amount || tx.amount}
                            </span>
                            {tx.refund_id && (
                              <span className="text-[10px] text-text-secondary font-mono block">{tx.refund_id.substring(0, 14)}...</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-text-secondary">
                        {new Date(tx.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(tx.payment_status === 'paid' || tx.payment_status === 'success') && !isRefunded && tx.razorpay_payment_id && (
                            <Button
                              variant="secondary"
                              className="text-xs h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-xs"
                              onClick={() => handleOpenRefundModal(tx)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" /> Refund
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
          <span className="text-xs text-text-secondary font-medium">
            Showing <strong className="text-text-primary">{transactions.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to <strong className="text-text-primary">{Math.min(page * limit, total)}</strong> of <strong className="text-text-primary">{total}</strong> payments
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="text-xs px-2.5 h-8 bg-white border-border-light text-text-primary shadow-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="text-xs font-semibold px-2 text-text-primary">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
              className="text-xs px-2.5 h-8 bg-white border-border-light text-text-primary shadow-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 5. TRANSACTION DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border-light w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-border-light">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-batangas text-text-primary">Payment Transaction Detail</h3>
                  {getStatusBadge(selectedTx.payment_status)}
                </div>
                <p className="text-xs text-text-secondary font-mono mt-1">ID: {selectedTx.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                  {selectedTx.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">{selectedTx.user_name}</h4>
                  <p className="text-xs text-text-secondary font-mono">{selectedTx.user_email}</p>
                </div>
              </div>
              {onSelectUser && selectedTx.user_id && (
                <Button
                  variant="secondary"
                  className="text-xs bg-white border-border-light text-text-primary shadow-xs"
                  onClick={() => {
                    const uid = selectedTx.user_id;
                    setSelectedTx(null);
                    onSelectUser(uid);
                  }}
                >
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  View Profile
                </Button>
              )}
            </div>

            {/* Core Financials */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Gross Amount</span>
                <span className="text-base font-bold text-text-primary font-mono">₹{selectedTx.amount?.toLocaleString()} {selectedTx.currency}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Package Plan</span>
                <span className="text-xs font-semibold text-text-primary">{formatPlanName(selectedTx.plan_id)}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Credits Injected</span>
                <span className="text-base font-bold text-primary font-mono">+{selectedTx.credits_added}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Payment Date</span>
                <span className="text-xs text-text-primary font-medium">
                  {new Date(selectedTx.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Payment Method</span>
                <span className="text-xs text-text-primary">{selectedTx.payment_method || 'Razorpay'}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Refund Status</span>
                <span className="text-xs font-semibold">
                  {selectedTx.refund_status === 'refunded' ? (
                    <span className="text-purple-700">Refunded (₹{selectedTx.refund_amount || selectedTx.amount})</span>
                  ) : (
                    <span className="text-accent-green">Captured (No refund)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Gateway Identifiers */}
            <div className="p-4 bg-slate-50 rounded-xl border border-border-light space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-primary" /> Gateway Reference Codes
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary">Razorpay Payment ID:</span>{' '}
                  <span className="font-mono font-medium text-text-primary">{selectedTx.razorpay_payment_id || 'None'}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Razorpay Order ID:</span>{' '}
                  <span className="font-mono font-medium text-text-primary">{selectedTx.razorpay_order_id || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Refund Data if applicable */}
            {selectedTx.refund_status === 'refunded' && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2 text-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Refund Audit Info
                </h5>
                <div><span className="text-text-secondary">Refund ID:</span> <span className="font-mono text-purple-800">{selectedTx.refund_id || 'N/A'}</span></div>
                <div><span className="text-text-secondary">Refund Amount:</span> <span className="font-mono font-bold text-purple-800">₹{selectedTx.refund_amount || selectedTx.amount}</span></div>
                <div><span className="text-text-secondary">Reason:</span> <span className="text-text-primary">{selectedTx.refund_reason || 'Administrative refund'}</span></div>
                {selectedTx.refunded_at && (
                  <div><span className="text-text-secondary">Processed At:</span> <span className="text-text-primary">{new Date(selectedTx.refunded_at).toLocaleString()}</span></div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-border-light">
              <div>
                {(selectedTx.payment_status === 'paid' || selectedTx.payment_status === 'success') && selectedTx.refund_status !== 'refunded' && selectedTx.razorpay_payment_id && (
                  <Button
                    variant="secondary"
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-xs"
                    onClick={() => {
                      const t = selectedTx;
                      setSelectedTx(null);
                      handleOpenRefundModal(t);
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Process Gateway Refund
                  </Button>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={() => setSelectedTx(null)}
                className="bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary text-xs shadow-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SECURE BACKEND REFUND MODAL */}
      {refundModalTx && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border-light shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-bold font-batangas text-lg">
                <RotateCcw className="w-5 h-5" />
                <h3>Process Refund</h3>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Issuing an official refund via Razorpay for <strong>{refundModalTx.user_email}</strong>.
              </p>
            </div>

            {refundError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{refundError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Refund Amount (INR) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold">₹</span>
                  <input
                    type="number"
                    value={refundAmount}
                    max={refundModalTx.amount}
                    min={1}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-border-light rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/40 shadow-xs"
                  />
                </div>
                <span className="text-[11px] text-text-secondary mt-1 block">
                  Original transaction total: ₹{refundModalTx.amount}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Reason for Refund <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer support resolution / Accidental double charge"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/40 shadow-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-border-light rounded-xl space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reverseCredits"
                    checked={reverseCredits}
                    onChange={(e) => setReverseCredits(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 bg-white border-border-light"
                  />
                  <label htmlFor="reverseCredits" className="font-semibold text-text-primary">
                    Deduct added credits ({refundModalTx.credits_added} credits)
                  </label>
                </div>
                <p className="text-[11px] text-text-secondary pl-6">
                  Safely reduces the customer's active credit quota on database upon successful refund.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
              <Button
                variant="secondary"
                onClick={() => setRefundModalTx(null)}
                disabled={refundLoading}
                className="bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleProcessRefund}
                disabled={refundLoading || !refundReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {refundLoading ? <Spinner className="w-4 h-4 mr-1.5" /> : <RotateCcw className="w-4 h-4 mr-1.5" />}
                Confirm Razorpay Refund
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
