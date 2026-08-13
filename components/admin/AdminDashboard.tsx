import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Spinner } from '../ui/Spinner';
import SubscriptionsList from './SubscriptionsList';
import AdminOverview from './AdminOverview';
import StorageManager from './StorageManager';

import UserDetailModal from './UserDetailModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'storage'>('overview');
  const limit = 20;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }
        const authHeader = session.access_token;
        const res = await axios.get('/api/admin/check', {
          headers: { Authorization: `Bearer ${authHeader}` }
        });
        if (res.data.is_admin) {
          setIsAdmin(true);
        } else {
          navigate('/');
        }
      } catch (err) {
        navigate('/');
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token;
      
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${authHeader}` },
        params: { search, limit, offset: (page - 1) * limit }
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Spinner className="w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to App</Button>
        </div>

        
        
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 space-x-6 overflow-x-auto">
          <button 
            className={`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-blue-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-[#00E5A0] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'subscriptions' ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions
          </button>
          <button 
            className={`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'storage' ? 'border-amber-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('storage')}
          >
            Storage
          </button>
        </div>

        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'storage' && <StorageManager />}
        {activeTab === 'subscriptions' && <SubscriptionsList />}
        {activeTab === 'users' && (

  
<Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Users ({total})</h2>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by email..." 
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-[#00E5A0] text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Tier</th>
                  <th className="pb-3 font-medium">Credits</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && users.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500"><Spinner className="w-4 h-4 mx-auto mb-2" /> Loading users...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4">{user.email} {user.is_admin && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>}</td>
                    <td className="py-4 text-slate-500">{user.name || '—'}</td>
                    <td className="py-4">{user.tier}</td>
                    <td className="py-4 font-mono">{user.current_balance} / {user.total_quota}</td>
                    <td className="py-4">
                      {user.banned_at ? (
                        <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-medium">Banned</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-[#00E5A0]/20 dark:text-[#00E5A0] px-2 py-1 rounded-full font-medium">Active</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" onClick={() => setSelectedUserId(user.id)}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="secondary" 
              
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">Page {page}</span>
            <Button 
              variant="secondary" 
              
              disabled={users.length < limit} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </Card>
        )}
      </div>

      {selectedUserId && (
        <UserDetailModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
          onUpdated={fetchUsers} 
        />
      )}
    </div>
  );
}
