import React, { useState, useEffect } from 'react';
import { User, Recommendation, Booth } from '../types';
import { evaluationService, userService } from '../services/supabase';

interface RecommendationsPageProps {
  user: User;
  recommendations: Recommendation[];
  boothData: Booth[];
  onBoothClick: (booth: Booth) => void;
  onBack: () => void;
  onNavigateToMap: () => void;
  onNavigateToSurvey: (updatedUser: User) => void;
}

const DISPLAY_COUNT = 10;

const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  user,
  recommendations,
  boothData,
  onBoothClick,
  onBack,
  onNavigateToMap,
  onNavigateToSurvey
}) => {
  const [displayedRecommendations, setDisplayedRecommendations] = useState<Recommendation[]>([]);
  const [candidateRecommendations, setCandidateRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('=== RecommendationsPage useEffect ===');
    console.log('받은 추천 개수:', recommendations.length);
    console.log('받은 추천 데이터:', recommendations);
    
    // 삭제된 부스 ID 목록 가져오기
    const deletedBoothIds = new Set<string>();
    if (user.rec_eval) {
      try {
        const evalArray = JSON.parse(user.rec_eval);
        evalArray.forEach((item: any) => {
          if (item.is_deleted) {
            deletedBoothIds.add(item.id);
          }
        });
      } catch (e) {
        console.error('rec_eval 파싱 오류:', e);
      }
    }

    // 삭제되지 않은 추천만 필터링
    const activeRecommendations = recommendations.filter(rec => !deletedBoothIds.has(rec.id));
    console.log('삭제되지 않은 추천 개수:', activeRecommendations.length);
    
    // 초기 설정: 처음 10개는 표시, 나머지는 후보
    setDisplayedRecommendations(activeRecommendations.slice(0, DISPLAY_COUNT));
    setCandidateRecommendations(activeRecommendations.slice(DISPLAY_COUNT));
    console.log('표시할 추천 개수:', activeRecommendations.slice(0, DISPLAY_COUNT).length);
    console.log('후보 추천 개수:', activeRecommendations.slice(DISPLAY_COUNT).length);
  }, [recommendations, user.rec_eval]);

  const getBoothById = (id: string): Booth | undefined => {
    return boothData.find(booth => booth.id === id);
  };

  const getEvaluation = (boothId: string): { booth_rating?: number; rec_rating?: number } | null => {
    if (!user.rec_eval) return null;
    try {
      const evalArray = JSON.parse(user.rec_eval);
      const eval_item = evalArray.find((item: any) => item.id === boothId && !item.is_deleted);
      return eval_item || null;
    } catch (e) {
      return null;
    }
  };

  const handleDelete = async (rec: Recommendation) => {
    const confirmed = window.confirm('삭제하시겠습니까? 되돌릴 수 없습니다.');
    if (!confirmed) return;

    try {
      // evaluation 테이블에 삭제 기록 추가
      await evaluationService.deleteRecommendation(user.user_id, rec.id);

      // rec_eval에 삭제된 부스 정보 추가
      const currentEval = user.rec_eval ? JSON.parse(user.rec_eval) : [];
      const deletedBooth = { id: rec.id, is_deleted: true, deleted_at: new Date().toISOString() };
      
      // 기존에 삭제 기록이 있는지 확인
      const existingDeletedIndex = currentEval.findIndex((item: any) => item.id === rec.id && item.is_deleted);
      if (existingDeletedIndex >= 0) {
        currentEval[existingDeletedIndex] = deletedBooth;
      } else {
        currentEval.push(deletedBooth);
      }

      // 사용자 rec_eval 업데이트
      await userService.updateUserRecEval(user.user_id, JSON.stringify(currentEval));

      // 후보가 있으면 대체, 없으면 제거
      if (candidateRecommendations.length > 0) {
        const nextCandidate = candidateRecommendations[0];
        setCandidateRecommendations(prev => prev.slice(1));
        setDisplayedRecommendations(prev => {
          const filtered = prev.filter(r => r.id !== rec.id);
          return [...filtered, nextCandidate];
        });
      } else {
        setDisplayedRecommendations(prev => prev.filter(r => r.id !== rec.id));
      }
    } catch (error) {
      console.error('삭제 중 오류 발생:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 평가 완료 개수 계산
  const evaluatedCount = displayedRecommendations.filter(rec => {
    const evaluation = getEvaluation(rec.id);
    return evaluation && (evaluation.booth_rating || evaluation.rec_rating);
  }).length;

  const allEvaluationsComplete = evaluatedCount >= DISPLAY_COUNT;

  const handleFinishEvaluation = async () => {
    if (!allEvaluationsComplete) {
      alert('아직 평가가 완료되지 않은 부스가 있습니다.');
      return;
    }

    setLoading(true);
    try {
      await userService.updateEvaluationFinished(user.user_id);
      const updatedUser = {
        ...user,
        evaluation_finished_at: new Date().toISOString()
      };
      onNavigateToSurvey(updatedUser);
    } catch (error) {
      console.error('평가 완료 처리 오류:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const remainingDeletions = candidateRecommendations.length;
  const canDelete = remainingDeletions > 0;

  return (
    <div className="container">
      <div className="top-nav-bar">
        <div className="nav-left" onClick={onBack}>
          ← 뒤로가기
        </div>
        <div className="nav-right" onClick={onNavigateToMap}>
          지도 보기
        </div>
      </div>

      <div className="header">
        <h1>추천 부스</h1>
        <p>위에서부터 차례대로 추천된 부스입니다.</p>
        <div className="status-bar">
          <div className="deletion-counter">
            삭제 가능 횟수: {remainingDeletions}
          </div>
          <div className="evaluation-counter">
            평가 완료: {evaluatedCount} / {DISPLAY_COUNT}
          </div>
        </div>
        {allEvaluationsComplete && (
          <div className="completion-notice">
            <p>✓ 모든 평가가 완료되었습니다!</p>
            <button
              className="btn-finish-evaluation"
              onClick={handleFinishEvaluation}
              disabled={loading}
            >
              {loading ? '처리 중...' : '평가를 완료했습니다. 실험 종료로 이동하기'}
            </button>
          </div>
        )}
      </div>

      <div className="booth-list">
        {displayedRecommendations
          .map((rec) => {
          const booth = getBoothById(rec.id);
          if (!booth) return null;

          const evaluation = getEvaluation(rec.id);
          const isEvaluated = evaluation && (evaluation.booth_rating || evaluation.rec_rating);

          return (
            <div
              key={rec.id}
              className="booth-item"
            >
              {!isEvaluated && canDelete && (
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(rec);
                  }}
                  title="추천 삭제"
                >
                  ✕
                </button>
              )}
              <div onClick={() => onBoothClick(booth)}>
                <div className="booth-item-header">
                  <h3>{booth.company_name_kor}</h3>
                  <div className="evaluation-badge">
                    {isEvaluated && evaluation && (
                      <>
                        <span className="rating-label">부스: {evaluation.booth_rating || '-'}</span>
                        <span className="rating-label">추천: {evaluation.rec_rating || '-'}</span>
                      </>
                    ) }
                  </div>
                </div>
                <p>
                  {rec.rationale}
                </p>
                {booth.products && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    제품: {booth.products}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .top-nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1976d2;
          color: white;
          padding: 16px 24px;
          margin: 0 0 20px 0;
          border-bottom: 3px solid #1565c0;
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

        .status-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .deletion-counter {
          margin-top: 12px;
          padding: 8px 16px;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          text-align: center;
          flex: 1;
          min-width: 150px;
        }

        .evaluation-counter {
          margin-top: 12px;
          padding: 8px 16px;
          background: #e3f2fd;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1976d2;
          text-align: center;
          flex: 1;
          min-width: 150px;
        }

        .completion-notice {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          border-radius: 12px;
          text-align: center;
          color: white;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .completion-notice p {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .btn-finish-evaluation {
          background: white;
          color: #4caf50;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .btn-finish-evaluation:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .btn-finish-evaluation:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .booth-item {
          position: relative;
        }

        .delete-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border: none;
          background: #ff5252;
          color: white;
          border-radius: 50%;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .delete-button:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }

        .delete-button:active {
          transform: scale(0.95);
        }

        .booth-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .booth-item-header h3 {
          flex: 1;
          margin: 0;
          padding-right: 32px;
        }

        .evaluation-badge {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          white-space: nowrap;
        }

        .rating-label {
          background: #1976d2;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .rating-undone {
          background: #e0e0e0;
          color: #666;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RecommendationsPage;
