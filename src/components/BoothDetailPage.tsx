import React, { useState, useEffect } from 'react';
import { User, Booth, Evaluation } from '../types';
import { evaluationService, userService } from '../services/supabase';

interface BoothDetailPageProps {
  user: User;
  booth: Booth;
  onBack: () => void;
  onUserUpdate: (user: User) => void;
}

const BoothDetailPage: React.FC<BoothDetailPageProps> = ({ user, booth, onBack, onUserUpdate }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  
  // 평가 상태
  const [boothRating, setBoothRating] = useState(0);
  const [recRating, setRecRating] = useState(0);
  const [isBoothWrongInfo, setIsBoothWrongInfo] = useState(false);
  const [isIrrelevant, setIsIrrelevant] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    checkEvaluation();
  }, []);

  const checkEvaluation = async () => {
    try {
      const existingEvaluation = await evaluationService.getEvaluation(user.user_id, booth.id);
      setEvaluation(existingEvaluation);
    } catch (error) {
      console.error('평가 정보 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluation = async () => {
    try {
      const newEvaluation = {
        user_id: user.user_id,
        booth_id: booth.id,
        started_at: new Date().toISOString()
      };
      
      await evaluationService.createEvaluation(newEvaluation);
      setEvaluation(newEvaluation as Evaluation);
    } catch (error) {
      console.error('평가 시작 오류:', error);
      alert('평가를 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const handleEndEvaluation = () => {
    setShowRatingModal(true);
    setModalStep(1);
    setBoothRating(0);
    setRecRating(0);
    setIsBoothWrongInfo(false);
    setIsIrrelevant(false);
    setIsCorrect(false);
  };

  const handleStep1Next = () => {
    if (boothRating === 0) {
      alert('부스 만족도를 선택해주세요.');
      return;
    }
    setModalStep(2);
  };

  const handleStep2Submit = async () => {
    if (recRating === 0) {
      alert('추천 만족도를 선택해주세요.');
      return;
    }

    try {
      // evaluation 테이블 업데이트
      await evaluationService.updateEvaluation(user.user_id, booth.id, {
        booth_rating: boothRating,
        rec_rating: recRating,
        is_booth_wrong_info: isBoothWrongInfo,
        is_irrelevant: isIrrelevant,
        is_correct: isCorrect,
        ended_at: new Date().toISOString()
      });
      
      // 모든 평가 데이터를 가져와서 rec_eval 업데이트
      try {
        const allEvaluations = await evaluationService.getAllEvaluations(user.user_id);
        const recEvalArray = allEvaluations.map((ev: any) => ({
          id: ev.booth_id,
          booth_rating: ev.booth_rating,
          rec_rating: ev.rec_rating
        }));
        await userService.updateUserRecEval(user.user_id, JSON.stringify(recEvalArray));
        
        // 업데이트된 user 정보 가져오기
        const updatedUser = await userService.getUser(user.user_id);
        onUserUpdate(updatedUser as User);
      } catch (evalError) {
        console.warn('rec_eval 업데이트 실패 (컬럼이 아직 없을 수 있음):', evalError);
        // rec_eval 업데이트는 실패해도 평가는 정상적으로 완료됨
      }
      
      setEvaluation(prev => prev ? {
        ...prev,
        booth_rating: boothRating,
        rec_rating: recRating,
        is_booth_wrong_info: isBoothWrongInfo,
        is_irrelevant: isIrrelevant,
        is_correct: isCorrect,
        ended_at: new Date().toISOString()
      } : null);
      
      setShowRatingModal(false);
      alert('평가가 완료되었습니다. 감사합니다!');
    } catch (error) {
      console.error('평가 완료 오류:', error);
      alert('평가를 완료할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const closeModal = () => {
    setShowRatingModal(false);
    setModalStep(1);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const hasStarted = evaluation && evaluation.started_at;
  const hasEnded = evaluation && evaluation.ended_at;

  return (
    <div className="container">
      <button className="back-button" onClick={onBack}>
        ← 뒤로가기
      </button>

      <div className="card">
        <h2 className="card-title">{booth.company_name_kor}</h2>
        
        {booth.category && (
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            카테고리: {booth.category}
          </p>
        )}

        <div className="card-description">
          {booth.company_description}
        </div>

        {booth.products && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '8px', color: '#333' }}>주요 제품</h4>
            <p style={{ color: '#666', marginBottom: '8px' }}>{booth.products}</p>
            {booth.products_description && (
              <p style={{ color: '#888', fontSize: '14px' }}>{booth.products_description}</p>
            )}
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          {!hasStarted ? (
            <button
              className="btn btn-primary"
              onClick={handleStartEvaluation}
            >
              시작
            </button>
          ) : !hasEnded ? (
            <button
              className="btn btn-danger"
              onClick={handleEndEvaluation}
            >
              종료
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: '#28a745' }}>
              <p>평가 완료</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                부스 평점: {evaluation?.booth_rating}점 | 추천 평점: {evaluation?.rec_rating}점
              </p>
            </div>
          )}
        </div>
      </div>

      {showRatingModal && (
        <div className="rating-modal">
          <div className="rating-modal-content">
            {modalStep === 1 ? (
              <>
                <h3>부스 만족도 평가</h3>
                <p>부스가 얼마나 만족스러웠나요?</p>
                
                <div className="rating-container">
                  <span className="rating-label-left">매우 불만족</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= boothRating ? 'active' : ''}`}
                        onClick={() => setBoothRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-label-right">매우 만족</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={closeModal}
                    style={{ flex: 1 }}
                  >
                    취소
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleStep1Next}
                    style={{ flex: 1 }}
                  >
                    다음
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>추천 만족도 평가</h3>
                <p>추천이 얼마나 만족스러웠나요?</p>
                
                <div className="rating-container">
                  <span className="rating-label-left">매우 불만족</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= recRating ? 'active' : ''}`}
                        onClick={() => setRecRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-label-right">매우 만족</span>
                </div>

                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isBoothWrongInfo}
                      onChange={(e) => setIsBoothWrongInfo(e.target.checked)}
                    />
                    <span>잘못된 부스 정보가 포함되어있습니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isIrrelevant}
                      onChange={(e) => setIsIrrelevant(e.target.checked)}
                    />
                    <span>저의 관심사와 관련성이 없는 부스가 추천되었습니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isCorrect}
                      onChange={(e) => setIsCorrect(e.target.checked)}
                    />
                    <span>해당 사항 없습니다.</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModalStep(1)}
                    style={{ flex: 1 }}
                  >
                    이전
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleStep2Submit}
                    style={{ flex: 1 }}
                  >
                    완료
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .rating-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 24px 0;
        }

        .rating-label-left,
        .rating-label-right {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
        }

        .checkbox-container {
          margin-top: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.5;
        }

        .checkbox-label input[type="checkbox"] {
          margin-top: 3px;
          cursor: pointer;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .checkbox-label span {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default BoothDetailPage;
