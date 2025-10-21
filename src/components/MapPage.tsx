import React, { useState, useEffect, useRef } from 'react';
import { User, Recommendation, BoothPosition, Booth } from '../types';
import { boothPositionService, userService } from '../services/supabase';

interface MapPageProps {
  user: User;
  recommendations: Recommendation[];
  onBack: () => void;
}

const DISPLAY_COUNT = 10;

interface Point {
  x: number;
  y: number;
}

interface PathStroke {
  points: Point[];
}

const MapPage: React.FC<MapPageProps> = ({ user, recommendations, onBack }) => {
  const [positions, setPositions] = useState<BoothPosition[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentBoothId, setCurrentBoothId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [displayedRecommendations, setDisplayedRecommendations] = useState<Recommendation[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [boothData, setBoothData] = useState<Map<string, Booth>>(new Map());
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [paths, setPaths] = useState<PathStroke[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedPathImageUrl, setSavedPathImageUrl] = useState<string | null>(user.path_image_url || null);
  const [isSaving, setIsSaving] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Admin 모드 체크 (user_id가 'admin' 문자열과 일치하거나 숫자 0)
  useEffect(() => {
    // user_id가 0이거나 문자열로 'admin'인 경우 (LandingPage에서 처리)
    setIsAdminMode(user.user_id === 0);
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

  // 캔버스 크기 조정
  useEffect(() => {
    if (!isDrawingMode || !imageRef.current || !canvasRef.current || !drawingCanvasRef.current) return;

    const updateCanvasSize = () => {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      
      if (!img || !canvas || !drawingCanvas) return;

      const rect = img.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawingCanvas.width = rect.width;
      drawingCanvas.height = rect.height;

      redrawPaths();
      redrawCurrentPath();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isDrawingMode, paths, currentPath]);

  // 저장된 경로 그리기
  const redrawPaths = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 82, 82, 0.4)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      
      ctx.stroke();
    });
  };

  // 현재 그리고 있는 경로 그리기
  const redrawCurrentPath = () => {
    if (!drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentPath.length < 2) return;

    ctx.strokeStyle = 'rgba(25, 118, 210, 0.7)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(currentPath[0].x * canvas.width, currentPath[0].y * canvas.height);
    
    for (let i = 1; i < currentPath.length; i++) {
      ctx.lineTo(currentPath[i].x * canvas.width, currentPath[i].y * canvas.height);
    }
    
    ctx.stroke();
  };

  // 좌표를 상대 좌표로 변환
  const getRelativeCoordinates = (clientX: number, clientY: number): Point | null => {
    if (!imageRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    
    // 이미지 영역 밖이면 null 반환
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    
    return { x, y };
  };

  // 그리기 시작
  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    
    // 그리기 시작 시 툴팁 닫기
    setSelectedBoothId(null);
    
    // 터치 이벤트이고 두 손가락 이상이면 그리기 하지 않음 (핀치 줌 허용)
    if ('touches' in e && e.touches.length > 1) {
      return;
    }
    
    // 한 손가락일 때만 preventDefault (패닝 방지)
    if ('touches' in e && e.touches.length === 1) {
      e.preventDefault();
    }
    
    const point = 'touches' in e 
      ? getRelativeCoordinates(e.touches[0].clientX, e.touches[0].clientY)
      : getRelativeCoordinates(e.clientX, e.clientY);
    
    if (!point) return;
    
    setIsDrawing(true);
    setCurrentPath([point]);
  };

  // 그리기 중
  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !isDrawing) return;
    
    // 터치 이벤트이고 두 손가락 이상이면 그리기 중단 (핀치 줌 허용)
    if ('touches' in e && e.touches.length > 1) {
      handleDrawEnd();
      return;
    }
    
    // 한 손가락일 때만 preventDefault (패닝 방지)
    if ('touches' in e && e.touches.length === 1) {
      e.preventDefault();
    }
    
    const point = 'touches' in e 
      ? getRelativeCoordinates(e.touches[0].clientX, e.touches[0].clientY)
      : getRelativeCoordinates(e.clientX, e.clientY);
    
    if (!point) return;
    
    setCurrentPath(prev => [...prev, point]);
  };

  // 그리기 종료
  const handleDrawEnd = () => {
    if (!isDrawingMode || !isDrawing) return;
    
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, { points: currentPath }]);
    }
    
    setCurrentPath([]);
    setIsDrawing(false);
  };

  // Undo: 마지막 획 삭제
  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  // 경로 그리기 모드 시작
  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    setSelectedBoothId(null);
  };

  // 경로 그리기 취소
  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setPaths([]);
    setCurrentPath([]);
    setIsDrawing(false);
  };

  // 경로 저장
  const handleSavePath = async () => {
    if (paths.length === 0 && currentPath.length === 0) {
      alert('그린 경로가 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      // 최종 경로 완성
      const finalPaths = currentPath.length > 1 
        ? [...paths, { points: currentPath }]
        : paths;

      const img = imageRef.current;
      
      if (!img) {
        throw new Error('지도 이미지를 찾을 수 없습니다.');
      }

      // 1. 합성 이미지 생성 (지도 + 경로)
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = img.naturalWidth;
      compositeCanvas.height = img.naturalHeight;
      
      const compositeCtx = compositeCanvas.getContext('2d');
      if (!compositeCtx) {
        throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
      }

      // 지도 이미지 그리기
      compositeCtx.drawImage(img, 0, 0, compositeCanvas.width, compositeCanvas.height);

      // 경로 그리기 (투명도 높은 색상)
      compositeCtx.strokeStyle = 'rgba(255, 82, 82, 0.5)';
      compositeCtx.lineWidth = 24;
      compositeCtx.lineCap = 'round';
      compositeCtx.lineJoin = 'round';

      finalPaths.forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        compositeCtx.beginPath();
        compositeCtx.moveTo(
          stroke.points[0].x * compositeCanvas.width,
          stroke.points[0].y * compositeCanvas.height
        );
        
        for (let i = 1; i < stroke.points.length; i++) {
          compositeCtx.lineTo(
            stroke.points[i].x * compositeCanvas.width,
            stroke.points[i].y * compositeCanvas.height
          );
        }
        
        compositeCtx.stroke();
      });

      // 2. 경로만 있는 이미지 생성 (투명 배경)
      const drawingCanvas = document.createElement('canvas');
      drawingCanvas.width = img.naturalWidth;
      drawingCanvas.height = img.naturalHeight;
      
      const drawingCtx = drawingCanvas.getContext('2d');
      if (!drawingCtx) {
        throw new Error('경로 캔버스 컨텍스트를 생성할 수 없습니다.');
      }

      // 투명 배경에 경로만 그리기
      drawingCtx.strokeStyle = 'rgba(255, 82, 82, 0.8)';
      drawingCtx.lineWidth = 24;
      drawingCtx.lineCap = 'round';
      drawingCtx.lineJoin = 'round';

      finalPaths.forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        drawingCtx.beginPath();
        drawingCtx.moveTo(
          stroke.points[0].x * drawingCanvas.width,
          stroke.points[0].y * drawingCanvas.height
        );
        
        for (let i = 1; i < stroke.points.length; i++) {
          drawingCtx.lineTo(
            stroke.points[i].x * drawingCanvas.width,
            stroke.points[i].y * drawingCanvas.height
          );
        }
        
        drawingCtx.stroke();
      });

      // 캔버스를 Blob으로 변환
      const compositeBlob = await new Promise<Blob>((resolve, reject) => {
        compositeCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('합성 이미지 변환 실패'));
        }, 'image/png');
      });

      const drawingBlob = await new Promise<Blob>((resolve, reject) => {
        drawingCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('경로 이미지 변환 실패'));
        }, 'image/png');
      });

      // Supabase에 두 이미지 모두 업로드
      const { compositeUrl, drawingUrl } = await userService.uploadPathImages(
        user.user_id, 
        compositeBlob, 
        drawingBlob
      );
      
      console.log('경로 이미지 저장 완료:', { 
        composite: compositeUrl, 
        drawing: drawingUrl 
      });
      
      setSavedPathImageUrl(compositeUrl);
      setIsDrawingMode(false);
      setPaths([]);
      setCurrentPath([]);
      setIsDrawing(false);
      
      alert('경로가 성공적으로 저장되었습니다!\n(합성 이미지와 경로 이미지 2개 저장 완료)');
    } catch (error) {
      console.error('경로 저장 오류:', error);
      alert('경로 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // currentPath 변경 시 다시 그리기
  useEffect(() => {
    redrawCurrentPath();
  }, [currentPath]);

  // paths 변경 시 다시 그리기
  useEffect(() => {
    redrawPaths();
  }, [paths]);

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    // 그리기 모드가 아닐 때는 항상 툴팁 닫기 (관리자/일반 모드 모두)
    if (!isDrawingMode) {
      setSelectedBoothId(null);
    }

    // 일반 모드에서는 여기서 종료
    if (!isAdminMode) {
      return;
    }

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
        {!isAdminMode && !isDrawingMode && !savedPathImageUrl && (
          <button className="draw-path-button" onClick={handleStartDrawing}>
            ✏️ 이동 경로 그리기
          </button>
        )}
        {!isAdminMode && savedPathImageUrl && !isDrawingMode && (
          <button className="view-path-button" onClick={handleStartDrawing}>
            🔄 경로 다시 그리기
          </button>
        )}
      </div>

      {isDrawingMode && (
        <div className="drawing-controls">
          <div className="drawing-info">
            ✏️ 지도 위를 드래그하여 이동 경로를 그려주세요
          </div>
          <div className="drawing-buttons">
            <button 
              className="undo-button" 
              onClick={handleUndo}
              disabled={paths.length === 0}
            >
              ↶ 뒤로가기 ({paths.length})
            </button>
            <button 
              className="save-button" 
              onClick={handleSavePath}
              disabled={isSaving || (paths.length === 0 && currentPath.length === 0)}
            >
              {isSaving ? '저장 중...' : '💾 저장하기'}
            </button>
            <button 
              className="cancel-button" 
              onClick={handleCancelDrawing}
              disabled={isSaving}
            >
              ✕ 취소
            </button>
          </div>
        </div>
      )}

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
          <div className="map-image-container" onClick={handleContainerClick}>
            {savedPathImageUrl && !isDrawingMode ? (
              <img
                src={savedPathImageUrl}
                alt="저장된 경로가 포함된 지도"
                className="map-image"
              />
            ) : (
              <>
                <img
                  ref={imageRef}
                  src="/2025_map.png"
                  alt="COEX 2025 Map"
                  className={`map-image ${isAdminMode ? 'clickable' : ''} ${isDrawingMode ? 'drawing-mode' : ''}`}
                  onClick={handleImageClick}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  onTouchStart={handleDrawStart}
                  onTouchMove={handleDrawMove}
                  onTouchEnd={handleDrawEnd}
                />
                {isDrawingMode && (
                  <>
                    <canvas
                      ref={canvasRef}
                      className="drawing-canvas"
                      style={{ pointerEvents: 'none' }}
                    />
                    <canvas
                      ref={drawingCanvasRef}
                      className="drawing-canvas current"
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                )}
              </>
            )}
            {displayPositions.map(pos => {
              const evaluated = isEvaluated(pos.booth_id);
              
              // Admin 모드: 모든 부스 파란색
              // 일반 모드: 평가 완료 = 파란색, 평가 미완료 = 빨간색
              const markerClass = isAdminMode 
                ? 'normal' 
                : (evaluated ? 'evaluated' : 'not-evaluated');
              
              const isSelected = selectedBoothId === pos.booth_id;
              
              return (
                <div
                  key={pos.booth_id}
                  className={`booth-marker ${markerClass} ${isDrawingMode ? 'faded' : ''}`}
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

        .map-header {
          padding: 0 20px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .map-header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .draw-path-button,
        .view-path-button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .draw-path-button:hover,
        .view-path-button:hover {
          background: #1565c0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .drawing-controls {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin: 0 20px 20px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .drawing-info {
          text-align: center;
          margin-bottom: 12px;
          color: #1976d2;
          font-weight: 600;
          font-size: 15px;
        }

        .drawing-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .undo-button,
        .save-button,
        .cancel-button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .undo-button {
          background: #ff9800;
          color: white;
        }

        .undo-button:hover:not(:disabled) {
          background: #f57c00;
          transform: translateY(-1px);
        }

        .undo-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .save-button {
          background: #4caf50;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #388e3c;
          transform: translateY(-1px);
        }

        .save-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .cancel-button {
          background: #f44336;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #d32f2f;
          transform: translateY(-1px);
        }

        .cancel-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .legend {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin: 0 20px 20px 20px;
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
          margin: 0 20px 20px 20px;
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
          margin: 0 20px 20px 20px;
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

        .map-image.drawing-mode {
          cursor: crosshair;
          touch-action: pinch-zoom;
        }

        .drawing-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
        }

        .drawing-canvas.current {
          z-index: 6;
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

        .booth-marker.faded {
          opacity: 0.3;
          pointer-events: none;
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

        @media (max-width: 768px) {
          .map-header {
            padding: 0 10px;
            flex-wrap: wrap;
            gap: 10px;
          }

          .map-header h1 {
            font-size: 20px;
            flex: 1;
            min-width: 100%;
          }

          .draw-path-button,
          .view-path-button {
            width: 100%;
          }

          .drawing-controls {
            margin: 0 10px 20px 10px;
          }

          .drawing-buttons {
            flex-direction: column;
          }

          .undo-button,
          .save-button,
          .cancel-button {
            width: 100%;
          }

          .legend {
            margin: 0 10px 20px 10px;
          }

          .admin-controls {
            margin: 0 10px 20px 10px;
          }

          .map-content {
            margin: 0 10px 20px 10px;
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

