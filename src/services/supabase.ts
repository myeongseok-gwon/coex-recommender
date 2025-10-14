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

  async uploadPhoto(userId: number, file: File, boothId?: number) {
    const fileExt = file.name.split('.').pop();
    const fileName = boothId 
      ? `user_${userId}_booth_${boothId}_${Date.now()}.${fileExt}`
      : `user_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `user-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(filePath);

    // 부스별 사진이 아닌 경우에만 user 테이블의 photo_url 업데이트
    if (!boothId) {
      const { error: updateError } = await supabase
        .from('user')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    return publicUrl;
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
  },

  async updateUserRecEval(userId: number, recEval: string) {
    const { error } = await supabase
      .from('user')
      .update({
        rec_eval: recEval
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

  async updateEvaluationPhoto(userId: number, boothId: number, photoUrl: string) {
    const { error } = await supabase
      .from('evaluation')
      .update({ photo_url: photoUrl })
      .eq('user_id', userId)
      .eq('booth_id', boothId);
    
    if (error) throw error;
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
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getAllEvaluations(userId: number) {
    const { data, error } = await supabase
      .from('evaluation')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  }
};
