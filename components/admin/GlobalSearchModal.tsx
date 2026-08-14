import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper';
import { Search, User, CreditCard, Layers, X, ExternalLink, Shield } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onNavigateTab: (tab: 'users' | 'subscriptions' | 'payments' | 'credits' | 'analytics' | 'storage' | 'monitoring' | 'audit') => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectUser,
  onNavigateTab
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    payments: any[];
    subscriptions: any[];
  }>({ users: [], payments: [], subscriptions: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ users: [], payments: [], subscriptions: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults({ users: [], payments: [], subscriptions: [] });
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const performSearch = async (q: string) => {
    try {
      setLoading(true);
      const authHeader = await getAdminAuthHeader();
      const res = await axios.get('/api/admin/search/global', {
        headers: { Authorization: `Bearer ${authHeader}` },
        params: { q }
      });
      setResults(res.data.results || { users: [], payments: [], subscriptions: [] });
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalResults = results.users.length + results.payments.length + results.subscriptions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-border-light shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border-light flex items-center gap-3 bg-main/50">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search email, name, user UUID, order ID, or payment ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-secondary focus:outline-none"
          />
          {loading && <Spinner className="w-4 h-4 text-primary shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-secondary hover:text-text-primary text-xs px-2 py-0.5 rounded-lg bg-slate-200 font-mono"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {query.trim().length < 2 && (
            <div className="py-12 text-center text-text-secondary space-y-2">
              <p className="font-medium">Type at least 2 characters to search across users, transactions, and subscriptions.</p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-text-secondary font-mono flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-main border border-border-light">Email: test@gmail.com</span>
                <span className="px-2 py-1 rounded-lg bg-main border border-border-light">User ID: 00000...</span>
                <span className="px-2 py-1 rounded-lg bg-main border border-border-light">Order: order_...</span>
              </div>
            </div>
          )}

          {query.trim().length >= 2 && !loading && totalResults === 0 && (
            <div className="py-12 text-center text-text-secondary">
              No matching records found for <span className="text-text-primary font-mono font-bold">"{query}"</span>.
            </div>
          )}

          {/* User Results */}
          {results.users.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Users ({results.users.length})
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('users');
                  }}
                  className="text-primary hover:underline lowercase font-normal"
                >
                  view all users →
                </button>
              </div>
              <div className="space-y-1.5">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onClose();
                      onSelectUser(u.id);
                    }}
                    className="p-3 bg-white hover:bg-main/60 border border-border-light rounded-xl cursor-pointer transition-colors flex items-center justify-between group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {u.name?.charAt(0) || u.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                          {u.name || 'Anonymous User'}
                        </div>
                        <div className="text-[11px] text-text-secondary font-mono">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-main border border-border-light text-text-secondary font-medium">
                        {u.tier || 'Free'}
                      </span>
                      {u.is_admin && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Results */}
          {results.payments.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Payments ({results.payments.length})
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('payments');
                  }}
                  className="text-primary hover:underline lowercase font-normal"
                >
                  view all payments →
                </button>
              </div>
              <div className="space-y-1.5">
                {results.payments.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectUser(p.user_id);
                    }}
                    className="p-3 bg-white hover:bg-main/60 border border-border-light rounded-xl cursor-pointer transition-colors flex items-center justify-between group shadow-xs"
                  >
                    <div>
                      <div className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                        ₹{p.amount} • {p.plan_id || 'Top-up'}
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono">
                        {p.razorpay_payment_id || p.razorpay_order_id || p.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription Results */}
          {results.subscriptions.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" /> Subscriptions ({results.subscriptions.length})
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('subscriptions');
                  }}
                  className="text-primary hover:underline lowercase font-normal"
                >
                  view all subscriptions →
                </button>
              </div>
              <div className="space-y-1.5">
                {results.subscriptions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onClose();
                      onSelectUser(s.user_id);
                    }}
                    className="p-3 bg-white hover:bg-main/60 border border-border-light rounded-xl cursor-pointer transition-colors flex items-center justify-between group shadow-xs"
                  >
                    <div>
                      <div className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {s.plan_name || 'Pro'} Tier (₹{s.amount})
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono">
                        Sub ID: {s.razorpay_subscription_id || s.id}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 border border-purple-200 font-bold">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-main/50 border-t border-border-light flex items-center justify-between text-[11px] text-text-secondary">
          <span>Click any user, payment, or subscription to open detailed profile</span>
          <span className="font-mono">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
