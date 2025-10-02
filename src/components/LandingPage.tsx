import React, { useState } from 'react';
import { loadUserData } from '../utils/dataLoader';
import { userService } from '../services/supabase';

interface LandingPageProps {
  onUserValid: (userId: number, hasRecommendation: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onUserValid }) => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validUsers = loadUserData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userIdNum = parseInt(userId);
    
    if (isNaN(userIdNum)) {
      setError('올바른 사용자 ID를 입력해주세요.');
      return;
    }

    const isValidUser = validUsers.some(user => user.user_id === userIdNum);
    
    if (!isValidUser) {
      setError('유효하지 않은 사용자 ID입니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 데이터베이스에서 사용자 정보 조회
      const userData = await userService.getUser(userIdNum);
      const hasRecommendation = !!userData.recommended_at;
      
      onUserValid(userIdNum, hasRecommendation);
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
        <p>전시회 부스 추천을 받으려면 사용자 ID를 입력해주세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId" className="form-label">
            사용자 ID
          </label>
          <input
            type="number"
            id="userId"
            className="form-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="사용자 ID를 입력하세요"
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

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>유효한 사용자 ID: 1-16</p>
      </div>
    </div>
  );
};

export default LandingPage;
