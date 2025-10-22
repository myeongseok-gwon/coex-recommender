import React, { useState } from 'react';
import { loadUserData } from '../utils/dataLoader';
import { userService } from '../services/supabase';

interface LandingPageProps {
  onUserValid: (userId: string, hasRecommendation: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onUserValid }) => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validUsers = loadUserData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin 모드 체크
    if (userId.toLowerCase() === 'admin') {
      setLoading(true);
      setError('');
      
      // Admin 모드로 진입 (user_id = '0', 빈 추천으로 지도 페이지 접근)
      onUserValid('0', true);
      setLoading(false);
      return;
    }

    // user_id를 문자열로 처리
    const trimmedUserId = userId.trim();
    
    if (!trimmedUserId) {
      setError('올바른 사용자 ID를 입력해주세요.');
      return;
    }

    const isValidUser = validUsers.some(user => user.user_id === trimmedUserId);
    
    if (!isValidUser) {
      setError('유효하지 않은 사용자 ID입니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 데이터베이스에서 사용자 정보 조회
      const userData = await userService.getUser(trimmedUserId);
      const hasRecommendation = !!userData.recommended_at;
      
      onUserValid(trimmedUserId, hasRecommendation);
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      setError('사용자 정보를 조회할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>COEX 추천 시스템</h1>
        <p>전시회 부스 추천을 받으려면 전화번호를 입력해주세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId" className="form-label">
            전화번호
          </label>
          <input
            type="text"
            id="userId"
            className="form-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="01012345678"
            required
          />
          {error && <div className="error-message">{error}</div>}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? '확인 중...' : '시작하기'}
        </button>
      </form>
    </div>
  );
};

export default LandingPage;