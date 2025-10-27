import React, { useState, useEffect } from 'react';
import { AppState, User, UserFormData } from './types';
import { loadBoothData } from './utils/dataLoader';
import { userService } from './services/supabase';
import { llmService } from './services/llm';
import { vectorSearchService, UserProfile } from './services/vectorSearch';
import { GPSService } from './services/gpsService';
import LandingPage from './components/LandingPage';
import UserFormPage from './components/UserFormPage';
import FollowUpQuestionsPage from './components/FollowUpQuestionsPage';
import LoadingPage from './components/LoadingPage';
import MainPage from './components/MainPage';
import BoothDetailPage from './components/BoothDetailPage';
import MapPage from './components/MapPage';
import SurveyPage from './components/SurveyPage';
import CompletePage from './components/CompletePage';
import ExitRatingModal from './components/ExitRatingModal';
import ThankYouPage from './components/ThankYouPage';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    currentPage: 'landing',
    recommendations: [],
    selectedBooth: null,
    boothData: [],
    evaluation: null,
    userFormData: null
  });

  const [followUpData, setFollowUpData] = useState<{ summary: string; questions: string[] } | null>(null);
  const [showExitRatingModal, setShowExitRatingModal] = useState(false);
  const [isBoothDataLoading, setIsBoothDataLoading] = useState(true);

  useEffect(() => {
    // 부스 데이터 로드
    const loadData = async () => {
      try {
        setIsBoothDataLoading(true);
        console.log('📦 부스 데이터 로드 시작...');
        const boothData = await loadBoothData();
        console.log('✅ 부스 데이터 로드 완료:', boothData.length, '개');
        
        if (boothData.length === 0) {
          console.warn('⚠️ boothData가 비어있습니다.');
        }
        
        setState(prev => ({ ...prev, boothData }));
        setIsBoothDataLoading(false);
        
        // sessionStorage에서 상태 복원 시도
        const savedState = sessionStorage.getItem('appState');
        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            console.log('상태 복원:', parsedState);
            console.log('boothData (로드된 것):', boothData.length, '개');
            setState(prev => ({
              ...prev,
              currentUser: parsedState.currentUser,
              currentPage: parsedState.currentPage,
              recommendations: parsedState.recommendations || [],
              selectedBooth: parsedState.selectedBooth
              // boothData는 상위에서 이미 설정되었으므로 prev를 유지
            }));
          } catch (error) {
            console.error('상태 복원 오류:', error);
            sessionStorage.removeItem('appState');
          }
        }
      } catch (error) {
        console.error('❌ 부스 데이터 로드 오류:', error);
        setIsBoothDataLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 추천 결과 중복 제거 (뒤 항목 제거 = 최초 항목 유지)
  const dedupeRecommendations = (list: any[]) => {
    const seen = new Set<string | number>();
    const result: any[] = [];
    for (const item of list || []) {
      if (!item?.id) continue; // id가 없는 항목은 건너뛰기
      
      const id = item.id; // id를 그대로 사용 (문자열이든 숫자든)
      if (!seen.has(id)) {
        seen.add(id);
        result.push(item);
      }
    }
    console.log('중복 제거 처리:', { 입력개수: list?.length, 출력개수: result.length });
    return result;
  };

  const startGPSTracking = async (userId: string) => {
    console.log('🚀 App.tsx: startGPSTracking 호출됨', { userId });
    
    // 기존 GPS 서비스가 있으면 완전히 정리
    if (window.gpsService) {
      console.log('🛑 기존 GPS 서비스 정리 중...');
      window.gpsService.stopTracking();
      window.gpsService = null;
      console.log('✅ 기존 GPS 서비스 정리 완료');
    }
    
    try {
      console.log('🚀 App.tsx: GPS 추적 시작 시도', {
        userId: userId,
        hasGeolocation: !!navigator.geolocation,
        userAgent: navigator.userAgent
      });
      
      const gpsService = new GPSService(userId);
      window.gpsService = gpsService;
      console.log('✅ GPSService 인스턴스 생성됨', { userId: gpsService.userId });
      
      await gpsService.startTracking(
        (location) => {
          console.log('📍 App.tsx: GPS 위치 업데이트 콜백:', location);
        },
        (error) => {
          console.error('❌ App.tsx: GPS 오류 콜백:', error);
        }
      );
      console.log('✅ App.tsx: GPS 추적 시작 성공');
      
      // GPS 서비스 디버그 정보 출력
      setTimeout(() => {
        if (window.gpsService) {
          console.log('🔍 GPS 서비스 디버그 정보:', window.gpsService.getDebugInfo());
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ App.tsx: GPS 추적 시작 실패:', error);
    }
  };

  const handleUserValid = async (userId: string, userData: any) => {
    console.log('🎯 App.tsx: handleUserValid 호출됨', { userId, userData });
    console.log('🎯 받은 사용자 데이터 상세:', JSON.stringify(userData, null, 2));
    try {
      // Admin 모드 처리 (userId === '0')
      if (userId === '0') {
        const adminUser: User = {
          user_id: '0',
          initial_form_started_at: undefined,
          initial_form_submitted_at: undefined,
          skipped_at: undefined,
          additional_form_submitted_at: undefined,
          ended_at: undefined
        };
        
        setState(prev => ({
          ...prev,
          currentUser: adminUser,
          recommendations: [],
          currentPage: 'map'
        }));
        return;
      }

      if (!userData) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 새로운 사용자 플로우에 따른 페이지 결정
      // 1. 새 사용자 (initial_form_started_at이 없음) -> GPS 권한 요청 후 초기 폼
      // 2. 초기 폼 미완료 (initial_form_submitted_at이 없음) -> 초기 폼
      // 3. 초기 폼 완료, 추가 폼 미완료 (ended_at 있음, skipped_at과 additional_form_submitted_at 없음) -> 추가 질문
      // 4. 완료된 사용자 (skipped_at 또는 additional_form_submitted_at 있음) -> 메인 페이지
      
      console.log('사용자 상태 확인:', {
        userId: userData.user_id,
        initial_form_started_at: userData.initial_form_started_at,
        initial_form_submitted_at: userData.initial_form_submitted_at,
        ended_at: userData.ended_at,
        skipped_at: userData.skipped_at,
        additional_form_submitted_at: userData.additional_form_submitted_at,
        has_rec_result: !!userData.rec_result
      });

      if (!userData.initial_form_started_at) {
        // 새 사용자 - GPS 권한 요청 후 초기 폼으로
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          currentPage: 'form'
        }));
        
        // GPS 추적 시작
        await startGPSTracking(userData.user_id);
        return;
      }

      if (!userData.initial_form_submitted_at) {
        // 초기 폼 미완료 - 초기 폼으로
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          currentPage: 'form'
        }));
        
        // GPS 추적 시작
        await startGPSTracking(userData.user_id);
        return;
      }

      if (userData.ended_at && !userData.skipped_at && !userData.additional_form_submitted_at) {
        // 초기 폼 완료, 추가 폼 미완료 - 추천 페이지로 이동 (추가 질문 스킵)
        const recommendations = userData.rec_result ? dedupeRecommendations(JSON.parse(userData.rec_result)) : [];
        
        console.log('추가 질문 단계 사용자 - 추천 페이지로 이동:', {
          userId: userData.user_id,
          hasRecommendations: recommendations.length > 0,
          recommendationsCount: recommendations.length
        });
        
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          recommendations,
          currentPage: 'recommendations'
        }));
        
        // 디버깅: 저장된 사용자 데이터 확인
        console.log('=== 저장된 사용자 데이터 확인 ===');
        console.log('userData 원본:', JSON.stringify(userData, null, 2));
        console.log('User 타입으로 캐스팅 후:', JSON.stringify(userData as User, null, 2));
        return;
      }

      if (userData.skipped_at || userData.additional_form_submitted_at) {
        // 완료된 사용자 - 메인 페이지로
        // 추천 결과가 있는 경우 파싱하여 전달
        console.log('완료된 사용자 데이터 확인:', {
          userId: userData.user_id,
          hasRecResult: !!userData.rec_result,
          recResultType: typeof userData.rec_result,
          recResultLength: userData.rec_result ? userData.rec_result.length : 0,
          recResultPreview: userData.rec_result ? userData.rec_result.substring(0, 200) + '...' : 'null',
          exit_ratings_submitted_at: userData.exit_ratings_submitted_at,
          skipped_at: userData.skipped_at,
          additional_form_submitted_at: userData.additional_form_submitted_at
        });
        
        let recommendations = [];
        if (userData.rec_result) {
          try {
            const parsedResult = JSON.parse(userData.rec_result);
            console.log('추천 데이터 파싱 성공:', {
              parsedType: typeof parsedResult,
              isArray: Array.isArray(parsedResult),
              length: Array.isArray(parsedResult) ? parsedResult.length : 'not array'
            });
            recommendations = dedupeRecommendations(parsedResult);
            console.log('파싱된 추천 데이터 개수:', recommendations.length);
            if (recommendations.length > 0) {
              console.log('첫 번째 추천:', recommendations[0]);
            }
          } catch (error) {
            console.error('추천 데이터 파싱 오류:', error);
            console.error('원본 데이터:', userData.rec_result);
            recommendations = [];
          }
        } else {
          console.warn('⚠️ rec_result가 없습니다. 사용자가 아직 추천을 받지 않았거나 데이터가 손실되었습니다.');
        }
        
        console.log('최종 추천 데이터:', {
          userId: userData.user_id,
          hasRecommendations: recommendations.length > 0,
          recommendationsCount: recommendations.length,
          recommendations: recommendations.slice(0, 3) // 처음 3개만 로그
        });
        
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          recommendations,
          currentPage: 'recommendations'
        }));
        
        // 디버깅: 완료된 사용자 데이터 확인
        console.log('=== 완료된 사용자 데이터 확인 ===');
        console.log('userData 원본:', JSON.stringify(userData, null, 2));
        console.log('User 타입으로 캐스팅 후:', JSON.stringify(userData as User, null, 2));
        
        // 완료된 사용자는 GPS 추적 시작하지 않음
        console.log('⏭️ 완료된 사용자 - GPS 추적 시작하지 않음');
        return;
      }

      // 기본적으로 초기 폼으로
      setState(prev => ({
        ...prev,
        currentUser: userData as User,
        currentPage: 'form'
      }));

      // GPS 추적 시작
      await startGPSTracking(userData.user_id);

    } catch (error) {
      console.error('사용자 검증 오류:', error);
      alert('사용자 검증 중 오류가 발생했습니다.');
    }
  };

  // RAG 기반 추천 생성 함수
  const generateRecommendationsWithRAG = async (user: User, userFormData: UserFormData, _followUpData?: Array<{ question: string; answer: string }> | null) => {
    try {
      // 사용자 프로필 구성 (추가 질문은 기록용으로만 사용, 추천 생성에는 제외)
      const userProfile: UserProfile = {
        age: userFormData.age,
        gender: userFormData.gender,
        visit_purpose: userFormData.visitPurpose,
        interests: userFormData.interests,
        has_companion: userFormData.hasCompanion,
        companion_count: userFormData.companionCount,
        specific_goal: userFormData.specificGoal,
        // 새로운 선택 항목들 포함
        has_children: userFormData.hasChildren,
        child_interests: userFormData.childInterests,
        has_pets: userFormData.hasPets,
        pet_types: userFormData.petTypes,
        has_allergies: userFormData.hasAllergies,
        allergies: userFormData.allergies,
        // followup_questions와 followup_answers는 추천 생성에서 제외 (기록용으로만 사용)
        // followup_questions: followUpData?.map(qa => qa.question).join(', '),
        // followup_answers: user.followup_answers
      };

      console.log('=== RAG 기반 추천 생성 시작 ===');
      console.log('사용자 프로필 (추가 질문 제외):', userProfile);

      // 벡터 검색 서비스 사용 가능 여부 확인
      const embeddingsExist = await vectorSearchService.checkEmbeddingsExist();
      
      if (embeddingsExist) {
        console.log('✅ 벡터 검색 서비스 사용 가능 - RAG 방식으로 추천 생성');
        const rawRecommendations = await llmService.getRecommendationsWithRAG(userProfile);
        console.log('RAG 방식 추천 결과:', rawRecommendations);
        return rawRecommendations;
      } else {
        console.log('⚠️ 벡터 검색 서비스 사용 불가 - 기존 방식으로 fallback');
        // 기존 방식으로 fallback (추가 질문 제외)
        const visitorInfo = createVisitorInfo(user, userFormData, null);
        const rawRecommendations = await llmService.getRecommendations(state.boothData, visitorInfo);
        console.log('기존 방식 추천 결과:', rawRecommendations);
        return rawRecommendations;
      }
    } catch (error) {
      console.error('RAG 기반 추천 생성 오류:', error);
      // 오류 발생 시 기존 방식으로 fallback (추가 질문 제외)
      console.log('RAG 방식 실패, 기존 방식으로 fallback');
      const visitorInfo = createVisitorInfo(user, userFormData, null);
      const rawRecommendations = await llmService.getRecommendations(state.boothData, visitorInfo);
      return rawRecommendations;
    }
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    if (!state.currentUser) return;

    try {
      // 사용자 정보 업데이트
      await userService.updateUserFormData(state.currentUser.user_id, formData);
      await userService.updateInitialFormSubmittedAt(state.currentUser.user_id);
      
      // 폼 데이터를 상태에 저장
      setState(prev => ({
        ...prev,
        userFormData: formData
      }));

      // 사용자가 이미 완료된 상태인지 확인 (재입장 시 추가 질문 건너뛰기)
      const isUserCompleted = state.currentUser.skipped_at || state.currentUser.additional_form_submitted_at;
      
      if (isUserCompleted) {
        // 완료된 사용자가 정보를 수정한 경우 - 바로 추천 생성
        console.log('🔄 완료된 사용자 정보 수정 - 바로 추천 생성');
        
        // 로딩 페이지로 이동
        setState(prev => ({
          ...prev,
          currentPage: 'loading'
        }));

        // RAG 기반 추천 생성 (추가 질문 제외)
        const rawRecommendations = await generateRecommendationsWithRAG(
          state.currentUser,
          formData,
          null
        );
        
        const recommendations = dedupeRecommendations(rawRecommendations);
        
        // 추천 결과를 데이터베이스에 저장
        await userService.updateUserRecommendation(
          state.currentUser.user_id, 
          JSON.stringify(recommendations)
        );

        setState(prev => ({
          ...prev,
          recommendations,
          currentPage: 'recommendations'
        }));
        return;
      }

      // 새 사용자 또는 미완료 사용자 - 추가 질문 생성
      // 로딩 페이지로 이동
      setState(prev => ({
        ...prev,
        currentPage: 'loading'
      }));

      // Gemini API를 통한 추가 질문 생성
      const visitorInfo = createVisitorInfo(state.currentUser, formData, []);
      console.log('=== App.tsx: 추가 질문 생성 시작 ===');
      
      const followUpResult = await llmService.generateFollowUpQuestions(visitorInfo);
      console.log('LLM에서 생성된 추가 질문:', followUpResult);
      
      setFollowUpData(followUpResult);

      // 추가 질문 페이지로 이동
      setState(prev => ({
        ...prev,
        currentPage: 'followup'
      }));
    } catch (error) {
      console.error('폼 제출 오류:', error);
      alert('폼 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      setState(prev => ({
        ...prev,
        currentPage: 'form'
      }));
    }
  };


  const handleFollowUpSubmit = async (questionAnswerPairs: Array<{ question: string; answer: string }>) => {
    if (!state.currentUser || !state.userFormData) return;

    try {
      // 추가 질문 답변 저장
      await userService.updateFollowUpAnswers(
        state.currentUser.user_id, 
        JSON.stringify(questionAnswerPairs)
      );
      
      // 추가 폼 제출 완료 표시
      await userService.updateAdditionalFormSubmittedAt(state.currentUser.user_id);
      
      // 로딩 페이지로 이동
      setState(prev => ({
        ...prev,
        currentPage: 'loading'
      }));

      // RAG 기반 추천 생성 (추가 질문은 기록용으로만 사용)
      console.log('=== App.tsx: RAG 기반 추천 생성 시작 (추가 질문은 기록용으로만 사용) ===');
      
      const rawRecommendations = await generateRecommendationsWithRAG(
        state.currentUser,
        state.userFormData,
        questionAnswerPairs
      );
      console.log('LLM에서 받은 원본 추천:', rawRecommendations);
      console.log('원본 추천 길이:', rawRecommendations?.length);
      
      const recommendations = dedupeRecommendations(rawRecommendations);
      console.log('중복 제거 후 추천:', recommendations);
      console.log('중복 제거 후 추천 길이:', recommendations?.length);
      
      // 추천 결과를 데이터베이스에 저장
      await userService.updateUserRecommendation(
        state.currentUser.user_id, 
        JSON.stringify(recommendations)
      );

      setState(prev => ({
        ...prev,
        recommendations,
        currentPage: 'recommendations'
      }));
    } catch (error) {
      console.error('추천 생성 오류:', error);
      alert('추천 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setState(prev => ({
        ...prev,
        currentPage: 'followup'
      }));
    }
  };

  const handleSkipFollowUp = async () => {
    if (!state.currentUser) return;

    try {
      // 스킵 표시
      await userService.updateSkippedAt(state.currentUser.user_id);
      
      // 로딩 페이지로 이동
      setState(prev => ({
        ...prev,
        currentPage: 'loading'
      }));

      // RAG 기반 추천 생성 (스킵 - 추가 질문은 기록용으로만 사용)
      console.log('=== App.tsx: RAG 기반 추천 생성 시작 (스킵 - 추가 질문은 기록용으로만 사용) ===');
      
      const rawRecommendations = await generateRecommendationsWithRAG(
        state.currentUser,
        state.userFormData || { age: 0, gender: '', interests: {}, visitPurpose: '' },
        null
      );
      console.log('LLM에서 받은 원본 추천:', rawRecommendations);
      console.log('원본 추천 길이:', rawRecommendations?.length);
      
      const recommendations = dedupeRecommendations(rawRecommendations);
      console.log('중복 제거 후 추천:', recommendations);
      console.log('중복 제거 후 추천 길이:', recommendations?.length);
      
      // 유사도가 포함된 추천 데이터 확인
      if (recommendations && recommendations.length > 0) {
        console.log('첫 번째 추천의 유사도:', recommendations[0].similarity);
        console.log('유사도가 포함된 추천 데이터:', recommendations.slice(0, 3));
      }
      
      // 추천 결과를 데이터베이스에 저장
      await userService.updateUserRecommendation(
        state.currentUser.user_id, 
        JSON.stringify(recommendations)
      );

      setState(prev => ({
        ...prev,
        recommendations,
        currentPage: 'recommendations'
      }));
    } catch (error) {
      console.error('추천 생성 오류:', error);
      alert('추천 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setState(prev => ({
        ...prev,
        currentPage: 'followup'
      }));
    }
  };

  const createVisitorInfo = (
    user: User, 
    formData: UserFormData, 
    _questionAnswerPairs: Array<{ question: string; answer: string }> | null
  ): string => {
    // 폼 데이터를 우선적으로 사용 (신규 사용자 대응)
    const age = formData.age || user.age;
    const gender = formData.gender || user.gender;
    const specificGoal = formData.specificGoal || user.specific_goal;
    const interests = formData.interests || user.interests;
    
    let info = `나이: ${age}세\n`;
    info += `성별: ${gender}\n`;
    
    // 새로운 선택 항목들 추가 (폼 데이터 우선 사용)
    const selectionItems = [];
    const hasChildren = formData.hasChildren !== undefined ? formData.hasChildren : user.has_children;
    const hasPets = formData.hasPets !== undefined ? formData.hasPets : user.has_pets;
    const hasAllergies = formData.hasAllergies !== undefined ? formData.hasAllergies : user.has_allergies;
    
    // 자녀 관련 정보
    if (hasChildren) {
      selectionItems.push('자녀가 있어요');
      const childInterests = formData.childInterests || user.child_interests;
      if (childInterests && childInterests.length > 0) {
        selectionItems.push(`자녀 관심사: ${childInterests.join(', ')}`);
      }
    } else {
      selectionItems.push('자녀 없음');
    }
    
    // 반려동물 관련 정보
    if (hasPets) {
      selectionItems.push('반려동물이 있어요');
      const petTypes = formData.petTypes || user.pet_types;
      if (petTypes && petTypes.length > 0) {
        selectionItems.push(`반려동물 종류: ${petTypes.join(', ')}`);
      }
    } else {
      selectionItems.push('반려동물 없음');
    }
    
    // 알러지 관련 정보
    if (hasAllergies) {
      selectionItems.push('알러지가 있어요');
      const allergies = formData.allergies || user.allergies;
      if (allergies) {
        selectionItems.push(`알러지 정보: ${allergies}`);
      }
    } else {
      selectionItems.push('알러지 없음');
    }
    
    if (selectionItems.length > 0) {
      info += `선택 항목: ${selectionItems.join(', ')}\n`;
    }

    // 구체적 목표 (폼 데이터 우선 사용)
    if (specificGoal && specificGoal.trim() !== '') {
      info += `목표: ${specificGoal} 둘러보기\n`;
    }
    
    // 관심사 (폼 데이터 우선 사용)
    const interestEntries = interests ? Object.entries(interests) : [];
    
    if (interestEntries.length > 0) {
      info += '\n선택한 관심사:\n';
      for (const [subcategory, items] of interestEntries) {
        if (items && items.length > 0) {
          info += `  ${subcategory}: ${items.join(', ')}\n`;
        }
      }
    }
    
    // 추가 질문-답변은 추천 생성에서 제외 (기록용으로만 사용)
    // if (questionAnswerPairs && questionAnswerPairs.length > 0) {
    //   info += `\n\n추가 질문 및 답변:\n`;
    //   questionAnswerPairs.forEach((pair, index) => {
    //     info += `\nQ${index + 1}. ${pair.question}\n`;
    //     info += `A${index + 1}. ${pair.answer}\n`;
    //   });
    // }
    
    console.log('방문자 정보 (추가 질문 제외):', info);
    return info;
  };


  const handleUserUpdate = (updatedUser: User) => {
    setState(prev => ({
      ...prev,
      currentUser: updatedUser
    }));
  };


  const handleSurveyComplete = (updatedUser: User) => {
    setState(prev => ({
      ...prev,
      currentUser: updatedUser,
      currentPage: 'complete'
    }));
  };

  const handleBack = () => {
    setState(prev => {
      if (prev.currentPage === 'detail') {
        return {
          ...prev,
          selectedBooth: null,
          currentPage: 'recommendations'
        };
      } else if (prev.currentPage === 'map') {
        return {
          ...prev,
          currentPage: 'recommendations'
        };
      } else if (prev.currentPage === 'recommendations') {
        // 추천 페이지에서 뒤로가기를 누르면 폼 페이지로 이동 (정보 수정 가능)
        return {
          ...prev,
          currentPage: 'form'
        };
      } else if (prev.currentPage === 'followup') {
        // 추가 질문 페이지에서 뒤로가기를 누르면 폼 페이지로 이동
        return {
          ...prev,
          currentPage: 'form'
        };
      } else if (prev.currentPage === 'form') {
        return {
          ...prev,
          currentUser: null,
          currentPage: 'landing'
        };
      }
      return prev;
    });
  };

  const handleExit = () => {
    console.log('🚪 App.tsx: handleExit 호출됨');
    
    // 별점 수집 모달 표시
    setShowExitRatingModal(true);
  };

  const handleExitRatingSubmit = async (recommendationRating: number, exhibitionRating: number) => {
    console.log('⭐ 별점 제출:', { recommendationRating, exhibitionRating });
    
    try {
      // 종료시점 저장 (ended_at 업데이트)
      if (state.currentUser) {
        await userService.updateUserFormData(state.currentUser.user_id, {});
        console.log('✅ 종료시점 저장 완료');
      }

      // 별점 저장
      if (state.currentUser) {
        await userService.updateExitRatings(state.currentUser.user_id, recommendationRating, exhibitionRating);
        console.log('✅ 별점 저장 완료');
      }
    } catch (error) {
      console.error('❌ 별점 저장 오류:', error);
    }

    // 모달 닫기
    setShowExitRatingModal(false);
    
    // GPS 추적 중지
    if (window.gpsService) {
      console.log('🛑 GPS 추적 중지 중...');
      window.gpsService.stopTracking();
      console.log('✅ GPS 추적 중지 완료');
      
      // GPS 서비스 정리
      window.gpsService = null;
    } else {
      console.log('⚠️ GPS 서비스가 없음');
    }
    
    // 감사 메시지 페이지로 이동
    console.log('🙏 감사 메시지 페이지로 이동');
    setState(prev => ({
      ...prev,
      currentPage: 'thankyou'
    }));
  };

  const handleExitRatingCancel = () => {
    console.log('❌ 별점 수집 취소');
    setShowExitRatingModal(false);
  };

  const handleThankYouComplete = () => {
    console.log('🙏 감사 메시지 완료 - 앱 초기화');
    
    // 세션 스토리지 초기화 (다음 세션에서 깨끗한 상태로 시작)
    sessionStorage.clear();
    
    // 앱 초기화 (boothData는 유지 - 캐시됨)
    setState({
      currentUser: null,
      userFormData: null,
      recommendations: [],
      boothData: state.boothData, // boothData는 유지
      currentPage: 'landing',
      selectedBooth: null,
      evaluation: null
    });
    console.log('✅ 앱 상태 초기화 완료 (boothData 유지)');
  };

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'landing':
        return <LandingPage onUserValid={handleUserValid} />;
      
      case 'form':
        if (!state.currentUser) return null;
        return (
          <UserFormPage
            onSubmit={handleFormSubmit}
            onBack={handleBack}
            initialData={state.userFormData}
          />
        );
      
      case 'followup':
        if (!state.currentUser || !followUpData) return null;
        return (
          <FollowUpQuestionsPage
            summary={followUpData.summary}
            questions={followUpData.questions}
            onSubmit={handleFollowUpSubmit}
            onSkip={handleSkipFollowUp}
            onBack={handleBack}
          />
        );
      
      case 'loading':
        return <LoadingPage />;
      
      case 'recommendations':
        if (!state.currentUser) return null;
        // boothData가 로딩 중이면 로딩 페이지 표시
        if (isBoothDataLoading) {
          console.log('⏳ boothData 로딩 중...');
          return <LoadingPage />;
        }
        // boothData가 비어있으면 에러 표시
        if (state.boothData.length === 0) {
          console.error('❌ boothData가 비어있습니다.');
          return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>오류 발생</h2>
              <p>부스 데이터를 불러오는데 실패했습니다.</p>
              <button onClick={() => window.location.reload()}>페이지 새로고침</button>
            </div>
          );
        }
        return (
          <MainPage
            user={state.currentUser}
            recommendations={state.recommendations}
            boothData={state.boothData}
            onBack={handleBack}
            onExit={handleExit}
          />
        );
      
      case 'map':
        if (!state.currentUser) return null;
        // boothData가 로딩 중이면 로딩 페이지 표시
        if (isBoothDataLoading) {
          return <LoadingPage />;
        }
        // boothData가 비어있으면 에러 표시
        if (state.boothData.length === 0) {
          return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>오류 발생</h2>
              <p>부스 데이터를 불러오는데 실패했습니다.</p>
              <button onClick={() => window.location.reload()}>페이지 새로고침</button>
            </div>
          );
        }
        return (
          <MapPage
            user={state.currentUser}
            recommendations={state.recommendations}
            onBack={handleBack}
          />
        );
      
      case 'survey':
        if (!state.currentUser) return null;
        return (
          <SurveyPage
            user={state.currentUser}
            onComplete={handleSurveyComplete}
          />
        );
      
      case 'complete':
        return <CompletePage />;
      
      case 'thankyou':
        return <ThankYouPage onComplete={handleThankYouComplete} />;
      
      case 'detail':
        if (!state.currentUser || !state.selectedBooth) return null;
        // 추천 리스트에서 해당 부스의 rationale을 찾음
        const selectedBooth = state.selectedBooth;
        const recommendation = state.recommendations.find(
          rec => rec.id === selectedBooth.id
        );
        return (
          <BoothDetailPage
            user={state.currentUser}
            booth={selectedBooth}
            rationale={recommendation?.rationale}
            onBack={handleBack}
            onUserUpdate={handleUserUpdate}
          />
        );
      
      default:
        return <LandingPage onUserValid={handleUserValid} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
      
      {/* 별점 수집 모달 */}
      {showExitRatingModal && (
        <ExitRatingModal
          onClose={handleExitRatingCancel}
          onSubmit={handleExitRatingSubmit}
        />
      )}
    </div>
  );
};

export default App;
