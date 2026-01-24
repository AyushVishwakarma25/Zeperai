
import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
}

export const ShopifyDashboard: React.FC<ShopifyDashboardProps> = ({ 
    onGenerateAd, onToggleSidebar, report, isLoaded, onReportUpdate 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!isLoaded);
    const [insights, setInsights] = useState<string[]>(report?.aiInsights || []);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync insights from report prop if it changes
    useEffect(() => {
        if (report?.aiInsights) {
            setInsights(report.aiInsights);
        }
    }, [report]);

    useEffect(() => {
        if (isLoaded) {
            setIsFetching(false);
            return;
        }

        let mounted = true;
        setIsFetching(true);
        analysisService.getLatestReport()
            .then(savedReport => {
                if (mounted) {
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

    useEffect(() => {
        let mounted = true;
        // Check if report exists but insights are missing, then generate them
        if (report && insights.length === 0 && !generatingInsights) {
            setGeneratingInsights(true);
            shopifyService.generateAIInsights(report)
                .then(res => {
                    if (mounted) {
                        setInsights(res);
                        // Optimistically update the parent state with the new insights to cache them
                        const updatedReport = { ...report, aiInsights: res };
                        onReportUpdate(updatedReport);
                        // Also persist this update to DB if possible (analysisService.saveReport) - skipped for now to avoid double API call overhead
                    }
                })
                .catch(err => {
                    console.error("Failed to auto-generate AI insights:", err);
                    if (mounted) setInsights(["AI insights could not be generated for this report."]);
                })
                .finally(() => {
                    if (mounted) setGeneratingInsights(false);
                });
        }
        return () => { mounted = false; };
    }, [report, insights.length, generatingInsights, onReportUpdate]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsLoading(true);
        onReportUpdate(null); // Clear previous report in parent
        setInsights([]);
        setError(null);
        try {
            const result = await shopifyService.parseAndAnalyze(file);
            await analysisService.saveReport(result);
            onReportUpdate(result); // Update parent with new report
        } catch (error: any) {
            console.error("Analysis failed:", error);
            if (error.message && error.message.includes('analysis_reports')) {
                setError("Database Error: The 'analysis_reports' table is missing. Please copy the latest setup SQL from the login page and run it in your Supabase dashboard to enable saving reports.");
            } else {
                setError(`Analysis failed: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [onReportUpdate]);
    
    // Robust Data sanitization for charts
    const sanitizedSalesTrend = useMemo(() => {
        if (!report?.salesTrend || !Array.isArray(report.salesTrend)) return [];
        
        try {
            const validData = report.salesTrend.map((item: any) => {
                const val = item.revenue ?? item.sales ?? item.amount ?? item.total ?? 0;
                const dateVal = item.date ?? item.day ?? item.time ?? '';
                
                let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
                return {
                    date: dateVal,
                    revenue: isNaN(num) ? 0 : num
                };
            }).filter(item => item.date);

            return validData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (e) {
            console.error("Chart data sanitization error:", e);
            return [];
        }
    }, [report]);

    const sanitizedTopProducts = useMemo(() => {
        if (!report?.topProducts || !Array.isArray(report.topProducts)) return [];
        
        try {
            return report.topProducts.map((item: any) => {
                const val = item.revenue ?? item.sales ?? item.amount ?? 0;
                const nameVal = item.name ?? item.title ?? item.product ?? 'Unknown Product';
                let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
                
                return {
                    name: nameVal,
                    revenue: isNaN(num) ? 0 : num
                };
            })
            .filter(item => item.name && item.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        } catch (e) {
            console.error("Product data sanitization error:", e);
            return [];
        }
    }, [report]);


    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1 
    });
    
    const handleUploadNew = () => {
        onReportUpdate(null);
        setInsights([]);
        setError(null);
    };

    // Chart Configuration
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

    const salesData = {
        labels: sanitizedSalesTrend.map(d => d.date),
        datasets: [
            {
                label: 'Revenue',
                data: sanitizedSalesTrend.map(d => d.revenue),
                borderColor: '#10B981',
                backgroundColor: '#10B981',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
            }
        ]
    };

    const horizontalBarOptions: ChartOptions<any> = {
        ...commonOptions,
        indexAxis: 'y', // Horizontal Bar
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
                ...commonOptions.scales?.y, // Swap X and Y logic for horizontal
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
                    callback: function(val, index) {
                        // ChartJS passes index, lookup label
                        const label = this.getLabelForValue(val as number);
                        return label.length > 15 ? label.substring(0, 15) + '...' : label;
                    }
                }
            }
        }
    };

    const topProductsData = {
        labels: sanitizedTopProducts.map(d => d.name),
        datasets: [
            {
                label: 'Revenue',
                data: sanitizedTopProducts.map(d => d.revenue),
                backgroundColor: '#6A5AE0',
                borderRadius: 4,
                barThickness: 24,
            }
        ]
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
                        <div className="p-2 bg-green-100 rounded-lg mr-3 text-green-700">
                            <Icon name="chart-bar" className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Commerce Data Analyzer</h1>
                    </div>
                </header>
                <main className="flex-grow flex items-center justify-center p-6">
                    <div className="text-center w-full max-w-lg">
                        {isLoading ? (
                            <div className="flex flex-col items-center">
                                <Spinner />
                                <p className="mt-4 text-slate-600">Analyzing your CSV with AI...</p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 text-left">
                                        <div className="flex">
                                            <Icon name="close" className="w-5 h-5 mr-3 mt-0.5 text-red-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold">Analysis Failed</p>
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
                                    <p className="text-sm text-slate-500 mb-6">
                                        Drag & drop any <strong>Sales</strong> or <strong>Product</strong> export file here.
                                        <br/>The AI will automatically map the columns.
                                    </p>
                                    <Button variant="secondary">Select File</Button>
                                </div>
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
                        <p className="text-xs text-slate-500">Based on your last analysis</p>
                    </div>
                </div>
                <Button onClick={handleUploadNew} variant="ghost" className="text-sm">Upload New</Button>
            </header>

            <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
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
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-xl">
                    <div className="flex items-center mb-3">
                        <Icon name="sparkles" className="w-5 h-5 text-emerald-600 mr-2" />
                        <h3 className="font-bold text-emerald-800">AI Strategic Insights</h3>
                    </div>
                    {generatingInsights ? (
                        <div className="flex items-center text-emerald-600 text-sm">
                            <Spinner /> <span className="ml-2">Analyzing trends...</span>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {insights.map((insight, idx) => (
                                <li key={idx} className="flex items-start text-sm text-emerald-700">
                                    <span className="mr-2">•</span> {insight}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-700 mb-4">Revenue Trend</h4>
                        <div style={{ width: '100%', height: 300 }}>
                            {sanitizedSalesTrend.length > 0 ? (
                                <Line options={commonOptions} data={salesData} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-lg">
                                    <Icon name="chart-bar" className="w-8 h-8 mb-2 text-slate-300" />
                                    No sales trend data available.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h4 className="font-bold text-slate-700 mb-4">Top 5 Products</h4>
                        <div style={{ width: '100%', height: 300 }}>
                            {sanitizedTopProducts.length > 0 ? (
                                <Bar options={horizontalBarOptions} data={topProductsData} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-lg">
                                    <Icon name="shopping-bag" className="w-8 h-8 mb-2 text-slate-300" />
                                    No product data available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Zone Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Green Zone */}
                    <ZoneList 
                        title="Green Zone (High Performers)" 
                        products={report.productZones.green} 
                        color="bg-green-100 text-green-800" 
                        icon="trending-up"
                        onAction={onGenerateAd}
                        actionLabel="Scale Ad"
                    />
                    {/* Yellow Zone */}
                    <ZoneList 
                        title="Yellow Zone (Average)" 
                        products={report.productZones.yellow} 
                        color="bg-yellow-100 text-yellow-800" 
                        icon="minus" 
                        onAction={onGenerateAd}
                        actionLabel="Boost"
                    />
                    {/* Red Zone */}
                    <ZoneList 
                        title="Red Zone (At Risk)" 
                        products={report.productZones.red} 
                        color="bg-red-100 text-red-800" 
                        icon="arrow-down" 
                        onAction={onGenerateAd}
                        actionLabel="Clearance Ad"
                    />
                </div>
            </main>
        </div>
    );
};

const ZoneList: React.FC<{ 
    title: string; 
    products: ProductZoneItem[]; 
    color: string; 
    icon: string;
    onAction: (name: string) => void;
    actionLabel: string;
}> = ({ title, products, color, icon, onAction, actionLabel }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-96">
        <div className={`p-4 rounded-t-xl flex items-center justify-between ${color.replace('text-', 'bg-').replace('100', '50')}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</span>
            <span className="text-xs font-bold">{products.length} SKUs</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
            {products.slice(0, 50).map((p, i) => {
                const val = p.revenue;
                const revenueAsNumber = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
                
                return (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group hover:bg-slate-100 transition-colors">
                        <div className="min-w-0 flex-1 mr-2">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(isNaN(revenueAsNumber) ? 0 : revenueAsNumber)} Sales
                            </p>
                        </div>
                        <button 
                            onClick={() => onAction(p.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-[10px] font-bold px-2 py-1 rounded hover:bg-primary hover:text-white hover:border-primary shadow-sm"
                        >
                            {actionLabel}
                        </button>
                    </div>
                );
            })}
            {products.length === 0 && <p className="text-center text-xs text-slate-400 mt-10">No products in this zone.</p>}
        </div>
    </div>
);
