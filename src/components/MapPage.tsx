import React, { useState, useEffect, useRef } from 'react';
import { User, Recommendation, BoothPosition, Booth } from '../types';
import { boothPositionService, evaluationService } from '../services/supabase';

interface MapPageProps {
  user: User;
  recommendations: Recommendation[];
  onBack: () => void;
  selectedBooth?: Booth | null;
  onBoothSelect?: () => void;
}

const MapPage: React.FC<MapPageProps> = ({ user, recommendations, selectedBooth, onBoothSelect }) => {
  const [positions, setPositions] = useState<BoothPosition[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [boothData, setBoothData] = useState<Map<string, Booth>>(new Map());
  const [evaluatedBooths, setEvaluatedBooths] = useState<Set<string>>(new Set());
  const [boothIdsInCSV, setBoothIdsInCSV] = useState<Set<string>>(new Set());
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Admin 모드 체크 (user_id가 'admin' 문자열과 일치하거나 숫자 0)
  useEffect(() => {
    // user_id가 0이거나 문자열로 'admin'인 경우 (LandingPage에서 처리)
    setIsAdminMode(user.user_id === '0');
  }, [user]);

  // CSV 파일에서 부스 ID 목록 로드
  useEffect(() => {
    const loadBoothIdsFromCSV = async () => {
      try {
        const response = await fetch('/booth_positions_rows.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        const boothIds = new Set<string>();
        
        // 첫 번째 줄은 헤더이므로 제외
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line) {
            const parts = line.split(',');
            if (parts.length >= 2) {
              boothIds.add(parts[0]); // booth_id
            }
          }
        }
        
        setBoothIdsInCSV(boothIds);
        console.log(`CSV에서 부스 ID 로드 완료: ${boothIds.size}개`);
      } catch (error) {
        console.error('CSV 파일 로드 오류:', error);
      }
    };
    
    loadBoothIdsFromCSV();
  }, []);

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

  // 선택된 부스가 있을 때 자동으로 클릭
  useEffect(() => {
    if (selectedBooth && boothData.has(selectedBooth.id)) {
      // CSV 파일에서 마커 존재 여부 확인
      if (boothIdsInCSV.size > 0) {
        const hasMarker = boothIdsInCSV.has(selectedBooth.id);
        if (hasMarker) {
          // 마커가 있으면 클릭 이벤트 발생
          const timer = setTimeout(() => {
            setSelectedBoothId(selectedBooth.id);
            if (onBoothSelect) {
              onBoothSelect();
            }
          }, 500);
          
          return () => clearTimeout(timer);
        } else {
          // 마커가 없으면 부스 정보만 표시
          const timer = setTimeout(() => {
            setSelectedBoothId(selectedBooth.id);
          }, 500);
          
          return () => clearTimeout(timer);
        }
      }
    }
  }, [selectedBooth, boothData, boothIdsInCSV, onBoothSelect]);

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
    e.preventDefault(); // 기본 동작 방지 (스크롤 등)
    setSelectedBoothId(boothId === selectedBoothId ? null : boothId);
  };

  // 부스 이름 가져오기
  const getBoothName = (boothId: string): string => {
    const booth = boothData.get(boothId);
    return booth?.company_name_kor || `부스 ${boothId}`;
  };


  // 표시할 추천 부스 ID 목록 (모든 활성 추천)
  const activeBoothIds = new Set(getActiveRecommendations().map(r => r.id));

  // 평가 완료 여부 확인 함수
  const isEvaluated = (boothId: string): boolean => {
    return evaluatedBooths.has(boothId);
  };

  // 표시할 부스 위치 필터링
  // Admin 모드: 모든 부스, 일반 모드: 추천된 부스 + 평가된 부스 + 선택된 부스
  const displayPositions = isAdminMode
    ? positions
    : positions.filter(pos => {
      const isRecommended = activeBoothIds.has(pos.booth_id);
      const isEvaluatedBooth = evaluatedBooths.has(pos.booth_id);
      const isSelected = selectedBoothId === pos.booth_id;
      return isRecommended || isEvaluatedBooth || isSelected;
    });

  return (
    <div className="map-container">




      <div className="map-content" ref={containerRef}>
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className={`map-image-container ${selectedBoothId ? 'has-selected' : ''}`} onClick={handleContainerClick}>
            <img
              ref={imageRef}
              src="/2025_map.png"
              alt="COEX 2025 Map"
              className="map-image"
              onClick={handleImageClick}
            />
            {displayPositions.map(pos => {
              const evaluated = isEvaluated(pos.booth_id);
              const isRecommended = activeBoothIds.has(pos.booth_id);
              
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
                <React.Fragment key={pos.booth_id}>
                  <div
                    className={`booth-marker ${markerClass} ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                    }}
                    onClick={(e) => handleMarkerClick(e, pos.booth_id)}
                    tabIndex={-1}
                  />
                  {isSelected && !isAdminMode && (
                    <div 
                      className="booth-tooltip"
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                      }}
                    >
                      {getBoothName(pos.booth_id)}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* 마커가 없는 부스의 임시 마커 (지도 중앙) */}
            {selectedBoothId && !boothIdsInCSV.has(selectedBoothId) && !isAdminMode && (
              <>
                <div
                  className="booth-marker temp-marker selected"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  onClick={(e) => handleMarkerClick(e, selectedBoothId)}
                />
                <div 
                  className="booth-tooltip"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                >
                  {getBoothName(selectedBoothId)}
                </div>
              </>
            )}
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
          border-radius: 0;
          padding: 0;
          margin: 0;
          box-shadow: none;
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
          border-radius: 0;
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
          transition: all 0.3s ease;
          cursor: pointer;
          z-index: 1;
        }

        /* 부스가 선택되었을 때 다른 부스들 투명도 조정 */
        .map-image-container.has-selected .booth-marker:not(.selected) {
          opacity: 0.3;
        }

        .booth-marker.selected {
          opacity: 1;
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

        .booth-marker.temp-marker {
          background: #4caf50;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        .booth-marker:hover {
          transform: translate(-50%, -50%) scale(1.3);
          z-index: 2;
        }

        .booth-tooltip {
          position: absolute !important;
          transform: translate(-50%, -100%) !important;
          margin-bottom: 8px !important;
          padding: 8px 12px !important;
          background: rgba(0, 0, 0, 0.9) !important;
          color: white !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
          pointer-events: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
          z-index: 9999 !important;
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

        .booth-info-box {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 100;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .booth-info-box h3 {
          margin: 0 0 8px 0;
          color: #1976d2;
          font-size: 1rem;
          font-weight: 600;
        }

        .booth-details p {
          margin: 4px 0;
          font-size: 0.85rem;
          color: #666;
        }

        .info-box-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .info-box-close:hover {
          background: #f0f0f0;
          color: #333;
        }

      `}</style>
    </div>
  );
};

export default MapPage;

