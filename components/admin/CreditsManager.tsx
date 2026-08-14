import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { AdminStateMessage } from './AdminStateMessage';
import {
  Coins,
  Search,
  PlusCircle,
  MinusCircle,
  History,
  TrendingUp,
  CreditCard,
  User,
  ExternalLink,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface CreditsManagerProps {
  onSelectUser?: (userId: string) => void;
}

interface UserCreditItem {
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  user_tier: string;
  current_balance: number;
  total_quota: number;
  credits_purchased: number;
  credits_consumed: number;
  generation_count: number;
  last_updated: string;
}

interface CreditHistoryItem {
  id: string;
  action: string;
  user_id: string;
  user_name: string;
  user_email: string;
  admin_email: string;
  amount: number;
  reason: string;
  old_balance?: number;
  new_balance?: number;
  created_at: string;
}

export default function CreditsManager({ onSelectUser }: CreditsManagerProps) {
  const [users, setUsers] = useState<UserCreditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [sortBy, setSortBy] = useState('current_balance');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals
  const [adjustModalUser, setAdjustModalUser] = useState<UserCreditItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState<string>('50');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // History Drawer/Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTargetUser, setHistoryTargetUser] = useState<UserCreditItem | null>(null);
  const [historyList, setHistoryList] = useState<CreditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchCreditsList();
  }, [page, debouncedSearch, tierFilter, sortBy, sortOrder]);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchCreditsList = async () => {
    try {
      setLoading(true);
      setCreditsError(null);
      const res = await axios.get('/api/admin/credits/overview', {
        headers: await getHeaders(),
        params: {
          search: debouncedSearch,
          tier: tierFilter || undefined,
          sortBy,
          sortOrder,
          limit,
          offset: (page - 1) * limit
        }
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error('Error fetching credits overview:', err);
      setCreditsError(err.response?.data?.error || err.message || 'Failed to retrieve credit ledger data. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (user?: UserCreditItem | null) => {
    try {
      setHistoryLoading(true);
      setHistoryTargetUser(user || null);
      setShowHistoryModal(true);
      const res = await axios.get('/api/admin/credits/history', {
        headers: await getHeaders(),
        params: {
          userId: user?.user_id || undefined,
          limit: 40
        }
      });
      setHistoryList(res.data.history || []);
    } catch (err) {
      console.error('Error fetching credit history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenAdjust = (user: UserCreditItem, mode: 'add' | 'deduct') => {
    setAdjustModalUser(user);
    setAdjustMode(mode);
    setAdjustAmount('50');
    setAdjustReason(mode === 'add' ? 'Support resolution credit grant' : 'Quota correction');
    setAdjustError(null);
  };

  const handleExecuteAdjust = async () => {
    if (!adjustModalUser) return;
    const num = Number(adjustAmount);
    if (!num || num <= 0) {
      setAdjustError('Please enter a positive numeric credit amount.');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Please provide a reason for this credit adjustment.');
      return;
    }

    const finalAmount = adjustMode === 'add' ? num : -num;

    if (adjustMode === 'deduct' && num > adjustModalUser.current_balance) {
      setAdjustError(`Cannot deduct more credits than user's balance (${adjustModalUser.current_balance}).`);
      return;
    }

    try {
      setAdjustLoading(true);
      setAdjustError(null);
      const res = await axios.post('/api/admin/credits/adjust', {
        userId: adjustModalUser.user_id,
        amount: finalAmount,
        reason: adjustReason.trim()
      }, {
        headers: await getHeaders()
      });

      alert(res.data.message || 'Credit adjustment applied successfully.');
      setAdjustModalUser(null);
      fetchCreditsList();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to adjust credits.';
      setAdjustError(msg);
    } finally {
      setAdjustLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Aggregate stats from current view for top KPIs
  const totalBalanceInView = users.reduce((sum, u) => sum + u.current_balance, 0);
  const totalPurchasedInView = users.reduce((sum, u) => sum + u.credits_purchased, 0);
  const totalConsumedInView = users.reduce((sum, u) => sum + u.credits_consumed, 0);
  const totalGenerationsInView = users.reduce((sum, u) => sum + u.generation_count, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Credits In Balance</span>
            <div className="p-2 rounded-xl bg-primary-light text-primary border border-primary/20">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{totalBalanceInView.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">Across active customer accounts</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Purchased</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-accent-green border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-accent-green font-mono">+{totalPurchasedInView.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">Via Razorpay transaction orders</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Credits Consumed</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{totalConsumedInView.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">Spent on image & video studio AI</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Generations</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{totalGenerationsInView.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">AI designs generated to date</p>
          </div>
        </Card>
      </div>

      {/* 2. SEARCH & CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-surface border border-border-light p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search user name or email..."
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

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium shadow-xs"
          >
            <option value="">All Tiers</option>
            <option value="Free">Free Tier</option>
            <option value="PayAsYouGo">Pay As You Go</option>
            <option value="Pro">Pro Plan</option>
            <option value="Agency">Agency Plan</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium shadow-xs"
          >
            <option value="current_balance">Sort: Balance (Highest)</option>
            <option value="credits_purchased">Sort: Purchased</option>
            <option value="credits_consumed">Sort: Consumed</option>
            <option value="generation_count">Sort: Generations</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchHistory(null)}
            className="text-xs px-3.5 h-8 bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
          >
            <History className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Audit Ledger
          </Button>

          <Button
            variant="secondary"
            onClick={() => fetchCreditsList()}
            className="text-xs px-3.5 h-8 bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 3. USER CREDITS TABLE */}
      <Card className="p-0 overflow-hidden border border-border-light shadow-sm bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary uppercase text-[11px] tracking-wider font-semibold border-b border-border-light">
              <tr>
                <th className="px-4 py-3.5">Customer Profile</th>
                <th className="px-4 py-3.5">Subscription Tier</th>
                <th className="px-4 py-3.5">Current Balance</th>
                <th className="px-4 py-3.5">Purchased Credits</th>
                <th className="px-4 py-3.5">Credits Consumed</th>
                <th className="px-4 py-3.5">Generations Count</th>
                <th className="px-4 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminStateMessage
                      type="loading"
                      title="Loading Credit Accounts"
                      message="Querying user credit balances, purchases, and AI generation usage..."
                    />
                  </td>
                </tr>
              ) : creditsError && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <AdminStateMessage
                      type="error"
                      title="Failed to Load Credit Ledger"
                      message={creditsError}
                      onRetry={fetchCreditsList}
                      retryText="Retry Loading Credits"
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminStateMessage
                      type="empty"
                      title="No Matching Credit Accounts"
                      message={search || tierFilter ? "No user accounts match the selected credit filters." : "No credit ledger records found."}
                      onClearFilters={search || tierFilter ? () => {
                        setSearch('');
                        setTierFilter('');
                        setPage(1);
                      } : undefined}
                      clearFiltersText="Reset All Filters"
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Customer */}
                    <td 
                      className="px-4 py-3.5 cursor-pointer"
                      onClick={() => onSelectUser && onSelectUser(u.user_id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                          {u.user_name?.charAt(0)?.toUpperCase() || u.user_email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-text-primary group-hover:text-primary transition-colors flex items-center gap-1">
                            {u.user_name}
                            {onSelectUser && (
                              <ExternalLink className="w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <div className="text-[11px] text-text-secondary font-mono">{u.user_email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        u.user_tier === 'Pro' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : u.user_tier === 'PayAsYouGo'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-border-light'
                      }`}>
                        {u.user_tier}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-sm text-primary font-mono bg-primary-light px-2.5 py-1 rounded-lg border border-primary/20">
                        {u.current_balance} <span className="text-[10px] uppercase font-normal text-text-secondary">CR</span>
                      </span>
                    </td>

                    {/* Purchased */}
                    <td className="px-4 py-3.5 font-mono text-xs text-accent-green font-semibold">
                      +{u.credits_purchased}
                    </td>

                    {/* Consumed */}
                    <td className="px-4 py-3.5 font-mono text-xs text-text-secondary font-medium">
                      {u.credits_consumed}
                    </td>

                    {/* Generation Count */}
                    <td className="px-4 py-3.5 font-mono text-xs text-text-secondary font-medium">
                      {u.generation_count} designs
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          className="text-xs h-7 px-2 bg-emerald-50 hover:bg-emerald-100 text-accent-green border-emerald-200 shadow-xs"
                          onClick={() => handleOpenAdjust(u, 'add')}
                          title="Add Credits"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>

                        <Button
                          variant="secondary"
                          className="text-xs h-7 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-xs"
                          onClick={() => handleOpenAdjust(u, 'deduct')}
                          title="Deduct Credits"
                        >
                          <MinusCircle className="w-3.5 h-3.5 mr-1" /> Deduct
                        </Button>

                        <button
                          onClick={() => fetchHistory(u)}
                          className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Credit Adjustments Log"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
          <span className="text-xs text-text-secondary font-medium">
            Showing <strong className="text-text-primary">{users.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to <strong className="text-text-primary">{Math.min(page * limit, total)}</strong> of <strong className="text-text-primary">{total}</strong> accounts
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

      {/* 4. CREDIT ADJUST MODAL (ADD / DEDUCT) */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border-light shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 text-text-primary font-bold font-batangas text-lg">
                {adjustMode === 'add' ? (
                  <div className="p-2 rounded-xl bg-emerald-50 text-accent-green border border-emerald-100">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    <MinusCircle className="w-5 h-5" />
                  </div>
                )}
                <h3>{adjustMode === 'add' ? 'Grant User Credits' : 'Deduct User Credits'}</h3>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Modifying balance for <strong>{adjustModalUser.user_email}</strong>.
              </p>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{adjustError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light flex justify-between items-center">
                <span className="text-text-secondary">Current Balance:</span>
                <span className="font-mono font-bold text-primary text-sm">{adjustModalUser.current_balance} Credits</span>
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Credit Amount <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  min={1}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-1">
                  Operational Reason <span className="text-primary">*</span>
                </label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
                  placeholder="e.g. Compensation for failed render batch"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
              <Button
                variant="secondary"
                onClick={() => setAdjustModalUser(null)}
                disabled={adjustLoading}
                className="bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteAdjust}
                disabled={adjustLoading || !adjustReason.trim()}
                className={adjustMode === 'add' ? 'bg-accent-green hover:bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
              >
                {adjustLoading ? <Spinner className="w-4 h-4 mr-1.5 text-white" /> : null}
                Confirm {adjustMode === 'add' ? 'Grant' : 'Deduction'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREDIT AUDIT HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-border-light shadow-xl space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-border-light">
              <div>
                <h3 className="text-base font-bold font-batangas text-text-primary flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  {historyTargetUser ? `Credit Adjustments: ${historyTargetUser.user_email}` : 'Platform Credit Adjustment Ledger'}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Audited administrative actions and balance grants
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-text-secondary">
                <Spinner className="w-5 h-5 mx-auto mb-2 text-primary" />
                Loading ledger entries...
              </div>
            ) : historyList.length === 0 ? (
              <div className="py-12 text-center text-text-secondary">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-text-primary">No adjustment history recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historyList.map((item) => {
                  const isPositive = item.amount > 0;
                  return (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-border-light text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-primary flex items-center gap-1.5">
                          {isPositive ? (
                            <span className="text-accent-green flex items-center gap-0.5 font-mono font-bold">
                              <ArrowUpRight className="w-3.5 h-3.5" /> +{item.amount} Credits
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-0.5 font-mono font-bold">
                              <ArrowDownRight className="w-3.5 h-3.5" /> {item.amount} Credits
                            </span>
                          )}
                          <span className="text-text-secondary font-normal">for</span>
                          <span className="font-mono text-text-primary">{item.user_email}</span>
                        </span>
                        <span className="text-text-secondary text-[11px]">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-text-secondary text-[11px] flex justify-between items-center">
                        <span>Reason: <em>"{item.reason}"</em></span>
                        <span className="text-text-secondary font-mono">By: {item.admin_email}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border-light">
              <Button
                variant="secondary"
                onClick={() => setShowHistoryModal(false)}
                className="bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
