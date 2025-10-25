import React, { useState, useEffect } from 'react';
import { AppState, User, UserFormData } from './types';
import { loadBoothData } from './utils/dataLoader';
import { userService } from './services/supabase';
import { llmService } from './services/llm';
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

  useEffect(() => {
    // 부스 데이터 로드
    const loadData = async () => {
      try {
        const boothData = await loadBoothData();
        setState(prev => ({ ...prev, boothData }));
        
        // sessionStorage에서 상태 복원 시도
        const savedState = sessionStorage.getItem('appState');
        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            console.log('상태 복원:', parsedState);
            setState(prev => ({
              ...prev,
              currentUser: parsedState.currentUser,
              currentPage: parsedState.currentPage,
              recommendations: parsedState.recommendations || [],
              selectedBooth: parsedState.selectedBooth,
              boothData // 부스 데이터는 새로 로드한 것 사용
            }));
          } catch (error) {
            console.error('상태 복원 오류:', error);
            sessionStorage.removeItem('appState');
          }
        }
      } catch (error) {
        console.error('부스 데이터 로드 오류:', error);
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
        return;
      }

      if (userData.skipped_at || userData.additional_form_submitted_at) {
        // 완료된 사용자 - 메인 페이지로
        // 추천 결과가 있는 경우 파싱하여 전달
        const recommendations = userData.rec_result ? dedupeRecommendations(JSON.parse(userData.rec_result)) : [];
        
        console.log('완료된 사용자 로그인:', {
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
        
        // GPS 추적 시작
        await startGPSTracking(userData.user_id);
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

      // LLM API 호출 - 추가 답변까지 포함하여 추천 생성
      const visitorInfo = createVisitorInfo(
        state.currentUser,
        state.userFormData,
        questionAnswerPairs
      );
      console.log('=== App.tsx: 추천 생성 시작 (추가 질문 포함) ===');
      console.log('부스 데이터 개수:', state.boothData.length);
      
      const rawRecommendations = await llmService.getRecommendations(state.boothData, visitorInfo);
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

      // LLM API 호출 - 초기 폼만으로 추천 생성
      const visitorInfo = createVisitorInfo(
        state.currentUser,
        state.userFormData || { age: 0, gender: '', interests: {}, visitPurpose: '' },
        null
      );
      console.log('=== App.tsx: 추천 생성 시작 (스킵) ===');
      console.log('부스 데이터 개수:', state.boothData.length);
      
      const rawRecommendations = await llmService.getRecommendations(state.boothData, visitorInfo);
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

  const createVisitorInfo = (
    _user: User, 
    formData: UserFormData, 
    questionAnswerPairs: Array<{ question: string; answer: string }> | null
  ): string => {
    let info = `나이: ${formData.age}세\n`;
    info += `성별: ${formData.gender}\n`;
    info += `방문 목적: ${formData.visitPurpose}\n`;
    
    const interestEntries = formData.interests ? Object.entries(formData.interests) : [];
    
    if (interestEntries.length > 0) {
      info += '\n선택한 관심사:\n';
      for (const [subcategory, items] of interestEntries) {
        if (items && items.length > 0) {
          info += `  ${subcategory}: ${items.join(', ')}\n`;
        }
      }
    }
    
    // 추가 질문-답변 포함
    if (questionAnswerPairs && questionAnswerPairs.length > 0) {
      info += `\n\n추가 질문 및 답변:\n`;
      questionAnswerPairs.forEach((pair, index) => {
        info += `\nQ${index + 1}. ${pair.question}\n`;
        info += `A${index + 1}. ${pair.answer}\n`;
      });
    }
    
    console.log(info);
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
        // 추천 페이지에서 뒤로가기를 누르면 랜딩 페이지로 이동
        // GPS 추적 중지
        if (window.gpsService) {
          console.log('🛑 뒤로가기: GPS 추적 중지 중...');
          window.gpsService.stopTracking();
          window.gpsService = null;
        }
        
        return {
          ...prev,
          currentUser: null,
          recommendations: [],
          selectedBooth: null,
          currentPage: 'landing'
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
    
    // 퇴장 확인 모달 표시
    const confirmed = window.confirm('정말로 퇴장하시겠습니까?');
    
    if (confirmed) {
      console.log('✅ 사용자가 퇴장을 확인함');
      
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
      
      // 앱 초기화
      console.log('🔄 앱 상태 초기화 중...');
      setState({
        currentUser: null,
        userFormData: null,
        recommendations: [],
        boothData: [],
        currentPage: 'landing',
        selectedBooth: null,
        evaluation: null
      });
      console.log('✅ 앱 상태 초기화 완료');
    } else {
      console.log('❌ 사용자가 퇴장을 취소함');
    }
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
    </div>
  );
};

export default App;
