import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { AdminStateMessage } from './AdminStateMessage.js';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  Shield,
  Clock,
  Eye
} from 'lucide-react';

interface AuditLogRecord {
  id: string;
  action: string;
  admin_id: string | null;
  admin_email: string;
  target_user_id: string | null;
  target_user_name: string | null;
  target_user_email: string | null;
  details: any;
  created_at: string;
}

interface AdminAuditLogProps {
  onSelectUser?: (userId: string) => void;
}

export function AdminAuditLog({ onSelectUser }: AdminAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Filters & State
  const [actionFilter, setActionFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, adminFilter, startDate, endDate, page]);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setAuditError(null);
      const offset = (page - 1) * limit;
      const res = await axios.get('/api/admin/audit-logs', {
        headers: await getHeaders(),
        params: {
          limit,
          offset,
          action: actionFilter !== 'all' ? actionFilter : undefined,
          admin: adminFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined
        }
      });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      if (res.data.availableActions) {
        setAvailableActions(res.data.availableActions);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setAuditError(err.response?.data?.error || err.message || 'Failed to retrieve immutable administrative logs. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCsv = async () => {
    try {
      const authHeader = await getAdminAuthHeader();
      window.open(`/api/admin/export/csv?type=audit_logs&token=${encodeURIComponent(authHeader || '')}`, '_blank');
    } catch (err) {
      console.error('Failed to trigger export:', err);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getActionColor = (action: string) => {
    if (action.includes('ban') || action.includes('delete')) return 'bg-rose-50 text-rose-600 border-rose-200';
    if (action.includes('credit') || action.includes('tier')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('admin') || action.includes('privilege')) return 'bg-primary-light text-primary border-primary/20';
    if (action.includes('refund') || action.includes('cancel')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-slate-100 text-text-secondary border-border-light';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. HEADER SUMMARY */}
      <Card className="p-0 overflow-hidden border border-border-light bg-surface shadow-sm">
        <div className="p-5 border-b border-border-light space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center border border-primary/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-batangas text-text-primary">Immutable Administrative Audit Log</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Cryptographically track and verify all privilege elevations, credit grants, refunds & deletions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleExportCsv}
                className="text-xs px-3 h-8 bg-slate-100 hover:bg-slate-200 text-text-primary border-border-light shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={fetchLogs}
                disabled={loading}
                className="text-xs px-3 h-8 bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-border-light">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search action, admin email, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              />
            </form>

            {/* Action Type Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              >
                <option value="all">All Mutation Actions</option>
                {availableActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary uppercase text-[11px] tracking-wider font-semibold border-b border-border-light">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin Actor</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target Account</th>
                <th className="px-5 py-3.5">Summary / Justification</th>
                <th className="px-5 py-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60 text-xs">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminStateMessage
                      type="loading"
                      title="Querying Audit Repository"
                      message="Fetching administrative operations, actor signatures, security events, and payload records..."
                    />
                  </td>
                </tr>
              ) : auditError && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <AdminStateMessage
                      type="error"
                      title="Failed to Load Audit Logs"
                      message={auditError}
                      onRetry={fetchLogs}
                      retryText="Retry Loading Audit Logs"
                    />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminStateMessage
                      type="empty"
                      title="No Audit Entries Found"
                      message={search || actionFilter !== 'all' || adminFilter || startDate || endDate ? "No audit log entries match the current filter or date range criteria." : "No administrative actions recorded in the audit ledger yet."}
                      onClearFilters={search || actionFilter !== 'all' || adminFilter || startDate || endDate ? () => {
                        setSearch('');
                        setActionFilter('all');
                        setAdminFilter('');
                        setStartDate('');
                        setEndDate('');
                        setPage(1);
                      } : undefined}
                      clearFiltersText="Reset All Filters"
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-text-primary">{log.admin_email}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {log.target_user_id ? (
                        <div
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={() => onSelectUser && onSelectUser(log.target_user_id!)}
                        >
                          <div className="font-medium text-text-primary">
                            {log.target_user_name || 'User'}
                          </div>
                          <div className="text-[11px] text-text-secondary font-mono truncate max-w-[160px]">
                            {log.target_user_email || log.target_user_id}
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-secondary font-mono text-[11px]">System Scope</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="max-w-xs text-text-primary truncate">
                        {log.details?.reason ? (
                          <span>{log.details.reason}</span>
                        ) : log.details?.amount ? (
                          <span>Amount: {log.details.amount > 0 ? `+${log.details.amount}` : log.details.amount} cr</span>
                        ) : log.details?.new_tier ? (
                          <span>Changed tier to: <strong className="text-primary">{log.details.new_tier}</strong></span>
                        ) : (
                          <span className="text-text-secondary font-mono">{JSON.stringify(log.details)}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="secondary"
                        className="text-xs px-2.5 h-7 bg-slate-100 hover:bg-slate-200 text-text-primary border-border-light shadow-xs"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border-light flex items-center justify-between text-xs text-text-secondary bg-slate-50">
          <div>
            Showing <strong className="text-text-primary">{logs.length}</strong> of <strong className="text-text-primary">{total}</strong> audit entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs px-2.5 h-7 bg-white border-border-light text-text-primary shadow-xs"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>
            <span className="font-mono text-xs text-text-primary px-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              className="text-xs px-2.5 h-7 bg-white border-border-light text-text-primary shadow-xs"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-lg border border-border-light shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold font-batangas text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Audit Trail Mutation Record
                </h3>
                <p className="text-xs text-text-secondary font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-text-secondary hover:text-text-primary text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light">
                <span className="text-text-secondary block">Admin Actor</span>
                <span className="font-semibold text-text-primary mt-0.5 block">{selectedLog.admin_email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light">
                <span className="text-text-secondary block">Action</span>
                <span className="font-semibold text-primary mt-0.5 block">{selectedLog.action}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light col-span-2">
                <span className="text-text-secondary block">Timestamp</span>
                <span className="font-mono text-text-primary mt-0.5 block">
                  {new Date(selectedLog.created_at).toUTCString()} ({new Date(selectedLog.created_at).toLocaleString()})
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-border-light text-xs space-y-1">
              <span className="text-text-secondary block font-medium">Metadata Payload</span>
              <pre className="text-text-primary bg-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap border border-border-light">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            {selectedLog.target_user_id && (
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light text-xs flex items-center justify-between">
                <div>
                  <span className="text-text-secondary text-[11px] block">Target Account</span>
                  <span className="text-text-primary font-medium">{selectedLog.target_user_name || 'User'} ({selectedLog.target_user_email || selectedLog.target_user_id})</span>
                </div>
                {onSelectUser && (
                  <Button
                    variant="secondary"
                    className="text-xs px-2.5 h-7 bg-white border-border-light text-text-primary shadow-xs"
                    onClick={() => {
                      const uid = selectedLog.target_user_id!;
                      setSelectedLog(null);
                      onSelectUser(uid);
                    }}
                  >
                    View Profile
                  </Button>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border-light">
              <Button
                variant="secondary"
                onClick={() => setSelectedLog(null)}
                className="bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary text-xs shadow-xs"
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

export default AdminAuditLog;
