import React, { useState, useEffect, useRef } from 'react';
import { User, Recommendation, BoothPosition, Booth } from '../types';
import { boothPositionService, evaluationService } from '../services/supabase';

interface MapPageProps {
  user: User;
  recommendations: Recommendation[];
  onBack: () => void;
}

const DISPLAY_COUNT = 10;


const MapPage: React.FC<MapPageProps> = ({ user, recommendations }) => {
  const [positions, setPositions] = useState<BoothPosition[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayedRecommendations, setDisplayedRecommendations] = useState<Recommendation[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [boothData, setBoothData] = useState<Map<string, Booth>>(new Map());
  const [evaluatedBooths, setEvaluatedBooths] = useState<Set<string>>(new Set());
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Admin 모드 체크 (user_id가 'admin' 문자열과 일치하거나 숫자 0)
  useEffect(() => {
    // user_id가 0이거나 문자열로 'admin'인 경우 (LandingPage에서 처리)
    setIsAdminMode(user.user_id === '0');
  }, [user]);

  // 부스 위치 데이터 로드
  useEffect(() => {
    loadPositions();
  }, []);

  // 부스 데이터 로드 (jsonl 파일에서)
  useEffect(() => {
    const loadBoothData = async () => {
      try {
        const response = await fetch('/foodweek_selected.jsonl');
        const text = await response.text();
        const lines = text.trim().split('\n');
        const boothMap = new Map<string, Booth>();
        
        lines.forEach(line => {
          try {
            const booth = JSON.parse(line) as Booth;
            boothMap.set(booth.id, booth);
          } catch (e) {
            console.error('부스 데이터 파싱 오류:', e);
          }
        });
        
        setBoothData(boothMap);
        console.log(`부스 데이터 로드 완료: ${boothMap.size}개`);
      } catch (error) {
        console.error('부스 데이터 로드 오류:', error);
      }
    };
    
    loadBoothData();
  }, []);

  // 평가된 부스 데이터 로드
  useEffect(() => {
    const loadEvaluatedBooths = async () => {
      try {
        const evaluations = await evaluationService.getAllEvaluations(user.user_id);
        const evaluatedBoothIds = new Set(evaluations.map(evaluation => evaluation.booth_id));
        setEvaluatedBooths(evaluatedBoothIds);
        console.log(`평가된 부스 로드 완료: ${evaluatedBoothIds.size}개`);
      } catch (error) {
        console.error('평가된 부스 로드 오류:', error);
      }
    };
    
    if (user.user_id && user.user_id !== '0') {
      loadEvaluatedBooths();
    }
  }, [user.user_id]);

  // displayedRecommendations 계산 (RecommendationsPage와 동일한 로직)
  useEffect(() => {
    console.log('=== MapPage: displayedRecommendations 계산 ===');
    console.log('받은 추천 개수:', recommendations.length);
    
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
    
    // 처음 10개만 표시
    const displayed = activeRecommendations.slice(0, DISPLAY_COUNT);
    setDisplayedRecommendations(displayed);
    console.log('지도에 표시할 추천 개수:', displayed.length);
  }, [recommendations, user.rec_eval]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await boothPositionService.getAllPositions();
      setPositions(data);
    } catch (error) {
      console.error('부스 위치 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleImageClick = () => {
    // 툴팁 닫기
    setSelectedBoothId(null);
  };

  // 컨테이너 클릭 시 툴팁 닫기
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 마커를 클릭한 경우가 아니면 툴팁 닫기
    const target = e.target as HTMLElement;
    if (!target.closest('.booth-marker')) {
      setSelectedBoothId(null);
    }
  };

  const handleMarkerClick = (e: React.MouseEvent, boothId: string) => {
    e.stopPropagation();
    setSelectedBoothId(boothId === selectedBoothId ? null : boothId);
  };

  // 부스 이름 가져오기
  const getBoothName = (boothId: string): string => {
    const booth = boothData.get(boothId);
    return booth?.company_name_kor || `부스 ${boothId}`;
  };


  // 표시할 추천 부스 ID 목록 (displayedRecommendations만)
  const displayedBoothIds = new Set(displayedRecommendations.map(r => r.id));

  // 평가 완료 여부 확인 함수
  const isEvaluated = (boothId: string): boolean => {
    return evaluatedBooths.has(boothId);
  };

  // 표시할 부스 위치 필터링
  // Admin 모드: 모든 부스, 일반 모드: 추천된 부스 + 평가된 부스
  const displayPositions = isAdminMode
    ? positions
    : positions.filter(pos => {
      const isRecommended = displayedBoothIds.has(pos.booth_id);
      const isEvaluatedBooth = evaluatedBooths.has(pos.booth_id);
      return isRecommended || isEvaluatedBooth;
    });

  return (
    <div className="map-container">




      <div className="map-content" ref={containerRef}>
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="map-image-container" onClick={handleContainerClick}>
            <img
              ref={imageRef}
              src="/2025_map.png"
              alt="COEX 2025 Map"
              className="map-image"
              onClick={handleImageClick}
            />
            {displayPositions.map(pos => {
              const evaluated = isEvaluated(pos.booth_id);
              const isRecommended = displayedBoothIds.has(pos.booth_id);
              
              // Admin 모드: 모든 부스 파란색
              // 일반 모드: 평가된 부스 = 파란색, 추천되었지만 평가되지 않은 부스 = 빨간색
              let markerClass = 'normal';
              
              if (isAdminMode) {
                markerClass = 'normal'; // 관리자 모드: 모든 부스 파란색
              } else {
                if (evaluated) {
                  markerClass = 'evaluated'; // 평가된 부스: 파란색
                } else if (isRecommended) {
                  markerClass = 'not-evaluated'; // 추천되었지만 평가되지 않은 부스: 빨간색
                } else {
                  markerClass = 'normal'; // 기타: 파란색
                }
              }
              
              const isSelected = selectedBoothId === pos.booth_id;
              
              return (
                <div
                  key={pos.booth_id}
                  className={`booth-marker ${markerClass}`}
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                  }}
                  onClick={(e) => handleMarkerClick(e, pos.booth_id)}
                >
                  {isSelected && !isAdminMode && (
                    <div className="booth-tooltip">
                      {getBoothName(pos.booth_id)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .map-container {
          width: 100%;
          min-height: 100vh;
          background: #f5f5f5;
          padding: 0;
        }


        .map-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }

        .map-image-container {
          position: relative;
          width: 100%;
          display: inline-block;
        }

        .map-image {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 8px;
        }


        .booth-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          cursor: pointer;
          z-index: 10;
        }


        .booth-marker.not-evaluated {
          background: #ff5252;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        .booth-marker.evaluated {
          background: #1976d2;
          border: 2px solid white;
        }

        .booth-marker.normal {
          background: #1976d2;
          border: 2px solid white;
        }

        .booth-marker:hover {
          transform: translate(-50%, -50%) scale(1.3);
          z-index: 20;
        }

        .booth-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 100;
        }

        .booth-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(255, 82, 82, 0.7);
          }
          50% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(255, 82, 82, 0);
          }
        }

      `}</style>
    </div>
  );
};

export default MapPage;

