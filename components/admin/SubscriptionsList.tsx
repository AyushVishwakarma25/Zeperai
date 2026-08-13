import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  
  const [cancelModalSub, setCancelModalSub] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const [driftChecking, setDriftChecking] = useState(false);
  const [driftResults, setDriftResults] = useState<any[] | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter]);

  const getHeaders = () => {
    const token = localStorage.getItem('supabase.auth.token');
    const authHeader = JSON.parse(token || '{}')?.currentSession?.access_token;
    return { Authorization: `Bearer ${authHeader}` };
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/subscriptions', {
        headers: getHeaders(),
        params: { status: statusFilter, limit, offset: (page - 1) * limit }
      });
      setSubscriptions(res.data.subscriptions);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason) return alert("Please provide a reason.");
    try {
      setCancelLoading(true);
      await axios.post(`/api/admin/subscriptions/${cancelModalSub.id}/cancel`, 
        { reason: cancelReason, immediate: cancelImmediate }, 
        { headers: getHeaders() }
      );
      setCancelModalSub(null);
      setCancelReason('');
      fetchSubscriptions();
      alert("Subscription cancelled successfully.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Error cancelling subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setDriftChecking(true);
      setDriftResults(null);
      const res = await axios.get('/api/admin/subscriptions-reconcile', { headers: getHeaders() });
      setDriftResults(res.data.mismatches);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error checking drift");
    } finally {
      setDriftChecking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="text-xs bg-green-100 text-green-700 dark:bg-[#00E5A0]/20 dark:text-[#00E5A0] px-2 py-1 rounded-full font-medium">Active</span>;
      case 'cancelled': return <span className="text-xs bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded-full font-medium">Cancelled</span>;
      case 'past_due': return <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-medium">Past Due</span>;
      case 'expired': return <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 px-2 py-1 rounded-full font-medium">Expired</span>;
      default: return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div className="flex space-x-2">
           <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
           >
             <option value="">All Statuses</option>
             <option value="active">Active</option>
             <option value="cancelled">Cancelled</option>
             <option value="past_due">Past Due</option>
             <option value="expired">Expired</option>
           </select>
         </div>
         
         <Button onClick={handleReconcile} variant="outline" size="sm" disabled={driftChecking}>
            {driftChecking ? <Spinner size="sm" className="mr-2" /> : null}
            Check for drift
         </Button>
      </div>

      {driftResults && (
        <Card className={`p-4 ${driftResults.length > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-green-50 border-green-200 dark:bg-[#00E5A0]/10 dark:border-[#00E5A0]/30'}`}>
          <h3 className={`font-semibold mb-2 ${driftResults.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-[#00E5A0]'}`}>
            {driftResults.length > 0 ? `Found ${driftResults.length} drift issues` : 'All subscriptions are perfectly synced with Razorpay!'}
          </h3>
          {driftResults.length > 0 && (
             <div className="text-sm space-y-2 max-h-40 overflow-y-auto mt-3">
               {driftResults.map((r, i) => (
                 <div key={i} className="flex justify-between border-b border-red-100 dark:border-red-900/30 pb-2">
                   <div>
                     <span className="font-mono text-xs">{r.local_id}</span>
                     <div className="text-slate-600 dark:text-slate-400 mt-1">Plan: {r.plan_name}</div>
                   </div>
                   <div className="text-right">
                     <div>Local: <span className="font-bold">{r.local_status}</span></div>
                     <div>Razorpay: <span className="font-bold text-amber-600">{r.razorpay_status}</span></div>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">User Email</th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Plan Name</th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Status</th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Amount</th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Renewal/Expiry</th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500"><Spinner size="sm" className="mx-auto mb-2" /> Loading subscriptions...</td></tr>
              ) : subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-medium">{sub.email}</div>
                    <div className="text-xs text-slate-500">{sub.razorpay_subscription_id}</div>
                  </td>
                  <td className="px-4 py-4">{sub.plan_name}</td>
                  <td className="px-4 py-4">
                     {getStatusBadge(sub.status)}
                     {sub.cancel_at_period_end && sub.status === 'active' && <div className="text-xs text-amber-500 mt-1">Cancels at end</div>}
                  </td>
                  <td className="px-4 py-4">₹{(sub.amount / 100).toFixed(2)}</td>
                  <td className="px-4 py-4">{new Date(sub.current_period_end).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-right">
                    {sub.status === 'active' && sub.razorpay_subscription_id && !sub.cancel_at_period_end && (
                       <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setCancelModalSub(sub)}>
                         Cancel
                       </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" disabled={subscriptions.length < limit} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </Card>

      {/* Cancel Modal */}
      {cancelModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Cancel Subscription</h3>
            <p className="text-sm text-slate-500 mb-6">You are cancelling the <strong>{cancelModalSub.plan_name}</strong> plan for <strong>{cancelModalSub.email}</strong>.</p>
            
            <div className="space-y-4 mb-6">
               <div>
                 <label className="block text-sm font-medium mb-1">Reason for Cancellation</label>
                 <input 
                   type="text" 
                   className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                   placeholder="e.g. User requested via support"
                   value={cancelReason}
                   onChange={e => setCancelReason(e.target.value)}
                 />
               </div>
               
               <div className="flex items-center space-x-2">
                 <input 
                   type="checkbox" 
                   id="immediate"
                   checked={cancelImmediate}
                   onChange={e => setCancelImmediate(e.target.checked)}
                   className="rounded text-[#8B5CF6] focus:ring-[#8B5CF6]"
                 />
                 <label htmlFor="immediate" className="text-sm font-medium text-red-600 dark:text-red-400">Cancel immediately (no refund)</label>
               </div>
               {!cancelImmediate && (
                 <p className="text-xs text-slate-500">If unchecked, the subscription will remain active until the end of the billing cycle ({new Date(cancelModalSub.current_period_end).toLocaleDateString()}) and then cancel automatically.</p>
               )}
            </div>
            
            <div className="flex justify-end space-x-3">
               <Button variant="outline" onClick={() => { setCancelModalSub(null); setCancelReason(''); }}>Keep Active</Button>
               <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white" disabled={cancelLoading} onClick={handleCancelSubmit}>
                 {cancelLoading ? <Spinner size="sm" /> : 'Confirm Cancellation'}
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
