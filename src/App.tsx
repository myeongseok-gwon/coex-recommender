import React, { useState, useEffect } from 'react';
import { AppState, User, UserFormData, Booth } from './types';
import { loadBoothData } from './utils/dataLoader';
import { userService } from './services/supabase';
import { llmService } from './services/llm';
import LandingPage from './components/LandingPage';
import UserFormPage from './components/UserFormPage';
import FollowUpQuestionsPage from './components/FollowUpQuestionsPage';
import LoadingPage from './components/LoadingPage';
import RecommendationsPage from './components/RecommendationsPage';
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
    userFormData: undefined
  });

  const [followUpData, setFollowUpData] = useState<{ summary: string; questions: string[] } | null>(null);

  useEffect(() => {
    // 부스 데이터 로드
    const loadData = async () => {
      try {
        console.log('=== 부스 데이터 로드 시작 ===');
        const boothData = await loadBoothData();
        console.log('로드된 부스 데이터 개수:', boothData.length);
        console.log('부스 데이터 첫 3개:', boothData.slice(0, 3));
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

  const handleUserValid = async (userId: number, hasRecommendation: boolean) => {
    try {
      // Admin 모드 처리 (userId === 0)
      if (userId === 0) {
        const adminUser: User = {
          user_id: 0,
          type: 'C',
        };
        
        setState(prev => ({
          ...prev,
          currentUser: adminUser,
          recommendations: [],
          currentPage: 'map'
        }));
        return;
      }

      // 데이터베이스에서 사용자 정보 조회
      const userData = await userService.getUser(userId);
      
      if (!userData) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // started_at 업데이트 (아직 업데이트되지 않은 경우에만)
      if (!userData.started_at) {
        await userService.updateUserStartedAt(userId);
      }

      // 실험 완료 확인
      if (userData.survey_finished_at) {
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          currentPage: 'complete'
        }));
        return;
      }

      // 평가 완료, 서베이 미완료
      if (userData.evaluation_finished_at && !userData.survey_finished_at) {
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          currentPage: 'survey'
        }));
        return;
      }

      if (hasRecommendation) {
        // 이미 추천이 있는 경우, 추천 결과를 파싱하여 바로 추천 페이지로 이동
        const parsed = userData.rec_result ? JSON.parse(userData.rec_result) : [];
        const recommendations = dedupeRecommendations(parsed);
        
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          recommendations,
          currentPage: 'recommendations'
        }));
      } else {
        // 추천이 없는 경우, 폼 페이지로 이동
        setState(prev => ({
          ...prev,
          currentUser: userData as User,
          currentPage: 'form'
        }));
      }
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
      
      // 로딩 페이지로 이동
      setState(prev => ({
        ...prev,
        currentPage: 'loading'
      }));

      // LLM API 호출 - Type A는 추가 질문-답변 없이 추천
      const visitorInfo = createVisitorInfo(state.currentUser, formData, null);
      console.log('=== App.tsx: 추천 생성 시작 (Type A) ===');
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
      console.error('폼 제출 오류:', error);
      alert('추천 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setState(prev => ({
        ...prev,
        currentPage: 'form'
      }));
    }
  };

  const handleFormNext = async (formData: UserFormData) => {
    if (!state.currentUser) return;

    try {
      // 사용자 정보 업데이트
      await userService.updateUserFormData(state.currentUser.user_id, formData);
      
      // 로딩 페이지로 이동
      setState(prev => ({
        ...prev,
        userFormData: formData,
        currentPage: 'loading'
      }));

      // LLM API 호출하여 추가 질문 생성
      const visitorInfo = createVisitorInfo(state.currentUser, formData, null);
      const followUpResult = await llmService.generateFollowUpQuestions(visitorInfo);
      
      // 추가 질문을 데이터베이스에 저장
      await userService.updateFollowUpQuestions(
        state.currentUser.user_id,
        JSON.stringify(followUpResult.questions)
      );

      setFollowUpData(followUpResult);
      
      setState(prev => ({
        ...prev,
        currentPage: 'followup'
      }));
    } catch (error) {
      console.error('추가 질문 생성 오류:', error);
      alert('추가 질문 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setState(prev => ({
        ...prev,
        currentPage: 'form'
      }));
    }
  };

  const handleFollowUpSubmit = async (questionAnswerPairs: Array<{ question: string; answer: string }>) => {
    if (!state.currentUser || !state.userFormData) return;

    try {
      // Type B, C 모두 question-answer pairs 저장
      await userService.updateFollowUpAnswers(
        state.currentUser.user_id, 
        JSON.stringify(questionAnswerPairs)
      );
      
      // 로딩 페이지로 이동
      setState(prev => ({
        ...prev,
        currentPage: 'loading'
      }));

      // LLM API 호출
      // Type B: 추가 답변을 받았지만 LLM에는 전달하지 않음 (첫 페이지 정보만)
      // Type C: 추가 답변까지 LLM에 전달 (정교한 추천)
      const visitorInfo = createVisitorInfo(
        state.currentUser,
        state.userFormData,
        state.currentUser.type === 'C' ? questionAnswerPairs : null
      );
      console.log(`=== App.tsx: 추천 생성 시작 (Type ${state.currentUser.type}) ===`);
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
    user: User, 
    formData: UserFormData, 
    questionAnswerPairs: Array<{ question: string; answer: string }> | null
  ): string => {
    let info = `나이: ${formData.age}세\n`;
    info += `성별: ${formData.gender}\n`;
    
    // Type A: 제한된 카테고리
    // Type B: 모든 카테고리 (추가 답변 제외)
    // Type C: 모든 카테고리 + 추가 질문-답변
    const interestEntries = formData.interests ? Object.entries(formData.interests) : [];
    
    if (interestEntries.length > 0) {
      // 모든 타입에서 전체 관심사 포함
      info += '\n선택한 관심사:\n';
      for (const [subcategory, items] of interestEntries) {
        if (items && items.length > 0) {
          info += `  ${subcategory}: ${items.join(', ')}\n`;
        }
      }
    }
    
    // Type C만: 추가 질문-답변 포함
    if (user.type === 'C' && questionAnswerPairs && questionAnswerPairs.length > 0) {
      info += `\n\n추가 질문 및 답변:\n`;
      questionAnswerPairs.forEach((pair, index) => {
        info += `\nQ${index + 1}. ${pair.question}\n`;
        info += `A${index + 1}. ${pair.answer}\n`;
      });
    }
    
    console.log(info);
    return info;
  };

  const handleBoothClick = (booth: Booth) => {
    setState(prev => ({
      ...prev,
      selectedBooth: booth,
      currentPage: 'detail'
    }));
  };

  const handleUserUpdate = (updatedUser: User) => {
    setState(prev => ({
      ...prev,
      currentUser: updatedUser
    }));
  };

  const handleNavigateToMap = () => {
    setState(prev => ({
      ...prev,
      currentPage: 'map'
    }));
  };

  const handleNavigateToSurvey = (updatedUser: User) => {
    setState(prev => ({
      ...prev,
      currentUser: updatedUser,
      currentPage: 'survey'
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

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'landing':
        return <LandingPage onUserValid={handleUserValid} />;
      
      case 'form':
        if (!state.currentUser) return null;
        return (
          <UserFormPage
            user={state.currentUser}
            onSubmit={handleFormSubmit}
            onNext={handleFormNext}
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
            onBack={handleBack}
          />
        );
      
      case 'loading':
        return <LoadingPage />;
      
      case 'recommendations':
        if (!state.currentUser) return null;
        return (
          <RecommendationsPage
            user={state.currentUser}
            recommendations={state.recommendations}
            boothData={state.boothData}
            onBoothClick={handleBoothClick}
            onBack={handleBack}
            onNavigateToMap={handleNavigateToMap}
            onNavigateToSurvey={handleNavigateToSurvey}
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
        return (
          <BoothDetailPage
            user={state.currentUser}
            booth={state.selectedBooth}
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
