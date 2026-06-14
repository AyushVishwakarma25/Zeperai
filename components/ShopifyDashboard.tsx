import React, { useState, useCallback, useEffect, useRef } from 'react';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductZoneItem {
  name: string;
  revenue: number;
  units: number;
}

interface TopProduct {
  name: string;
  revenue: number;
  units: number;
}

interface Insight {
  type: 'green' | 'amber' | 'red' | 'info';
  text: string;
}

interface AnalysisResult {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  customerCount: number;
  refunds: number;
  topProducts: TopProduct[];
  trendDates: string[];
  trendRevs: number[];
  zones: { green: ProductZoneItem[]; amber: ProductZoneItem[]; red: ProductZoneItem[] };
  insights: Insight[];
  warnings: string[];
}

interface ShopifyDashboardProps {
  onGenerateAd?: (productName: string) => void;
  onToggleSidebar?: () => void;
  onDeductCredits?: (cost: number) => boolean;
  report?: any;
  isLoaded?: boolean;
  onReportUpdate?: (report: any) => void;
}

// ─── CSV Parsing Utilities ────────────────────────────────────────────────────

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

/**
 * Fuzzy column finder — matches against 10–20 aliases per field,
 * handling differences across Shopify plan tiers and export versions.
 */
function findCol(headers: string[], candidates: string[]): string | null {
  const hl = headers.map(h => h.toLowerCase().replace(/[\s_\-]/g, ''));
  for (const c of candidates) {
    const cl = c.toLowerCase().replace(/[\s_\-]/g, '');
    const idx = hl.findIndex(h => h === cl || h.includes(cl) || cl.includes(h));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

/** Strips any currency symbol, commas, spaces, parens before parsing. */
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

// ─── File Type Detection ──────────────────────────────────────────────────────

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

// ─── Processors ──────────────────────────────────────────────────────────────

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
    const dateKey = dateRaw ? dateRaw.substring(0, 7) : 'Unknown';
    const product = colProduct ? r[colProduct]?.trim() : '';
    const qty     = colQty ? cleanNum(r[colQty]) : 1;
    const lineRev = colLineRev ? cleanMoney(r[colLineRev]) * qty : 0;

    if (colEmail && r[colEmail]) customerEmails.add(r[colEmail].toLowerCase());

    // Handle line-item expanded exports (one row per line item, order total repeated)
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

    // Accumulate product revenue from line items
    if (product && lineRev > 0) {
      productRevenue[product] = (productRevenue[product] || 0) + lineRev;
      productUnits[product]   = (productUnits[product] || 0) + qty;
    }

    // Fallback: single-row-per-order exports with no line item columns
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
    const d   = colDate ? r[colDate]?.substring(0, 7) : '';
    if (!d) return;
    const rev = cleanMoney(colRev ? r[colRev] : '0');
    daily[d]  = (daily[d] || 0) + rev;
  });
  return daily;
}

// ─── Product Zones ────────────────────────────────────────────────────────────

function buildProductZones(
  productRevenue: Record<string, number>,
  productUnits: Record<string, number>
): { green: ProductZoneItem[]; amber: ProductZoneItem[]; red: ProductZoneItem[] } {
  const items: ProductZoneItem[] = Object.entries(productRevenue).map(([name, revenue]) => ({
    name,
    revenue,
    units: productUnits[name] || 0
  }));

  if (!items.length) return { green: [], amber: [], red: [] };

  const sorted = items.sort((a, b) => b.revenue - a.revenue);
  const total  = sorted.reduce((s, p) => s + p.revenue, 0);
  const avg    = total / sorted.length;

  const green: ProductZoneItem[] = [];
  const amber: ProductZoneItem[] = [];
  const red:   ProductZoneItem[] = [];

  sorted.forEach(p => {
    if (p.revenue >= avg * 1.5)       green.push(p);
    else if (p.revenue >= avg * 0.5)  amber.push(p);
    else                               red.push(p);
  });

  return { green, amber, red };
}

// ─── Insights Engine ──────────────────────────────────────────────────────────

function generateInsights(data: {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  zones: { green: ProductZoneItem[]; amber: ProductZoneItem[]; red: ProductZoneItem[] };
  trendDates: string[];
  trendRevs: number[];
  topProducts: TopProduct[];
}): Insight[] {
  const { totalRevenue, totalOrders, avgOrder, zones, trendRevs, topProducts } = data;
  const ins: Insight[] = [];

  if (totalOrders > 0 && avgOrder > 0) {
    const commentary =
      avgOrder < 50  ? 'Consider bundling or upselling to increase AOV.' :
      avgOrder > 200 ? 'Strong AOV — focus on retention to compound revenue.' :
                       'Healthy AOV with room to grow through product bundles.';
    ins.push({ type: 'info', text: `Average order value is ${fmt$(avgOrder)} across ${fmtN(totalOrders)} orders. ${commentary}` });
  }

  if (zones.green.length) {
    const extra = zones.green.length > 1 ? ` + ${zones.green.length - 1} more` : '';
    ins.push({ type: 'green', text: `${zones.green.length} high-performing product${zones.green.length > 1 ? 's' : ''} (${zones.green[0].name}${extra}) drive${zones.green.length === 1 ? 's' : ''} disproportionate revenue. Prioritize these in paid ads.` });
  }

  if (zones.red.length) {
    ins.push({ type: 'red', text: `${zones.red.length} underperforming SKU${zones.red.length > 1 ? 's' : ''} are below 50% of average revenue. Review pricing, visibility, or consider discontinuation.` });
  }

  if (trendRevs.length >= 2) {
    const last = trendRevs[trendRevs.length - 1];
    const prev = trendRevs[trendRevs.length - 2];
    const chg  = prev > 0 ? ((last - prev) / prev * 100) : 0;
    ins.push({
      type: chg >= 0 ? 'green' : 'red',
      text: `Most recent period revenue is ${fmt$(last)}, ${chg >= 0 ? 'up' : 'down'} ${Math.abs(chg).toFixed(1)}% from the prior period.`
    });
  }

  if (topProducts.length && totalRevenue > 0) {
    const share = topProducts[0].revenue / totalRevenue;
    ins.push({
      type: 'amber',
      text: `Top product "${topProducts[0].name}" accounts for ${(share * 100).toFixed(1)}% of total revenue. ${share > 0.5 ? 'High concentration risk — diversify catalog.' : 'Healthy diversification across products.'}`
    });
  }

  return ins;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const KPICard: React.FC<{ label: string; value: string; sub?: string; danger?: boolean }> = ({ label, value, sub, danger }) => (
  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: 4 }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 700, color: danger ? '#DC2626' : '#0F172A' }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{sub}</p>}
  </div>
);

const InsightCard: React.FC<{ insights: Insight[] }> = ({ insights }) => {
  const dotColor = { green: '#16A34A', amber: '#D97706', red: '#DC2626', info: '#7C3AED' };
  return (
    <div style={{ background: '#F8F7FF', border: '1px solid #E8E4FF', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#4C1D95' }}>✦ Automated Insights</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((ins, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ marginTop: 6, width: 7, height: 7, borderRadius: '50%', background: dotColor[ins.type], flexShrink: 0 }} />
            <span style={{ fontSize: 13, lineHeight: 1.55, color: '#1E293B' }}>{ins.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ZoneList: React.FC<{
  title: string;
  products: ProductZoneItem[];
  color: 'green' | 'amber' | 'red';
  onAction?: (name: string) => void;
  actionLabel: string;
}> = ({ title, products, color, onAction, actionLabel }) => {
  const palette = {
    green: { bg: '#F0FDF4', border: '#BBF7D0', hdr: '#15803D', badge: '#DCFCE7', badgeText: '#166534' },
    amber: { bg: '#FFFBEB', border: '#FDE68A', hdr: '#B45309', badge: '#FEF3C7', badgeText: '#92400E' },
    red:   { bg: '#FFF1F2', border: '#FECDD3', hdr: '#B91C1C', badge: '#FFE4E6', badgeText: '#9F1239' },
  }[color];

  return (
    <div style={{ border: `1px solid ${palette.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 340 }}>
      <div style={{ background: palette.bg, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${palette.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.hdr }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 700, background: palette.badge, color: palette.badgeText, padding: '2px 8px', borderRadius: 99 }}>{products.length} SKUs</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {products.length === 0
          ? <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 40 }}>No products in this zone.</p>
          : products.slice(0, 50).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 8, marginBottom: 3, cursor: onAction ? 'pointer' : 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</p>
                <p style={{ fontSize: 10, color: '#64748B' }}>{fmt$(p.revenue)} · {fmtN(p.units)} units</p>
              </div>
              {onAction && (
                <button onClick={() => onAction(p.name)} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#334155', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {actionLabel}
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ShopifyDashboard: React.FC<ShopifyDashboardProps> = ({
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
  const [progress, setProgress]         = useState(0);
  const [progressMsg, setProgressMsg]   = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [warnings, setWarnings]         = useState<string[]>([]);
  const [report, setReport]             = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

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

  // ── Analysis ───────────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!stagedFiles.length) return;
    setIsAnalyzing(true);
    setProgress(5);
    setProgressMsg('Reading files…');
    setWarnings([]);

    const accOrders: OrdersResult = {
      totalRevenue: 0, totalOrders: 0,
      dailyRevenue: {}, productRevenue: {}, productUnits: {},
      customerCount: 0, refunds: 0
    };
    let accTimeSeries: Record<string, number> = {};
    const warns: string[] = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      setProgressMsg(`Parsing ${file.name}…`);
      setProgress(10 + (i / stagedFiles.length) * 55);
      await new Promise(r => setTimeout(r, 0));

      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      if (!rows.length) {
        warns.push(`${file.name}: no data rows found`);
        continue;
      }

      const type = detectFileType(headers);

      if (type === 'orders' || type === 'unknown') {
        const res = processOrders(rows, headers);
        accOrders.totalRevenue  += res.totalRevenue;
        accOrders.totalOrders   += res.totalOrders;
        accOrders.customerCount += res.customerCount;
        accOrders.refunds       += res.refunds;
        Object.entries(res.dailyRevenue).forEach(([d, v]) => {
          accOrders.dailyRevenue[d] = (accOrders.dailyRevenue[d] || 0) + v;
        });
        Object.entries(res.productRevenue).forEach(([p, v]) => {
          accOrders.productRevenue[p] = (accOrders.productRevenue[p] || 0) + v;
        });
        Object.entries(res.productUnits).forEach(([p, v]) => {
          accOrders.productUnits[p] = (accOrders.productUnits[p] || 0) + v;
        });
        if (type === 'unknown' && res.totalRevenue === 0) {
          warns.push(`${file.name}: format not fully recognized — partial data may be extracted`);
        }
      } else if (type === 'timeseries' || type === 'analytics') {
        const res = processTimeSeries(rows, headers);
        Object.entries(res).forEach(([d, v]) => {
          accTimeSeries[d] = (accTimeSeries[d] || 0) + v;
        });
      } else if (type === 'customers') {
        const emailCol = findCol(headers, ['Email', 'email', 'Customer Email']);
        if (emailCol) {
          accOrders.customerCount = new Set(rows.map(r => r[emailCol]).filter(Boolean)).size;
        }
      }
    }

    setProgress(70);
    setProgressMsg('Building product zones…');
    await new Promise(r => setTimeout(r, 0));

    // Prefer time-series file revenue over order-derived daily revenue if richer
    const revSource = Object.keys(accTimeSeries).length > Object.keys(accOrders.dailyRevenue).length
      ? accTimeSeries
      : accOrders.dailyRevenue;

    const trendDates = Object.keys(revSource).filter(d => d !== 'Unknown').sort();
    const trendRevs  = trendDates.map(d => revSource[d]);

    const totalRevenue = accOrders.totalRevenue || trendRevs.reduce((s, v) => s + v, 0);
    const totalOrders  = accOrders.totalOrders;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const zones = buildProductZones(accOrders.productRevenue, accOrders.productUnits);

    const topProducts: TopProduct[] = Object.entries(accOrders.productRevenue)
      .map(([name, revenue]) => ({ name, revenue, units: accOrders.productUnits[name] || 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setProgress(90);
    setProgressMsg('Generating insights…');
    await new Promise(r => setTimeout(r, 0));

    const insights = generateInsights({ totalRevenue, totalOrders, avgOrder: avgOrderValue, zones, trendDates, trendRevs, topProducts });

    setProgress(100);
    await new Promise(r => setTimeout(r, 80));

    setReport({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      customerCount: accOrders.customerCount,
      refunds: accOrders.refunds,
      topProducts,
      trendDates,
      trendRevs,
      zones,
      insights,
      warnings: warns
    });
    setWarnings(warns);
    setStagedFiles([]);
    setIsAnalyzing(false);
  };

  // ── Chart configs ──────────────────────────────────────────────────────────

  const trendChartData = report ? {
    labels: report.trendDates,
    datasets: [{
      label: 'Revenue',
      data: report.trendRevs,
      borderColor: '#7C3AED',
      backgroundColor: 'rgba(124,58,237,0.08)',
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#7C3AED',
      fill: true,
    }]
  } : null;

  const trendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 10,
        cornerRadius: 8,
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
    labels: report.topProducts.slice(0, 8).map(p => p.name.length > 22 ? p.name.substring(0, 22) + '…' : p.name),
    datasets: [{
      label: 'Revenue',
      data: report.topProducts.slice(0, 8).map(p => p.revenue),
      backgroundColor: ['#7C3AED','#16A34A','#D97706','#DC2626','#0369A1','#0F766E','#C026D3','#9333EA'],
      borderRadius: 4,
    }]
  } : null;

  const barOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 10,
        cornerRadius: 8,
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

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setReport(null);
    setStagedFiles([]);
    setError(null);
    setWarnings([]);
    setProgress(0);
    setProgressMsg('');
  };

  // ── Upload screen ──────────────────────────────────────────────────────────

  if (!report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#fff' }}>
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748B' }}>
              ☰
            </button>
          )}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            📊
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Shopify Analytics</h1>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Upload any Shopify CSV export to begin</p>
          </div>
        </header>

        {/* Body */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 480 }}>

            {isAnalyzing ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>{progressMsg}</p>
                <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: '#7C3AED', borderRadius: 3, transition: 'width .3s' }} />
                </div>
                <p style={{ fontSize: 12, color: '#64748B' }}>{Math.round(progress)}% complete</p>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991B1B', display: 'flex', gap: 8 }}>
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragActive(true); }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragActive ? '#7C3AED' : '#CBD5E1'}`,
                    borderRadius: 16,
                    padding: '36px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragActive ? '#F5F3FF' : '#fff',
                    transition: 'all .15s',
                    marginBottom: 20
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.tsv,.txt"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                  />
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>
                    📁
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Drop Shopify CSV exports here</h3>
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 1.5 }}>
                    Supports <strong>Orders</strong>, <strong>Products</strong>, <strong>Analytics</strong>, <strong>Customers</strong>, and <strong>Inventory</strong> exports — any Shopify CSV format
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {['orders_export.csv', 'products_export.csv', 'analytics.csv', 'customers.csv'].map(f => (
                      <span key={f} style={{ fontSize: 11, padding: '3px 9px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 99, color: '#64748B' }}>{f}</span>
                    ))}
                  </div>
                </div>

                {/* Staged files */}
                {stagedFiles.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Staged files ({stagedFiles.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {stagedFiles.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                          <span style={{ fontSize: 16 }}>📄</span>
                          <span style={{ flex: 1, fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>{(f.size / 1024).toFixed(0)} KB</span>
                          <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 14, lineHeight: 1 }} aria-label={`Remove ${f.name}`}>✕</button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={runAnalysis}
                      style={{ width: '100%', padding: '12px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      📈 Analyze with Python Engine
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

  // ── Report screen ──────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC', overflowY: 'auto' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748B' }}>☰</button>
          )}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Analytics Report</h1>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{fmtN(report.totalOrders)} orders · {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          style={{ fontSize: 13, padding: '6px 14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', color: '#334155', fontWeight: 500 }}
        >
          Upload New
        </button>
      </header>

      <main style={{ padding: '20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400E', display: 'flex', gap: 8 }}>
            <span>⚠</span>
            <span>{warnings.join(' · ')}</span>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <KPICard label="Total Revenue" value={fmt$(report.totalRevenue)} />
          <KPICard label="Total Orders" value={fmtN(report.totalOrders)} />
          <KPICard label="Avg Order Value" value={fmt$(report.avgOrderValue)} />
          {report.customerCount > 0 && <KPICard label="Customers" value={fmtN(report.customerCount)} />}
          {report.refunds > 0 && <KPICard label="Refunds Detected" value={fmtN(report.refunds)} danger />}
        </div>

        {/* Insights */}
        {report.insights.length > 0 && <InsightCard insights={report.insights} />}

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>

          {/* Trend chart */}
          {trendChartData && report.trendDates.length > 1 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 14 }}>Revenue Trend</h4>
              <div style={{ position: 'relative', width: '100%', height: 220 }}>
                <Line options={trendOptions} data={trendChartData} />
              </div>
            </div>
          )}

          {/* Bar chart */}
          {barChartData && report.topProducts.length >= 2 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 14 }}>Top Products by Revenue</h4>
              <div style={{ position: 'relative', width: '100%', height: Math.max(200, report.topProducts.slice(0, 8).length * 38) }}>
                <Bar options={barOptions} data={barChartData} />
              </div>
            </div>
          )}
        </div>

        {/* Product Zones */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>Product Performance Zones</h4>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>Classified by revenue relative to catalog average</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <ZoneList title="Accelerate (Green)" products={report.zones.green} color="green" onAction={onGenerateAd} actionLabel="Promote" />
            <ZoneList title="Monitor (Yellow)"   products={report.zones.amber} color="amber" onAction={onGenerateAd} actionLabel="Analyze" />
            <ZoneList title="Optimize (Red)"     products={report.zones.red}   color="red"   onAction={onGenerateAd} actionLabel="Revamp" />
          </div>
        </div>

        {/* Push / Stop */}
        {(report.zones.green.length > 0 || report.zones.red.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Push products */}
            {report.zones.green.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#15803D' }}>Top Push Products</span>
                  {onGenerateAd && (
                    <button
                      onClick={() => onGenerateAd('Top Push Products')}
                      style={{ fontSize: 11, padding: '4px 10px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Generate Ads
                    </button>
                  )}
                </div>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.zones.green.slice(0, 5).map((p, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '2px 7px', borderRadius: 99, marginLeft: 8, whiteSpace: 'nowrap' }}>{fmt$(p.revenue)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{fmtN(p.units)} units sold · Above-average performer</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stop products */}
            {report.zones.red.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3', padding: '10px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B91C1C' }}>Review / Stop Products</span>
                </div>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.zones.red.slice(0, 3).map((p, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C', background: '#FFE4E6', padding: '2px 7px', borderRadius: 99, marginLeft: 8, whiteSpace: 'nowrap' }}>{fmt$(p.revenue)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{fmtN(p.units)} units sold · Below 50% of catalog average</p>
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
