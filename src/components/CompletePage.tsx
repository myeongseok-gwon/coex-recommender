import React from 'react';

const CompletePage: React.FC = () => {
  return (
    <div className="container">
      <div className="complete-content">
        <div className="success-icon">✓</div>
        <h1>실험 완료!</h1>
        <p className="message">
          모든 실험 과정을 완료하셨습니다.
        </p>
        <p className="message">
          소중한 시간을 내어 참여해주셔서 진심으로 감사드립니다.
        </p>
        <div className="info-box">
          <p>귀하의 피드백은 추천 시스템 개선에 큰 도움이 됩니다.</p>
          <p>연구에 참여해주셔서 다시 한번 감사드립니다.</p>
        </div>
      </div>

      <style>{`
        .complete-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 72px;
          color: white;
          margin-bottom: 32px;
          animation: scaleIn 0.5s ease-out;
          box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .complete-content h1 {
          font-size: 36px;
          color: #333;
          margin-bottom: 24px;
          font-weight: 700;
        }

        .message {
          font-size: 18px;
          color: #666;
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #4caf50;
          padding: 24px 32px;
          border-radius: 8px;
          margin-top: 40px;
          max-width: 600px;
        }

        .info-box p {
          margin: 12px 0;
          font-size: 16px;
          color: #555;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .complete-content h1 {
            font-size: 28px;
          }

          .success-icon {
            width: 100px;
            height: 100px;
            font-size: 60px;
          }

          .message {
            font-size: 16px;
          }

          .info-box {
            padding: 20px;
          }

          .info-box p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default CompletePage;

