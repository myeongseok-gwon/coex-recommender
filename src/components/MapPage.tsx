import React, { useState, useEffect, useRef } from 'react';
import { User, Recommendation, BoothPosition } from '../types';
import { boothPositionService } from '../services/supabase';

interface MapPageProps {
  user: User;
  recommendations: Recommendation[];
  onBack: () => void;
}

const DISPLAY_COUNT = 10;

const MapPage: React.FC<MapPageProps> = ({ user, recommendations, onBack }) => {
  const [positions, setPositions] = useState<BoothPosition[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentBoothId, setCurrentBoothId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [displayedRecommendations, setDisplayedRecommendations] = useState<Recommendation[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Admin 모드 체크 (user_id가 'admin' 문자열과 일치하거나 숫자 0)
  useEffect(() => {
    // user_id가 0이거나 문자열로 'admin'인 경우 (LandingPage에서 처리)
    setIsAdminMode(user.user_id === 0);
  }, [user]);

  // 부스 위치 데이터 로드
  useEffect(() => {
    loadPositions();
  }, []);

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

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isAdminMode) return;

    const boothId = currentBoothId.trim();
    if (!boothId) {
      alert('부스 ID를 입력해주세요 (예: A1234, B5678).');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    try {
      await boothPositionService.upsertPosition(boothId, x, y);
      alert(`부스 ${boothId}의 위치가 저장되었습니다.\n(x: ${(x * 100).toFixed(2)}%, y: ${(y * 100).toFixed(2)}%)`);
      await loadPositions();
      setCurrentBoothId('');
    } catch (error) {
      console.error('위치 저장 오류:', error);
      alert('위치 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePosition = async (boothId: string) => {
    if (!window.confirm(`부스 ${boothId}의 위치를 삭제하시겠습니까?`)) return;

    try {
      await boothPositionService.deletePosition(boothId);
      alert(`부스 ${boothId}의 위치가 삭제되었습니다.`);
      await loadPositions();
    } catch (error) {
      console.error('위치 삭제 오류:', error);
      alert('위치 삭제 중 오류가 발생했습니다.');
    }
  };

  // 표시할 추천 부스 ID 목록 (displayedRecommendations만)
  const displayedBoothIds = new Set(displayedRecommendations.map(r => r.id));

  // 평가 완료 여부 확인 함수
  const isEvaluated = (boothId: string): boolean => {
    if (!user.rec_eval) return false;
    try {
      const evalArray = JSON.parse(user.rec_eval);
      const evaluation = evalArray.find((item: any) => item.id === boothId && !item.is_deleted);
      return evaluation && (evaluation.booth_rating || evaluation.rec_rating);
    } catch (e) {
      return false;
    }
  };

  // 표시할 부스 위치 필터링
  // Admin 모드: 모든 부스, 일반 모드: displayedRecommendations만
  const displayPositions = isAdminMode
    ? positions
    : positions.filter(pos => displayedBoothIds.has(pos.booth_id));

  return (
    <div className="map-container">
      <div className="top-nav-bar">
        <div className="nav-left" onClick={onBack}>
          ← 뒤로가기
        </div>
        <div className="nav-right">
          {isAdminMode ? '관리자 모드' : '부스 지도'}
        </div>
      </div>

      <div className="map-header">
        <h1>{isAdminMode ? '지도 관리' : '부스 지도'}</h1>
      </div>

      {isAdminMode && (
        <div className="admin-controls">
          <div className="control-group">
            <label htmlFor="boothId">부스 ID:</label>
            <input
              id="boothId"
              type="text"
              value={currentBoothId}
              onChange={(e) => setCurrentBoothId(e.target.value.toUpperCase())}
              placeholder="예: A1234, B5678"
              className="booth-id-input"
            />
            <span className="instruction">
              ↑ 부스 ID를 입력하고 지도를 클릭하세요
            </span>
          </div>

          <div className="positions-list">
            <h3>저장된 위치 ({positions.length}개)</h3>
            <div className="positions-grid">
              {positions.map(pos => (
                <div key={pos.booth_id} className="position-item">
                  <span className="booth-id-label">부스 {pos.booth_id}</span>
                  <span className="position-coords">
                    ({(pos.x * 100).toFixed(1)}%, {(pos.y * 100).toFixed(1)}%)
                  </span>
                  <button
                    className="delete-pos-button"
                    onClick={() => handleDeletePosition(pos.booth_id)}
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isAdminMode && (
        <div className="legend">
          <div className="legend-item">
            <div className="legend-marker not-evaluated"></div>
            <span>평가 필요 (빨간색)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker evaluated"></div>
            <span>평가 완료 (파란색)</span>
          </div>
        </div>
      )}

      <div className="map-content" ref={containerRef}>
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="map-image-container">
            <img
              ref={imageRef}
              src="/2025_map.png"
              alt="COEX 2025 Map"
              className={`map-image ${isAdminMode ? 'clickable' : ''}`}
              onClick={handleImageClick}
            />
            {displayPositions.map(pos => {
              const evaluated = isEvaluated(pos.booth_id);
              
              // Admin 모드: 모든 부스 파란색
              // 일반 모드: 평가 완료 = 파란색, 평가 미완료 = 빨간색
              const markerClass = isAdminMode 
                ? 'normal' 
                : (evaluated ? 'evaluated' : 'not-evaluated');
              
              return (
                <div
                  key={pos.booth_id}
                  className={`booth-marker ${markerClass}`}
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                  }}
                  title={`부스 ${pos.booth_id}${!isAdminMode ? (evaluated ? ' (평가 완료)' : ' (평가 필요)') : ''}`}
                >
                  <span className="booth-marker-label">{pos.booth_id}</span>
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
          padding: 20px;
        }

        .top-nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1976d2;
          color: white;
          padding: 16px 24px;
          margin: -20px -20px 20px -20px;
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

        .map-header {
          padding: 0 10px;
          margin-bottom: 20px;
        }

        .map-header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .legend {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          gap: 24px;
          justify-content: center;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-marker.not-evaluated {
          background: #ff5252;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #ff5252;
        }

        .legend-marker.evaluated {
          background: #1976d2;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #1976d2;
        }

        .legend-item span {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .admin-controls {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .control-group label {
          font-weight: 600;
          color: #333;
        }

        .booth-id-input {
          padding: 8px 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          width: 150px;
        }

        .booth-id-input:focus {
          outline: none;
          border-color: #1976d2;
        }

        .instruction {
          color: #666;
          font-size: 14px;
          font-style: italic;
        }

        .positions-list h3 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 18px;
        }

        .positions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          padding: 8px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .position-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          font-size: 13px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .booth-id-label {
          font-weight: 600;
          color: #1976d2;
        }

        .position-coords {
          color: #666;
          font-size: 11px;
        }

        .delete-pos-button {
          background: #ff5252;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .delete-pos-button:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }

        .map-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
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

        .map-image.clickable {
          cursor: crosshair;
        }

        .booth-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          cursor: pointer;
          z-index: 10;
        }

        .booth-marker.not-evaluated {
          background: #ff5252;
          border: 3px solid white;
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
          transform: translate(-50%, -50%) scale(1.2);
          z-index: 20;
        }

        .booth-marker-label {
          font-size: 10px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(255, 82, 82, 0.7);
          }
          50% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(255, 82, 82, 0);
          }
        }

        @media (max-width: 768px) {
          .map-container {
            padding: 10px;
          }

          .map-header {
            flex-wrap: wrap;
            gap: 10px;
          }

          .map-header h1 {
            font-size: 20px;
            width: 100%;
          }

          .control-group {
            flex-direction: column;
            align-items: flex-start;
          }

          .booth-id-input {
            width: 100%;
          }

          .positions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MapPage;

