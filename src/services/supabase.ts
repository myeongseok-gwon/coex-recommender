import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const userService = {
  async getUser(userId: number) {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUserStartedAt(userId: number) {
    const { error } = await supabase
      .from('user')
      .update({ started_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateUserFormData(userId: number, formData: any) {
    const { error } = await supabase
      .from('user')
      .update({
        ...formData,
        ended_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateUserRecommendation(userId: number, recResult: string) {
    const { error } = await supabase
      .from('user')
      .update({
        rec_result: recResult,
        recommended_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};

export const evaluationService = {
  async createEvaluation(evaluation: any) {
    const { data, error } = await supabase
      .from('evaluation')
      .insert(evaluation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateEvaluation(userId: number, boothId: number, updates: any) {
    const { error } = await supabase
      .from('evaluation')
      .update(updates)
      .eq('user_id', userId)
      .eq('booth_id', boothId);
    
    if (error) throw error;
  },

  async getEvaluation(userId: number, boothId: number) {
    const { data, error } = await supabase
      .from('evaluation')
      .select('*')
      .eq('user_id', userId)
      .eq('booth_id', boothId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};
