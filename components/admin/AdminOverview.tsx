import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';

export default function AdminOverview() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase.auth.token');
      const authHeader = JSON.parse(token || '{}')?.currentSession?.access_token;
      const res = await axios.get('/api/admin/dashboard/summary', {
        headers: { Authorization: `Bearer ${authHeader}` }
      });
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary) {
    return <div className="py-12 flex justify-center"><Spinner size="lg" /></div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
              <h3 className="text-2xl font-bold">{summary.totalUsers}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Icon name="users" className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+{summary.newSignups}</span>
            <span className="text-slate-500 ml-2">this week</span>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Subs</p>
              <h3 className="text-2xl font-bold">{summary.activeSubCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00E5A0]/20 text-[#00E5A0] flex items-center justify-center">
              <Icon name="check-circle" className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Estimated MRR</p>
              <h3 className="text-2xl font-bold">₹{summary.mrr}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center">
              <Icon name="credit-card" className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Credits Spent (7d)</p>
              <h3 className="text-2xl font-bold font-mono">{summary.creditsConsumed}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Icon name="zap" className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold">Recent Admin Actions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Admin</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Target User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.recentActions.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">No recent actions</td></tr>
              ) : summary.recentActions.map((action: any) => (
                <tr key={action.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(action.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">{action.admin_email}</td>
                  <td className="px-6 py-4">
                     <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">{action.action}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{action.target || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
