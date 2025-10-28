import React, { useState } from 'react';
import { Booth } from '../types';
import { hasLongCompanyName } from '../utils/companyName';

interface BoothRatingProps {
  booth: Booth;
  onRate: (rating: number) => void;
  onClose: () => void;
  onViewOnMap?: (booth: Booth) => void;
}

const BoothRating: React.FC<BoothRatingProps> = ({
  booth,
  onRate,
  onClose,
  onViewOnMap
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = () => {
    if (rating > 0) {
      onRate(rating);
    }
  };

  const StarRating = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            className={`star ${value <= (hoveredRating || rating) ? 'filled' : ''}`}
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="booth-rating-overlay">
      <div className="booth-rating-modal">
        <div className="rating-header">
          <h2>부스 평가</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="booth-info">
          <h3 className={hasLongCompanyName(booth.company_name_kor) ? 'long-name' : ''}>{booth.company_name_kor}</h3>
          <p className="booth-category">{booth.category}</p>
          <p className="booth-products">{booth.products}</p>
          {onViewOnMap && (
            <p 
              className="view-on-map-link"
              onClick={() => onViewOnMap(booth)}
            >
              지도에서 보기
            </p>
          )}
        </div>

        <div className="rating-section">
          <h4>이 부스에 대해 어떻게 생각하시나요?</h4>
          <StarRating />
          <p className="rating-text">
            {rating === 0 && '별을 클릭하여 평가해주세요'}
            {rating === 1 && '매우 불만족'}
            {rating === 2 && '불만족'}
            {rating === 3 && '보통'}
            {rating === 4 && '만족'}
            {rating === 5 && '매우 만족'}
          </p>
        </div>

        <div className="rating-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            평가 완료
          </button>
        </div>
      </div>

      <style>{`
        .booth-rating-overlay {
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

        .booth-rating-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .rating-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
          background: #f8f9fa;
        }

        .rating-header h2 {
          margin: 0;
          color: #1976d2;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e0e0e0;
          color: #333;
        }

        .booth-info {
          padding: 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .booth-info h3 {
          margin: 0 0 8px 0;
          color: #1976d2;
          font-size: 1.3rem;
        }

        .booth-info h3.long-name {
          font-size: 1.0rem;
        }

        .booth-category {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .booth-products {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 0.9rem;
        }

        .view-on-map-link {
          color: #1976d2;
          font-size: 0.85rem;
          cursor: pointer;
          margin: 4px 0 0 0;
          user-select: none;
          transition: color 0.2s;
        }

        .view-on-map-link:hover {
          color: #1565c0;
          text-decoration: underline;
        }

        .rating-section {
          padding: 24px;
          text-align: center;
        }

        .rating-section h4 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .star-rating {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .star {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          transition: all 0.2s;
          filter: grayscale(1);
        }

        .star.filled {
          filter: grayscale(0);
        }

        .star:hover {
          transform: scale(1.1);
        }

        .rating-text {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .rating-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e0e0e0;
        }

        .btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-primary:disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default BoothRating;
