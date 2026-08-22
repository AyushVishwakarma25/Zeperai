import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { Icon } from '../ui/Icon.js';
import { AdminConfirmationModal } from './AdminConfirmationModal.js';

interface Props {
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function UserDetailModal({ userId, onClose, onUpdated }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'generations' | 'payments' | 'audit' | 'actions'>('overview');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Mutation states
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditReason, setCreditReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation Modals
  const [showAdminConfirmModal, setShowAdminConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const authHeader = await getAdminAuthHeader();
      const res = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${authHeader}` }
      });
      setUser(res.data.user);
    } catch (err: any) {
      console.error(err);
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Failed to load user details.' });
    } finally {
      setLoading(false);
    }
  };

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAdjustCredits = async () => {
    if (creditAmount === 0) {
      setActionMsg({ type: 'error', text: 'Please enter a non-zero credit adjustment amount.' });
      return;
    }
    if (!creditReason.trim()) {
      setActionMsg({ type: 'error', text: 'Reason is required for audit logging.' });
      return;
    }

    try {
      setActionLoading(true);
      setActionMsg(null);
      await axios.post(
        `/api/admin/users/${userId}/adjust-credits`,
        { amount: creditAmount, reason: creditReason.trim() },
        { headers: await getHeaders() }
      );
      setActionMsg({ type: 'success', text: `Successfully adjusted credits by ${creditAmount > 0 ? '+' : ''}${creditAmount}.` });
      setCreditAmount(0);
      setCreditReason('');
      await fetchUser();
      onUpdated();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Error adjusting credits.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTier = async (newTier: string) => {
    try {
      setActionLoading(true);
      setActionMsg(null);
      await axios.post(
        `/api/admin/users/${userId}/update-tier`,
        { tier: newTier },
        { headers: await getHeaders() }
      );
      setActionMsg({ type: 'success', text: `User tier successfully updated to ${newTier}.` });
      await fetchUser();
      onUpdated();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Error updating user tier.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdminConfirmed = async () => {
    const nextAdminState = !user?.is_admin;
    try {
      setActionLoading(true);
      setActionMsg(null);
      await axios.post(
        `/api/admin/users/${userId}/toggle-admin`,
        { is_admin: nextAdminState },
        { headers: await getHeaders() }
      );
      setActionMsg({ type: 'success', text: `Admin privileges ${nextAdminState ? 'granted' : 'revoked'}.` });
      setShowAdminConfirmModal(false);
      await fetchUser();
      onUpdated();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Error updating admin status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      setActionMsg({ type: 'error', text: 'Suspension reason is required for audit trail.' });
      return;
    }
    try {
      setActionLoading(true);
      setActionMsg(null);
      await axios.post(
        `/api/admin/users/${userId}/ban`,
        { reason: banReason.trim() },
        { headers: await getHeaders() }
      );
      setActionMsg({ type: 'success', text: 'User account has been suspended.' });
      setBanReason('');
      await fetchUser();
      onUpdated();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Error suspending user.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    try {
      setActionLoading(true);
      setActionMsg(null);
      await axios.post(
        `/api/admin/users/${userId}/unban`,
        {},
        { headers: await getHeaders() }
      );
      setActionMsg({ type: 'success', text: 'User account ban revoked.' });
      await fetchUser();
      onUpdated();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Error unbanning user.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      setActionLoading(true);
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: await getHeaders(),
        data: { confirmationEmail: user?.email }
      });
      setShowDeleteConfirmModal(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Error deleting user.' });
      setActionLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div className="bg-white border border-border-light rounded-2xl p-8 flex flex-col items-center space-y-3 shadow-xl">
          <Spinner className="w-8 h-8 text-primary" />
          <p className="text-sm text-text-secondary font-medium">Loading user profile & activity record...</p>
        </div>
      </div>
    );
  }

  const currentBalance = user.credits?.current_balance ?? 0;
  const totalQuota = user.credits?.total_quota ?? 50;
  const creditUsagePct = totalQuota > 0 ? Math.min(100, Math.round(((totalQuota - currentBalance) / totalQuota) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-border-light rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8 text-text-primary flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border-light flex items-start justify-between bg-main/50 sticky top-0 z-20">
          <div className="flex items-start space-x-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="w-12 h-12 rounded-xl object-cover border border-border-light" alt="avatar" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-lg font-bold font-batangas text-text-primary leading-tight">{user.name || user.email}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {user.tier || 'Free'} Tier
                </span>
                {user.is_admin && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                    Admin
                  </span>
                )}
                {user.banned_at ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    Banned
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user.email}</p>
              <div className="flex items-center space-x-3 mt-1.5 text-xs text-text-secondary">
                <button
                  onClick={copyUserId}
                  className="flex items-center space-x-1 hover:text-text-primary transition-colors font-mono"
                  title="Click to copy User ID"
                >
                  <span>ID: {user.id.slice(0, 8)}...</span>
                  <Icon name={copiedId ? 'check' : 'copy'} className="w-3 h-3 text-primary" />
                </button>
                <span>•</span>
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                {user.last_activity && (
                  <>
                    <span>•</span>
                    <span>Last active {new Date(user.last_activity || user.updated_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-light px-6 bg-main/30 space-x-6 overflow-x-auto text-sm">
          {[
            { id: 'overview', label: 'User Overview', icon: 'user' },
            { id: 'generations', label: `Generations (${user.recent_designs?.length || 0})`, icon: 'image' },
            { id: 'payments', label: `Payments (${user.payments?.length || 0})`, icon: 'credit-card' },
            { id: 'audit', label: `Audit Log (${user.audit_logs?.length || 0})`, icon: 'shield-check' },
            { id: 'actions', label: 'Admin Actions', icon: 'zap' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 font-medium border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon as any} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Action Flash Message */}
        {actionMsg && (
          <div className={`mx-6 mt-4 p-3.5 rounded-xl text-xs flex items-center space-x-2 font-medium ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <Icon name={actionMsg.type === 'success' ? 'check-circle' : 'alert-triangle'} className="w-4 h-4 shrink-0" />
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-main/60 p-4 rounded-xl border border-border-light">
                  <span className="text-xs text-text-secondary font-medium">Credits Balance</span>
                  <div className="text-2xl font-bold font-mono text-primary mt-1">
                    {currentBalance} <span className="text-xs text-text-secondary font-normal">/ {totalQuota} total</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((currentBalance / Math.max(1, totalQuota)) * 100))}%` }} />
                  </div>
                </div>

                <div className="bg-main/60 p-4 rounded-xl border border-border-light">
                  <span className="text-xs text-text-secondary font-medium">Lifetime AI Generations</span>
                  <div className="text-2xl font-bold text-text-primary mt-1">
                    {user.designs_count || user.recent_designs?.length || 0}
                  </div>
                  <p className="text-xs text-text-secondary mt-2">Saved creations in gallery</p>
                </div>

                <div className="bg-main/60 p-4 rounded-xl border border-border-light">
                  <span className="text-xs text-text-secondary font-medium">Storage Consumed</span>
                  <div className="text-2xl font-bold text-text-primary mt-1">
                    {user.storage?.totalMB || '0.00'} MB
                  </div>
                  <p className="text-xs text-text-secondary mt-2">{user.storage?.totalFiles || 0} stored image assets</p>
                </div>
              </div>

              {/* Profile Bio & Details */}
              <div className="bg-main/60 p-5 rounded-xl border border-border-light space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Account Profile Attributes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-text-secondary block">Full Name:</span>
                    <span className="text-text-primary font-medium">{user.name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Design Role / Persona:</span>
                    <span className="text-text-primary font-medium">{user.role || 'Brand Creator'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Location:</span>
                    <span className="text-text-primary font-medium">{user.location || 'Global'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Bio / Notes:</span>
                    <span className="text-text-primary font-medium">{user.bio || 'No bio specified'}</span>
                  </div>
                </div>
              </div>

              {/* Active Subscriptions */}
              <div className="bg-main/60 p-5 rounded-xl border border-border-light">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Subscription Subsystem</h4>
                {user.subscriptions && user.subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {user.subscriptions.map((sub: any) => (
                      <div key={sub.id} className="p-3.5 bg-white rounded-xl border border-border-light flex items-center justify-between text-xs shadow-xs">
                        <div>
                          <div className="font-bold text-text-primary text-sm">{sub.plan_name}</div>
                          <div className="text-text-secondary font-mono mt-0.5">
                            Razorpay ID: {sub.razorpay_subscription_id || 'Direct / Manual Grant'}
                          </div>
                          <div className="text-text-secondary mt-1">
                            Status: <span className="text-emerald-600 font-semibold uppercase">{sub.status}</span>
                            {sub.cancel_at_period_end && <span className="text-amber-600 ml-2">(Cancels at cycle end)</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-text-primary">₹{sub.amount}</div>
                          <div className="text-text-secondary mt-1">
                            Renews: {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary py-2">No active paid subscriptions on record (Free / Pay-As-You-Go).</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GENERATION HISTORY */}
          {activeTab === 'generations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Recent AI Studio Outputs ({user.recent_designs?.length || 0})
                </h4>
              </div>

              {(!user.recent_designs || user.recent_designs.length === 0) ? (
                <div className="py-12 text-center text-text-secondary text-xs bg-main/40 rounded-xl border border-border-light">
                  No designs generated by this user yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {user.recent_designs.map((d: any) => (
                    <div
                      key={d.id}
                      className="group relative bg-white rounded-xl overflow-hidden border border-border-light hover:border-primary transition-all cursor-pointer shadow-xs"
                      onClick={() => setPreviewImage(d.image_url)}
                    >
                      <div className="aspect-square bg-slate-100 overflow-hidden">
                        <img
                          src={d.image_url}
                          alt="AI generation"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2.5 bg-white text-xs">
                        <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                          <span className="font-semibold text-primary">{d.params?.mode || 'Studio'}</span>
                          <span>{d.aspect_ratio || '1:1'}</span>
                        </div>
                        <p className="text-[11px] text-text-primary line-clamp-1">
                          {d.caption || d.params?.prompt || 'No prompt stored'}
                        </p>
                        <span className="text-[10px] text-text-secondary block mt-1">
                          {new Date(d.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT TRANSACTIONS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Payment Transactions Ledger
              </h4>
              {(!user.payments || user.payments.length === 0) ? (
                <div className="py-12 text-center text-text-secondary text-xs bg-main/40 rounded-xl border border-border-light">
                  No payment transactions recorded for this user.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border-light">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-main text-text-secondary border-b border-border-light uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Plan / Purpose</th>
                        <th className="p-3">Razorpay Order & Payment</th>
                        <th className="p-3">Credits</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light bg-white">
                      {user.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-main/50 transition-colors">
                          <td className="p-3 whitespace-nowrap text-text-secondary">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-semibold text-text-primary">
                            {p.plan_id || 'Top-Up'}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-text-secondary">
                            <div>{p.razorpay_order_id || '—'}</div>
                            <div className="text-text-secondary">{p.razorpay_payment_id || '—'}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-primary">
                            +{p.credits_added || 0}
                          </td>
                          <td className="p-3 font-bold text-text-primary">
                            ₹{p.amount}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              p.status === 'paid' || p.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : p.status === 'refunded'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Administrative Actions Logged on this Account
              </h4>
              {(!user.audit_logs || user.audit_logs.length === 0) ? (
                <div className="py-12 text-center text-text-secondary text-xs bg-main/40 rounded-xl border border-border-light">
                  No prior administrative interventions logged on this user.
                </div>
              ) : (
                <div className="space-y-2">
                  {user.audit_logs.map((log: any) => (
                    <div key={log.id} className="p-3.5 bg-main/50 rounded-xl border border-border-light text-xs flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-primary">{log.action}</span>
                          <span className="text-text-secondary font-mono text-[11px]">
                            by {log.details?.admin_email || 'Master Admin'}
                          </span>
                        </div>
                        {log.details?.reason && (
                          <p className="text-text-primary mt-1">Reason: {log.details.reason}</p>
                        )}
                        {log.details?.amount !== undefined && (
                          <p className="text-text-secondary mt-0.5">
                            Credit delta: {log.details.amount > 0 ? '+' : ''}{log.details.amount} (Balance: {log.details.old_balance} → {log.details.new_balance})
                          </p>
                        )}
                      </div>
                      <span className="text-text-secondary whitespace-nowrap text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ADMIN ACTIONS (MUTATIONS) */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              
              {/* Tier & Privileges */}
              <div className="bg-main/60 p-5 rounded-xl border border-border-light space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center space-x-2">
                  <Icon name="layers" className="w-4 h-4 text-primary" />
                  <span>Tier & Role Privileges</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1.5 font-medium">Change User Tier</label>
                    <select
                      value={user.tier || 'Free'}
                      onChange={(e) => handleUpdateTier(e.target.value)}
                      disabled={actionLoading}
                      className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-text-primary text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="Free">Free (50 credits)</option>
                      <option value="PayAsYouGo">PayAsYouGo (Pay per generation)</option>
                      <option value="Pro">Pro Tier (Advanced)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1.5 font-medium">Administrative Status</label>
                    <Button
                      onClick={() => setShowAdminConfirmModal(true)}
                      disabled={actionLoading}
                      variant="secondary"
                      className={`w-full text-xs py-2 ${
                        user.is_admin
                          ? 'border border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                          : 'border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10'
                      }`}
                    >
                      {user.is_admin ? 'Revoke Admin Privileges' : 'Grant Admin Privileges'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Adjust Credits */}
              <div className="bg-main/60 p-5 rounded-xl border border-border-light space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center space-x-2">
                  <Icon name="zap" className="w-4 h-4 text-amber-500" />
                  <span>Adjust Credits Balance</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1 font-medium">Adjustment Amount (+ or -)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50 or -20"
                      value={creditAmount || ''}
                      onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                      disabled={actionLoading}
                      className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-text-primary font-mono text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-text-secondary block mb-1 font-medium">Audit Log Reason (Required)</label>
                    <input
                      type="text"
                      placeholder="e.g. Courtesy top-up for failed prompt batch"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      disabled={actionLoading}
                      className="w-full px-3 py-2 bg-white border border-border-light rounded-xl text-text-primary text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAdjustCredits}
                    disabled={actionLoading || creditAmount === 0 || !creditReason.trim()}
                    variant="primary"
                    className="text-xs py-2 px-4 bg-primary text-white font-bold hover:bg-primary-hover disabled:opacity-50"
                  >
                    {actionLoading ? 'Applying Adjustment...' : 'Apply Credit Mutation'}
                  </Button>
                </div>
              </div>

              {/* Account Suspension / Ban */}
              <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-2">
                  <Icon name="shield-alert" className="w-4 h-4 text-amber-600" />
                  <span>Access Control & Account Suspension</span>
                </h4>
                {user.banned_at ? (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-800">
                      User is currently <strong>SUSPENDED</strong> since {new Date(user.banned_at).toLocaleString()}.<br />
                      Reason: <span className="italic">{user.banned_reason || 'Administrative restriction'}</span>
                    </p>
                    <Button
                      onClick={handleUnban}
                      disabled={actionLoading}
                      variant="secondary"
                      className="border border-amber-300 text-amber-800 bg-amber-100 hover:bg-amber-200 text-xs py-2"
                    >
                      Revoke Suspension / Restore Access
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-700">
                      Suspended accounts are locked out of generation pipelines, API calls, and credit consumption.
                    </p>
                    <input
                      type="text"
                      placeholder="Reason for suspension (Terms violation, payment abuse, etc.)..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      disabled={actionLoading}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-text-primary text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleBan}
                        disabled={actionLoading || !banReason.trim()}
                        variant="secondary"
                        className="border border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200 text-xs py-2 px-4 disabled:opacity-50"
                      >
                        Suspend User Account
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone: Hard Delete */}
              <div className="bg-red-50/60 p-5 rounded-xl border border-red-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center space-x-2">
                  <Icon name="alert-triangle" className="w-4 h-4 text-red-600" />
                  <span>Danger Zone: Permanent Account Deletion</span>
                </h4>
                <p className="text-xs text-red-700">
                  Permanently deletes the auth profile, all designs, brand assets, and storage files. This action cannot be reversed.
                </p>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setShowDeleteConfirmModal(true)}
                    disabled={actionLoading}
                    variant="secondary"
                    className="text-xs py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50 border-transparent shadow-xs"
                  >
                    Permanently Delete Account
                  </Button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-light bg-main/50 flex items-center justify-between text-xs text-text-secondary">
          <span>User ID: {user.id}</span>
          <Button variant="secondary" onClick={onClose} className="text-xs px-3 py-1.5">
            Close
          </Button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AdminConfirmationModal
        isOpen={showAdminConfirmModal}
        title={user?.is_admin ? "Revoke Admin Privileges" : "Grant Admin Privileges"}
        description={user?.is_admin 
          ? `Are you sure you want to revoke administrative access for ${user?.email}?` 
          : `Grant full administrative privileges to ${user?.email}?`}
        impactItems={user?.is_admin ? [
          "The user will immediately lose access to the Admin Dashboard and administrative API routes.",
          "Their account role will be downgraded to standard user.",
          "Logged in administrative sessions will expire on next token refresh."
        ] : [
          "The user will gain full unrestricted access to system telemetry, user records, and billing settings.",
          "They will be able to perform destructive data mutations and manage other administrators.",
          "This promotion will be permanently logged in the audit ledger."
        ]}
        confirmButtonText={user?.is_admin ? "Revoke Admin Access" : "Grant Admin Access"}
        variant={user?.is_admin ? "danger" : "warning"}
        loading={actionLoading}
        onConfirm={handleToggleAdminConfirmed}
        onClose={() => setShowAdminConfirmModal(false)}
      />

      <AdminConfirmationModal
        isOpen={showDeleteConfirmModal}
        title="Permanently Delete User Account"
        description={`You are about to permanently purge ${user?.email} from the system.`}
        impactItems={[
          "Permanently deletes user profile and database records across all tables.",
          "Deletes all generated images, uploaded brand assets, and storage bucket files.",
          "Cancels any active subscriptions and voids remaining credit ledger balances.",
          "This action is completely IRREVERSIBLE."
        ]}
        confirmKeyword={user?.email}
        confirmButtonText="Permanently Purge Account"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setShowDeleteConfirmModal(false)}
      />

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
