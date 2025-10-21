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

  async uploadPhoto(userId: number, file: File, boothId?: string) {
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
    const updateData: any = {
      ended_at: new Date().toISOString()
    };
    
    // 명시적으로 필요한 필드만 추가
    if (formData.age !== undefined) updateData.age = formData.age;
    if (formData.gender !== undefined) updateData.gender = formData.gender;
    if (formData.interests !== undefined) updateData.interests = formData.interests;
    
    const { error } = await supabase
      .from('user')
      .update(updateData)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateFollowUpQuestions(userId: number, questions: string) {
    const { error } = await supabase
      .from('user')
      .update({
        followup_questions: questions
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateFollowUpAnswers(userId: number, answers: string) {
    const { error } = await supabase
      .from('user')
      .update({
        followup_answers: answers
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
  },

  async updateEvaluationFinished(userId: number) {
    const { error } = await supabase
      .from('user')
      .update({
        evaluation_finished_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateFinalSurvey(userId: number, finalRating: number, finalPros: string, finalCons: string) {
    const { error } = await supabase
      .from('user')
      .update({
        final_rating: finalRating,
        final_pros: finalPros,
        final_cons: finalCons,
        survey_finished_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async uploadPathImages(userId: number, compositeBlob: Blob, drawingBlob: Blob) {
    const timestamp = Date.now();
    
    // 합성 이미지 업로드 (지도 + 경로)
    const compositeFileName = `path_composite_user_${userId}_${timestamp}.png`;
    const compositeFilePath = `path-images/${compositeFileName}`;

    const { error: compositeUploadError } = await supabase.storage
      .from('user-photos')
      .upload(compositeFilePath, compositeBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (compositeUploadError) throw compositeUploadError;

    const { data: { publicUrl: compositeUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(compositeFilePath);

    // 경로만 있는 이미지 업로드
    const drawingFileName = `path_drawing_user_${userId}_${timestamp}.png`;
    const drawingFilePath = `path-images/${drawingFileName}`;

    const { error: drawingUploadError } = await supabase.storage
      .from('user-photos')
      .upload(drawingFilePath, drawingBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (drawingUploadError) throw drawingUploadError;

    const { data: { publicUrl: drawingUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(drawingFilePath);

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('user')
      .update({ 
        path_image_url: compositeUrl,
        path_drawing_url: drawingUrl
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return { compositeUrl, drawingUrl };
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

  async startEvaluation(userId: number, boothId: string, photoUrl?: string) {
    const { data, error } = await supabase
      .from('evaluation')
      .upsert({
        user_id: userId,
        booth_id: boothId,
        photo_url: photoUrl,
        started_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,booth_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateEvaluationPhoto(userId: number, boothId: string, photoUrl: string) {
    const { error } = await supabase
      .from('evaluation')
      .update({ photo_url: photoUrl })
      .eq('user_id', userId)
      .eq('booth_id', boothId);
    
    if (error) throw error;
  },

  async updateEvaluation(userId: number, boothId: string, updates: any) {
    const { error } = await supabase
      .from('evaluation')
      .update(updates)
      .eq('user_id', userId)
      .eq('booth_id', boothId);
    
    if (error) throw error;
  },

  async getEvaluation(userId: number, boothId: string) {
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
  },

  async deleteRecommendation(userId: number, boothId: string) {
    const { data, error } = await supabase
      .from('evaluation')
      .upsert({
        user_id: userId,
        booth_id: boothId,
        is_deleted: true,
        deleted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,booth_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const boothPositionService = {
  async getAllPositions() {
    const { data, error } = await supabase
      .from('booth_positions')
      .select('*')
      .order('booth_id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getPosition(boothId: string) {
    const { data, error } = await supabase
      .from('booth_positions')
      .select('*')
      .eq('booth_id', boothId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertPosition(boothId: string, x: number, y: number) {
    const { data, error } = await supabase
      .from('booth_positions')
      .upsert({
        booth_id: boothId,
        x,
        y,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'booth_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePosition(boothId: string) {
    const { error } = await supabase
      .from('booth_positions')
      .delete()
      .eq('booth_id', boothId);
    
    if (error) throw error;
  }
};
