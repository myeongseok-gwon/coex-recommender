import React, { useState, useEffect } from 'react';
import { User, Recommendation, Booth } from '../types';
import BoothSearch from './BoothSearch';
import BoothRating from './BoothRating';
import MapPage from './MapPage';
import { evaluationService } from '../services/supabase';

interface MainPageProps {
  user: User;
  recommendations: Recommendation[];
  boothData: Booth[];
  onBack: () => void;
  onExit: () => void;
}

type TabType = 'recommendations' | 'evaluation' | 'map';

const MainPage: React.FC<MainPageProps> = ({
  user,
  recommendations,
  boothData,
  onBack,
  onExit
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('recommendations');
  const [showBoothSearch, setShowBoothSearch] = useState(false);
  const [selectedBoothForRating, setSelectedBoothForRating] = useState<Booth | null>(null);
  const [evaluatedBooths, setEvaluatedBooths] = useState<{booth: Booth, rating: number}[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  
  // 사용자가 완료된 상태인지 확인 (퇴장 후 재입장 시 평가 추가 방지)
  const isUserCompleted = user.skipped_at || user.additional_form_submitted_at;

  // 사용자 상호작용 시 GPS 전송
  const handleUserInteraction = async () => {
    // 완료된 사용자는 GPS 전송하지 않음
    if (isUserCompleted) {
      console.log('⏭️ 완료된 사용자 - GPS 전송 건너뜀');
      return;
    }
    
    console.log('👆 handleUserInteraction 호출됨', { 
      hasGpsService: !!window.gpsService,
      gpsServiceUserId: window.gpsService?.userId 
    });
    
    if (window.gpsService) {
      try {
        console.log('👆 사용자 상호작용 감지 - GPS 전송');
        await window.gpsService.sendCurrentLocation();
        console.log('✅ GPS 전송 성공');
      } catch (error: any) {
        console.error('❌ 사용자 상호작용 GPS 전송 실패:', error);
        // GPS 전송 실패는 조용히 처리 (팝업 없음)
      }
    } else {
      console.error('❌ GPS 서비스가 없습니다');
      // GPS 서비스 없음도 조용히 처리 (팝업 없음)
    }
  };


  // 기존 평가 데이터 로드
  useEffect(() => {
    const loadExistingEvaluations = async () => {
      try {
        setLoadingEvaluations(true);
        const evaluations = await evaluationService.getAllEvaluations(user.user_id);
        
        // 평가된 부스들의 정보를 가져와서 상태 업데이트
        const evaluatedBoothsWithRatings = evaluations
          .filter(evaluation => evaluation.booth_rating && evaluation.ended_at) // 완료된 평가만
          .map(evaluation => {
            const booth = boothData.find(b => b.id === evaluation.booth_id);
            if (booth && evaluation.booth_rating) {
              return { booth, rating: evaluation.booth_rating };
            }
            return null;
          })
          .filter((item): item is {booth: Booth, rating: number} => item !== null);
        
        setEvaluatedBooths(evaluatedBoothsWithRatings);
        console.log('기존 평가 데이터 로드 완료:', evaluatedBoothsWithRatings.length, '개');
      } catch (error) {
        console.error('평가 데이터 로드 오류:', error);
      } finally {
        setLoadingEvaluations(false);
      }
    };

    if (user.user_id && boothData.length > 0) {
      loadExistingEvaluations();
    }
  }, [user.user_id, boothData]);

  const handleBoothSelect = (booth: Booth) => {
    setSelectedBoothForRating(booth);
    setShowBoothSearch(false);
  };

  const handleBoothRate = async (rating: number) => {
    if (!selectedBoothForRating) return;

    try {
      await evaluationService.startEvaluation(user.user_id, selectedBoothForRating.id);
      await evaluationService.updateEvaluation(user.user_id, selectedBoothForRating.id, {
        booth_rating: rating,
        ended_at: new Date().toISOString()
      });

      // 평가된 부스 목록에 추가 (평점 포함)
      setEvaluatedBooths(prev => {
        // 이미 평가된 부스인지 확인
        const existingIndex = prev.findIndex(item => item.booth.id === selectedBoothForRating.id);
        if (existingIndex >= 0) {
          // 기존 평가 업데이트
          const updated = [...prev];
          updated[existingIndex] = { booth: selectedBoothForRating, rating };
          return updated;
        } else {
          // 새로운 평가 추가
          return [...prev, { booth: selectedBoothForRating, rating }];
        }
      });
      setSelectedBoothForRating(null);
    } catch (error) {
      console.error('평가 저장 오류:', error);
      alert('평가 저장 중 오류가 발생했습니다.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return (
          <div className="tab-content">
            {isUserCompleted && (
              <div className="recommendations-header">
                <div className="recommendations-info">
                  <h2>📋 이전에 받은 추천</h2>
                  <p>이전에 받았던 부스 추천을 확인하실 수 있습니다.</p>
                </div>
              </div>
            )}
            {recommendations.length > 0 ? (
              <div className="recommendations-list">
                {recommendations.map((rec) => {
                  const booth = boothData.find(b => b.id === rec.id);
                  if (!booth) return null;

                  return (
                    <div key={rec.id} className="recommendation-item">
                      <div className="booth-info">
                        <h3>{booth.company_name_kor}</h3>
                        <p className="booth-category">{booth.category}</p>
                        {booth.products && (
                          <p className="booth-products">{booth.products}</p>
                        )}
                      </div>
                      <div className="rationale">
                        <p>{rec.rationale}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-recommendations">
                <h3>추천 결과가 없습니다</h3>
                {isUserCompleted ? (
                  <p>이전에 받았던 추천 데이터를 찾을 수 없습니다. 시스템 관리자에게 문의해주세요.</p>
                ) : (
                  <p>아직 추천을 받지 못했습니다. 잠시 후 다시 시도해주세요.</p>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={onBack}
                >
                  {isUserCompleted ? '돌아가기' : '다시 시작하기'}
                </button>
              </div>
            )}
          </div>
        );

      case 'evaluation':
        return (
          <div className="tab-content">
            <div className="evaluation-section">
              {!isUserCompleted ? (
                <button 
                  className="btn btn-primary add-evaluation-btn"
                  onClick={() => setShowBoothSearch(true)}
                >
                  + 부스 평가 추가하기
                </button>
              ) : (
                <div className="completed-user-message">
                  <div className="message-icon">✅</div>
                  <h3>평가가 완료되었습니다</h3>
                  <p>이미 모든 평가를 완료하셨습니다. 평가한 부스들을 확인하실 수 있습니다.</p>
                </div>
              )}
              <div className="evaluated-booths">
                <h3>평가한 부스들</h3>
                <div className="evaluated-list">
                  {loadingEvaluations ? (
                    <div className="loading-evaluations">
                      <p>평가 데이터를 불러오는 중...</p>
                    </div>
                  ) : evaluatedBooths.length > 0 ? (
                    <div className="evaluated-booths-list">
                      {evaluatedBooths.map(({booth, rating}) => (
                        <div key={booth.id} className="evaluated-booth-item">
                          <div className="booth-header">
                            <h4>{booth.company_name_kor}</h4>
                            <div className="rating-display">
                              <span className="rating-stars">
                                {'⭐'.repeat(rating)}
                                {'☆'.repeat(5 - rating)}
                              </span>
                              <span className="rating-number">({rating}/5)</span>
                            </div>
                          </div>
                          <p className="booth-category">{booth.category}</p>
                          <p className="booth-products">{booth.products}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-evaluations">아직 평가한 부스가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'map':
        return (
          <MapPage
            user={user}
            recommendations={recommendations}
            onBack={onBack}
          />
        );

      default:
        return null;
    }
  };


  return (
    <div className="container">
      <div className="top-nav-bar">
        <div className="nav-left" onClick={onBack}>
          ← 뒤로가기
        </div>
        {!isUserCompleted && (
          <div className="nav-right" onClick={onExit}>
            퇴장
          </div>
        )}
      </div>



      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recommendations');
            handleUserInteraction();
          }}
        >
          추천
        </button>
        <button 
          className={`tab-button ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('evaluation');
            handleUserInteraction();
          }}
        >
          평가
        </button>
        <button 
          className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('map');
            handleUserInteraction();
          }}
        >
          지도
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {renderTabContent()}

      {/* 모달들 */}
      {showBoothSearch && (
        <BoothSearch
          boothData={boothData}
          onBoothSelect={handleBoothSelect}
          onClose={() => setShowBoothSearch(false)}
        />
      )}

      {selectedBoothForRating && (
        <BoothRating
          booth={selectedBoothForRating}
          onRate={handleBoothRate}
          onClose={() => setSelectedBoothForRating(null)}
        />
      )}

      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .top-nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1976d2;
          color: white;
          padding: 16px 24px;
          margin: 0 0 20px 0;
          border-bottom: 3px solid #1565c0;
          border-radius: 8px;
        }

        .nav-left {
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .nav-left:hover {
          opacity: 0.8;
        }

        .nav-right {
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .nav-right:hover {
          opacity: 0.8;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #1976d2;
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .tab-navigation {
          display: flex;
          background: #f5f5f5;
          border-radius: 12px;
          padding: 8px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab-button {
          flex: 1;
          padding: 16px 24px;
          border: none;
          background: transparent;
          font-size: 1.1rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .tab-button:hover {
          background: rgba(25, 118, 210, 0.1);
          color: #1976d2;
        }

        .tab-button.active {
          background: #1976d2;
          color: white;
          box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
        }

        .tab-content {
          min-height: 500px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .recommendation-item {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: default;
        }

        .booth-info h3 {
          color: #1976d2;
          font-size: 1.3rem;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .booth-category {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .booth-products {
          color: #333;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }

        .rationale {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .rationale p {
          color: #333;
          line-height: 1.6;
          margin: 0;
        }

        .evaluation-section {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .add-evaluation-btn {
          align-self: center;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .evaluated-booths h3 {
          color: #1976d2;
          font-size: 1.3rem;
          margin-bottom: 16px;
        }

        .evaluated-list {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
          min-height: 200px;
        }

        .no-evaluations {
          text-align: center;
          color: #666;
          font-style: italic;
          margin: 40px 0;
        }

        .loading-evaluations {
          text-align: center;
          color: #1976d2;
          margin: 40px 0;
          font-weight: 500;
        }

        .evaluated-booths-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .evaluated-booth-item {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
        }

        .booth-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }

        .booth-header h4 {
          margin: 0;
          color: #1976d2;
          font-size: 1.1rem;
          flex: 1;
        }

        .rating-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .rating-stars {
          font-size: 1.2rem;
          line-height: 1;
        }

        .rating-number {
          font-size: 0.8rem;
          color: #666;
          font-weight: 600;
        }

        .evaluated-booth-item .booth-category {
          margin: 0 0 4px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .evaluated-booth-item .booth-products {
          margin: 0;
          color: #333;
          font-size: 0.9rem;
        }


        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: white;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
        }

        .no-recommendations {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .no-recommendations h3 {
          color: #1976d2;
          font-size: 1.5rem;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .no-recommendations p {
          color: #666;
          font-size: 1rem;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .completed-user-message {
          background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
          border: 2px solid #4caf50;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
        }

        .message-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .completed-user-message h3 {
          color: #2e7d32;
          font-size: 1.3rem;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .completed-user-message p {
          color: #4caf50;
          font-size: 1rem;
          margin: 0;
          line-height: 1.5;
        }

        .recommendations-header {
          background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
          border: 2px solid #2196f3;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
        }

        .recommendations-info h2 {
          color: #1976d2;
          font-size: 1.4rem;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .recommendations-info p {
          color: #1976d2;
          font-size: 1rem;
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default MainPage;
