import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAdminAuthHeader } from './adminAuthHelper.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { AdminStateMessage } from './AdminStateMessage.js';
import { AdminConfirmationModal } from './AdminConfirmationModal.js';
import {
  Database,
  Trash2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Video,
  Layers,
  HardDrive,
  RefreshCw,
  User,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Search
} from 'lucide-react';

interface StorageManagerProps {
  onSelectUser?: (userId: string) => void;
}

export default function StorageManager({ onSelectUser }: StorageManagerProps) {
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  
  const [orphanedFiles, setOrphanedFiles] = useState<any[]>([]);
  const [loadingOrphaned, setLoadingOrphaned] = useState(false);
  const [showOrphaned, setShowOrphaned] = useState(false);
  const [orphanedError, setOrphanedError] = useState<string | null>(null);
  
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Safe Deletion Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const getHeaders = async () => {
    const authHeader = await getAdminAuthHeader();
    return { Authorization: `Bearer ${authHeader || ''}` };
  };

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      setStorageError(null);
      const res = await axios.get('/api/admin/storage/overview', { headers: await getHeaders() });
      setOverview(res.data);
    } catch (err: any) {
      console.error('Error fetching storage overview:', err);
      setStorageError(err.response?.data?.error || err.message || 'Failed to retrieve storage overview metrics. Please check Supabase and database connection.');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchOrphaned = async () => {
    try {
      setLoadingOrphaned(true);
      setShowOrphaned(true);
      setOrphanedError(null);
      const res = await axios.get('/api/admin/storage/orphaned', { headers: await getHeaders() });
      setOrphanedFiles(res.data.orphaned || []);
    } catch (err: any) {
      console.error('Error fetching orphaned files:', err);
      setOrphanedError(err.response?.data?.error || err.message || 'Failed to audit storage objects.');
    } finally {
      setLoadingOrphaned(false);
    }
  };

  const initiateDeleteSelected = () => {
    if (selectedPaths.size === 0) return;
    setShowConfirmModal(true);
  };

  const handleExecuteDelete = async () => {
    const pathsArray = Array.from(selectedPaths);
    const sizeToFree = orphanedFiles
      .filter(f => selectedPaths.has(f.path))
      .reduce((sum, f) => sum + (f.size || 0), 0);

    try {
      setDeleting(true);
      await axios.post('/api/admin/storage/cleanup-orphaned', 
        { objectPaths: pathsArray, totalBytes: sizeToFree }, 
        { headers: await getHeaders() }
      );
      
      setSelectedPaths(new Set());
      setShowConfirmModal(false);
      await fetchOverview();
      await fetchOrphaned();
      setActionSuccessMsg(`Cleanup completed. Successfully removed ${pathsArray.length} unreferenced files and freed ${formatBytes(sizeToFree)}.`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error deleting storage objects");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPaths.size === orphanedFiles.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(orphanedFiles.map(f => f.path)));
    }
  };

  const toggleSelect = (path: string) => {
    const newSet = new Set(selectedPaths);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setSelectedPaths(newSet);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  if (loadingOverview && !overview) {
    return (
      <AdminStateMessage
        type="loading"
        title="Auditing Supabase Object Storage"
        message="Querying bucket usage, file mime categories, top user storage allocations, and unreferenced files..."
      />
    );
  }

  if (storageError && !overview) {
    return (
      <AdminStateMessage
        type="error"
        title="Storage Audit Failed"
        message={storageError}
        onRetry={fetchOverview}
        retryText="Retry Storage Audit"
      />
    );
  }

  if (!overview) return null;

  const topUsersFiltered = (overview.topUsers || []).filter((u: any) => {
    if (!searchUser) return true;
    const q = searchUser.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.userId?.toLowerCase().includes(q);
  });

  const fileBreakdown = overview.fileBreakdown || { images: 0, videos: 0, other: 0 };
  const totalFilesCount = overview.totalFiles || (fileBreakdown.images + fileBreakdown.videos + fileBreakdown.other);

  const selectedSizeToFree = orphanedFiles
    .filter(f => selectedPaths.has(f.path))
    .reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Storage Used</span>
            <div className="p-2 rounded-xl bg-primary-light text-primary border border-primary/20">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{formatBytes(overview.totalSize)}</span>
            <p className="text-xs text-text-secondary mt-1">Supabase <code className="bg-slate-100 px-1 py-0.5 rounded text-text-primary">designs</code> bucket</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Image Files</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-accent-green border border-emerald-100">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{fileBreakdown.images.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">PNG, JPG, WebP renders & masks</p>
          </div>
        </Card>

        <Card className="p-5 bg-surface border border-border-light shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Video Assets</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-batangas text-text-primary font-mono">{fileBreakdown.videos.toLocaleString()}</span>
            <p className="text-xs text-text-secondary mt-1">MP4 animated reels & pans</p>
          </div>
        </Card>

        <Card className={`p-5 bg-surface border shadow-sm ${overview.orphanedCount > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-border-light'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${overview.orphanedCount > 0 ? 'text-amber-700' : 'text-text-secondary'}`}>
              Orphaned Assets
            </span>
            <div className={`p-2 rounded-xl ${overview.orphanedCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-text-secondary'}`}>
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <span className={`text-2xl font-bold font-batangas font-mono ${overview.orphanedCount > 0 ? 'text-amber-700' : 'text-text-primary'}`}>
                {overview.orphanedCount}
              </span>
              <p className="text-xs text-text-secondary mt-1">Waste: {formatBytes(overview.orphanedSize)}</p>
            </div>
            {overview.orphanedCount > 0 && (
              <Button
                variant={showOrphaned ? 'secondary' : 'primary'}
                onClick={showOrphaned ? () => setShowOrphaned(false) : fetchOrphaned}
                className="text-xs px-2.5 h-7 shadow-xs"
              >
                {showOrphaned ? 'Hide' : 'Clean'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* 2. ORPHANED FILES MANAGEMENT & SAFE CLEANUP */}
      {showOrphaned && (
        <Card className="p-0 overflow-hidden border border-amber-300 bg-surface shadow-md">
          <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold font-batangas text-sm text-amber-800 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-600" />
                Unreferenced / Orphaned Files Detected ({orphanedFiles.length})
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Files present in bucket storage but not linked to any design record or brand kit.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {selectedPaths.size > 0 && (
                <Button
                  variant="secondary"
                  className="text-xs px-3 h-8 bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-xs"
                  onClick={initiateDeleteSelected}
                  disabled={deleting}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Clean Selected ({selectedPaths.size}) • {formatBytes(selectedSizeToFree)}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={fetchOrphaned}
                className="text-xs px-2.5 h-8 bg-white border-border-light text-text-primary shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingOrphaned ? 'animate-spin' : ''}`} />
                Rescan
              </Button>
            </div>
          </div>
          
          <div className="max-h-[420px] overflow-y-auto">
            {loadingOrphaned ? (
              <div className="py-12 text-center text-text-secondary">
                <Spinner className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                Scanning storage bucket hierarchy...
              </div>
            ) : orphanedFiles.length === 0 ? (
              <div className="py-10 text-center text-text-secondary">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-accent-green" />
                <p className="font-semibold text-text-primary">No orphaned files in storage</p>
                <p className="text-xs text-text-secondary mt-0.5">All bucket objects are indexed in the database.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-text-secondary uppercase text-[10px] tracking-wider sticky top-0 border-b border-border-light z-10">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={orphanedFiles.length > 0 && selectedPaths.size === orphanedFiles.length}
                        onChange={toggleSelectAll}
                        className="rounded text-primary focus:ring-primary bg-white border-border-light"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Storage Object Path</th>
                    <th className="px-4 py-3 font-medium w-32">File Size</th>
                    <th className="px-4 py-3 font-medium w-48">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/60">
                  {orphanedFiles.map((file) => (
                    <tr key={file.path} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-2.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedPaths.has(file.path)}
                          onChange={() => toggleSelect(file.path)}
                          className="rounded text-primary focus:ring-primary bg-white border-border-light"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-text-primary truncate max-w-md" title={file.path}>
                        {file.path}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-text-secondary">{formatBytes(file.size)}</td>
                      <td className="px-4 py-2.5 text-xs text-text-secondary font-mono">
                        {file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* 3. TOP USERS BY STORAGE USAGE TABLE */}
      <Card className="p-0 overflow-hidden border border-border-light bg-surface shadow-sm">
        <div className="p-5 border-b border-border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold font-batangas text-text-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Largest Storage Accounts (Top Users)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">Ranked by total megabytes consumed in customer folders</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Filter by user or email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border-light rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary uppercase text-[11px] tracking-wider font-semibold border-b border-border-light">
              <tr>
                <th className="px-5 py-3.5 w-16">Rank</th>
                <th className="px-5 py-3.5">Customer Profile</th>
                <th className="px-5 py-3.5">Subscription Tier</th>
                <th className="px-5 py-3.5">Files Count</th>
                <th className="px-5 py-3.5">Storage Footprint</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60">
              {topUsersFiltered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary">
                    No matching customer storage records.
                  </td>
                </tr>
              ) : topUsersFiltered.map((u: any, index: number) => {
                const percentOfTotal = overview.totalSize > 0 ? ((u.size / overview.totalSize) * 100).toFixed(1) : '0';
                return (
                  <tr key={u.userId} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5 text-text-secondary font-mono text-xs">
                      #{index + 1}
                    </td>

                    <td 
                      className="px-5 py-3.5 cursor-pointer"
                      onClick={() => onSelectUser && onSelectUser(u.userId)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-text-primary group-hover:text-primary transition-colors flex items-center gap-1">
                            {u.name}
                            {onSelectUser && (
                              <ExternalLink className="w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <div className="text-[11px] text-text-secondary font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        u.tier === 'Pro' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : u.tier === 'PayAsYouGo'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-text-secondary border-border-light'
                      }`}>
                        {u.tier}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs text-text-primary">
                      {u.filesCount || 0} objects
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-text-primary">{formatBytes(u.size)}</span>
                          <span className="text-[10px] text-text-secondary">({percentOfTotal}% of bucket)</span>
                        </div>
                        <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(Number(percentOfTotal), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {onSelectUser && (
                        <Button
                          variant="secondary"
                          className="text-xs px-2.5 h-7 bg-slate-100 hover:bg-slate-200 text-text-primary border-border-light shadow-xs"
                          onClick={() => onSelectUser(u.userId)}
                        >
                          User Details
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-accent-green rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-accent-green/80 hover:text-accent-green text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. SAFE DESTRUCTIVE CONFIRMATION MODAL */}
      <AdminConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Storage Cleanup"
        description={`You are about to permanently delete ${selectedPaths.size} unreferenced storage objects totaling ${formatBytes(selectedSizeToFree)}.`}
        impactItems={[
          `Permanently removes ${selectedPaths.size} objects from Supabase storage buckets.`,
          `Reclaims approx ${formatBytes(selectedSizeToFree)} of bucket capacity.`,
          'Creates an immutable entry in the administrative audit ledger.'
        ]}
        confirmKeyword="DELETE"
        confirmButtonText="Execute Storage Cleanup"
        variant="danger"
        loading={deleting}
        onConfirm={handleExecuteDelete}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
