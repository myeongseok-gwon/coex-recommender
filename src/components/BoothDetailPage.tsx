import React, { useState, useEffect, useRef } from 'react';
import { User, Booth, Evaluation } from '../types';
import { evaluationService, userService } from '../services/supabase';
import { hasLongCompanyName } from '../utils/companyName';

interface BoothDetailPageProps {
  user: User;
  booth: Booth;
  rationale?: string;
  onBack: () => void;
  onUserUpdate: (user: User) => void;
}

const BoothDetailPage: React.FC<BoothDetailPageProps> = ({ user, booth, rationale, onBack, onUserUpdate }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  
  // 카메라 관련 상태
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 평가 상태
  const [boothRating, setBoothRating] = useState(0);
  const [recRating, setRecRating] = useState(0);
  const [isBoothWrongInfo, setIsBoothWrongInfo] = useState(false);
  const [isIrrelevant, setIsIrrelevant] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    // 카메라 열기 전에 현재 상태를 sessionStorage에 저장
    try {
      const appState = {
        currentUser: user,
        currentPage: 'detail',
        selectedBooth: booth,
        recommendations: user.rec_result ? JSON.parse(user.rec_result) : []
      };
      sessionStorage.setItem('appState', JSON.stringify(appState));
      console.log('상태 저장됨:', appState);
    } catch (error) {
      console.error('상태 저장 오류:', error);
    }
    
    fileInputRef.current?.click();
  };

  const retakePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartEvaluation = async () => {
    if (!photo) {
      alert('사진을 촬영해주세요.');
      return;
    }

    setCameraLoading(true);

    try {
      // Base64를 Blob으로 변환
      const response = await fetch(photo);
      const blob = await response.blob();
      const file = new File([blob], `user_${user.user_id}_booth_${booth.id}_photo.jpg`, { type: 'image/jpeg' });
      
      // Supabase Storage에 사진 업로드 (부스별)
      const photoUrl = await userService.uploadPhoto(user.user_id, file, booth.id);
      
      // 평가 시작 (photo_url 포함)
      const newEvaluation = await evaluationService.startEvaluation(
        user.user_id, 
        booth.id, 
        photoUrl
      );
      setEvaluation(newEvaluation as Evaluation);
      
      // 상태 초기화
      setPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // 평가가 성공적으로 시작되었으므로 저장된 상태 정리
      sessionStorage.removeItem('appState');
      
    } catch (error) {
      console.error('사진 업로드 또는 평가 시작 오류:', error);
      alert('사진 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setCameraLoading(false);
    }
  };

  const handleEndEvaluation = () => {
    setShowRatingModal(true);
    setModalStep(1);
    setBoothRating(0);
    setRecRating(0);
    setIsBoothWrongInfo(false);
    setIsIrrelevant(false);
    setIsCorrect(false);
  };

  const handleStep1Next = () => {
    if (boothRating === 0) {
      alert('부스 만족도를 반드시 선택해주세요.');
      return;
    }
    setModalStep(2);
  };

  const handleStep2Submit = async () => {
    if (recRating === 0) {
      alert('추천 만족도를 반드시 선택해주세요.');
      return;
    }

    // 최소 하나의 체크박스가 선택되어야 함
    if (!isBoothWrongInfo && !isIrrelevant && !isCorrect) {
      alert('아래 체크박스 중 적어도 하나는 반드시 선택해주세요.');
      return;
    }

    try {
      // evaluation 테이블 업데이트
      await evaluationService.updateEvaluation(user.user_id, booth.id, {
        booth_rating: boothRating,
        rec_rating: recRating,
        is_booth_wrong_info: isBoothWrongInfo,
        is_irrelevant: isIrrelevant,
        is_correct: isCorrect,
        ended_at: new Date().toISOString()
      });
      
      // 모든 평가 데이터를 가져와서 rec_eval 업데이트
      try {
        const allEvaluations = await evaluationService.getAllEvaluations(user.user_id);
        const recEvalArray = allEvaluations.map((ev: any) => ({
          id: ev.booth_id,
          booth_rating: ev.booth_rating,
          rec_rating: ev.rec_rating
        }));
        await userService.updateUserRecEval(user.user_id, JSON.stringify(recEvalArray));
        
        // 업데이트된 user 정보 가져오기
        const updatedUser = await userService.getUser(user.user_id);
        onUserUpdate(updatedUser as User);
      } catch (evalError) {
        console.warn('rec_eval 업데이트 실패 (컬럼이 아직 없을 수 있음):', evalError);
        // rec_eval 업데이트는 실패해도 평가는 정상적으로 완료됨
      }
      
      setEvaluation(prev => prev ? {
        ...prev,
        booth_rating: boothRating,
        rec_rating: recRating,
        is_booth_wrong_info: isBoothWrongInfo,
        is_irrelevant: isIrrelevant,
        is_correct: isCorrect,
        ended_at: new Date().toISOString()
      } : null);
      
      setShowRatingModal(false);
      alert('평가가 완료되었습니다. 감사합니다!');
    } catch (error) {
      console.error('평가 완료 오류:', error);
      alert('평가를 완료할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const closeModal = () => {
    setShowRatingModal(false);
    setModalStep(1);
  };

  const handleBackClick = () => {
    // 뒤로가기 시 저장된 상태 정리
    sessionStorage.removeItem('appState');
    onBack();
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
      <div className="top-nav-bar">
        <div className="nav-left" onClick={handleBackClick}>
          ← 뒤로가기
        </div>
      </div>

      <div className="card">
        <h2 className={`card-title ${hasLongCompanyName(booth.company_name_kor) ? 'long-name' : ''}`}>{booth.company_name_kor}</h2>
        
        {booth.category && (
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            카테고리: {booth.category}
          </p>
        )}

        {rationale && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '8px', color: '#333' }}>추천 이유</h4>
            <div className="card-description">
              {rationale}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          {!hasStarted ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              {photo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={photo} 
                    alt="촬영된 사진"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: '8px'
                    }}
                  />
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleStartEvaluation}
                      className="btn btn-primary"
                      disabled={cameraLoading}
                      style={{ fontSize: '16px', padding: '12px 24px' }}
                    >
                      {cameraLoading ? '업로드 중...' : '✅ 확인하고 시작'}
                    </button>
                    <button 
                      onClick={retakePhoto}
                      className="btn"
                      disabled={cameraLoading}
                      style={{ fontSize: '16px', padding: '12px 24px' }}
                    >
                      🔄 다시 촬영
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={openCamera}
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  📷 사진 촬영하고 시작하기
                </button>
              )}
            </>
          ) : !hasEnded ? (
            <button
              className="btn btn-danger"
              onClick={handleEndEvaluation}
            >
              종료
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: '#28a745' }}>
              <p>평가 완료</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                부스 평점: {evaluation?.booth_rating}점 | 추천 평점: {evaluation?.rec_rating}점
              </p>
            </div>
          )}
        </div>
      </div>

      {showRatingModal && (
        <div className="rating-modal">
          <div className="rating-modal-content">
            {modalStep === 1 ? (
              <>
                <h3>부스 만족도 평가</h3>
                <p>부스가 얼마나 만족스러웠나요?</p>
                
                <div className="rating-container">
                  <span className="rating-label-left">매우 불만족</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= boothRating ? 'active' : ''}`}
                        onClick={() => setBoothRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-label-right">매우 만족</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={closeModal}
                    style={{ flex: 1 }}
                  >
                    취소
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleStep1Next}
                    style={{ flex: 1 }}
                    disabled={boothRating === 0}
                  >
                    다음
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>추천 만족도 평가</h3>
                <p>추천이 얼마나 만족스러웠나요?</p>
                
                <div className="rating-container">
                  <span className="rating-label-left">매우 불만족</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= recRating ? 'active' : ''}`}
                        onClick={() => setRecRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-label-right">매우 만족</span>
                </div>

                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isBoothWrongInfo}
                      onChange={(e) => setIsBoothWrongInfo(e.target.checked)}
                    />
                    <span>잘못된 부스 정보가 포함되어있습니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isIrrelevant}
                      onChange={(e) => setIsIrrelevant(e.target.checked)}
                    />
                    <span>제 관심사와 관련성 없는 부스입니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isCorrect}
                      onChange={(e) => setIsCorrect(e.target.checked)}
                    />
                    <span>해당 사항 없습니다.</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModalStep(1)}
                    style={{ flex: 1 }}
                  >
                    이전
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleStep2Submit}
                    style={{ flex: 1 }}
                    disabled={recRating === 0 || (!isBoothWrongInfo && !isIrrelevant && !isCorrect)}
                  >
                    완료
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

        .rating-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 24px 0;
        }

        .rating-label-left,
        .rating-label-right {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
        }

        .checkbox-container {
          margin-top: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.5;
        }

        .checkbox-label input[type="checkbox"] {
          margin-top: 3px;
          cursor: pointer;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .checkbox-label span {
          flex: 1;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #ccc !important;
          color: #666 !important;
        }

        .btn:disabled:hover {
          background-color: #ccc !important;
          color: #666 !important;
        }
      `}</style>
    </div>
  );
};

export default BoothDetailPage;
