import React, { useState } from 'react';
import { User, Recommendation, Booth } from '../types';
import { evaluationService, userService } from '../services/supabase';
import { hasLongCompanyName } from '../utils/companyName';

interface RecommendationsPageProps {
  user: User;
  recommendations: Recommendation[];
  boothData: Booth[];
  onBoothClick: (booth: Booth) => void;
  onBack: () => void;
  onNavigateToMap: () => void;
  onNavigateToSurvey: (updatedUser: User) => void;
}

const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  user,
  recommendations,
  boothData,
  onBoothClick,
  onBack,
  onNavigateToMap,
  onNavigateToSurvey
}) => {
  // 연결된 입력 항목들을 분석하는 함수
  const getConnectedInputs = (): string[] => {
    const connectedInputs: string[] = [];
    
    console.log('=== getConnectedInputs 디버깅 ===');
    console.log('사용자 데이터:', user);
    console.log('사용자 나이:', user.age);
    console.log('사용자 성별:', user.gender);
    console.log('사용자 구체적 목표:', user.specific_goal);
    console.log('사용자 관심사:', user.interests);
    console.log('새로운 필드들:', {
      has_children: user.has_children,
      child_interests: user.child_interests,
      has_pets: user.has_pets,
      pet_types: user.pet_types,
      has_allergies: user.has_allergies,
      allergies: user.allergies
    });
    
    // 기본 정보
    if (user.age) {
      connectedInputs.push(`나이: ${user.age}세`);
      console.log('나이 추가됨:', `나이: ${user.age}세`);
    }
    if (user.gender) {
      connectedInputs.push(`성별: ${user.gender}`);
      console.log('성별 추가됨:', `성별: ${user.gender}`);
    }
    
    // 구체적 목표
    if (user.specific_goal) {
      connectedInputs.push(`목표: ${user.specific_goal}`);
      console.log('목표 추가됨:', `목표: ${user.specific_goal}`);
    }
    
    // 관심사
    if (user.interests) {
      Object.entries(user.interests).forEach(([category, items]) => {
        if (items && items.length > 0) {
          const interestText = `${category}: ${items.join(', ')}`;
          connectedInputs.push(interestText);
          console.log('관심사 추가됨:', interestText);
        }
      });
    }
    
    // 새로운 선택 항목들
    if (user.has_children) {
      connectedInputs.push('자녀가 있어요');
      console.log('자녀 추가됨: 자녀가 있어요');
      if (user.child_interests && user.child_interests.length > 0) {
        const childInterestText = `자녀 관심사: ${user.child_interests.join(', ')}`;
        connectedInputs.push(childInterestText);
        console.log('자녀 관심사 추가됨:', childInterestText);
      }
    }
    if (user.has_pets) {
      connectedInputs.push('반려동물이 있어요');
      console.log('반려동물 추가됨: 반려동물이 있어요');
      if (user.pet_types && user.pet_types.length > 0) {
        const petText = `반려동물: ${user.pet_types.join(', ')}`;
        connectedInputs.push(petText);
        console.log('반려동물 종류 추가됨:', petText);
      }
    }
    if (user.has_allergies) {
      connectedInputs.push('알러지가 있어요');
      console.log('알러지 추가됨: 알러지가 있어요');
      if (user.allergies) {
        const allergyText = `알러지: ${user.allergies}`;
        connectedInputs.push(allergyText);
        console.log('알러지 정보 추가됨:', allergyText);
      }
    }
    if (!user.has_children && !user.has_pets && !user.has_allergies) {
      connectedInputs.push('해당 사항 없어요');
      console.log('해당 사항 없음 추가됨: 해당 사항 없어요');
    }
    
    console.log('최종 연결된 입력 항목들:', connectedInputs);
    console.log('연결된 입력 항목 개수:', connectedInputs.length);
    return connectedInputs;
  };
  const [loading, setLoading] = useState(false);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; boothId: string | null }>({ isOpen: false, boothId: null });
  const [reportReason, setReportReason] = useState<string>('');

  // 삭제된 부스 ID 목록 가져오기
  const getDeletedBoothIds = (): Set<string> => {
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
    return deletedBoothIds;
  };

  // 삭제되지 않은 추천만 필터링
  const getActiveRecommendations = (): Recommendation[] => {
    const deletedBoothIds = getDeletedBoothIds();
    return recommendations.filter(rec => !deletedBoothIds.has(rec.id));
  };

  const getBoothById = (id: string): Booth | undefined => {
    const booth = boothData.find(booth => booth.id === id);
    if (!booth) {
      console.log(`부스 ${id}를 찾을 수 없습니다. 전체 부스 ID 목록:`, boothData.map(b => b.id).slice(0, 10));
    }
    return booth;
  };

  const getEvaluation = (boothId: string): { booth_rating?: number; rec_rating?: number; is_irrelevant?: boolean; is_booth_wrong_info?: boolean } | null => {
    if (!user.rec_eval) return null;
    try {
      const evalArray = JSON.parse(user.rec_eval);
      const eval_item = evalArray.find((item: any) => item.id === boothId && !item.is_deleted);
      return eval_item || null;
    } catch (e) {
      return null;
    }
  };

  const handleReport = (boothId: string) => {
    setReportModal({ isOpen: true, boothId });
    setReportReason('');
  };

  const handleReportSubmit = async () => {
    if (!reportModal.boothId || !reportReason) return;

    try {
      // evaluation 테이블에 신고 기록 추가
      await evaluationService.updateEvaluation(user.user_id, reportModal.boothId, {
        is_irrelevant: reportReason === 'irrelevant',
        is_booth_wrong_info: reportReason === 'wrong_info'
      });

      // rec_eval에 신고 정보 추가
      const currentEval = user.rec_eval ? JSON.parse(user.rec_eval) : [];
      const reportData = {
        id: reportModal.boothId,
        is_irrelevant: reportReason === 'irrelevant',
        is_booth_wrong_info: reportReason === 'wrong_info',
        reported_at: new Date().toISOString()
      };
      
      // 기존 평가 항목 찾기 및 업데이트
      const existingIndex = currentEval.findIndex((item: any) => item.id === reportModal.boothId && !item.is_deleted);
      if (existingIndex >= 0) {
        currentEval[existingIndex] = { ...currentEval[existingIndex], ...reportData };
      } else {
        currentEval.push(reportData);
      }

      // 사용자 rec_eval 업데이트
      await userService.updateUserRecEval(user.user_id, JSON.stringify(currentEval));

      // 모달 닫기
      setReportModal({ isOpen: false, boothId: null });
      setReportReason('');
    } catch (error) {
      console.error('신고 처리 중 오류 발생:', error);
      alert('신고 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReportCancel = () => {
    setReportModal({ isOpen: false, boothId: null });
    setReportReason('');
  };

  // 평가 완료 개수 계산
  const evaluatedCount = getActiveRecommendations().filter(rec => {
    const evaluation = getEvaluation(rec.id);
    return evaluation && (evaluation.booth_rating || evaluation.rec_rating);
  }).length;

  const allEvaluationsComplete = evaluatedCount >= getActiveRecommendations().length;

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
          <div className="evaluation-counter">
            평가 완료: {evaluatedCount} / {getActiveRecommendations().length}
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
        {(() => {
          const activeRecommendations = getActiveRecommendations();
          console.log('렌더링 시 activeRecommendations.length:', activeRecommendations.length);
          console.log('렌더링 시 recommendations.length:', recommendations.length);
          console.log('렌더링 시 boothData.length:', boothData.length);
          return null;
        })()}
        {getActiveRecommendations().length === 0 ? (
          <div className="no-recommendations">
            <p>추천이 없습니다.</p>
            <p>전체 추천 개수: {recommendations.length}</p>
            <p>부스 데이터 개수: {boothData.length}</p>
          </div>
        ) : (
          getActiveRecommendations().map((rec) => {
            const booth = getBoothById(rec.id);
            if (!booth) {
              console.log(`부스 ${rec.id}를 찾을 수 없습니다.`);
              // 임시로 부스 정보 없이도 표시
              return (
                <div key={rec.id} className="booth-item">
                  <div className="booth-item-header">
                    <h3>부스 {rec.id} (정보 없음)</h3>
                    <div className="similarity-badge">
                      유사도: {rec.similarity !== undefined ? (rec.similarity * 100).toFixed(1) : 'N/A'}%
                    </div>
                  </div>
                  <p>{rec.rationale}</p>
                </div>
              );
            }

            const evaluation = getEvaluation(rec.id);
            const isEvaluated = evaluation && (evaluation.booth_rating || evaluation.rec_rating);
            const isReported = evaluation && (evaluation.is_irrelevant || evaluation.is_booth_wrong_info);
            
            // 유사도 디버깅
            console.log(`부스 ${rec.id} 유사도:`, rec.similarity);
          
          // 디버깅용 로그
          console.log(`부스 ${rec.id}:`, {
            evaluation,
            isEvaluated,
            isReported,
            shouldShowReport: !isReported
          });

          return (
            <div
              key={rec.id}
              className="booth-item"
            >
              {/* 신고 버튼 */}
              <button
                className="report-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReport(rec.id);
                }}
                title="신고하기"
              >
                ⚠️
              </button>
              {isReported && (
                <div className="report-status">
                  {evaluation?.is_irrelevant ? '관심 없어요' : '잘못된 설명'}
                </div>
              )}
              <div onClick={() => onBoothClick(booth)}>
                <div className="booth-item-header">
                  <div className="booth-title-row">
                    <h3 className={hasLongCompanyName(booth.company_name_kor) ? 'long-name' : ''}>{booth.company_name_kor}</h3>
                    <div className="similarity-badge">
                      일치도: {rec.similarity !== undefined ? (rec.similarity * 100).toFixed(1) : 'N/A'}%
                    </div>
                  </div>
                  
                  {/* 연결된 입력 항목들 */}
                  <div className="connected-inputs">
                    <div className="connected-inputs-label">연결된 입력:</div>
                    <div className="input-chips">
                      {(() => {
                        const inputs = getConnectedInputs();
                        console.log('렌더링 시 연결된 입력 항목들:', inputs);
                        console.log('렌더링 시 입력 항목 개수:', inputs.length);
                        return inputs.map((input, index) => (
                          <span key={index} className="input-chip">
                            {input}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                  
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
          })
        )}
      </div>

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>신고하기</h3>
            <p>이 추천에 대해 신고하시겠습니까?</p>
            <div className="report-options">
              <label className="report-option">
                <input
                  type="radio"
                  name="reportReason"
                  value="irrelevant"
                  checked={reportReason === 'irrelevant'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span>관심 없는 부스입니다</span>
              </label>
              <label className="report-option">
                <input
                  type="radio"
                  name="reportReason"
                  value="wrong_info"
                  checked={reportReason === 'wrong_info'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span>추천 이유와 실제 부스가 달랐습니다</span>
              </label>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={handleReportCancel}
              >
                취소
              </button>
              <button
                className="btn-submit"
                onClick={handleReportSubmit}
                disabled={!reportReason}
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}

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
          right: 44px;
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

        .booth-item-header h3.long-name {
          font-size: 1.0rem;
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

        .report-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border: none;
          background: #ff9800;
          color: white;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex !important;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          opacity: 1;
        }

        .report-button:hover {
          background: #f57c00;
          transform: scale(1.1);
        }

        .report-button:active {
          transform: scale(0.95);
        }

        .report-status {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ff5722;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          z-index: 10;
          white-space: nowrap;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .modal-content h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }

        .modal-content p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }

        .report-options {
          margin-bottom: 24px;
        }

        .report-option {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .report-option:hover {
          border-color: #1976d2;
          background: #f5f5f5;
        }

        .report-option input[type="radio"] {
          margin-right: 12px;
          transform: scale(1.2);
        }

        .report-option input[type="radio"]:checked + span {
          font-weight: 600;
          color: #1976d2;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-cancel {
          background: #e0e0e0;
          color: #666;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: #d0d0d0;
        }

        .btn-submit {
          background: #1976d2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-submit:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .similarity-badge {
          background: linear-gradient(135deg, #4caf50, #66bb6a);
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          margin-left: 12px;
          box-shadow: 0 3px 6px rgba(76, 175, 80, 0.4);
          display: inline-block;
          min-width: 80px;
          text-align: center;
        }

        /* 연결된 입력 항목 스타일 */
        .booth-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .connected-inputs {
          margin: 12px 0;
        }

        .connected-inputs-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .input-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .input-chip {
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #90caf9;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default RecommendationsPage;
