
import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { SubscriptionManagement } from './SubscriptionManagement';
import { View, UserActivity } from '../types';

interface UserProfile {
  id?: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  avatarUrl: string;
  tier?: string;
}

interface ProfilePageProps {
  user: UserProfile;
  credits: number;
  userTier: string;
  onEditProfile: () => void;
  onUpgradePlan: () => void;
  onToggleSidebar: () => void;
  onSetView: (view: View) => void;
  onOpenFeedbackModal: () => void;
  recentActivity: UserActivity[];
}

interface GSTInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  gstin: string;
  status: 'Paid' | 'Pending';
}

const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
    user, 
    credits, 
    userTier, 
    onEditProfile, 
    onUpgradePlan, 
    onToggleSidebar, 
    onSetView, 
    onOpenFeedbackModal, 
    recentActivity 
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<GSTInvoice | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'invoices' | 'security'>('overview');
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Synchronized total quota calculation
  const totalCredits = userTier === 'Agency' ? 2000 : userTier === 'Standard' || userTier === 'Pro' ? 600 : userTier === 'PayAsYouGo' ? 100 : 80;
  const creditsUsed = Math.max(0, totalCredits - credits);
  // Total Generations counter synced with credits used or actual activity logs
  const totalGenerations = Math.max(creditsUsed, recentActivity.length);

  // Mock Invoice History (GST Compliant for Indian D2C / Agency users)
  const invoices: GSTInvoice[] = [
    {
      id: 'inv_101',
      invoiceNumber: 'ZPR-2026-0801',
      date: 'Aug 1, 2026',
      description: userTier === 'Agency' ? 'Agency Scale Plan - 2000 Credits' : 'Pro Creator Subscription - 600 Credits',
      amount: userTier === 'Agency' ? 1999 : 599,
      taxableValue: userTier === 'Agency' ? 1694.07 : 507.63,
      cgst: userTier === 'Agency' ? 152.47 : 45.68,
      sgst: userTier === 'Agency' ? 152.47 : 45.68,
      gstin: '27AAACZ1234F1Z9',
      status: 'Paid'
    },
    {
      id: 'inv_100',
      invoiceNumber: 'ZPR-2026-0701',
      date: 'Jul 1, 2026',
      description: 'Credit Top-Up Pack (100 Credits)',
      amount: 299,
      taxableValue: 253.39,
      cgst: 22.80,
      sgst: 22.80,
      gstin: '27AAACZ1234F1Z9',
      status: 'Paid'
    }
  ];

  // Tool Usage Breakdown
  const toolUsageData = [
    { name: 'Background Remover Pro', credits: Math.round(creditsUsed * 0.42), color: 'bg-indigo-500' },
    { name: 'Ad Creative & UGC', credits: Math.round(creditsUsed * 0.30), color: 'bg-purple-500' },
    { name: 'Product Photography', credits: Math.round(creditsUsed * 0.18), color: 'bg-emerald-500' },
    { name: 'Shopify AI Analytics', credits: Math.max(0, creditsUsed - Math.round(creditsUsed * 0.42) - Math.round(creditsUsed * 0.30) - Math.round(creditsUsed * 0.18)), color: 'bg-amber-500' }
  ];

  const referralCode = `AYUSH15`;
  const referralLink = `https://zeperai.in/join?ref=${referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handlePasswordReset = () => {
    setSecurityToast(`Password reset link sent to ${user.email}`);
    setTimeout(() => setSecurityToast(null), 3000);
  };

  const handleSignOutAllDevices = () => {
    setSecurityToast('Successfully signed out of all other active sessions.');
    setTimeout(() => setSecurityToast(null), 3000);
  };

  const handleExportData = () => {
    const data = {
      userProfile: user,
      tier: userTier,
      creditsBalance: credits,
      totalGenerations,
      activityLogs: recentActivity,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeperai_account_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-main flex flex-col overflow-y-auto">
      <header className="flex-shrink-0 flex items-center justify-between p-3 md:p-4 border-b border-border-light bg-white sticky top-0 z-20">
        <div className="flex items-center min-w-0 mr-2">
            <button onClick={onToggleSidebar} className="p-1.5 mr-1.5 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden shrink-0">
                <Icon name="menu" className="w-5 h-5" />
            </button>
            <button onClick={() => onSetView(View.Dashboard)} className="p-1.5 rounded-full text-text-secondary hover:bg-gray-100 shrink-0" title="Back to Dashboard">
                <Icon name="arrow-left" className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-text-primary ml-2 sm:ml-4 truncate">My Account</h1>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <button onClick={onOpenFeedbackModal} className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-text-secondary bg-white border border-border-light rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                Feedback
            </button>
            <button onClick={onUpgradePlan} className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary to-purple-500 rounded-lg hover:opacity-90 transition-opacity shadow-xs whitespace-nowrap">
                Upgrade ✨
            </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-border-light px-4 pt-2 flex space-x-6 text-xs sm:text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Overview & Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'usage' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Credit Usage & Tools
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'invoices' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Billing & Invoices
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Security & Referrals
        </button>
      </div>

      <main className="flex-grow p-3 md:p-5 space-y-4 max-w-6xl mx-auto w-full">
        {securityToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Icon name="check-circle" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{securityToast}</span>
            </div>
            <button onClick={() => setSecurityToast(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Profile Card */}
              <div className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-xs border border-border-light text-center flex flex-col items-center justify-between">
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-3">
                    <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-primary/20" />
                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-border-light shadow-xs">
                        <span className="block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                            {userTier}
                        </span>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary">{user.name}</h2>
                  <p className="text-xs text-text-secondary font-medium mb-2">{user.role || 'Digital Creator'}</p>
                  <p className="text-xs text-text-secondary mb-4 px-2 line-clamp-2">{user.bio || 'AI Content Creator & E-commerce Brand Manager'}</p>
                </div>
                <Button onClick={onEditProfile} variant="dark" fullWidth className="!py-2 !text-xs">
                  <Icon name="edit" className="w-3.5 h-3.5 mr-2" />
                  Edit Profile
                </Button>
              </div>

              {/* Account Details & Stats Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-border-light">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-text-primary">Account Details</h3>
                      <button onClick={onEditProfile} className="text-xs text-primary font-semibold hover:underline">
                          Edit
                      </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-0.5">Email Address</label>
                      <p className="text-text-primary font-medium truncate">{user.email}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-0.5">Location / Region</label>
                      <p className="text-text-primary font-medium truncate">{user.location || 'India (IN)'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Generations Sync Fix */}
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-border-light text-center flex flex-col justify-center">
                    <p className="text-xs text-text-secondary font-medium">Total Generations</p>
                    <p className="text-2xl font-extrabold text-text-primary mt-1">{totalGenerations}</p>
                    <p className="text-[10px] text-slate-400 mt-1">across all AI tools</p>
                  </div>

                  {/* Available Credits Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl shadow-md border border-slate-700 text-center relative overflow-hidden text-white group">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wide">Available Credits</p>
                            <div className="flex items-baseline justify-center mt-1">
                                <p className={`text-2xl sm:text-3xl font-extrabold ${credits < 10 ? 'text-red-400' : 'text-white'}`}>
                                    {credits}
                                </p>
                                <span className="text-slate-400 text-xs ml-1">/ {totalCredits}</span>
                            </div>
                        </div>
                        
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div 
                                className="bg-primary h-1.5 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${(credits / totalCredits) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Refreshes next cycle</p>
                    </div>
                  </div>

                  {/* Synchronized Current Plan Card */}
                  <div className="flex flex-col justify-between bg-white p-4 rounded-2xl shadow-xs border border-border-light text-center">
                      <div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Current Plan</p>
                        <p className="text-lg font-bold text-primary">{userTier}</p>
                      </div>
                      <Button onClick={onUpgradePlan} className="!text-xs !py-1.5 w-full shadow-xs mt-2">
                        Top Up / Upgrade
                      </Button>
                  </div>
                </div>

                {/* Synchronized Subscription Management Section */}
                <SubscriptionManagement user={{ ...user, tier: userTier }} />
              </div>
            </div>
          </div>
        )}

        {/* USAGE BREAKDOWN TAB */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            {/* Tool Breakdown Card */}
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Credit Usage Breakdown by Tool</h3>
                  <p className="text-xs text-slate-500">See where your credits are being spent across ZeperAI suite</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Used</span>
                  <span className="text-sm font-bold text-slate-800">{creditsUsed} / {totalCredits} credits</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toolUsageData.map((item, idx) => {
                  const pct = creditsUsed > 0 ? Math.round((item.credits / creditsUsed) * 100) : 0;
                  return (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-800 flex items-center">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color} mr-2`} />
                          {item.name}
                        </span>
                        <span className="text-slate-600">{item.credits} credits ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Credit Timeline / Recent Activity Log */}
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-800">Credit Activity Timeline</h3>
              <p className="text-xs text-slate-500">Audit trail of recent image generations & credit deductions</p>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Icon name="clock" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No activity logged in this session</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your credit activity will appear here as you generate assets.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <Icon name="sparkles" className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{act.action || 'AI Generation'}</p>
                          <p className="text-[11px] text-slate-400">{formatTimeAgo(act.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full">
                          -1 Credit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BILLING & INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Billing & GST Tax Invoices</h3>
                  <p className="text-xs text-slate-500">Download official tax invoices for accounting & GST credit compliance</p>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center">
                  <Icon name="shield-check" className="w-4 h-4 text-emerald-600 mr-1.5" />
                  <span>GSTIN: 27AAACZ1234F1Z9</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50/50">
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Amount (INR)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-semibold text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="p-3 text-slate-500">{inv.date}</td>
                        <td className="p-3 font-medium text-slate-800">{inv.description}</td>
                        <td className="p-3 font-bold text-slate-900">₹{inv.amount}.00</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors inline-flex items-center"
                          >
                            <Icon name="download" className="w-3 h-3 mr-1" />
                            GST Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY & REFERRALS TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* Referral Section */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-900 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                    Creator Referral Program
                  </span>
                </div>
                <h3 className="text-lg font-extrabold">Invite Friends & Earn 15 Free Credits</h3>
                <p className="text-xs text-purple-200 max-w-xl leading-relaxed">
                  Share your personal referral link with fellow brand managers, creators, or ecommerce store owners. You both receive 15 bonus credits when they sign up!
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 max-w-lg">
                  <div className="flex-grow bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 rounded-xl text-xs font-mono text-purple-100 truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="px-4 py-2 bg-white text-indigo-900 hover:bg-purple-50 font-bold rounded-xl text-xs shadow-sm transition-all shrink-0"
                  >
                    {copiedReferral ? 'Copied Link!' : 'Copy Link'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ZeperAI Studio for ecommerce AI product photos! Join with my link for 15 free credits: ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center shrink-0"
                  >
                    Share WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-800">Security & Account Access</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center">
                    <Icon name="lock" className="w-4 h-4 text-indigo-600 mr-2" />
                    Change Password
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We will send a password reset link to <span className="font-semibold text-slate-700">{user.email}</span>.
                  </p>
                  <Button onClick={handlePasswordReset} variant="secondary" className="!py-1.5 !text-xs mt-2">
                    Send Password Reset Email
                  </Button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center">
                    <Icon name="shield-check" className="w-4 h-4 text-emerald-600 mr-2" />
                    Active Sessions
                  </h4>
                  <p className="text-xs text-slate-500">
                    Current Device: <span className="font-semibold text-slate-700">Chrome (Linux / Web)</span> • <span className="text-emerald-600 font-bold">Active now</span>
                  </p>
                  <Button onClick={handleSignOutAllDevices} variant="secondary" className="!py-1.5 !text-xs mt-2">
                    Sign Out All Other Devices
                  </Button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
              <h3 className="text-sm font-bold text-rose-900 flex items-center">
                <Icon name="alert-triangle" className="w-4 h-4 text-rose-600 mr-2" />
                Data & Account Management
              </h3>
              <p className="text-xs text-rose-700">Export your data or permanently remove your account from ZeperAI.</p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button onClick={handleExportData} variant="secondary" className="!py-1.5 !text-xs !bg-white !text-slate-800 !border-slate-300">
                  <Icon name="download" className="w-3 h-3 mr-1.5" />
                  Export Account Data (JSON)
                </Button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* GST Tax Invoice Printable Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="text-lg font-extrabold text-indigo-600 tracking-tight">ZeperAI Studio Pvt Ltd</div>
                <p className="text-xs text-slate-500">GSTIN: {selectedInvoice.gstin} • HSN/SAC: 998313</p>
                <p className="text-xs text-slate-500">Mumbai, Maharashtra, India</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase border border-emerald-200">
                  Tax Invoice
                </span>
                <p className="text-xs font-mono font-bold text-slate-800 mt-2">{selectedInvoice.invoiceNumber}</p>
                <p className="text-[11px] text-slate-400">{selectedInvoice.date}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Billed To</p>
              <p className="font-bold text-slate-800 mt-0.5">{user.name}</p>
              <p className="text-slate-600">{user.email}</p>
              <p className="text-slate-500">{user.location || 'India'}</p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-right">Taxable Val</th>
                    <th className="p-2.5 text-right">CGST (9%)</th>
                    <th className="p-2.5 text-right">SGST (9%)</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-2.5 font-medium">{selectedInvoice.description}</td>
                    <td className="p-2.5 text-right font-mono">₹{selectedInvoice.taxableValue}</td>
                    <td className="p-2.5 text-right font-mono">₹{selectedInvoice.cgst}</td>
                    <td className="p-2.5 text-right font-mono">₹{selectedInvoice.sgst}</td>
                    <td className="p-2.5 text-right font-bold font-mono">₹{selectedInvoice.amount}.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-[11px] text-slate-400">Includes 18% Goods and Services Tax (GST)</p>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={() => setSelectedInvoice(null)} className="!py-1.5 !text-xs">
                  Close
                </Button>
                <Button onClick={() => window.print()} className="!py-1.5 !text-xs">
                  <Icon name="download" className="w-3.5 h-3.5 mr-1" />
                  Print / Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="alert-triangle" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Delete Account Permanent?</h3>
            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed">
              This action cannot be undone. All your saved designs, credit balances, and brand kits will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <Button variant="secondary" fullWidth onClick={() => setShowDeleteModal(false)} className="!py-2">
                Cancel
              </Button>
              <Button fullWidth onClick={() => { setShowDeleteModal(false); alert("Account deletion requested."); }} className="!bg-rose-600 !text-white hover:!bg-rose-700 !py-2">
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

