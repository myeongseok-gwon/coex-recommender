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

  return (
    <div className="container">
      <button className="back-button" onClick={onBack}>
        ← 뒤로가기
      </button>

      <div className="header">
        <h1>추천 부스</h1>
        <p>당신에게 맞는 부스를 추천해드립니다. (추천 등수 높은 순)</p>
      </div>

      <div className="booth-list">
        {recommendations.map((rec) => {
          const booth = getBoothById(rec.id);
          if (!booth) return null;

          return (
            <div
              key={rec.id}
              className="booth-item"
              onClick={() => onBoothClick(booth)}
            >
              <h3>{booth.company_name_kor}</h3>
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
    </div>
  );
};

export default RecommendationsPage;
