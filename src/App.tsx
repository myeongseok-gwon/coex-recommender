import React, { useState, useEffect } from 'react';
import { AppState, User, UserFormData, Booth } from './types';
import { loadBoothData } from './utils/dataLoader';
import { userService } from './services/supabase';
import { llmService } from './services/llm';
import LandingPage from './components/LandingPage';
import UserFormPage from './components/UserFormPage';
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
    evaluation: null
  });

  useEffect(() => {
    // 부스 데이터 로드
    const loadData = async () => {
      try {
        const boothData = await loadBoothData();
        setState(prev => ({ ...prev, boothData }));
      } catch (error) {
        console.error('부스 데이터 로드 오류:', error);
      }
    };
    
    loadData();
  }, []);

  // 추천 결과 중복 제거 (뒤 항목 제거 = 최초 항목 유지)
  const dedupeRecommendations = (list: any[]) => {
    const seen = new Set<number>();
    const result: any[] = [];
    for (const item of list || []) {
      const id = Number(item?.id);
      if (!Number.isFinite(id)) continue;
      if (!seen.has(id)) {
        seen.add(id);
        result.push(item);
      }
    }
    return result;
  };

  const handleUserValid = async (userId: number, hasRecommendation: boolean) => {
    try {
      // Admin 모드 처리 (userId === 0)
      if (userId === 0) {
        const adminUser: User = {
          user_id: 0,
          type: 'many_personal',
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

      // LLM API 호출
      const visitorInfo = createVisitorInfo(state.currentUser, formData);
      const rawRecommendations = await llmService.getRecommendations(state.boothData, visitorInfo);
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
    } catch (error) {
      console.error('폼 제출 오류:', error);
      alert('추천 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setState(prev => ({
        ...prev,
        currentPage: 'form'
      }));
    }
  };

  const createVisitorInfo = (user: User, formData: UserFormData): string => {
    let info = `나이: ${formData.age}세\n`;
    info += `성별: ${formData.gender}\n`;
    
    // 유저 타입에서 언더바 사이의 단어 추출 (예: abc_many_def -> "many")
    const typeMatch = user.type.match(/_(\w+)_/);
    const typeKeyword = typeMatch ? typeMatch[1] : '';
    
    // 관심사 정보 추가 (항상 표시)
    if (formData.interests && Object.keys(formData.interests).length > 0) {
      info += '\n선택한 관심사:\n';
      for (const [subcategory, items] of Object.entries(formData.interests)) {
        if (items && items.length > 0) {
          info += `  ${subcategory}: ${items.join(', ')}\n`;
        }
      }
    }
    
    // 기대사항 및 선호도 (few 타입일 경우 제외)
    if (typeKeyword !== 'few' && formData.details && formData.details.trim()) {
      info += `\n기대사항 및 선호도: ${formData.details}`;
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
