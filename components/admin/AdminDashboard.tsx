import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  LayoutDashboard,
  DollarSign,
  CreditCard,
  Zap,
  BarChart3,
  Layers,
  ShieldCheck,
  Database,
  ExternalLink,
  LogOut,
  Search,
  SlidersHorizontal,
  Bell,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { getAdminAuthHeader, clearAdminAuthSession, getStoredAdminUser } from './adminAuthHelper';
import { BrandLogo } from '../ui/BrandLogo';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import SubscriptionsList from './SubscriptionsList';
import PaymentsManager from './PaymentsManager';
import AdminOverview from './AdminOverview';
import StorageManager from './StorageManager';
import CreditsManager from './CreditsManager';
import AIUsageAnalytics from './AIUsageAnalytics';
import UserDetailModal from './UserDetailModal';
import GenerationMonitoring from './GenerationMonitoring';
import AdminAuditLog from './AdminAuditLog';
import GlobalSearchModal from './GlobalSearchModal';
import { AdminStateMessage } from './AdminStateMessage';

type AdminTab = 'users' | 'overview' | 'payments' | 'subscriptions' | 'credits' | 'analytics' | 'monitoring' | 'storage' | 'audit';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; newUsers: number; activeUsers: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const limit = 20;

  // Selected User Modal & Global Search
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText('DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;\nCREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const authHeader = await getAdminAuthHeader();
        if (!authHeader) {
          navigate('/admin-login', { replace: true });
          return;
        }
        const res = await axios.get('/api/admin/check', {
          headers: { Authorization: `Bearer ${authHeader}` }
        });
        if (res.data?.is_admin) {
          setIsAdmin(true);
          setAdminUser(getStoredAdminUser() || { username: 'admin', name: 'Admin Master', email: 'admin@zeper.ai' });
        } else {
          clearAdminAuthSession();
          navigate('/admin-login', { replace: true });
        }
      } catch (err) {
        clearAdminAuthSession();
        navigate('/admin-login', { replace: true });
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAdmin, activeTab, page, search, tierFilter, statusFilter, adminFilter, sortBy, sortOrder]);

  const handleAdminLogout = () => {
    clearAdminAuthSession();
    navigate('/admin-login', { replace: true });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const authHeader = await getAdminAuthHeader();
      
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${authHeader}` },
        params: {
          search,
          tier: tierFilter,
          status: statusFilter,
          admin: adminFilter,
          sortBy,
          sortOrder,
          limit,
          offset: (page - 1) * limit
        }
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch users list:', err);
      setError(err.response?.data?.error || err.message || 'Failed to retrieve registered users. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length && users.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  if (isAdmin === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-800 space-y-3 font-sans">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-sm text-slate-500 font-medium">Verifying administrator authorization credentials...</p>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: any; count?: number }> = [
    { id: 'users', label: 'Users', icon: Users, count: total > 0 ? total : undefined },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Finances', icon: DollarSign },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'credits', label: 'Credits & Usage', icon: Zap },
    { id: 'analytics', label: 'AI Analytics', icon: BarChart3 },
    { id: 'monitoring', label: 'Health & Logs', icon: Layers },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'users': return 'Users management';
      case 'overview': return 'Command Center Overview';
      case 'payments': return 'Finances & Transactions';
      case 'subscriptions': return 'Subscriptions & Billing';
      case 'credits': return 'Credit Accounts & Allocation';
      case 'analytics': return 'AI Generation Analytics';
      case 'monitoring': return 'System Health & Monitoring';
      case 'storage': return 'Storage & Asset Buckets';
      case 'audit': return 'Administrative Audit Logs';
      default: return 'Admin Portal';
    }
  };

  return (
    <div className="h-screen w-screen flex bg-slate-50 text-slate-900 font-sans overflow-hidden select-none selection:bg-[#C8CEFE]">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 h-full flex flex-col justify-between bg-white border-r border-slate-200/80 shrink-0 z-20">
        <div className="flex flex-col h-full">
          
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo variant="full" color="primary" className="h-6 w-auto" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#4452FB]/10 text-[#4452FB] border border-[#4452FB]/20 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#4452FB] text-white font-bold shadow-md shadow-[#4452FB]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar Controls */}
          <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-200/60"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>User Application</span>
            </button>
            <button
              onClick={handleAdminLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 transition-all border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              <span>Sign out</span>
            </button>
          </div>

        </div>
      </aside>

      {/* 2. MAIN CANVAS CONTENT */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto bg-slate-50">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {getPageTitle()}
            </h1>
          </div>

          {/* Top Right Utilities */}
          <div className="flex items-center gap-3">
            {/* Quick Search Shortcut Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:border-[#4452FB]/30 shadow-2xs transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick search...</span>
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-mono font-bold shadow-2xs">⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('monitoring')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs relative transition-all"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#4452FB] text-white flex items-center justify-center font-black text-xs shadow-sm shadow-[#4452FB]/20 overflow-hidden">
                {adminUser?.avatar_url ? (
                  <img src={adminUser.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span>{(adminUser?.name || adminUser?.username || 'M').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {adminUser?.name || 'MadMan'}
                </span>
                <span className="text-[11px] text-slate-500 font-normal leading-tight">
                  {adminUser?.email || 'admin@zeper.ai'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-8 space-y-6">
          
          {/* TAB 1: USERS MANAGEMENT (Matching provided reference image) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* 3 Metric Cards Row (Live metrics from Supabase) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Total Users */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#4452FB]/30 transition-all flex items-start justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Users</span>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {stats?.totalUsers ?? total}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="font-bold">Live Database</span>
                      <span className="text-slate-400 font-normal">registered accounts</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#4452FB]/10 text-[#4452FB] rounded-2xl border border-[#4452FB]/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* New Users */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#4452FB]/30 transition-all flex items-start justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">New Users</span>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {stats?.newUsers ?? 0}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="font-bold">Last 30 Days</span>
                      <span className="text-slate-400 font-normal">recent signups</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>

                {/* Active Users */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#4452FB]/30 transition-all flex items-start justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Users</span>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {stats?.activeUsers ?? 0}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="font-bold">Live Sessions</span>
                      <span className="text-slate-400 font-normal">tracked sessions</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Main User List Card Container (Matching reference card & table) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                
                {/* User List Header Bar */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">User Directory</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4452FB]/10 text-[#4452FB]">
                      {total} users
                    </span>
                  </div>

                  {/* Right Action Controls: Search, Filters, Date Filter */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    
                    {/* Search for user */}
                    <div className="relative min-w-[240px]">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB] transition-all font-medium"
                      />
                    </div>

                    {/* Filters Toggle Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-2xl text-xs font-bold transition-all ${
                        showFilters || tierFilter || statusFilter || adminFilter
                          ? 'bg-[#4452FB] text-white border-[#4452FB] shadow-sm shadow-[#4452FB]/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Filters</span>
                      {(tierFilter || statusFilter || adminFilter) && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </button>

                    {/* Date / Sorting Preset */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                      >
                        <option value="created_at">Latest First</option>
                        <option value="email">Sort by Email</option>
                        <option value="name">Sort by Name</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Export CSV */}
                    <button
                      onClick={async () => {
                        const authHeader = await getAdminAuthHeader();
                        window.open(`/api/admin/export/csv?type=users&token=${encodeURIComponent(authHeader || '')}`, '_blank');
                      }}
                      className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                      title="Export CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Filter Row */}
                {showFilters && (
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Plan Tier</label>
                      <select
                        value={tierFilter}
                        onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
                      >
                        <option value="">All Tiers</option>
                        <option value="Free">Free</option>
                        <option value="Pro">Pro</option>
                        <option value="Agency">Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="banned">Suspended Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                      <select
                        value={adminFilter}
                        onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#4452FB]/20 focus:border-[#4452FB]"
                      >
                        <option value="">All Roles</option>
                        <option value="true">Admins Only</option>
                        <option value="false">Standard Users</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-4 pl-6 pr-3 w-10">
                          <input
                            type="checkbox"
                            checked={users.length > 0 && selectedUserIds.size === users.length}
                            onChange={toggleSelectAll}
                            className="rounded-md border-slate-300 text-[#4452FB] focus:ring-[#4452FB] cursor-pointer"
                          />
                        </th>
                        <th className="py-4 px-3">User</th>
                        <th className="py-4 px-3">Email Address</th>
                        <th className="py-4 px-3">Tier & Balance</th>
                        <th className="py-4 px-3">Created Date</th>
                        <th className="py-4 px-3">Status</th>
                        <th className="py-4 pr-6 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {loading && users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <AdminStateMessage
                              type="loading"
                              title="Loading User Accounts"
                              message="Querying user records, active credits, and subscriptions..."
                            />
                          </td>
                        </tr>
                      ) : error && users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4">
                            <AdminStateMessage
                              type="error"
                              title="Failed to Load Users"
                              message={error}
                              onRetry={fetchUsers}
                              retryText="Retry Loading Users"
                            />
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6">
                            {search || tierFilter || statusFilter || adminFilter ? (
                              <AdminStateMessage
                                type="empty"
                                title="No Users Found"
                                message="No users match the active search or filters."
                                onClearFilters={() => {
                                  setSearch('');
                                  setTierFilter('');
                                  setStatusFilter('');
                                  setAdminFilter('');
                                  setPage(1);
                                }}
                                clearFiltersText="Reset All Filters"
                              />
                            ) : (
                              <div className="max-w-2xl mx-auto py-8 px-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-center space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                                  <Database className="w-6 h-6" />
                                </div>
                                <div className="space-y-1.5">
                                  <h3 className="text-sm font-bold text-slate-900">Unlock Users from Supabase</h3>
                                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                                    Your Supabase <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-800 font-mono font-semibold">profiles</code> table has Row Level Security (RLS) enabled. To allow the admin dashboard to read all accounts, run this 1-step SQL query in your Supabase SQL Editor:
                                  </p>
                                </div>

                                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-left font-mono text-[11px] relative group overflow-x-auto">
                                  <pre className="text-emerald-400">
{`-- Allow admin and app to read profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);`}
                                  </pre>
                                  <button
                                    onClick={handleCopySql}
                                    className="absolute right-2.5 top-2.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700 shadow-xs"
                                  >
                                    {copiedSql ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400 font-semibold">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy SQL</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                  <button
                                    onClick={fetchUsers}
                                    className="px-4 py-2 bg-[#4452FB] hover:bg-[#3442EB] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-[#4452FB]/20"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Refresh User List</span>
                                  </button>
                                  <a
                                    href="https://supabase.com/dashboard/project/_/sql"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                                  >
                                    <span>Open Supabase SQL Editor</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => {
                          const isSelected = selectedUserIds.has(user.id);
                          const initials = (user.name || user.email || 'U').substring(0, 2).toUpperCase();
                          const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });

                          return (
                            <tr
                              key={user.id}
                              className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-slate-50/90' : ''}`}
                            >
                              {/* Checkbox */}
                              <td className="py-4 pl-6 pr-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectUser(user.id)}
                                  className="rounded-md border-slate-300 text-[#4452FB] focus:ring-[#4452FB] cursor-pointer"
                                />
                              </td>

                              {/* User (Avatar + Bold Name) */}
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-3">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#4452FB]/10 text-[#4452FB] border border-[#4452FB]/20 flex items-center justify-center font-black text-[11px]">
                                      {initials}
                                    </div>
                                  )}
                                  <span className="font-bold text-slate-900">
                                    {user.name || user.email?.split('@')[0] || 'User'}
                                  </span>
                                </div>
                              </td>

                              {/* Email Address */}
                              <td className="py-4 px-3 text-slate-600 text-xs font-medium">
                                {user.email}
                              </td>

                              {/* Tier / Balance */}
                              <td className="py-4 px-3 text-slate-600">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  user.tier === 'Agency' ? 'bg-purple-100 text-purple-800' :
                                  user.tier === 'Pro' ? 'bg-[#4452FB]/10 text-[#4452FB]' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {user.tier || 'Free'} • {user.current_balance || 0} credits
                                </span>
                              </td>

                              {/* Created Date */}
                              <td className="py-4 px-3 text-slate-500 whitespace-nowrap">
                                {createdDate}
                              </td>

                              {/* User Status (Pills matching reference: Active / Warned / Blocked / Admin) */}
                              <td className="py-4 px-3">
                                {user.banned_at ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    Blocked
                                  </span>
                                ) : user.is_admin ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                    Admin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Active
                                  </span>
                                )}
                              </td>

                              {/* Actions (...) */}
                              <td className="py-4 pr-6 pl-3 text-right">
                                <button
                                  onClick={() => setSelectedUserId(user.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                                  title="Inspect & Manage"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer (Matching < 1 2 3 ... 8 9 10 > in reference) */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs bg-slate-50/50">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#4452FB] text-white shadow-sm shadow-[#4452FB]/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <span className="px-1 text-slate-400">...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold ${
                          page === totalPages ? 'bg-[#4452FB] text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: OVERVIEW */}
          {activeTab === 'overview' && (
            <AdminOverview onNavigateTab={(tab) => setActiveTab(tab as any)} />
          )}

          {/* TAB 3: CREDITS & USAGE */}
          {activeTab === 'credits' && (
            <CreditsManager onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}

          {/* TAB 4: AI ANALYTICS */}
          {activeTab === 'analytics' && (
            <AIUsageAnalytics onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}

          {/* TAB 5: GENERATION HEALTH */}
          {activeTab === 'monitoring' && (
            <GenerationMonitoring onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <AdminAuditLog onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}

          {/* TAB 7: PAYMENTS & FINANCES */}
          {activeTab === 'payments' && (
            <PaymentsManager onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}

          {/* TAB 8: STORAGE */}
          {activeTab === 'storage' && (
            <StorageManager onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}
          
          {/* TAB 9: SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <SubscriptionsList onSelectUser={(userId) => setSelectedUserId(userId)} />
          )}

        </main>
      </div>

      {/* Deep User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdated={fetchUsers}
        />
      )}

      {/* Global Command / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={(userId) => setSelectedUserId(userId)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

    </div>
  );
}

