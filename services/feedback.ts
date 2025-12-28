
import { supabase } from './supabaseClient';

export interface FeedbackData {
  id: string;
  rating: string;
  comment: string;
  timestamp: number;
  userEmail?: string;
}

export const feedback = {
  async submitFeedback(rating: string, comment: string, userEmail?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('feedback').insert({
            user_id: user?.id,
            user_email: userEmail || user?.email,
            rating,
            comment
        });

    if (error) throw error;
  }
};
