import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';

export default function StorageManager() {
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  
  const [orphanedFiles, setOrphanedFiles] = useState<any[]>([]);
  const [loadingOrphaned, setLoadingOrphaned] = useState(false);
  const [showOrphaned, setShowOrphaned] = useState(false);
  
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token;
    return { Authorization: `Bearer ` };
  };

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await axios.get('/api/admin/storage/overview', { headers: await getHeaders() });
      setOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchOrphaned = async () => {
    try {
      setLoadingOrphaned(true);
      setShowOrphaned(true);
      const res = await axios.get('/api/admin/storage/orphaned', { headers: await getHeaders() });
      setOrphanedFiles(res.data.orphaned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrphaned(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPaths.size === 0) return;
    
    const pathsArray = Array.from(selectedPaths);
    const sizeToFree = orphanedFiles
      .filter(f => selectedPaths.has(f.path))
      .reduce((sum, f) => sum + f.size, 0);

    if (!confirm(`Are you sure you want to delete ${pathsArray.length} files?\n\nTotal space to be freed: ${formatBytes(sizeToFree)}`)) {
      return;
    }

    try {
      setDeleting(true);
      await axios.post('/api/admin/storage/cleanup-orphaned', 
        { objectPaths: pathsArray, totalBytes: sizeToFree }, 
        { headers: await getHeaders() }
      );
      
      setSelectedPaths(new Set());
      await fetchOverview();
      await fetchOrphaned();
      alert("Files deleted successfully.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Error deleting files");
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
    return <div className="py-12 flex justify-center"><Spinner className="w-8 h-8" /></div>;
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Storage Used (Designs Bucket)</p>
          <h3 className="text-3xl font-bold">{formatBytes(overview.totalSize)}</h3>
        </Card>
        
        <Card className={`p-6 border-2 ${overview.orphanedCount > 0 ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30' : 'border-transparent'}`}>
          <p className={`text-sm font-medium mb-1 ${overview.orphanedCount > 0 ? 'text-amber-700 dark:text-amber-500' : 'text-slate-500'}`}>
            Orphaned Files Detected
          </p>
          <div className="flex items-end justify-between">
            <div>
               <h3 className={`text-3xl font-bold ${overview.orphanedCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                 {overview.orphanedCount}
               </h3>
               <p className="text-xs text-slate-500 mt-1">Waste: {formatBytes(overview.orphanedSize)}</p>
            </div>
            {overview.orphanedCount > 0 && (
              <Button variant={showOrphaned ? 'secondary' : 'primary'} onClick={showOrphaned ? () => setShowOrphaned(false) : fetchOrphaned}>
                {showOrphaned ? 'Hide Details' : 'View Orphans'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Orphaned Files Management */}
      {showOrphaned && (
        <Card className="p-0 overflow-hidden border-amber-200 dark:border-amber-900/30">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 flex items-center justify-between">
             <h2 className="font-bold text-amber-800 dark:text-amber-400">Orphaned Files Management</h2>
             {selectedPaths.size > 0 && (
               <Button variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={handleDeleteSelected} disabled={deleting}>
                 {deleting ? <Spinner className="w-4 h-4 mr-2" /> : <Icon name="trash-2" className="w-4 h-4 mr-2" />}
                 Delete Selected ({selectedPaths.size})
               </Button>
             )}
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {loadingOrphaned ? (
              <div className="py-12 flex justify-center"><Spinner /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={orphanedFiles.length > 0 && selectedPaths.size === orphanedFiles.length}
                        onChange={toggleSelectAll}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700">File Path</th>
                    <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 w-32">Size</th>
                    <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 w-48">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orphanedFiles.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">No orphaned files found.</td></tr>
                  ) : orphanedFiles.map((file) => (
                    <tr key={file.path} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedPaths.has(file.path)}
                          onChange={() => toggleSelect(file.path)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-md" title={file.path}>
                        {file.path}
                      </td>
                      <td className="px-4 py-3">{formatBytes(file.size)}</td>
                      <td className="px-4 py-3 text-slate-500">{file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* Top 20 Users by Storage */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold">Top 20 Users by Storage Usage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Rank</th>
                <th className="px-6 py-3 font-medium border-b border-slate-200 dark:border-slate-700">User Email</th>
                <th className="px-6 py-3 font-medium border-b border-slate-200 dark:border-slate-700">Storage Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {overview.topUsers.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-slate-500">No users found.</td></tr>
              ) : overview.topUsers.map((u: any, index: number) => (
                <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">#{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{u.email} <span className="text-xs text-slate-400 font-mono ml-2 block sm:inline">{u.userId}</span></td>
                  <td className="px-6 py-4 font-mono font-medium">{formatBytes(u.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
