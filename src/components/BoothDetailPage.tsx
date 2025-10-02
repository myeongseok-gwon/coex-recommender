import React, { useState, useEffect } from 'react';
import { User, Booth, Evaluation } from '../types';
import { evaluationService } from '../services/supabase';

interface BoothDetailPageProps {
  user: User;
  booth: Booth;
  onBack: () => void;
}

const BoothDetailPage: React.FC<BoothDetailPageProps> = ({ user, booth, onBack }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);

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
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    try {
      await evaluationService.updateEvaluation(user.user_id, booth.id, {
        rating: rating,
        ended_at: new Date().toISOString()
      });
      
      setEvaluation(prev => prev ? {
        ...prev,
        rating: rating,
        ended_at: new Date().toISOString()
      } : null);
      
      setShowRatingModal(false);
      alert('평가가 완료되었습니다. 감사합니다!');
    } catch (error) {
      console.error('평가 완료 오류:', error);
      alert('평가를 완료할 수 없습니다. 다시 시도해주세요.');
    }
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
              <p>평가 완료 (평점: {evaluation?.rating}점)</p>
            </div>
          )}
        </div>
      </div>

      {showRatingModal && (
        <div className="rating-modal">
          <div className="rating-modal-content">
            <h3>부스 평가</h3>
            <p>이 부스에 대한 만족도를 평가해주세요</p>
            
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRatingModal(false)}
                style={{ flex: 1 }}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRatingSubmit}
                style={{ flex: 1 }}
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoothDetailPage;
