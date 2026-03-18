
import Papa from 'papaparse';
import { ShopifyAnalysisResult, ProductZoneItem } from '../types';
import { Type } from "@google/genai";
import { getAI } from '../config/ai';
import { env } from '../utils/env';

// Helper to parse currency strings "$1,200.50" -> 1200.50
const parseCurrency = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0;
};

// Helper to normalize dates
const normalizeDate = (dateStr: string): string => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Unknown Date';
        return date.toISOString().split('T')[0];
    } catch {
        return 'Unknown Date';
    }
};

// Deterministic Analysis (Instant)
const calculateMetrics = (data: any[]): ShopifyAnalysisResult => {
    let totalRevenue = 0;
    const uniqueOrders = new Set<string>();
    const productMap = new Map<string, { revenue: number; quantity: number }>();
    const salesByDate = new Map<string, number>();

    // 1. Identify Columns (Heuristic Mapping)
    const headers = Object.keys(data[0] || {});
    const colRevenue = headers.find(h => /net sales|total sales|total|price|amount/i.test(h)) || 'Net Sales';
    const colProduct = headers.find(h => /product title|product|title|item name/i.test(h)) || 'Product Title';
    const colOrder = headers.find(h => /order name|order id|name|id/i.test(h)) || 'Name';
    const colDate = headers.find(h => /day|date|created at|time/i.test(h)) || 'Day';
    const colQty = headers.find(h => /net quantity|quantity|qty/i.test(h)) || 'Net Quantity';

    // 2. Aggregate Data
    data.forEach(row => {
        const revenue = parseCurrency(row[colRevenue]);
        const product = row[colProduct] || 'Unknown Product';
        const orderId = row[colOrder];
        const date = normalizeDate(row[colDate]);
        const qty = parseCurrency(row[colQty]);

        if (revenue === 0 && qty === 0) return; // Skip empty rows

        // KPIs
        totalRevenue += revenue;
        if (orderId) uniqueOrders.add(orderId);

        // Product Aggregation
        const currentProd = productMap.get(product) || { revenue: 0, quantity: 0 };
        productMap.set(product, {
            revenue: currentProd.revenue + revenue,
            quantity: currentProd.quantity + qty
        });

        // Sales Trend
        const currentDaily = salesByDate.get(date) || 0;
        salesByDate.set(date, currentDaily + revenue);
    });

    // 3. Process Collections
    const totalOrders = uniqueOrders.size || data.length; // Fallback if no order ID column
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const allProducts: ProductZoneItem[] = Array.from(productMap.entries()).map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        quantity: stats.quantity
    })).sort((a, b) => b.revenue - a.revenue); // Descending by revenue

    const salesTrend = Array.from(salesByDate.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. Calculate Zones (ABC Analysis)
    const zones = {
        green: [] as ProductZoneItem[],
        yellow: [] as ProductZoneItem[],
        red: [] as ProductZoneItem[]
    };

    // Pareto Principle (80/20 rule rough approximation for zones)
    // Green: Top 20% of catalog count OR products contributing to top 50% revenue
    // For simplicity in this app: Top 20% items = Green, Next 60% = Yellow, Bottom 20% = Red
    const totalCount = allProducts.length;
    const greenCutoff = Math.ceil(totalCount * 0.2);
    const yellowCutoff = Math.ceil(totalCount * 0.8);

    allProducts.forEach((p, index) => {
        if (index < greenCutoff) zones.green.push(p);
        else if (index < yellowCutoff) zones.yellow.push(p);
        else zones.red.push(p);
    });

    return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        topProducts: allProducts.slice(0, 5),
        salesTrend,
        productZones: zones,
        aiInsights: [] // To be filled by AI later
    };
};

export const shopifyService = {
    parseAndAnalyze(file: File): Promise<ShopifyAnalysisResult> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true, // Auto-convert numbers and booleans
                complete: (results) => {
                    try {
                        const data = results.data as any[];
                        if (data.length === 0) {
                            throw new Error("CSV file is empty or could not be parsed.");
                        }
                        
                        // Use Deterministic JS Calculation (Instant)
                        // No more waiting for Gemini to calculate totals
                        const report = calculateMetrics(data);
                        resolve(report);
                    } catch (e) {
                        console.error("Analysis Error", e);
                        reject(e);
                    }
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    },

    async generateAIInsights(data: ShopifyAnalysisResult): Promise<string[]> {
        if (!env.API_KEY) return ["Set API Key to get insights."];
        
        const ai = getAI();
        
        // Prepare a lightweight summary for the AI
        const summary = {
            revenue: Math.round(data.totalRevenue),
            orders: data.totalOrders,
            aov: Math.round(data.avgOrderValue),
            topSellers: data.topProducts.map(p => p.name).join(', '),
            underperformers: data.productZones.red.slice(0, 5).map(p => p.name).join(', '),
            trend: data.salesTrend.length > 7 ? 'Available' : 'Insufficient Data'
        };
        
        const prompt = `
        Act as a senior e-commerce strategist. Analyze this Shopify data summary:
        ${JSON.stringify(summary)}

        Provide 3 specific, actionable, and short marketing insights or ad campaign ideas.
        1. How to scale the top sellers (Green Zone).
        2. How to clear the underperformers (Red Zone) or bundle them.
        3. A general observation on AOV or strategy.

        Format: Return ONLY a raw JSON array of strings. Example: ["Insight 1", "Insight 2", "Insight 3"].
        Do not use markdown formatting.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            insights: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                }
            });
            
            const result = JSON.parse(response.text || '{}');
            return result.insights || [
                "Bundle your top sellers to increase AOV.",
                "Run a flash sale on red zone items to clear inventory.",
                "Create lookalike audiences based on your high-value customers."
            ];
        } catch (e) {
            console.error("AI Insight Gen Failed", e);
            return ["Focus on bundling slow movers with best sellers.", "Run a flash sale for top items."];
        }
    }
};
