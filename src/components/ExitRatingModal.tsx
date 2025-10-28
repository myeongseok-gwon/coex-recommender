import React, { useState } from 'react';

interface ExitRatingModalProps {
  onClose: () => void;
  onSubmit: (recommendationRating: number, exhibitionRating: number) => void;
}

const ExitRatingModal: React.FC<ExitRatingModalProps> = ({ onClose, onSubmit }) => {
  const [recommendationRating, setRecommendationRating] = useState<number>(0);
  const [exhibitionRating, setExhibitionRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (recommendationRating === 0 || exhibitionRating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(recommendationRating, exhibitionRating);
    } catch (error) {
      console.error('별점 제출 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitEnabled = recommendationRating > 0 && exhibitionRating > 0;

  return (
    <div className="exit-rating-modal-overlay">
      <div className="exit-rating-modal">
        <div className="modal-header">
          <h2>서비스 평가</h2>
          <p>퇴장 전에 간단한 평가를 부탁드립니다.</p>
        </div>

        <div className="rating-sections">
          {/* 추천 시스템 만족도 */}
          <div className="rating-section">
            <h3>추천 시스템이 도움이 되었나요?</h3>
            <div className="rating-container">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= recommendationRating ? 'active' : ''}`}
                    onClick={() => setRecommendationRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            {recommendationRating > 0 && (
              <div className="rating-feedback">
                {recommendationRating === 1 && "전혀 도움 안됨"}
                {recommendationRating === 2 && "조금 도움됨"}
                {recommendationRating === 3 && "보통 도움됨"}
                {recommendationRating === 4 && "도움됨"}
                {recommendationRating === 5 && "매우 도움됨"}
              </div>
            )}
          </div>

          {/* 전시회 만족도 */}
          <div className="rating-section">
            <h3>전시회에 전반적으로 얼마나 만족하셨나요?</h3>
            <div className="rating-container">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= exhibitionRating ? 'active' : ''}`}
                    onClick={() => setExhibitionRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            {exhibitionRating > 0 && (
              <div className="rating-feedback">
                {exhibitionRating === 1 && "매우 불만족"}
                {exhibitionRating === 2 && "불만족"}
                {exhibitionRating === 3 && "보통"}
                {exhibitionRating === 4 && "만족"}
                {exhibitionRating === 5 && "매우 만족"}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button 
            className={`btn ${isSubmitEnabled ? 'btn-primary' : 'btn-disabled'}`}
            onClick={handleSubmit}
            disabled={!isSubmitEnabled || isSubmitting}
          >
            {isSubmitting ? '제출 중...' : '제출하기'}
          </button>
        </div>

        <style>{`
          .exit-rating-modal-overlay {
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
            padding: 20px;
          }

          .exit-rating-modal {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }

          .modal-header {
            text-align: center;
            margin-bottom: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .modal-header h2 {
            color: #1976d2;
            font-size: 1.8rem;
            font-weight: 700;
            margin: 0 0 8px 0;
          }

          .modal-header p {
            color: #666;
            font-size: 1rem;
            margin: 0;
          }

          .rating-sections {
            display: flex;
            flex-direction: column;
            gap: 40px;
            margin-bottom: 32px;
          }

          .rating-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .rating-section h3 {
            color: #333;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 4px 0;
            text-align: center;
          }

          .rating-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .rating-stars {
            display: flex;
            gap: 4px;
          }

          .star {
            font-size: 2.5rem;
            color: #ddd;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
          }

          .star:hover {
            transform: scale(1.1);
          }

          .star.active {
            color: #ffc107;
          }

          .rating-feedback {
            margin-top: 8px;
            padding: 8px 12px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            color: #0369a1;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
          }

          .modal-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }

          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
          }

          .btn-primary {
            background: linear-gradient(135deg, #1976d2, #42a5f5);
            color: white;
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
          }

          .btn-secondary {
            background: #f5f5f5;
            color: #666;
            border: 1px solid #ddd;
          }

          .btn-secondary:hover:not(:disabled) {
            background: #e0e0e0;
          }

          .btn-disabled {
            background: #e0e0e0;
            color: #999;
            cursor: not-allowed;
            box-shadow: none;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          @media (max-width: 480px) {
            .exit-rating-modal {
              padding: 24px;
              margin: 10px;
            }

            .rating-container {
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }

            .star {
              font-size: 1.8rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ExitRatingModal;
