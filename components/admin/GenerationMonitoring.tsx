import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { AdminStateMessage } from './AdminStateMessage.js';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Play,
  RefreshCw,
  Search,
  Video,
  XCircle,
  Zap,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface GenerationRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_tier: string;
  title: string;
  prompt: string;
  image_url: string | null;
  thumbnail_url: string | null;
  aspect_ratio: string;
  feature: string;
  is_video: boolean;
  status: 'successful' | 'failed' | 'processing';
  error_summary: string | null;
  cost_credits: number;
  created_at: string;
}

interface GenerationMonitoringProps {
  onSelectUser?: (userId: string) => void;
}

export default function GenerationMonitoring({ onSelectUser }: GenerationMonitoringProps) {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [metrics, setMetrics] = useState<any>({ totalEvaluated: 0, successful: 0, failed: 0, processing: 0, failureRate: '0' });
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  
  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [studioFilter, setStudioFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Selected item modal / quick inspect
  const [inspectItem, setInspectItem] = useState<GenerationRecord | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, [statusFilter, studioFilter, page]);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      setGenError(null);
      const offset = (page - 1) * limit;
      const res = await axios.get('/api/admin/generations/monitoring', {
        headers: await getHeaders(),
        params: {
          limit,
          offset,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          studio: studioFilter !== 'all' ? studioFilter : undefined,
          search: search || undefined
        }
      });
      setGenerations(res.data.generations || []);
      setMetrics(res.data.metrics || {});
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error('Failed to load generation monitoring data:', err);
      setGenError(err.response?.data?.error || err.message || 'Failed to retrieve generation monitoring metrics. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGenerations();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. HEALTH & METRIC STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Successful Runs</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-accent-green border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{metrics.successful || 0}</span>
            <p className="text-xs text-text-secondary mt-1">Rendered with image/video payloads</p>
          </div>
        </Card>

        <Card className={`p-5 bg-surface border shadow-sm ${metrics.failed > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-border-light'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${metrics.failed > 0 ? 'text-rose-600' : 'text-text-secondary'}`}>
              Failed Generations
            </span>
            <div className={`p-2 rounded-xl ${metrics.failed > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500'}`}>
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold font-batangas font-mono ${metrics.failed > 0 ? 'text-rose-600' : 'text-text-primary'}`}>
              {metrics.failed || 0}
            </span>
            <p className="text-xs text-text-secondary mt-1">Error rate: <strong className="text-text-primary">{metrics.failureRate}%</strong></p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Processing In Queue</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-amber-600 font-mono">{metrics.processing || 0}</span>
            <p className="text-xs text-text-secondary mt-1">Pending response from AI model</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Monitored</span>
            <div className="p-2 rounded-xl bg-primary-light text-primary border border-primary/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{total}</span>
            <p className="text-xs text-text-secondary mt-1">Database generation events indexed</p>
          </div>
        </Card>
      </div>

      {/* 2. MAIN LOGS & TABLE */}
      <Card className="p-0 overflow-hidden border border-border-light bg-surface shadow-sm">
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-border-light space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold font-batangas text-text-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Operational Generation Health Monitor
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Real-time inspection of generation status, error reports, and user feature attribution.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="secondary"
                onClick={fetchGenerations}
                disabled={loading}
                className="text-xs px-3.5 h-8 bg-slate-100 hover:bg-slate-200 border-border-light text-text-primary shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3 border-t border-border-light">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search prompt, title, or generation ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              />
            </form>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              >
                <option value="all">All Execution Statuses</option>
                <option value="successful">Successful Renders</option>
                <option value="failed">Failed / Aborted Only</option>
                <option value="processing">Processing / In-Flight</option>
              </select>
            </div>

            {/* Studio Feature Filter */}
            <div>
              <select
                value={studioFilter}
                onChange={(e) => {
                  setStudioFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
              >
                <option value="all">All Features & Studios</option>
                <option value="product">Product Studio</option>
                <option value="fashion">Fashion Studio</option>
                <option value="influencer">Influencer Studio</option>
                <option value="cgi">CGI / 3D Studio</option>
                <option value="catalog">Catalog Batch</option>
                <option value="festival">Festival Studio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary uppercase text-[11px] tracking-wider font-semibold border-b border-border-light">
              <tr>
                <th className="px-5 py-3.5 w-16">Preview</th>
                <th className="px-5 py-3.5">Execution Status</th>
                <th className="px-5 py-3.5">Feature Studio</th>
                <th className="px-5 py-3.5">User Account</th>
                <th className="px-5 py-3.5">Prompt & Details</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60">
              {loading && generations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminStateMessage
                      type="loading"
                      title="Fetching Generation Telemetry"
                      message="Querying AI studio runs, prompt metadata, generation cost, and output assets..."
                    />
                  </td>
                </tr>
              ) : genError && generations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <AdminStateMessage
                      type="error"
                      title="Failed to Load Generations"
                      message={genError}
                      onRetry={fetchGenerations}
                      retryText="Retry Loading Telemetry"
                    />
                  </td>
                </tr>
              ) : generations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminStateMessage
                      type="empty"
                      title="No Generation Records"
                      message={search || statusFilter !== 'all' || studioFilter !== 'all' ? "No AI generations match the active filter criteria." : "No generation telemetry found in the database."}
                      onClearFilters={search || statusFilter !== 'all' || studioFilter !== 'all' ? () => {
                        setSearch('');
                        setStatusFilter('all');
                        setStudioFilter('all');
                        setPage(1);
                      } : undefined}
                      clearFiltersText="Reset All Filters"
                    />
                  </td>
                </tr>
              ) : (
                generations.map((gen) => (
                  <tr key={gen.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-border-light overflow-hidden flex items-center justify-center relative">
                        {gen.image_url ? (
                          <img
                            src={gen.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : gen.is_video ? (
                          <Video className="w-4 h-4 text-purple-600" />
                        ) : gen.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {gen.status === 'successful' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-accent-green border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Successful
                        </span>
                      )}
                      {gen.status === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                      {gen.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Processing
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-text-primary">{gen.feature}</span>
                        {gen.is_video && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 font-mono border border-purple-200">
                            Video
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-secondary font-mono">{gen.aspect_ratio}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div 
                        className="cursor-pointer group-hover:text-primary transition-colors"
                        onClick={() => onSelectUser && onSelectUser(gen.user_id)}
                      >
                        <div className="font-semibold text-xs text-text-primary">{gen.user_name}</div>
                        <div className="text-[11px] text-text-secondary font-mono truncate max-w-[180px]">
                          {gen.user_email}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="max-w-xs">
                        <p className="text-xs text-text-primary truncate" title={gen.prompt}>
                          {gen.prompt}
                        </p>
                        {gen.error_summary && (
                          <p className="text-[11px] text-rose-600 font-mono mt-0.5 truncate" title={gen.error_summary}>
                            Error: {gen.error_summary}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary font-mono text-xs">
                      {new Date(gen.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="secondary"
                        className="text-xs px-2.5 h-7 bg-slate-100 hover:bg-slate-200 text-text-primary border-border-light shadow-xs"
                        onClick={() => setInspectItem(gen)}
                      >
                        Details
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
            Showing <strong className="text-text-primary">{generations.length}</strong> of <strong className="text-text-primary">{total}</strong> records
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

      {/* 3. INSPECTION MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-lg border border-border-light shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold font-batangas text-text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Generation Telemetry Record
                </h3>
                <p className="text-xs text-text-secondary font-mono mt-0.5">ID: {inspectItem.id}</p>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-text-secondary hover:text-text-primary text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {inspectItem.image_url && (
              <div className="rounded-xl overflow-hidden border border-border-light bg-slate-50 max-h-64 flex items-center justify-center">
                <img
                  src={inspectItem.image_url}
                  alt=""
                  className="max-h-64 object-contain w-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light">
                <span className="text-text-secondary block">Feature Studio</span>
                <span className="font-semibold text-text-primary mt-0.5 block">{inspectItem.feature}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light">
                <span className="text-text-secondary block">Status</span>
                <span className={`font-semibold mt-0.5 block ${inspectItem.status === 'successful' ? 'text-accent-green' : inspectItem.status === 'failed' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {inspectItem.status.toUpperCase()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light">
                <span className="text-text-secondary block">Aspect Ratio</span>
                <span className="font-mono text-text-primary mt-0.5 block">{inspectItem.aspect_ratio}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-border-light">
                <span className="text-text-secondary block">Cost Billed</span>
                <span className="font-mono text-primary font-bold mt-0.5 block">{inspectItem.cost_credits} Credits</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-border-light text-xs space-y-1">
              <span className="text-text-secondary block font-medium">Prompt Context</span>
              <p className="text-text-primary whitespace-pre-wrap">{inspectItem.prompt}</p>
            </div>

            {inspectItem.error_summary && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                <span className="text-rose-600 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Error Diagnosed
                </span>
                <p className="text-rose-700 font-mono text-[11px] break-all">{inspectItem.error_summary}</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-border-light text-xs flex items-center justify-between">
              <div>
                <span className="text-text-secondary text-[11px] block">Created By</span>
                <span className="text-text-primary font-medium">{inspectItem.user_name} ({inspectItem.user_email})</span>
              </div>
              {onSelectUser && (
                <Button
                  variant="secondary"
                  className="text-xs px-2.5 h-7 bg-white border-border-light text-text-primary shadow-xs"
                  onClick={() => {
                    setInspectItem(null);
                    onSelectUser(inspectItem.user_id);
                  }}
                >
                  View Profile
                </Button>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border-light">
              <Button
                variant="secondary"
                onClick={() => setInspectItem(null)}
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
