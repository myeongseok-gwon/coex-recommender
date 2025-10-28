import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const userService = {
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUserStartedAt(userId: string) {
    const { error } = await supabase
      .from('user')
      .update({ started_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async createUser(userId: string) {
    const { data, error } = await supabase
      .from('user')
      .insert({
        user_id: userId,
        initial_form_started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateInitialFormStartedAt(userId: string) {
    const { error } = await supabase
      .from('user')
      .update({ initial_form_started_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateInitialFormSubmittedAt(userId: string) {
    const { error } = await supabase
      .from('user')
      .update({ initial_form_submitted_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateSkippedAt(userId: string) {
    const { error } = await supabase
      .from('user')
      .update({ skipped_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateAdditionalFormSubmittedAt(userId: string) {
    const { error } = await supabase
      .from('user')
      .update({ additional_form_submitted_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async uploadPhoto(userId: string, file: File, boothId?: string) {
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

  async updateUserFormData(userId: string, formData: any) {
    const updateData: any = {
      ended_at: new Date().toISOString()
    };
    
    // 명시적으로 필요한 필드만 추가
    if (formData.age !== undefined) updateData.age = formData.age;
    if (formData.gender !== undefined) updateData.gender = formData.gender;
    if (formData.visitPurpose !== undefined) updateData.visit_purpose = formData.visitPurpose;
    if (formData.interests !== undefined) updateData.interests = formData.interests;
    if (formData.hasCompanion !== undefined) updateData.has_companion = formData.hasCompanion;
    if (formData.companionCount !== undefined) updateData.companion_count = formData.companionCount;
    if (formData.specificGoal !== undefined) updateData.specific_goal = formData.specificGoal;
    
    // 새로운 선택 항목 필드들
    if (formData.hasChildren !== undefined) updateData.has_children = formData.hasChildren;
    if (formData.childInterests !== undefined) updateData.child_interests = formData.childInterests;
    if (formData.hasPets !== undefined) updateData.has_pets = formData.hasPets;
    if (formData.petTypes !== undefined) updateData.pet_types = formData.petTypes;
    if (formData.hasAllergies !== undefined) updateData.has_allergies = formData.hasAllergies;
    if (formData.allergies !== undefined) updateData.allergies = formData.allergies;
    
    const { error } = await supabase
      .from('user')
      .update(updateData)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateFollowUpQuestions(userId: string, questions: string) {
    const { error } = await supabase
      .from('user')
      .update({
        followup_questions: questions
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateFollowUpAnswers(userId: string, answers: string) {
    const { error } = await supabase
      .from('user')
      .update({
        followup_answers: answers
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateUserRecommendation(userId: string, recResult: string) {
    const { error } = await supabase
      .from('user')
      .update({
        rec_result: recResult,
        recommended_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateUserRecEval(userId: string, recEval: string) {
    const { error } = await supabase
      .from('user')
      .update({
        rec_eval: recEval
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateEvaluationFinished(userId: string) {
    const { error } = await supabase
      .from('user')
      .update({
        evaluation_finished_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async updateFinalSurvey(userId: string, finalRating: number, finalPros: string, finalCons: string) {
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

  async updateExitRatings(userId: string, recommendationRating: number, exhibitionRating: number) {
    const { error } = await supabase
      .from('user')
      .update({
        exit_recommendation_rating: recommendationRating,
        exit_exhibition_rating: exhibitionRating,
        exit_ratings_submitted_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async uploadPathImages(userId: string, compositeBlob: Blob, drawingBlob: Blob) {
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
  },

  async incrementRecommendationModalClicks(userId: string, boothId: string) {
    // Get current value and increment it for the specific booth
    const { data: user, error: fetchError } = await supabase
      .from('user')
      .select('recommendation_modal_clicks')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentClicks = user?.recommendation_modal_clicks || {};
    const currentBoothClicks = currentClicks[boothId] || 0;
    const newBoothClicks = currentBoothClicks + 1;
    
    const updatedClicks = {
      ...currentClicks,
      [boothId]: newBoothClicks
    };

    const { error: updateError } = await supabase
      .from('user')
      .update({ recommendation_modal_clicks: updatedClicks })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log(`✅ 추천 모달 클릭 카운트 증가 (${boothId}): ${currentBoothClicks} → ${newBoothClicks}`);
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

  async startEvaluation(userId: string, boothId: string, photoUrl?: string) {
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

  async updateEvaluationPhoto(userId: string, boothId: string, photoUrl: string) {
    const { error } = await supabase
      .from('evaluation')
      .update({ photo_url: photoUrl })
      .eq('user_id', userId)
      .eq('booth_id', boothId);
    
    if (error) throw error;
  },

  async updateEvaluation(userId: string, boothId: string, updates: any) {
    const { error } = await supabase
      .from('evaluation')
      .update(updates)
      .eq('user_id', userId)
      .eq('booth_id', boothId);
    
    if (error) throw error;
  },

  async getEvaluation(userId: string, boothId: string) {
    const { data, error } = await supabase
      .from('evaluation')
      .select('*')
      .eq('user_id', userId)
      .eq('booth_id', boothId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getAllEvaluations(userId: string) {
    const { data, error } = await supabase
      .from('evaluation')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async deleteRecommendation(userId: string, boothId: string) {
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

export const gpsTrackingService = {
  async createTracking(userId: string, trackingData: any) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .insert({
        user_id: userId,
        total_points: trackingData.totalPoints,
        total_distance: trackingData.totalDistance,
        duration: trackingData.duration,
        locations: trackingData.locations
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTracking(userId: string) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateTracking(id: number, trackingData: any) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .update({
        total_points: trackingData.totalPoints,
        total_distance: trackingData.totalDistance,
        duration: trackingData.duration,
        locations: trackingData.locations,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async sendRealtimeLocation(userId: string, location: any) {
    console.log('📡 Supabase에 GPS 데이터 전송 중:', {
      userId,
      location,
      table: 'gps_locations'
    });
    
    const insertData = {
      user_id: userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      altitude: location.altitude,
      speed: location.speed,
      heading: location.heading
    };
    
    console.log('📡 삽입할 데이터:', insertData);
    
    const { data, error } = await supabase
      .from('gps_locations')
      .insert(insertData);
    
    if (error) {
      console.error('❌ Supabase GPS 데이터 삽입 오류:', error);
      throw error;
    }
    
    console.log('✅ Supabase GPS 데이터 삽입 성공:', data);
    return data;
  }
};
