import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { AdminStateMessage } from './AdminStateMessage';
import { AdminConfirmationModal } from './AdminConfirmationModal';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  User, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Receipt,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';

interface SubscriptionsListProps {
  onSelectUser?: (userId: string) => void;
}

export default function SubscriptionsList({ onSelectUser }: SubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;
  
  // Modals & details
  const [selectedSubDetail, setSelectedSubDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelModalSub, setCancelModalSub] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Drift / Reconciliation
  const [driftChecking, setDriftChecking] = useState(false);
  const [driftResults, setDriftResults] = useState<any[] | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter, planFilter, paymentStatusFilter, debouncedSearch]);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setSubsError(null);
      const res = await axios.get('/api/admin/subscriptions', {
        headers: await getHeaders(),
        params: { 
          status: statusFilter, 
          plan: planFilter,
          paymentStatus: paymentStatusFilter,
          search: debouncedSearch,
          limit, 
          offset: (page - 1) * limit 
        }
      });
      setSubscriptions(res.data.subscriptions || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setSubsError(err.response?.data?.error || err.message || 'Failed to retrieve subscriptions. Please check gateway and database connection.');
    } finally {
      setLoading(false);
    }
  };

  const openSubscriptionDetail = async (sub: any) => {
    setSelectedSubDetail(sub);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/admin/subscriptions/${sub.id}`, {
        headers: await getHeaders()
      });
      if (res.data.subscription) {
        setSelectedSubDetail(res.data.subscription);
      }
    } catch (err) {
      console.warn('Failed to load rich subscription details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) return alert("Please provide a reason for cancellation.");
    try {
      setCancelLoading(true);
      await axios.post(`/api/admin/subscriptions/${cancelModalSub.id}/cancel`, 
        { reason: cancelReason, immediate: cancelImmediate }, 
        { headers: await getHeaders() }
      );
      setCancelModalSub(null);
      setCancelReason('');
      fetchSubscriptions();
      if (selectedSubDetail?.id === cancelModalSub.id) {
        setSelectedSubDetail(null);
      }
      alert("Subscription cancelled successfully.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Error cancelling subscription in Razorpay/Database");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setDriftChecking(true);
      setDriftResults(null);
      const res = await axios.get('/api/admin/subscriptions-reconcile', { headers: await getHeaders() });
      setDriftResults(res.data.mismatches || []);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error checking Razorpay subscription drift");
    } finally {
      setDriftChecking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-accent-green border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-text-secondary border border-border-light px-2.5 py-0.5 rounded-full font-medium">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full font-medium">
            <AlertTriangle className="w-3 h-3" /> Past Due
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
            <Clock className="w-3 h-3" /> Expired
          </span>
        );
      default:
        return (
          <span className="text-xs bg-slate-100 text-text-secondary px-2 py-0.5 rounded-full font-medium border border-border-light">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
      case 'success':
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-accent-green border border-emerald-200">
            Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-text-secondary border border-border-light">
            {paymentStatus || 'Pending'}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Active status quick stats from loaded data
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;
  const pastDueCount = subscriptions.filter(s => s.status === 'past_due' || s.status === 'expired').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header controls & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[260px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search user, sub ID, order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border-light rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
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
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium text-text-primary shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="past_due">Past Due</option>
            <option value="expired">Expired</option>
          </select>

          {/* Plan Filter */}
          <select 
            value={planFilter} 
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium text-text-primary shadow-xs"
          >
            <option value="">All Plans</option>
            <option value="pro">Pro Plan</option>
            <option value="payg">Pay As You Go</option>
            <option value="agency">Agency / Studio</option>
          </select>

          {/* Payment Status Filter */}
          <select 
            value={paymentStatusFilter} 
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium text-text-primary shadow-xs"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              const authHeader = await getAdminAuthHeader();
              window.open(`/api/admin/export/csv?type=subscriptions&token=${encodeURIComponent(authHeader || '')}`, '_blank');
            }}
            variant="secondary"
            className="text-xs px-3 bg-white border-border-light text-text-primary shadow-xs"
            title="Export Subscriptions CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button 
            onClick={fetchSubscriptions} 
            variant="secondary"
            className="text-xs px-3 bg-white border-border-light text-text-primary shadow-xs"
            title="Refresh subscriptions"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            onClick={handleReconcile} 
            variant="secondary" 
            disabled={driftChecking}
            className="text-xs bg-white border-border-light text-text-primary shadow-xs"
          >
            {driftChecking ? <Spinner className="w-3.5 h-3.5 mr-1.5" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-primary" />}
            Reconcile with Razorpay
          </Button>
        </div>
      </div>

      {/* Drift Reconciliation Results */}
      {driftResults && (
        <Card className={`p-4 border shadow-sm ${driftResults.length > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {driftResults.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-accent-green" />
              )}
              <h3 className={`font-semibold font-batangas text-sm ${driftResults.length > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                {driftResults.length > 0 
                  ? `Found ${driftResults.length} subscription drift discrepancies` 
                  : 'All database subscriptions are synchronized with Razorpay gateway.'}
              </h3>
            </div>
            <button 
              onClick={() => setDriftResults(null)}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {driftResults.length > 0 && (
            <div className="text-xs space-y-2 max-h-48 overflow-y-auto mt-3 pt-2 border-t border-amber-200/60">
              {driftResults.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-amber-200/40">
                  <div>
                    <span className="font-mono font-medium text-text-primary">{r.local_id?.substring(0, 18)}...</span>
                    <div className="text-text-secondary text-[11px] mt-0.5">Plan: {r.plan_name} | Razorpay ID: {r.razorpay_id || 'None'}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div>Local: <span className="font-semibold text-text-primary">{r.local_status}</span></div>
                    <div>Gateway: <span className="font-bold text-amber-600">{r.razorpay_status}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Main Subscriptions Table */}
      <Card className="p-0 overflow-hidden border border-border-light bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary uppercase text-[11px] tracking-wider font-semibold border-b border-border-light">
              <tr>
                <th className="px-4 py-3.5">User & Contact</th>
                <th className="px-4 py-3.5">Subscription Plan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Renewal / Expiry</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60">
              {loading && subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminStateMessage
                      type="loading"
                      title="Loading Subscriptions"
                      message="Querying user subscription plans, recurring billing schedules, and status..."
                    />
                  </td>
                </tr>
              ) : subsError && subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <AdminStateMessage
                      type="error"
                      title="Failed to Load Subscriptions"
                      message={subsError}
                      onRetry={fetchSubscriptions}
                      retryText="Retry Loading Subscriptions"
                    />
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminStateMessage
                      type="empty"
                      title="No Subscriptions Found"
                      message={searchQuery || statusFilter || planFilter || paymentStatusFilter ? "No subscriptions match the selected search or filter criteria." : "No subscriptions found in the database."}
                      onClearFilters={searchQuery || statusFilter || planFilter || paymentStatusFilter ? () => {
                        setSearchQuery('');
                        setStatusFilter('');
                        setPlanFilter('');
                        setPaymentStatusFilter('');
                        setPage(1);
                      } : undefined}
                      clearFiltersText="Reset All Filters"
                    />
                  </td>
                </tr>
              ) : (
                subscriptions.map(sub => {
                  const startDate = sub.start_date || sub.current_period_start || sub.created_at;
                  const renewalDate = sub.renewal_date || sub.current_period_end;
                  const amountFormatted = sub.amount 
                    ? (sub.amount > 1000 ? `₹${(sub.amount / 100).toFixed(2)}` : `₹${sub.amount}`)
                    : '₹0';

                  return (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => openSubscriptionDetail(sub)}
                    >
                      {/* User Column */}
                      <td className="px-4 py-3.5" onClick={(e) => {
                        if (onSelectUser && sub.user_id) {
                          e.stopPropagation();
                          onSelectUser(sub.user_id);
                        }
                      }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {sub.name?.charAt(0)?.toUpperCase() || sub.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary flex items-center gap-1.5 hover:text-primary transition-colors">
                              {sub.name || 'User'}
                              {onSelectUser && sub.user_id && (
                                <ExternalLink className="w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                            <div className="text-xs text-text-secondary font-mono">{sub.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-text-primary">{sub.plan_name || 'Standard Plan'}</div>
                        <div className="text-xs text-text-secondary font-mono mt-0.5 flex items-center gap-1">
                          <span>{amountFormatted}</span>
                          {sub.credits_allocated ? (
                            <span className="text-[11px] text-primary">({sub.credits_allocated} credits)</span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(sub.status)}
                        {sub.cancel_at_period_end && sub.status === 'active' && (
                          <div className="text-[11px] text-amber-600 mt-1 font-medium">Cancels at cycle end</div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5">
                        {getPaymentBadge(sub.payment_status || (sub.status === 'active' ? 'paid' : 'pending'))}
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-3.5 text-xs text-text-secondary">
                        {startDate ? new Date(startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>

                      {/* Renewal Date */}
                      <td className="px-4 py-3.5 text-xs text-text-secondary">
                        {renewalDate ? (
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                            {new Date(renewalDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        ) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openSubscriptionDetail(sub)}
                            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {sub.status === 'active' && sub.razorpay_subscription_id && !sub.cancel_at_period_end && (
                            <Button 
                              variant="secondary" 
                              className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 h-8 px-2.5 shadow-xs" 
                              onClick={() => setCancelModalSub(sub)}
                            >
                              Cancel
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
        
        {/* Pagination Bar */}
        <div className="p-4 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <span className="text-xs text-text-secondary font-medium">
            Showing <strong className="text-text-primary">{subscriptions.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to <strong className="text-text-primary">{Math.min(page * limit, total)}</strong> of <strong className="text-text-primary">{total}</strong> subscriptions
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

      {/* Subscription Detail Modal */}
      {selectedSubDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border-light w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6">
            <div className="flex justify-between items-start pb-4 border-b border-border-light">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-batangas text-text-primary">
                    {selectedSubDetail.plan_name || 'Subscription Details'}
                  </h3>
                  {getStatusBadge(selectedSubDetail.status)}
                </div>
                <p className="text-xs text-text-secondary mt-1 font-mono">
                  ID: {selectedSubDetail.id}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSubDetail(null)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-6">
              {/* User overview section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-border-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                    {selectedSubDetail.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">
                      {selectedSubDetail.name || 'User Account'}
                    </h4>
                    <p className="text-xs text-text-secondary font-mono">{selectedSubDetail.email}</p>
                  </div>
                </div>
                {onSelectUser && selectedSubDetail.user_id && (
                  <Button 
                    variant="secondary" 
                    className="text-xs bg-white border-border-light text-text-primary shadow-xs"
                    onClick={() => {
                      const uid = selectedSubDetail.user_id;
                      setSelectedSubDetail(null);
                      onSelectUser(uid);
                    }}
                  >
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    Open User Profile
                  </Button>
                )}
              </div>

              {/* Subscription Core Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-white border border-border-light rounded-xl shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Billing Amount</span>
                  <span className="text-base font-bold text-text-primary">
                    ₹{selectedSubDetail.amount ? (selectedSubDetail.amount > 1000 ? (selectedSubDetail.amount / 100).toFixed(2) : selectedSubDetail.amount) : '0'}
                  </span>
                  <span className="text-xs text-text-secondary ml-1">/ cycle</span>
                </div>

                <div className="p-3 bg-white border border-border-light rounded-xl shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Payment Status</span>
                  <div>{getPaymentBadge(selectedSubDetail.payment_status || (selectedSubDetail.status === 'active' ? 'paid' : 'pending'))}</div>
                </div>

                <div className="p-3 bg-white border border-border-light rounded-xl shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Credits Assigned</span>
                  <span className="text-base font-bold text-primary">
                    {selectedSubDetail.credits_allocated || 0}
                  </span>
                  <span className="text-xs text-text-secondary ml-1">credits</span>
                </div>

                <div className="p-3 bg-white border border-border-light rounded-xl shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Start Date</span>
                  <span className="text-xs font-semibold text-text-primary">
                    {selectedSubDetail.current_period_start || selectedSubDetail.created_at ? new Date(selectedSubDetail.current_period_start || selectedSubDetail.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-border-light rounded-xl shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Renewal / Expiry</span>
                  <span className="text-xs font-semibold text-text-primary">
                    {selectedSubDetail.current_period_end ? new Date(selectedSubDetail.current_period_end).toLocaleDateString() : '—'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-border-light rounded-xl shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold block mb-1">Auto-Renewal</span>
                  <span className="text-xs font-semibold">
                    {selectedSubDetail.cancel_at_period_end ? (
                      <span className="text-amber-600">Cancelling at End</span>
                    ) : (
                      <span className="text-accent-green">Enabled</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Gateway References */}
              <div className="p-4 bg-slate-50 rounded-xl border border-border-light space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-primary" /> Gateway Identifiers
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-secondary">Razorpay Sub ID:</span>{' '}
                    <span className="font-mono font-medium text-text-primary">{selectedSubDetail.razorpay_subscription_id || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Order ID:</span>{' '}
                    <span className="font-mono font-medium text-text-primary">{selectedSubDetail.razorpay_order_id || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Payment ID:</span>{' '}
                    <span className="font-mono font-medium text-text-primary">{selectedSubDetail.razorpay_payment_id || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Currency:</span>{' '}
                    <span className="font-mono font-medium text-text-primary">{selectedSubDetail.currency || 'INR'}</span>
                  </div>
                </div>
              </div>

              {/* Transaction History for this User */}
              {selectedSubDetail.payments && selectedSubDetail.payments.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">
                    User Payment History ({selectedSubDetail.payments.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-border-light rounded-xl p-2 bg-white">
                    {selectedSubDetail.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-xs">
                        <div>
                          <span className="font-mono font-medium text-text-primary">{p.razorpay_payment_id || p.id.substring(0, 8)}</span>
                          <span className="text-text-secondary ml-2">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-text-primary">₹{p.amount}</span>
                          {getPaymentBadge(p.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-border-light">
              <div>
                {selectedSubDetail.status === 'active' && selectedSubDetail.razorpay_subscription_id && !selectedSubDetail.cancel_at_period_end && (
                  <Button 
                    variant="secondary"
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 shadow-xs"
                    onClick={() => {
                      setCancelModalSub(selectedSubDetail);
                    }}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedSubDetail(null)} className="bg-white border-border-light text-text-primary shadow-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalSub && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border-light shadow-xl">
            <h3 className="text-lg font-bold font-batangas mb-1 text-text-primary">Cancel Subscription</h3>
            <p className="text-xs text-text-secondary mb-5">
              You are cancelling <strong>{cancelModalSub.plan_name}</strong> for <strong>{cancelModalSub.email}</strong> via Razorpay.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1 text-text-primary">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 shadow-xs"
                  placeholder="e.g. Customer requested via support / non-payment"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                />
              </div>
              
              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="immediate"
                    checked={cancelImmediate}
                    onChange={e => setCancelImmediate(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="immediate" className="text-xs font-semibold text-rose-700">
                    Cancel immediately (Revoke access now)
                  </label>
                </div>
                {!cancelImmediate && (
                  <p className="text-[11px] text-text-secondary">
                    If unchecked, subscription remains active until billing period ends ({cancelModalSub.current_period_end ? new Date(cancelModalSub.current_period_end).toLocaleDateString() : 'cycle end'}), after which no further renewals occur.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => { setCancelModalSub(null); setCancelReason(''); }}
                className="bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
              >
                Keep Active
              </Button>
              <Button 
                variant="primary" 
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs" 
                disabled={cancelLoading || !cancelReason.trim()} 
                onClick={handleCancelSubmit}
              >
                {cancelLoading ? <Spinner className="w-4 h-4 mr-1.5" /> : null}
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
