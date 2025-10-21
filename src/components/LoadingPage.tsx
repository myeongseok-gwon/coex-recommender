import React from 'react';

const LoadingPage: React.FC = () => {
  return (
    <div className="container">
      <div className="header">
        <h1>추천 생성 중</h1>
        <p>AI가 당신에게 맞는 부스를 찾고 있습니다...</p>
      </div>

      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>

      <div style={{ textAlign: 'center', color: '#666', marginTop: '20px', padding: '0 20px' }}>
        <p>잠시만 기다려주세요</p>
      </div>
    </div>
  );
};

export default LoadingPage;
