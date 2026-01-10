
import Papa from 'papaparse';
import { ShopifyAnalysisResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey });
};

// This new function offloads the entire analysis to Gemini.
async function getAIAnalysis(rows: any[]): Promise<ShopifyAnalysisResult> {
    const ai = getAI();
    const rowLimit = 1000;
    const isTruncated = rows.length > rowLimit;
    const rowsToAnalyze = isTruncated ? rows.slice(0, rowLimit) : rows;

    const analysisSchema = {
        type: Type.OBJECT,
        properties: {
            totalRevenue: { type: Type.NUMBER, description: "Total revenue from all sales." },
            totalOrders: { type: Type.NUMBER, description: "Total count of unique orders." },
            avgOrderValue: { type: Type.NUMBER, description: "Average value per order." },
            topProducts: {
                type: Type.ARRAY,
                description: "Top 5 products by revenue.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        revenue: { type: Type.NUMBER },
                        quantity: { type: Type.NUMBER },
                    },
                    required: ['name', 'revenue', 'quantity'],
                },
            },
            salesTrend: {
                type: Type.ARRAY,
                description: "Daily sales revenue, sorted chronologically.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
                        revenue: { type: Type.NUMBER },
                    },
                    required: ['date', 'revenue'],
                },
            },
            productZones: {
                type: Type.OBJECT,
                description: "Products categorized into performance zones.",
                properties: {
                    green: {
                        type: Type.ARRAY,
                        description: "Top 20% of products by revenue.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                revenue: { type: Type.NUMBER },
                                quantity: { type: Type.NUMBER },
                            },
                            required: ['name', 'revenue', 'quantity'],
                        },
                    },
                    yellow: {
                        type: Type.ARRAY,
                        description: "Middle 60% of products by revenue.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                revenue: { type: Type.NUMBER },
                                quantity: { type: Type.NUMBER },
                            },
                            required: ['name', 'revenue', 'quantity'],
                        },
                    },
                    red: {
                        type: Type.ARRAY,
                        description: "Bottom 20% of products by revenue.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                revenue: { type: Type.NUMBER },
                                quantity: { type: Type.NUMBER },
                            },
                            required: ['name', 'revenue', 'quantity'],
                        },
                    },
                },
                required: ['green', 'yellow', 'red'],
            },
        },
        required: ['totalRevenue', 'totalOrders', 'avgOrderValue', 'topProducts', 'salesTrend', 'productZones'],
    };

    const truncationWarning = isTruncated ? `\nNOTE: The provided data is a truncated sample of the first ${rowLimit} rows out of a total of ${rows.length}. Perform the analysis based on this sample.` : '';

    const prompt = `
        You are an expert data analyst for e-commerce brands. I will provide you with data from a sales report as a JSON array of objects. Your task is to analyze this data and return a complete summary in a specific JSON format.

        First, intelligently identify the correct columns for product title, sales figures (like 'Net Sales' or 'Total'), quantity sold, date of sale, and a unique order identifier. These names can vary.

        Then, perform the following calculations on the entire dataset provided:
        1.  **totalRevenue**: The sum of all sales. Handle various currency formats (e.g., "$1,234.56", "500.00") by converting them to numbers.
        2.  **totalOrders**: The count of unique orders. If an order identifier is not clear, use the number of rows as a fallback.
        3.  **avgOrderValue**: Calculated as totalRevenue / totalOrders. If totalOrders is zero, this should be zero.
        4.  **topProducts**: An array of the top 5 products sorted by their total revenue in descending order. Each object must include 'name', 'revenue', and 'quantity'.
        5.  **salesTrend**: An array of objects, each with a 'date' (formatted as YYYY-MM-DD) and the total 'revenue' for that day. This array must be sorted chronologically by date.
        6.  **productZones**: Classify all products into three zones based on revenue:
            *   'green': The top 20% of products by revenue.
            *   'yellow': The middle 60% of products by revenue.
            *   'red': The bottom 20% of products by revenue.
            Each zone should be an array of product objects, including 'name', 'revenue', and 'quantity', sorted by revenue.

        Here are the records:
        ${JSON.stringify(rowsToAnalyze)}
        ${truncationWarning}

        Provide your final analysis strictly in the required JSON format.
    `;

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema
            }
        });

        const result = JSON.parse(response.text || '{}') as ShopifyAnalysisResult;

        // Basic validation of the AI's output
        if (typeof result.totalRevenue !== 'number' || !Array.isArray(result.topProducts)) {
             throw new Error("AI returned an invalid data structure.");
        }
        
        // Ensure salesTrend is sorted, as AI can sometimes miss this instruction
        result.salesTrend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return { ...result, aiInsights: [] }; // aiInsights will be added in the next step
    } catch (e) {
        console.error("Error getting AI analysis:", e);
        throw new Error("The AI failed to analyze the data. Please check the CSV format or try again.");
    }
}

export const shopifyService = {
    parseAndAnalyze(file: File): Promise<ShopifyAnalysisResult> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const data = results.data as any[];
                        if (data.length === 0) {
                            throw new Error("CSV file is empty or could not be parsed.");
                        }
                        
                        // Use AI to perform the entire analysis
                        const report = await getAIAnalysis(data);
                        resolve(report);
                    } catch (e) {
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
        if (!process.env.API_KEY) return ["Set API Key to get insights."];
        const ai = getAI();
        const topNames = data.topProducts.map(p => p.name).join(', ');
        const redNames = data.productZones.red.slice(0, 3).map(p => p.name).join(', ');
        
        const prompt = `Analyze this e-commerce data summary:
        Total Revenue: ${data.totalRevenue.toFixed(2)}
        Top Selling Products (Green Zone): ${topNames || 'None'}
        Underperforming Products (Red Zone): ${redNames || 'None'}
        
        Provide 3 short, actionable marketing insights or ad campaign ideas. 
        Focus on how to boost the Red Zone items or scale the Green Zone items.
        Return as a JSON array of strings.`;

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
            return result.insights || ["Focus on bundling slow movers with best sellers.", "Run a flash sale for top items."];
        } catch (e) {
            console.error("AI Insight Gen Failed", e);
            return ["Data analysis complete. Check the charts for trends."];
        }
    }
};
