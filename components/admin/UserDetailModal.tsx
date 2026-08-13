import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';

interface Props {
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function UserDetailModal({ userId, onClose, onUpdated }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');
  
  const [banReason, setBanReason] = useState('');
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

  const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase.auth.token');
      const authHeader = JSON.parse(token || '{}')?.currentSession?.access_token;
      const res = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${authHeader}` }
      });
      setUser(res.data.user);
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getHeaders = () => {
    const token = localStorage.getItem('supabase.auth.token');
    const authHeader = JSON.parse(token || '{}')?.currentSession?.access_token;
    return { Authorization: `Bearer ${authHeader}` };
  };

  const handleAdjustCredits = async () => {
    if (!creditReason) return alert("Reason is required");
    try {
      await axios.post(`/api/admin/users/${userId}/adjust-credits`, { amount: creditAmount, reason: creditReason }, { headers: getHeaders() });
      setCreditAmount(0);
      setCreditReason('');
      fetchUser();
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error adjusting credits");
    }
  };

  const handleBan = async () => {
    if (!banReason) return alert("Reason is required");
    try {
      await axios.post(`/api/admin/users/${userId}/ban`, { reason: banReason }, { headers: getHeaders() });
      setBanReason('');
      fetchUser();
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error banning user");
    }
  };

  const handleUnban = async () => {
    try {
      await axios.post(`/api/admin/users/${userId}/unban`, {}, { headers: getHeaders() });
      fetchUser();
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error unbanning user");
    }
  };

  const handleDelete = async () => {
    if (deleteEmailConfirm !== user?.email) return alert("Email confirmation does not match");
    if (!confirm("Are you absolutely sure? This cannot be undone and deletes all user data and storage.")) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, { 
        headers: getHeaders(),
        data: { confirmationEmail: deleteEmailConfirm }
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error deleting user");
    }
  };

  if (!user || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8"><Spinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] font-bold">
                {user.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{user.email}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>{user.tier} Tier</span>
                <span>•</span>
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                {user.banned_at && (
                  <><span>•</span><span className="text-red-500 font-medium">Banned</span></>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
          <button 
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#00E5A0] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => setActiveTab('details')}
          >
            Overview
          </button>
          <button 
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'actions' ? 'border-[#8B5CF6] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => setActiveTab('actions')}
          >
            Admin Actions
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-medium mb-1">Credit Balance</div>
                  <div className="text-2xl font-bold font-mono text-[#00E5A0]">
                    {user.credits?.current_balance} <span className="text-base text-slate-400">/ {user.credits?.total_quota}</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-medium mb-1">Total Designs</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user.designs_count}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Subscriptions ({user.subscriptions?.length})</h3>
                {user.subscriptions?.length > 0 ? (
                  <div className="space-y-2">
                    {user.subscriptions.map((sub: any) => (
                      <div key={sub.id} className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{sub.plan_name}</div>
                          <div className="text-xs text-slate-500">{sub.status} • {sub.razorpay_subscription_id || 'Manual'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-slate-900 dark:text-white">₹{sub.amount}</div>
                          <div className="text-xs text-slate-500">Renews: {new Date(sub.current_period_end).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">No subscriptions.</p>}
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Recent Payments</h3>
                {user.payments?.length > 0 ? (
                  <div className="space-y-2">
                    {user.payments.map((pay: any) => (
                      <div key={pay.id} className="text-sm border-b border-slate-100 dark:border-slate-800 py-2 flex justify-between">
                        <span className="text-slate-500">{new Date(pay.created_at).toLocaleDateString()}</span>
                        <span className="font-mono text-slate-900 dark:text-white">₹{pay.amount}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pay.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {pay.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">No payment history.</p>}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-8">
              
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Adjust Credits</h3>
                <div className="flex space-x-3 mb-3">
                  <input 
                    type="number" 
                    placeholder="Amount (+ or -)" 
                    className="w-1/3 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    value={creditAmount || ''}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  />
                  <input 
                    type="text" 
                    placeholder="Reason for audit log" 
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                  />
                </div>
                <Button onClick={handleAdjustCredits} variant="primary" size="sm" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">Apply Adjustment</Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <h3 className="font-semibold text-amber-900 dark:text-amber-500 mb-4">Access Control</h3>
                {user.banned_at ? (
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-400 mb-3">User was banned on {new Date(user.banned_at).toLocaleString()}<br/>Reason: {user.banned_reason}</p>
                    <Button onClick={handleUnban} variant="outline" size="sm" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30">Revoke Ban</Button>
                  </div>
                ) : (
                  <div>
                    <input 
                      type="text" 
                      placeholder="Reason for ban..." 
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg text-sm mb-3"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                    <Button onClick={handleBan} variant="outline" size="sm" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30">Suspend User</Button>
                  </div>
                )}
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone: Hard Delete</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                  Permanently deletes the user account, all their generations, brand kits, subscriptions, and storage files. This cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <input 
                    type="text" 
                    placeholder={`Type ${user.email} to confirm`}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-lg text-sm"
                    value={deleteEmailConfirm}
                    onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                  />
                  <Button 
                    onClick={handleDelete} 
                    variant="primary" 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    disabled={deleteEmailConfirm !== user.email}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
