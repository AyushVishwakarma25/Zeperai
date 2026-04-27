import Papa from 'papaparse';

interface CSVFile {
    originalname: string;
    buffer: Buffer;
}

export const analyzeShopify = async (files: CSVFile[]) => {
    const dfs: Record<string, any[]> = {};
    
    // Parse all files
    for (const file of files) {
        if (!file.originalname.toLowerCase().endsWith('.csv')) continue;
        const csvText = file.buffer.toString('utf8');
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        dfs[file.originalname.toLowerCase()] = parsed.data;
    }

    // Identify tables
    let products_df = Object.entries(dfs).find(([k]) => k.includes('product'))?.[1] || [];
    let orders_df = Object.entries(dfs).find(([k]) => k.includes('order'))?.[1] || [];
    let analytics_df = Object.entries(dfs).find(([k]) => k.includes('analytic') || k.includes('sales'))?.[1] || [];

    if (!products_df.length && !orders_df.length && !analytics_df.length) {
        if (Object.keys(dfs).length === 1) {
            analytics_df = Object.values(dfs)[0];
        } else {
            throw new Error("No recognizable Shopify CSVs found (Products, Orders, Analytics).");
        }
    }

    // Clean columns to lowercase
    const cleanKeys = (obj: any) => {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
            cleaned[key.toLowerCase()] = obj[key];
        }
        return cleaned;
    };
    
    products_df = products_df.map(cleanKeys);
    orders_df = orders_df.map(cleanKeys);
    analytics_df = analytics_df.map(cleanKeys);

    let merged_df: any[] = [];
    let join_key: string | null = null;

    if (products_df.length > 0 && analytics_df.length > 0) {
        if (products_df[0]?.sku !== undefined && analytics_df[0]?.sku !== undefined) join_key = 'sku';
        else if (products_df[0]?.handle !== undefined && analytics_df[0]?.handle !== undefined) join_key = 'handle';
    }

    if (join_key) {
        // Global Merge logic outer join
        const keySet = new Set([...products_df.map(row => row[join_key!]), ...analytics_df.map(row => row[join_key!])]);
        
        merged_df = Array.from(keySet).map(keyVal => {
            const prodMatch = products_df.find(row => row[join_key!] === keyVal) || {};
            const analMatch = analytics_df.find(row => row[join_key!] === keyVal) || {};
            return { ...prodMatch, ...analMatch, [join_key!]: keyVal };
        });
    } else {
        merged_df = analytics_df.length > 0 ? analytics_df : products_df;
    }

    if (merged_df.length === 0) {
        throw new Error("Data could not be merged or is empty.");
    }

    // Convert numerics and handle defaults
    merged_df = merged_df.map(row => {
        const out = { ...row };
        for (const col of Object.keys(out)) {
            let val = String(out[col] || '');
            if (col.includes('sales') || col.includes('revenue') || col.includes('price') || col.includes('margin') || col.includes('spend')) {
                out[col] = parseFloat(val.replace(/[$,]/g, '')) || 0;
            } else if (col.includes('order') || col.includes('click') || col.includes('quantity') || col.includes('age')) {
                out[col] = parseFloat(val) || 0;
            } else if (col.includes('rate')) {
                out[col] = (parseFloat(val.replace('%', '')) || 0) / 100;
            }
        }
        
        if (out['total orders'] === undefined) out['total orders'] = out['orders'] !== undefined ? out['orders'] : (out['net quantity'] !== undefined ? out['net quantity'] : 1);
        if (out['total clicks'] === undefined) out['total clicks'] = out['clicks'] !== undefined ? out['clicks'] : 100;
        if (out['margin'] === undefined) out['margin'] = 0.5;
        if (out['conversion_rate'] === undefined) out['conversion_rate'] = out['total orders'] / (out['total clicks'] || 1);
        if (out['inventory_age'] === undefined) out['inventory_age'] = 30;
        if (out['spend'] === undefined) out['spend'] = 0;
        if (out['atc'] === undefined) out['atc'] = out['total orders'] * 2;
        if (out['title'] === undefined) {
             out['title'] = out['product title'] || out['name'] || (join_key ? out[join_key] : 'Unknown Product');
        }

        // Avoid division by zero by setting 0 to 1
        if (out['total clicks'] === 0) out['total clicks'] = 1;
        if (out['inventory_age'] === 0) out['inventory_age'] = 1;
        if (out['atc'] === 0) out['atc'] = 1;

        out['conversion_velocity'] = out['total orders'] / out['total clicks'];
        out['ad_push_score'] = (out['margin'] * out['conversion_rate']) / out['inventory_age'];
        out['burn_ratio'] = out['spend'] / out['atc'];

        return out;
    });

    const push_results = [...merged_df].sort((a, b) => b['ad_push_score'] - a['ad_push_score']).slice(0, 5).map(row => ({
        name: row['title'] ? String(row['title']) : 'Unknown Product',
        score: Math.round(row['ad_push_score'] * 10000) / 10000,
        reasoning: `Product shows high conversion velocity (${Math.round(row['conversion_velocity'] * 10000) / 100}%) and healthy margin. Ready to scale.`
    }));

    const stop_results = [...merged_df].sort((a, b) => b['burn_ratio'] - a['burn_ratio']).slice(0, 3).map(row => ({
         name: row['title'] ? String(row['title']) : 'Unknown Product',
         score: Math.round(row['burn_ratio'] * 100) / 100,
         reasoning: `High burn detected. High ad spend with low add-to-cart ratio (${Math.round(row['burn_ratio'] * 100) / 100}). Stop or optimize ads.`
    }));

    const chart_data = { dates: [] as string[], revenue: [] as number[] };
    if (merged_df.length > 0 && merged_df[0]['date'] !== undefined) {
        const trend = merged_df.reduce((acc, row) => {
             acc[row['date']] = (acc[row['date']] || 0) + (row['total sales'] || 0);
             return acc;
        }, {} as Record<string, number>);
        
        chart_data.dates = Object.keys(trend).sort();
        chart_data.revenue = chart_data.dates.map(d => trend[d]);
    }

    return {
        top_push_products: push_results,
        top_stop_products: stop_results,
        chart_data
    };
};
