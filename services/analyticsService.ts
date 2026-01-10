
import type { GeneratedImage } from '../types';
import { AspectRatio } from '../types';

export interface AnalyticsMetric {
    date: string;
    views: number;
    clicks: number;
    ctr: number;
}

export interface FormatPerformance {
    format: string;
    clicks: number;
    views: number;
    ctr: number;
}

export interface AnalyticsSummary {
    trends: AnalyticsMetric[];
    performanceByFormat: FormatPerformance[];
    totalViews: number;
    totalClicks: number;
    avgCtr: number;
    topAssetId: string;
    insight: string;
}

// Helper to simulate realistic performance numbers based on metadata biases
const simulateMetrics = (image: GeneratedImage) => {
    // Bias: Vertical formats perform better in mobile-first world
    const isVertical = image.aspectRatio === AspectRatio.Portrait || image.aspectRatio === AspectRatio.PortraitPost;
    const formatMultiplier = isVertical ? 1.4 : 1.0;
    
    // Bias: Newer images get less accumulated views but potentially higher trend velocity
    // Random base views between 1000 and 5000
    const baseViews = Math.floor(Math.random() * 4000) + 1000;
    
    // Random base CTR between 0.5% and 2.5%, boosted by format
    const baseCtr = (Math.random() * 2 + 0.5) * formatMultiplier;
    
    const views = baseViews;
    const clicks = Math.round(views * (baseCtr / 100));
    
    return { views, clicks };
};

export const analyticsService = {
    getAnalyticsData(designs: GeneratedImage[]): AnalyticsSummary {
        if (!designs || designs.length === 0) {
            return {
                trends: [],
                performanceByFormat: [],
                totalViews: 0,
                totalClicks: 0,
                avgCtr: 0,
                topAssetId: '',
                insight: "Start saving designs to unlock performance insights."
            };
        }

        const formatStats: Record<string, { views: number, clicks: number }> = {};
        const dailyStats: Record<string, { views: number, clicks: number }> = {};
        let totalViews = 0;
        let totalClicks = 0;
        let bestAsset = { id: '', clicks: 0 };

        designs.forEach(design => {
            const { views, clicks } = simulateMetrics(design);
            
            // Format Aggregation
            const ratio = design.aspectRatio || 'Unknown';
            if (!formatStats[ratio]) formatStats[ratio] = { views: 0, clicks: 0 };
            formatStats[ratio].views += views;
            formatStats[ratio].clicks += clicks;

            // Trend Aggregation (Group by Date)
            const date = new Date(design.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyStats[date]) dailyStats[date] = { views: 0, clicks: 0 };
            dailyStats[date].views += views;
            dailyStats[date].clicks += clicks;

            totalViews += views;
            totalClicks += clicks;

            if (clicks > bestAsset.clicks) {
                bestAsset = { id: design.id, clicks };
            }
        });

        // Transform to Arrays for Charts
        const performanceByFormat = Object.keys(formatStats).map(format => ({
            format,
            views: formatStats[format].views,
            clicks: formatStats[format].clicks,
            ctr: parseFloat(((formatStats[format].clicks / formatStats[format].views) * 100).toFixed(2))
        }));

        const trends = Object.keys(dailyStats).map(date => ({
            date,
            views: dailyStats[date].views,
            clicks: dailyStats[date].clicks,
            ctr: parseFloat(((dailyStats[date].clicks / dailyStats[date].views) * 100).toFixed(2))
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7); // Last 7 data points

        // Generate AI Insight Logic
        let winningFormat = '';
        let maxCtr = 0;
        performanceByFormat.forEach(p => {
            if (p.ctr > maxCtr) {
                maxCtr = p.ctr;
                winningFormat = p.format;
            }
        });

        // Fallback or specific logic matching the prompt requirement
        const insight = winningFormat === AspectRatio.Portrait || winningFormat === AspectRatio.PortraitPost
            ? `Vertical formats (${winningFormat}) are outperforming landscape visuals by ${Math.floor(Math.random() * 15 + 15)}% in engagement.`
            : `${winningFormat} visuals are currently driving the highest Click-Through Rate (${maxCtr}%) among your assets.`;

        return {
            trends,
            performanceByFormat,
            totalViews,
            totalClicks,
            avgCtr: totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(2)) : 0,
            topAssetId: bestAsset.id,
            insight: `${insight} Consider refreshing your ad sets with warmer color palettes for better conversion.`
        };
    }
};
