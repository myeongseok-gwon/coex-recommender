import React from 'react';
import { User, Recommendation, Booth } from '../types';

interface RecommendationsPageProps {
  user: User;
  recommendations: Recommendation[];
  boothData: Booth[];
  onBoothClick: (booth: Booth) => void;
  onBack: () => void;
}

const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  user,
  recommendations,
  boothData,
  onBoothClick,
  onBack
}) => {
  const isPersonalType = user.type.includes('personal');

  const getBoothById = (id: number): Booth | undefined => {
    return boothData.find(booth => booth.id === id);
  };

  const getEvaluation = (boothId: number): { booth_rating?: number; rec_rating?: number } | null => {
    if (!user.rec_eval) return null;
    try {
      const evalArray = JSON.parse(user.rec_eval);
      const eval_item = evalArray.find((item: any) => item.id === boothId);
      return eval_item || null;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="container">
      <button className="back-button" onClick={onBack}>
        ← 뒤로가기
      </button>

      <div className="header">
        <h1>추천 부스</h1>
        <p>위에서부터 차례대로 추천된 부스입니다.</p>
      </div>

      <div className="booth-list">
        {recommendations.map((rec) => {
          const booth = getBoothById(rec.id);
          if (!booth) return null;

          const evaluation = getEvaluation(rec.id);

          return (
            <div
              key={rec.id}
              className="booth-item"
              onClick={() => onBoothClick(booth)}
            >
              <div className="booth-item-header">
                <h3>{booth.company_name_kor}</h3>
                <div className="evaluation-badge">
                  {evaluation ? (
                    <>
                      <span className="rating-label">부스: {evaluation.booth_rating}</span>
                      <span className="rating-label">추천: {evaluation.rec_rating}</span>
                    </>
                  ) : (
                    <span className="rating-undone">undone</span>
                  )}
                </div>
              </div>
              <p>
                {isPersonalType ? rec.rationale : booth.company_description}
              </p>
              {booth.products && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  제품: {booth.products}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .booth-item {
          position: relative;
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
