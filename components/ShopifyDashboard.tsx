
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { shopifyService } from '../services/shopifyService';
import { analysisService } from '../services/analysisService';
import { ShopifyAnalysisResult, ProductZoneItem } from '../types';

// Register ChartJS components
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
    onGenerateAd: (productName: string) => void;
    onToggleSidebar: () => void;
    report: ShopifyAnalysisResult | null;
    isLoaded: boolean;
    onReportUpdate: (report: ShopifyAnalysisResult | null) => void;
    onDeductCredits: (cost: number) => boolean;
}

const ShopifyDashboard: React.FC<ShopifyDashboardProps> = ({ 
    onGenerateAd, onToggleSidebar, report, isLoaded, onReportUpdate, onDeductCredits
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!isLoaded);
    const [insights, setInsights] = useState<string[]>(report?.aiInsights || []);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);

    // Sync insights from report prop if it changes
    useEffect(() => {
        if (report?.aiInsights && report.aiInsights.length > 0) {
            setInsights(report.aiInsights);
        }
    }, [report]);

    // Load saved report on mount
    useEffect(() => {
        if (isLoaded) {
            setIsFetching(false);
            return;
        }

        let mounted = true;
        setIsFetching(true);
        analysisService.getLatestReport()
            .then(savedReport => {
                if (mounted && savedReport) {
                    onReportUpdate(savedReport);
                }
            })
            .catch(err => {
                console.error("Failed to fetch latest report", err);
            })
            .finally(() => {
                if (mounted) setIsFetching(false);
            });
        return () => { mounted = false; };
    }, [isLoaded, onReportUpdate]);

    const handleGenerateInsights = () => {
        if (!report) return;
        
        // CREDIT CHECK
        if (!onDeductCredits(1)) return;

        setGeneratingInsights(true);
        shopifyService.generateAIInsights(report)
            .then(res => {
                setInsights(res);
                // Save the full report with insights to state and DB
                const updatedReport = { ...report, aiInsights: res };
                onReportUpdate(updatedReport);
                analysisService.saveReport(updatedReport).catch(e => console.warn("Background save failed", e));
            })
            .catch(err => {
                console.error("Failed to generate AI insights:", err);
                setInsights(["AI insights could not be generated for this report."]);
            })
            .finally(() => {
                setGeneratingInsights(false);
            });
    };

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setInsights([]);
        setError(null);

        // Combine both for client-side programmatic evaluation to bypass OS/browser MIME-type resolution issues
        const allFiles = [...acceptedFiles, ...fileRejections.map(r => r.file)];
        
        if (allFiles.length === 0) {
            setError("No files selected. Please upload a valid CSV file.");
            return;
        }

        const csvFiles = allFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
        const rejectedFiles = allFiles.filter(file => !file.name.toLowerCase().endsWith('.csv'));

        if (rejectedFiles.length > 0) {
            const fileNames = rejectedFiles.map(f => f.name).join(', ');
            setError(`Rejected non-CSV file(s): "${fileNames}". Please ensure you are uploading standard Shopify CSV exports (ending in .csv).`);
        }

        if (csvFiles.length === 0) {
            return;
        }

        setStagedFiles(prev => [...prev, ...csvFiles]);
    }, []);

    const handleAnalyze = async () => {
        if (stagedFiles.length === 0) {
            setError("No files to analyze.");
            return;
        }
        
        setIsLoading(true);
        onReportUpdate(null); 
        try {
            const formData = new FormData();
            stagedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/analyze-shopify', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            // Convert chart_data to expected salesTrend format for existing logic if we want to reuse chart, 
            // but we can also just pass the entire response. We will preserve existing behavior by faking some params.
            const enhancedResult: ShopifyAnalysisResult = {
                 ...result,
                 totalRevenue: result.totalRevenue !== undefined ? result.totalRevenue : (result.total_revenue || 0),
                 totalOrders: result.totalOrders !== undefined ? result.totalOrders : (result.total_orders || 0),
                 avgOrderValue: result.avgOrderValue !== undefined ? result.avgOrderValue : (result.avg_order_value || 0),
                 topProducts: result.topProducts || [],
                 salesTrend: result.salesTrend || result.chart_data?.dates?.map((d: string, i: number) => ({ date: d, revenue: result.chart_data.revenue[i] })) || [],
                 productZones: result.productZones || { green: [], yellow: [], red: [] },
                 aiInsights: result.aiInsights || []
            };

            onReportUpdate(enhancedResult);
            
            analysisService.saveReport(enhancedResult).catch(e => {
                console.warn('DB save warning', e);
            });

        } catch (error: any) {
            console.error("Analysis failed:", error);
            setError(`Analysis failed: ${error.message}`);
        } finally {
            setIsLoading(false);
            setStagedFiles([]);
        }
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop
    });
    
    const handleUploadNew = () => {
        onReportUpdate(null);
        setInsights([]);
        setError(null);
        setStagedFiles([]);
    };

    // Chart Options
    const commonOptions: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1E293B',
                padding: 12,
                cornerRadius: 8,
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 12 },
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748B', font: { family: 'Inter', size: 10 } },
                border: { display: false }
            },
            y: {
                grid: { color: '#F1F5F9', drawBorder: false },
                ticks: {
                    color: '#64748B',
                    font: { family: 'Inter', size: 10 },
                    callback: (value) => '$' + value
                },
                border: { display: false }
            }
        }
    };

    const horizontalBarOptions: ChartOptions<any> = {
        ...commonOptions,
        indexAxis: 'y',
        plugins: {
            ...commonOptions.plugins,
            tooltip: {
                ...commonOptions.plugins?.tooltip,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.x !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.x);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ...commonOptions.scales?.y,
                grid: { color: '#F1F5F9', drawBorder: false },
                ticks: { display: false }
            },
            y: {
                ...commonOptions.scales?.x,
                grid: { display: false },
                ticks: { 
                    color: '#334155', 
                    font: { family: 'Inter', size: 11 },
                    autoSkip: false,
                    callback: function(val) {
                        const label = this.getLabelForValue(val as number);
                        return label.length > 15 ? label.substring(0, 15) + '...' : label;
                    }
                }
            }
        }
    };

    if (isFetching) {
        return (
             <div className="w-full h-full bg-main flex flex-col items-center justify-center">
                <Spinner />
                <p className="mt-4 text-slate-600">Loading your last report...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="w-full h-full bg-main flex flex-col">
                <header className="flex-shrink-0 flex items-center p-4 md:p-6 border-b border-border-light bg-white">
                    <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                        <Icon name="menu" className="w-6 h-6" />
                    </button>
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3 text-purple-700">
                            <Icon name="sparkles" className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Data Intelligence</h1>
                    </div>
                </header>
                <main className="flex-grow flex items-center justify-center p-6">
                    <div className="text-center w-full max-w-lg">
                        {isLoading ? (
                            <div className="flex flex-col items-center animate-fade-in-scale-up">
                                <Spinner />
                                <p className="mt-4 text-slate-600">Processing Data...</p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 text-left">
                                        <div className="flex">
                                            <Icon name="close" className="w-5 h-5 mr-3 mt-0.5 text-red-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold">Notice</p>
                                                <p className="text-sm mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div 
                                    {...getRootProps()} 
                                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center cursor-pointer transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                                        <Icon name="upload" className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Upload Shopify CSV</h3>
                                    <p className="text-sm text-slate-500 mb-6 text-center">
                                        Drag & drop <strong>Products</strong>, <strong>Orders</strong>, and <strong>Analytics</strong> CSVs here.
                                    </p>
                                    <Button variant="secondary">Select File</Button>
                                </div>
                                {stagedFiles.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        <h4 className="font-bold text-slate-800 mb-3 text-left">Staged files ({stagedFiles.length})</h4>
                                        <ul className="space-y-2 mb-6 text-left">
                                            {stagedFiles.map((f, i) => (
                                                <li key={i} className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg break-all">
                                                    <Icon name="document" className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                                                    {f.name}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button onClick={handleAnalyze} className="w-full h-12 text-base shadow-lg animate-fade-in">
                                            <Icon name="chart-bar" className="w-5 h-5 mr-2" />
                                            Analyze with Python Engine
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-main flex flex-col overflow-y-auto">
            <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-border-light bg-white sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                        <Icon name="menu" className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Analytics Report</h1>
                        <p className="text-xs text-slate-500">Instant analysis for {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <Button onClick={handleUploadNew} variant="ghost" className="text-sm">Upload New</Button>
            </header>

            <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.totalRevenue)}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Orders</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{report.totalOrders}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase">Avg Order Value</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.avgOrderValue)}
                        </p>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-xl relative overflow-hidden">
                    <div className="flex items-center mb-3 relative z-10">
                        <Icon name="sparkles" className="w-5 h-5 text-emerald-600 mr-2" />
                        <h3 className="font-bold text-emerald-800">AI Strategic Insights</h3>
                    </div>
                    {generatingInsights ? (
                        <div className="flex items-center text-emerald-600 text-sm animate-pulse relative z-10">
                            <Spinner /> <span className="ml-2 font-medium">Gemini is analyzing your data trends...</span>
                        </div>
                    ) : insights.length > 0 ? (
                        <ul className="space-y-2 relative z-10">
                            {insights.map((insight, idx) => (
                                <li key={idx} className="flex items-start text-sm text-emerald-700">
                                    <span className="mr-2 mt-1">•</span> 
                                    <span>{insight}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="relative z-10">
                            <p className="text-sm text-emerald-600 mb-3">Unlock data-driven strategies to boost sales.</p>
                            <Button onClick={handleGenerateInsights} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md !text-xs !py-2">
                                Generate Strategic Insights (1 Credit)
                            </Button>
                        </div>
                    )}
                    <div className="absolute right-0 bottom-0 opacity-10">
                        <Icon name="trend-up" className="w-32 h-32 text-emerald-300" />
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-700 mb-4">Revenue Trend</h4>
                        <div style={{ width: '100%', height: 300 }}>
                            {report.salesTrend.length > 0 ? (
                                <Line options={commonOptions} data={{
                                    labels: report.salesTrend.map(d => d.date),
                                    datasets: [{
                                        label: 'Revenue',
                                        data: report.salesTrend.map(d => d.revenue),
                                        borderColor: '#10B981',
                                        backgroundColor: '#10B981',
                                        tension: 0.4,
                                        pointRadius: 2,
                                    }]
                                }} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-lg">
                                    No sales trend data available.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-700 mb-4">Top 5 Products</h4>
                        <div style={{ width: '100%', height: 300 }}>
                            {report.topProducts.length > 0 ? (
                                <Bar options={horizontalBarOptions} data={{
                                    labels: report.topProducts.map(d => d.name),
                                    datasets: [{
                                        label: 'Revenue',
                                        data: report.topProducts.map(d => d.revenue),
                                        backgroundColor: '#6A5AE0',
                                        borderRadius: 4,
                                        barThickness: 24,
                                    }]
                                }} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-lg">
                                    No product data available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Performance Zones */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-700">Product Performance Zones</h4>
                        <span className="text-xs text-slate-500">Categorized dynamically by metrics analysis</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ZoneList 
                            title="Accelerate Zone (Green)" 
                            products={report.productZones?.green || []} 
                            colorClass="text-green-800 bg-green-50 border-green-100" 
                            onAction={onGenerateAd} 
                            actionLabel="Promote" 
                        />
                        <ZoneList 
                            title="Monitor Zone (Yellow)" 
                            products={report.productZones?.yellow || []} 
                            colorClass="text-amber-800 bg-amber-50 border-amber-100" 
                            onAction={onGenerateAd} 
                            actionLabel="Analyze" 
                        />
                        <ZoneList 
                            title="Optimize Zone (Red)" 
                            products={report.productZones?.red || []} 
                            colorClass="text-red-800 bg-red-50 border-red-100" 
                            onAction={onGenerateAd} 
                            actionLabel="Revamp" 
                        />
                    </div>
                </div>

                {/* Top Push & Stop Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="p-4 rounded-t-xl flex items-center justify-between bg-green-50 border-b border-green-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-800">Top 5 Push Products</span>
                            <Button onClick={() => onGenerateAd('Top Push Products')} className="text-xs px-3 py-1.5 h-auto">Generate Ad Creatives</Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {report.top_push_products && report.top_push_products.length > 0 ? report.top_push_products.map((p, i) => (
                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-slate-800">{p.name}</p>
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Score: {p.score}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{p.reasoning}</p>
                                </div>
                            )) : (
                                <p className="text-center text-sm text-slate-400 mt-4">No push products identified.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="p-4 rounded-t-xl flex items-center justify-between bg-red-50 border-b border-red-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-800">Top 3 Stop Products</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                             {report.top_stop_products && report.top_stop_products.length > 0 ? report.top_stop_products.map((p, i) => (
                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-slate-800">{p.name}</p>
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Burn: {p.score}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{p.reasoning}</p>
                                </div>
                            )) : (
                                <p className="text-center text-sm text-slate-400 mt-4">No stop products identified.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ZoneList: React.FC<{ 
    title: string; 
    products: ProductZoneItem[]; 
    colorClass: string; 
    onAction: (name: string) => void; 
    actionLabel: string;
}> = ({ title, products, colorClass, onAction, actionLabel }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-96">
        <div className={`p-4 rounded-t-xl flex items-center justify-between border-b ${colorClass}`}>
            <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
            <span className="text-xs font-bold">{products.length} SKUs</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
            {products.slice(0, 50).map((p, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group hover:bg-slate-100 transition-colors">
                    <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(p.revenue))} Sales
                        </p>
                    </div>
                    <button 
                        onClick={() => onAction(p.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-[10px] font-bold px-2 py-1 rounded hover:bg-slate-800 hover:text-white hover:border-slate-800 shadow-sm transition-all"
                    >
                        {actionLabel}
                    </button>
                </div>
            ))}
            {products.length === 0 && <p className="text-center text-xs text-slate-400 mt-10">No products in this zone.</p>}
        </div>
    </div>
);

export default ShopifyDashboard;
