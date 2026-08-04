import { ShopifyAnalysisResult } from '../types';
import { supabase } from './supabaseClient';

export const shopifyService = {
    async analyzeFiles(files: File | File[]): Promise<ShopifyAnalysisResult> {
        const fileList = Array.isArray(files) ? files : [files];
        const formData = new FormData();
        fileList.forEach(file => formData.append('files', file));

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/analyze-shopify', {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ error: 'Failed to analyze files' }));
            throw new Error(errData.error || `Server error: ${response.status}`);
        }

        return await response.json();
    },

    // Legacy method compatibility
    async parseAndAnalyze(file: File): Promise<ShopifyAnalysisResult> {
        return this.analyzeFiles(file);
    },

    async generateAIInsights(data: ShopifyAnalysisResult): Promise<string[]> {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const summary = {
            revenue: Math.round(data.totalRevenue || 0),
            orders: data.totalOrders || 0,
            aov: Math.round(data.avgOrderValue || 0),
            topSellers: (data.topProducts || []).slice(0, 5).map((p: any) => p.name).join(', '),
            underperformers: (data.productZones?.red || []).slice(0, 5).map((p: any) => p.name).join(', ')
        };

        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                model: 'gemini-flash-latest',
                contents: `Act as a senior e-commerce strategist. Analyze this store summary: ${JSON.stringify(summary)}. Provide 3 short, specific marketing insights or campaign ideas as a JSON array of strings: ["Insight 1", "Insight 2", "Insight 3"]. Return ONLY valid raw JSON array.`
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate AI insights from server proxy.');
        }

        const result = await response.json();
        try {
            const parsed = JSON.parse(result.text || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;
        } catch {
            // ignore
        }
        return [
            "Bundle top sellers with slow-moving items to clear inventory.",
            "Run a targeted retargeting ad campaign for Green Zone products.",
            "Set a free shipping threshold 15% above current AOV."
        ];
    }
};
