import React, { useEffect } from 'react';

interface ThankYouPageProps {
  onComplete: () => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ onComplete }) => {
  useEffect(() => {
    // 3초 후 자동으로 완료 처리
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="thank-you-page">
      <div className="thank-you-content">
        <div className="thank-you-icon">🙏</div>
        <h1>감사합니다!</h1>
        <p>소중한 평가를 해주셔서 감사합니다.</p>
        <p>더 나은 서비스를 위해 노력하겠습니다.</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <style>{`
        .thank-you-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .thank-you-content {
          text-align: center;
          background: white;
          padding: 60px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
          animation: slideUp 0.6s ease-out;
        }

        .thank-you-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          animation: bounce 1s ease-in-out infinite alternate;
        }

        .thank-you-content h1 {
          color: #1976d2;
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 20px 0;
          animation: fadeIn 0.8s ease-out 0.2s both;
        }

        .thank-you-content p {
          color: #666;
          font-size: 1.1rem;
          margin: 0 0 15px 0;
          line-height: 1.6;
          animation: fadeIn 0.8s ease-out 0.4s both;
        }

        .thank-you-content p:last-of-type {
          margin-bottom: 30px;
          animation: fadeIn 0.8s ease-out 0.6s both;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          animation: fadeIn 0.8s ease-out 0.8s both;
        }

        .loading-dots span {
          width: 8px;
          height: 8px;
          background: #1976d2;
          border-radius: 50%;
          animation: pulse 1.4s ease-in-out infinite both;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .thank-you-content {
            padding: 40px 20px;
            margin: 20px;
          }

          .thank-you-icon {
            font-size: 3rem;
          }

          .thank-you-content h1 {
            font-size: 2rem;
          }

          .thank-you-content p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ThankYouPage;
