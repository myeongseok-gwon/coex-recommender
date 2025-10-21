import React, { useState } from 'react';
import { User } from '../types';
import { userService } from '../services/supabase';

interface SurveyPageProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const SurveyPage: React.FC<SurveyPageProps> = ({ user, onComplete }) => {
  const [finalRating, setFinalRating] = useState(0);
  const [finalPros, setFinalPros] = useState('');
  const [finalCons, setFinalCons] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (finalRating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!finalPros.trim() && !finalCons.trim()) {
      alert('만족스러웠던 점 또는 아쉬웠던 점 중 하나 이상을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await userService.updateFinalSurvey(user.user_id, finalRating, finalPros, finalCons);
      
      const updatedUser = {
        ...user,
        final_rating: finalRating,
        final_pros: finalPros,
        final_cons: finalCons,
        survey_finished_at: new Date().toISOString()
      };
      
      onComplete(updatedUser);
    } catch (error) {
      console.error('총평 제출 오류:', error);
      alert('총평 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="top-nav-bar">
        <div className="nav-left" style={{ visibility: 'hidden' }}>
          ← 뒤로가기
        </div>
        <div className="nav-right">
          총평
        </div>
      </div>

      <div className="header">
        <h1>실험에 참여해주셔서 감사합니다!</h1>
        <p>추천 시스템에 대한 총평을 남겨주세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            전체 만족도 <span className="required">*</span>
          </label>
          <p className="form-hint">추천 시스템 전체에 대한 만족도를 평가해주세요</p>
          
          <div className="rating-container">
            <span className="rating-label-left">매우 불만족</span>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  key={rating}
                  className={`star ${finalRating >= rating ? 'active' : ''}`}
                  onClick={() => setFinalRating(rating)}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-label-right">매우 만족</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="finalPros" className="form-label">
            만족스러웠던 점
          </label>
          <p className="form-hint">추천 시스템에서 만족스러웠던 점을 자유롭게 작성해주세요</p>
          <textarea
            id="finalPros"
            className="form-textarea"
            value={finalPros}
            onChange={(e) => setFinalPros(e.target.value)}
            placeholder="예: 내 관심사에 맞는 부스를 잘 추천해주었습니다."
            rows={5}
          />
        </div>

        <div className="form-group">
          <label htmlFor="finalCons" className="form-label">
            아쉬웠던 점
          </label>
          <p className="form-hint">추천 시스템에서 개선이 필요한 점을 자유롭게 작성해주세요</p>
          <textarea
            id="finalCons"
            className="form-textarea"
            value={finalCons}
            onChange={(e) => setFinalCons(e.target.value)}
            placeholder="예: 카테고리가 너무 많아서 선택하기 어려웠습니다."
            rows={5}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? '제출 중...' : '실험 끝내기'}
        </button>
      </form>

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
        }

        .required {
          color: #ff5252;
        }

        .form-hint {
          color: #666;
          font-size: 14px;
          margin-top: 4px;
          margin-bottom: 12px;
        }

        .rating-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 24px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .rating-label-left,
        .rating-label-right {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .stars {
          display: flex;
          gap: 8px;
        }

        .star {
          font-size: 36px;
          cursor: pointer;
          color: #ddd;
          transition: all 0.2s;
          user-select: none;
        }

        .star:hover {
          transform: scale(1.2);
        }

        .star.active {
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #1976d2;
        }

        .btn {
          width: 100%;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default SurveyPage;

