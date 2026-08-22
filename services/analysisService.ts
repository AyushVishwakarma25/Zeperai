
import { supabase } from './supabaseClient.js';
import type { ShopifyAnalysisResult } from '../types.js';

export const analysisService = {
  /**
   * Fetches the most recent analysis report for the current user.
   */
  async getLatestReport(): Promise<ShopifyAnalysisResult | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('analysis_reports')
        .select('report_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        if (error && error.code !== 'PGRST116') {
          console.warn("Failed to load latest analysis report:", error.message);
        }
        return null;
      }

      return data.report_data as ShopifyAnalysisResult;
    } catch (e) {
      return null;
    }
  },

  /**
   * Saves a new analysis report for the current user.
   */
  async saveReport(report: ShopifyAnalysisResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Silently return for guest or non-authenticated users. Saving is a non-critical background task.
      return;
    }

    const { error } = await supabase
      .from('analysis_reports')
      .insert({
        user_id: user.id,
        report_data: report,
      });

    if (error) {
        console.error("Failed to save analysis report:", error.message);
        throw new Error(`Failed to save report to your account. Reason: ${error.message}`);
    }
  }
};
