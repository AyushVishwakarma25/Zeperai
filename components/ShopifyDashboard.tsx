import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  ChevronRight, 
  Menu, 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  X,
  Plus
} from 'lucide-react';
import { shopifyService } from '../services/shopifyService.js';
import { ShopifyAnalysisResult, ProductZoneItem } from '../types.js';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ShopifyDashboardProps {
  onGenerateAd?: (productName: string) => void;
  onToggleSidebar?: () => void;
  onDeductCredits?: (cost: number) => boolean;
  report?: any;
  isLoaded?: boolean;
  onReportUpdate?: (report: any) => void;
}

// ─── CSV Parsing Helpers ────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };

  const delim = lines[0].includes('\t') ? '\t' : ',';

  function splitLine(line: string): string[] {
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === delim && !inQ) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur.trim());
    return cols;
  }

  const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] !== undefined ? cols[j].replace(/^"|"$/g, '').trim() : '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function findCol(headers: string[], candidates: string[]): string | null {
  const hl = headers.map(h => h.toLowerCase().replace(/[\s_\-]/g, ''));
  for (const c of candidates) {
    const cl = c.toLowerCase().replace(/[\s_\-]/g, '');
    const idx = hl.findIndex(h => h === cl || h.includes(cl) || cl.includes(h));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function cleanMoney(v: string | undefined): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[$£€¥₹,\s]/g, '').replace(/[()]/g, ''));
  return isNaN(n) ? 0 : n;
}

function cleanNum(v: string | undefined): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fmt$(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(v);
}

function fmtN(v: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(v));
}

type FileType = 'orders' | 'products' | 'analytics' | 'customers' | 'inventory' | 'timeseries' | 'unknown';

function detectFileType(headers: string[]): FileType {
  const hl = headers.map(h => h.toLowerCase());
  const has = (k: string) => hl.some(h => h.includes(k));

  if (
    has('lineitem') || has('line_item') ||
    (has('financial') && has('fulfillment')) ||
    (has('name') && has('total') && has('email') && has('shipping'))
  ) return 'orders';

  if (
    (has('variant') && has('inventory')) || has('variant sku') || has('variant price') ||
    (has('title') && has('vendor') && has('type'))
  ) return 'products';

  if (has('sessions') || has('pageview') || has('visitor') || has('bounce')) return 'analytics';

  if (has('customer') && (has('total spent') || has('orders count') || has('email'))) return 'customers';

  if (has('inventory') || has('available') || has('on hand')) return 'inventory';

  if (
    (has('date') || has('day') || has('month')) &&
    (has('sales') || has('revenue') || has('total'))
  ) return 'timeseries';

  return 'unknown';
}

interface OrdersResult {
  totalRevenue: number;
  totalOrders: number;
  dailyRevenue: Record<string, number>;
  productRevenue: Record<string, number>;
  productUnits: Record<string, number>;
  customerCount: number;
  refunds: number;
}

function processOrders(rows: Record<string, string>[], headers: string[]): OrdersResult {
  const colName     = findCol(headers, ['Name', 'Order Name', 'Order Number', 'order_name', '#', 'id']);
  const colTotal    = findCol(headers, ['Total', 'Subtotal', 'Total Price', 'total_price', 'Grand Total', 'Revenue', 'Amount', 'Net Payment', 'Gross Sales']);
  const colDate     = findCol(headers, ['Created at', 'Created At', 'Date', 'Order Date', 'Paid At', 'created_at', 'order_date', 'Processed At']);
  const colProduct  = findCol(headers, ['Lineitem name', 'Line Item Name', 'Product', 'Product Title', 'lineitem_name', 'Product Name', 'Item', 'Title']);
  const colQty      = findCol(headers, ['Lineitem quantity', 'Quantity', 'lineitem_quantity', 'Qty', 'Units', 'Quantity Ordered']);
  const colLineRev  = findCol(headers, ['Lineitem price', 'Line Item Price', 'lineitem_price', 'Unit Price', 'Price', 'Item Price']);
  const colStatus   = findCol(headers, ['Financial Status', 'financial_status', 'Payment Status', 'Status', 'Order Status']);
  const colEmail    = findCol(headers, ['Email', 'Customer Email', 'email', 'Billing Email']);

  const orderTotals: Record<string, number> = {};
  const orderDates: Record<string, string> = {};
  const productRevenue: Record<string, number> = {};
  const productUnits: Record<string, number> = {};
  const dailyRevenue: Record<string, number> = {};
  const orderSet = new Set<string>();
  const customerEmails = new Set<string>();
  let totalRevenue = 0;
  let totalOrders = 0;
  let refunds = 0;

  rows.forEach(r => {
    const status = colStatus ? r[colStatus]?.toLowerCase() : '';
    if (status === 'refunded' || status === 'voided') { refunds++; return; }

    const orderId = colName ? r[colName] : '';
    const total   = colTotal ? cleanMoney(r[colTotal]) : 0;
    const dateRaw = colDate ? r[colDate] : '';
    const dateKey = dateRaw ? dateRaw.substring(0, 10) : 'Unknown';
    const product = colProduct ? r[colProduct]?.trim() : '';
    const qty     = colQty ? cleanNum(r[colQty]) : 1;
    const lineRev = colLineRev ? cleanMoney(r[colLineRev]) * qty : 0;

    if (colEmail && r[colEmail]) customerEmails.add(r[colEmail].toLowerCase());

    if (orderId && !orderSet.has(orderId)) {
      orderSet.add(orderId);
      totalOrders++;
      if (total > 0) {
        orderTotals[orderId] = total;
        totalRevenue += total;
        if (dateKey) {
          dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + total;
          orderDates[orderId] = dateKey;
        }
      }
    }

    if (product && lineRev > 0) {
      productRevenue[product] = (productRevenue[product] || 0) + lineRev;
      productUnits[product]   = (productUnits[product] || 0) + qty;
    }

    if (!orderId && total > 0 && lineRev === 0) {
      totalRevenue += total;
      totalOrders++;
      if (dateKey) dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + total;
    }
  });

  return {
    totalRevenue,
    totalOrders,
    dailyRevenue,
    productRevenue,
    productUnits,
    customerCount: customerEmails.size,
    refunds
  };
}

function processTimeSeries(rows: Record<string, string>[], headers: string[]): Record<string, number> {
  const colDate = findCol(headers, ['Date', 'Day', 'Month', 'Period', 'Week', 'date']);
  const colRev  = findCol(headers, ['Total Sales', 'Sales', 'Revenue', 'Total Revenue', 'Net Sales', 'Gross Sales', 'total_sales', 'revenue', 'Amount', 'Total']);
  const daily: Record<string, number> = {};
  rows.forEach(r => {
    const d   = colDate ? r[colDate]?.substring(0, 10) : '';
    if (!d) return;
    const rev = cleanMoney(colRev ? r[colRev] : '0');
    daily[d]  = (daily[d] || 0) + rev;
  });
  return daily;
}

interface TempZoneProduct {
  name: string;
  revenue: number;
  units: number;
}

function buildProductZones(
  productRevenue: Record<string, number>,
  productUnits: Record<string, number>
): { green: TempZoneProduct[]; amber: TempZoneProduct[]; red: TempZoneProduct[] } {
  const items: TempZoneProduct[] = Object.entries(productRevenue).map(([name, revenue]) => ({
    name,
    revenue,
    units: productUnits[name] || 0
  }));

  if (!items.length) return { green: [], amber: [], red: [] };

  const sorted = items.sort((a, b) => b.revenue - a.revenue);
  const total  = sorted.reduce((s, p) => s + p.revenue, 0);
  const avg    = total / sorted.length;

  const green: TempZoneProduct[] = [];
  const amber: TempZoneProduct[] = [];
  const red:   TempZoneProduct[] = [];

  sorted.forEach(p => {
    if (p.revenue >= avg * 1.5)       green.push(p);
    else if (p.revenue >= avg * 0.5)  amber.push(p);
    else                               red.push(p);
  });

  return { green, amber, red };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const KPICard: React.FC<{ label: string; value: string; icon: React.ReactNode; danger?: boolean }> = ({ label, value, icon, danger }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">{label}</p>
      <h3 className={`text-2xl font-bold ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
      {icon}
    </div>
  </div>
);

const ZoneList: React.FC<{
  title: string;
  products: ProductZoneItem[];
  color: 'green' | 'amber' | 'red';
  onAction?: (name: string) => void;
  actionLabel: string;
}> = ({ title, products = [], color, onAction, actionLabel }) => {
  const palette = {
    green: { bg: 'bg-emerald-50/55', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
    amber: { bg: 'bg-amber-50/55', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
    red:   { bg: 'bg-rose-50/55', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800' },
  }[color];

  return (
    <div className={`border rounded-2xl overflow-hidden flex flex-col h-[340px] bg-white transition-all shadow-xs ${palette.border}`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${palette.bg} ${palette.border}`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${palette.text}`}>{title}</span>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${palette.badge}`}>{products.length} SKUs</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
            <ShoppingBag className="w-8 h-8 mb-2 stroke-1" />
            <p className="text-xs">No catalog items classified</p>
          </div>
        ) : (
          products.slice(0, 50).map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition duration-150">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs font-bold text-slate-800 truncate" title={p.name}>{p.name}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{fmt$(typeof p.revenue === 'string' ? parseFloat(p.revenue) : p.revenue)} · {fmtN(p.quantity)} units</p>
              </div>
              {onAction && (
                <button 
                  onClick={() => onAction(p.name)} 
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 transition"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ShopifyDashboard: React.FC<ShopifyDashboardProps> = ({
  onGenerateAd,
  onToggleSidebar,
  onDeductCredits,
  report: propReport,
  isLoaded,
  onReportUpdate
}) => {
  const [stagedFiles, setStagedFiles]   = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [progress, setProgress]         = useState(0);
  const [progressMsg, setProgressMsg]   = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [warnings, setWarnings]         = useState<string[]>([]);
  const [report, setReport]             = useState<ShopifyAnalysisResult | null>(propReport || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with propReport
  useEffect(() => {
    if (propReport) {
      setReport(propReport);
    }
  }, [propReport]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const all = Array.from(files);
    const csv = all.filter(f => f.name.match(/\.(csv|tsv|txt)$/i));
    const bad = all.filter(f => !f.name.match(/\.(csv|tsv|txt)$/i));
    if (bad.length) setError(`Skipped non-CSV file(s): ${bad.map(f => f.name).join(', ')}`);
    else setError(null);
    if (csv.length) {
      setStagedFiles(prev => {
        const existing = new Set(prev.map(f => f.name));
        return [...prev, ...csv.filter(f => !existing.has(f.name))];
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (i: number) =>
    setStagedFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleReset = () => {
    setReport(null);
    setStagedFiles([]);
    setError(null);
    setWarnings([]);
    setProgress(0);
    setProgressMsg('');
    if (onReportUpdate) {
      onReportUpdate(null);
    }
  };

  const runAnalysis = async () => {
    if (!stagedFiles.length) return;
    setIsAnalyzing(true);
    setProgress(20);
    setProgressMsg('Uploading & analyzing CSV dataset on server...');
    setError(null);
    setWarnings([]);

    try {
      setProgress(60);
      const res = await shopifyService.analyzeFiles(stagedFiles);
      setProgress(100);
      setReport(res);
      onReportUpdate?.(res);
      setStagedFiles([]);
    } catch (err: any) {
      console.error('Shopify Analysis failed:', err);
      setError(err?.message || 'Failed to analyze store metrics.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAIInsights = async () => {
    if (!report) return;

    if (onDeductCredits) {
      const success = onDeductCredits(1);
      if (!success) return; 
    }

    try {
      setIsGeneratingAI(true);
      setError(null);
      
      const realInsights = await shopifyService.generateAIInsights(report);
      
      const updatedReport: ShopifyAnalysisResult = {
        ...report,
        aiInsights: realInsights
      };

      setReport(updatedReport);
      onReportUpdate?.(updatedReport);
    } catch (err: any) {
      console.error('Failed to generate AI insights:', err);
      setError(err?.message || 'Failed to generate AI insights via Gemini. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ─── Automated Mathematical Insights ──────────────────────────────────────────

  const automatedInsights = useMemo(() => {
    if (!report) return [];
    const avgOrder = report.avgOrderValue || 0;
    const totalOrders = report.totalOrders || 0;
    const zones = report.productZones || { green: [], yellow: [], red: [] };
    const list = [];

    if (totalOrders > 0 && avgOrder > 0) {
      const commentary =
        avgOrder < 50  ? 'Consider bundling low-margin and high-performing styles to increase order sizing.' :
        avgOrder > 200 ? 'Incredible average order value! Set up VIP retargeting ads to incentivize loyalty.' :
                         'Steady order size. Set up tier-discount rules to increase cart values.';
      list.push(`AOV is ${fmt$(avgOrder)} over ${fmtN(totalOrders)} orders. ${commentary}`);
    }

    if (zones.green?.length) {
      const names = zones.green.slice(0, 2).map(p => p.name).join(', ');
      list.push(`Hero assets "${names}" represent catalog heavyweights. Drive high conversion by maximizing paid ad pushes.`);
    }

    if (zones.red?.length) {
      list.push(`${zones.red.length} items currently sit in the low-performing category. Bundle them with bestsellers or run flash sales.`);
    }

    return list;
  }, [report]);

  // ─── Charts preparation ───────────────────────────────────────────────────────

  const trendChartData = report?.chart_data?.dates?.length ? {
    labels: report.chart_data.dates,
    datasets: [{
      label: 'Revenue',
      data: report.chart_data.revenue,
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#8B5CF6',
      fill: true,
    }]
  } : null;

  const trendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: ctx => 'Revenue: ' + fmt$(ctx.parsed.y) }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10 } }, border: { display: false } },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { color: '#94A3B8', font: { size: 10 }, callback: v => '$' + Math.round(Number(v) / 1000) + 'k' },
        border: { display: false }
      }
    }
  };

  const barChartData = report?.topProducts?.length ? {
    labels: report.topProducts.slice(0, 8).map(p => p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name),
    datasets: [{
      label: 'Revenue',
      data: report.topProducts.slice(0, 8).map(p => typeof p.revenue === 'string' ? parseFloat(p.revenue) : p.revenue),
      backgroundColor: ['#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#0D9488','#D946EF','#A855F7'],
      borderRadius: 6,
    }]
  } : null;

  const barOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: ctx => 'Revenue: ' + fmt$(ctx.parsed.x) }
      }
    },
    scales: {
      x: {
        grid: { color: '#F1F5F9' },
        ticks: { color: '#94A3B8', font: { size: 10 }, callback: v => '$' + Math.round(Number(v) / 1000) + 'k' },
        border: { display: false }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#334155', font: { size: 11 } },
        border: { display: false }
      }
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!report) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-white">
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} className="p-1 text-slate-500 hover:text-slate-800 transition cursor-pointer md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Shopify Data Analyst</h1>
            <p className="text-xs text-slate-500 font-medium">Verify product sales velocity instantly via CSV</p>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
            {isAnalyzing ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-6" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">{progressMsg}</h3>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-64 mx-auto mb-3">
                  <div className="h-full bg-violet-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-400 font-semibold">{Math.round(progress)}% Processing</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-800 text-sm mb-6 font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div
                  onDragOver={e => { e.preventDefault(); setIsDragActive(true); }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition duration-150 bg-white ${
                    isDragActive ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                  />
                  <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1.5">Drop your Shopify CSV reports here</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto mb-5">
                    Integrate your raw export sales trends, bestsellers lists, orders logs, or inventory files directly.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['orders_export.csv', 'products.csv', 'analytics_stats.csv'].map((f) => (
                      <span key={f} className="text-[10px] select-none uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-400">{f}</span>
                    ))}
                  </div>
                </div>

                {stagedFiles.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Staged Documents ({stagedFiles.length})</p>
                    <div className="space-y-2 mb-6">
                      {stagedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileSpreadsheet className="w-5 h-5 text-violet-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={file.name}>{file.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer active:scale-90 transition rounded-lg hover:bg-slate-200/60"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={runAnalysis}
                      className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
                    >
                      <span>Analyze Store Metrics</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─── Report view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} className="p-1 text-slate-500 hover:text-slate-800 transition cursor-pointer md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">Active Analytics Report</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Parsed {fmtN(report.totalOrders || 0)} Orders · Last calculated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-xs font-bold px-4 py-2 hover:bg-slate-50/50 active:scale-95 text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition shadow-2xs"
        >
          Reset Dataset
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-xs font-semibold mb-6 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Parsing Warnings:</p>
              <ul className="list-disc list-inside mt-1 font-medium space-y-0.5 text-amber-700">
                {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Core KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KPICard 
            label="Total Gross Income" 
            value={fmt$(report.totalRevenue || 0)} 
            icon={<DollarSign className="w-5 h-5 text-violet-500" />} 
          />
          <KPICard 
            label="Total Processed Orders" 
            value={fmtN(report.totalOrders || 0)} 
            icon={<ShoppingBag className="w-5 h-5 text-violet-500" />} 
          />
          <KPICard 
            label="Average Order Value" 
            value={fmt$(report.avgOrderValue || 0)} 
            icon={<Users className="w-5 h-5 text-violet-500" />} 
          />
        </div>

        {/* ─── AI Strategic Insights Playbook (GEMINI-POWERED) ─── */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 rounded-3xl text-white shadow-md mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse mt-0.5" />
                <span className="text-xs font-bold uppercase tracking-widest text-violet-200">Google Gemini Strategy Assistant</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">E-Commerce Playbook & Campaign Suggestions</h2>
              <p className="text-violet-100 mt-2 text-sm leading-relaxed font-medium">
                Unlock automated hyper-targeted ad campaign architectures, bundling recommendations, and cross-sell ideas analyzed from your specific store metrics.
              </p>
            </div>

            {!report.aiInsights || report.aiInsights.length === 0 ? (
              <button
                onClick={handleGenerateAIInsights}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 hover:scale-102 disabled:opacity-50 text-slate-900 text-sm font-extrabold rounded-xl transition duration-150 shadow-md shrink-0 self-start md:self-center cursor-pointer active:scale-95"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Analyzing Catalog...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    <span>Generate AI Insights (1 Credit)</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {report.aiInsights && report.aiInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10 relative z-10">
              {report.aiInsights.map((insight, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/15 transition-all">
                  <div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-4 font-mono">
                      {idx + 1}
                    </div>
                    <p className="text-white text-sm font-semibold leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
              
              <div className="md:col-span-3 flex justify-end mt-2">
                <button
                  onClick={handleGenerateAIInsights}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-200 hover:text-white transition cursor-pointer"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mt-0.5" />
                  )}
                  Re-generate Ideas (1 Credit)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Local Mathematical automated insights */}
        {automatedInsights.length > 0 && (
          <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-6 mb-8 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-violet-600 font-extrabold text-xs uppercase tracking-wider">✦ Mathematical Insights</span>
            </div>
            <ul className="space-y-3">
              {automatedInsights.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-slate-600 text-xs leading-relaxed font-semibold">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Charts graphs list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend */}
          {trendChartData && (report.chart_data?.dates?.length || 0) > 1 && (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Gross Revenue Trend</h4>
              <div className="relative w-full h-[230px]">
                <Line options={trendOptions} data={trendChartData} />
              </div>
            </div>
          )}

          {/* Bar top products */}
          {barChartData && (report.topProducts?.length || 0) >= 2 && (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Core Products Revenue</h4>
              <div className="relative w-full h-[230px]">
                <Bar options={barOptions} data={barChartData} />
              </div>
            </div>
          )}
        </div>

        {/* Product Zones Grid */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Product Velocity Categories</h4>
              <p className="text-xs text-slate-400 font-medium">Grouped by total product-specific metrics relative to average</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ZoneList 
              title="Accelerate / Green" 
              products={report.productZones?.green || []} 
              color="green" 
              onAction={onGenerateAd} 
              actionLabel="Promote" 
            />
            <ZoneList 
              title="Monitor / Yellow"   
              products={report.productZones?.yellow || []} 
              color="amber" 
              onAction={onGenerateAd} 
              actionLabel="Analyze" 
            />
            <ZoneList 
              title="Optimize / Red"     
              products={report.productZones?.red || []} 
              color="red"   
              onAction={onGenerateAd} 
              actionLabel="Revamp" 
            />
          </div>
        </div>

        {/* Recommendations split campaign */}
        {((report.productZones?.green?.length || 0) > 0 || (report.productZones?.red?.length || 0) > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Accelerate */}
            {(report.productZones?.green?.length || 0) > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="bg-emerald-50/50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Top Scale Candidates</span>
                  {onGenerateAd && (
                    <button
                      onClick={() => onGenerateAd(report.productZones?.green?.[0]?.name || 'Top products')}
                      className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition active:scale-95"
                    >
                      Generate Ads
                    </button>
                  )}
                </div>
                <div className="p-5 space-y-3.5">
                  {(report.productZones?.green || []).slice(0, 3).map((product, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Scale Candidate {idx + 1}</p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                        {fmt$(typeof product.revenue === 'string' ? parseFloat(product.revenue) : product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimize */}
            {(report.productZones?.red?.length || 0) > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="bg-rose-50/50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-rose-800">BOGO & Bundle Suggestions</span>
                </div>
                <div className="p-5 space-y-3.5">
                  {(report.productZones?.red || []).slice(0, 3).map((product, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-[10px] text-[red] font-bold mt-1 uppercase tracking-wider">Low Velocity - Clear Inventory</p>
                      </div>
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-100/60 px-2.5 py-1 rounded-lg">
                        {fmt$(typeof product.revenue === 'string' ? parseFloat(product.revenue) : product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};

export default ShopifyDashboard;
