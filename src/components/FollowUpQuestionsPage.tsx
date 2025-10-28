import React, { useState } from 'react';

interface FollowUpQuestionsPageProps {
  summary: string;
  questions: string[];
  onSubmit: (questionAnswerPairs: Array<{ question: string; answer: string }>) => void;
  onSkip: () => void;
  onBack: () => void;
}

const FollowUpQuestionsPage: React.FC<FollowUpQuestionsPageProps> = ({
  summary: _summary,
  questions,
  onSubmit,
  onSkip,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [currentAnswer, setCurrentAnswer] = useState<string>('');

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    // 현재 답변 저장
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(newAnswers);
    
    // 다음 질문으로 이동
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(newAnswers[currentQuestionIndex + 1] || '');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // 현재 답변 저장
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);
      
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAnswer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    // 마지막 답변 저장
    const finalAnswers = [...answers];
    finalAnswers[currentQuestionIndex] = currentAnswer;
    
    // 모든 답변이 입력되었는지 확인
    const allAnswered = finalAnswers.every(answer => answer.trim().length > 0);
    if (!allAnswered) {
      alert('모든 질문에 답변해주세요.');
      return;
    }

    // question-answer pairs 생성
    const questionAnswerPairs = questions.map((question, index) => ({
      question,
      answer: finalAnswers[index]
    }));

    onSubmit(questionAnswerPairs);
  };

  return (
    <div className="container">
      <div className="top-nav-bar">
        <div className="nav-left" onClick={onBack}>
          ← 뒤로가기
        </div>
      </div>

      <div className="header">
        <h1>추가 질문</h1>
        <p>더 정확한 추천을 위해 몇 가지 질문에 답해주세요</p>
      </div>

      <div className="chat-container">
          <div className="progress-bar">
            <div className="progress-text">
              질문 {currentQuestionIndex + 1} / {questions.length}
            </div>
            <div className="progress-line">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="chat-messages" ref={(el) => {
            if (el) {
              // 부드러운 스크롤
              el.scrollTo({
                top: el.scrollHeight,
                behavior: 'smooth'
              });
            }
          }}>
          {/* 이전 질문들 표시 */}
          {questions.slice(0, currentQuestionIndex).map((question, index) => (
            <div key={index} className="message-group">
              <div className="message bot-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-text">{question}</div>
                  <div className="message-time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="message user-message">
                <div className="message-content">
                  <div className="message-text">{answers[index]}</div>
                  <div className="message-time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="message-avatar">👤</div>
              </div>
            </div>
          ))}

          {/* 현재 질문 */}
          <div className="message-group current">
            <div className="message bot-message typing">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-text">{questions[currentQuestionIndex]}</div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={currentQuestionIndex === questions.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <div className="input-section">
            <div className="input-wrapper">
              <textarea
                className="chat-input"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="답변을 입력해주세요..."
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (currentQuestionIndex === questions.length - 1) {
                      handleSubmit(e);
                    } else {
                      handleNext();
                    }
                  }
                }}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={!currentAnswer.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="input-footer">
              <div className="char-count">
                {currentAnswer.length}자
              </div>
              <div className="button-group">
                <button 
                  type="button" 
                  className="btn btn-skip"
                  onClick={onSkip}
                >
                  스킵
                </button>
                {currentQuestionIndex > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handlePrevious}
                  >
                    이전
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!currentAnswer.trim()}
                >
                  {currentQuestionIndex === questions.length - 1 ? '추천 받기' : '다음'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

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

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: calc(100vh - 300px);
          min-height: 500px;
          position: relative;
          padding: 0 20px;
        }

        .progress-bar {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .progress-line {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1976d2, #42a5f5);
          transition: width 0.3s ease;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          max-height: 400px;
          scroll-behavior: smooth;
          /* 스크롤바 숨기기 */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .chat-messages::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        /* 스크롤 가능하다는 것을 시각적으로 표시 */
        .chat-messages::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to bottom, rgba(245, 247, 250, 0.8), transparent);
          pointer-events: none;
          z-index: 1;
        }

        .chat-messages::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to top, rgba(245, 247, 250, 0.8), transparent);
          pointer-events: none;
          z-index: 1;
        }

        .message-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          animation: slideIn 0.4s ease-out;
        }

        .message-group.current {
          animation: pulse 0.6s ease-in;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .message {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          max-width: 85%;
          animation: fadeIn 0.3s ease-out;
        }

        .bot-message {
          align-self: flex-start;
        }

        .user-message {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .bot-message .message-avatar {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: white;
        }

        .user-message .message-avatar {
          background: linear-gradient(135deg, #4caf50, #66bb6a);
          color: white;
        }

        .message-content {
          background: white;
          padding: 0.875rem 1.125rem;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          max-width: 100%;
        }

        .user-message .message-content {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: white;
        }

        .message-text {
          line-height: 1.5;
          font-size: 0.95rem;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-top: 0.25rem;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          margin-top: 0.5rem;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1976d2;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .input-section {
          background: white;
          border-radius: 12px;
          border: 2px solid #e0e0e0;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .input-section:focus-within {
          border-color: #1976d2;
          box-shadow: 0 4px 16px rgba(25, 118, 210, 0.2);
        }

        .input-wrapper {
          display: flex;
          align-items: flex-end;
          padding: 1rem;
          gap: 0.75rem;
        }

        .chat-input {
          flex: 1;
          border: none;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          font-family: inherit;
          resize: none;
          outline: none;
          background: #f8f9fa;
          border-radius: 20px;
          transition: all 0.2s ease;
          max-height: 120px;
        }

        .chat-input:focus {
          background: white;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }

        .send-button {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .send-button:disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
          transform: none;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #f8f9fa;
          border-top: 1px solid #e0e0e0;
        }

        .char-count {
          font-size: 0.85rem;
          color: #666;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 20px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: white;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
        }

        .btn-primary:disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-secondary {
          background: linear-gradient(135deg, #757575, #9e9e9e);
          color: white;
          box-shadow: 0 4px 12px rgba(117, 117, 117, 0.3);
        }

        .btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(117, 117, 117, 0.4);
        }

        .btn-skip {
          background: linear-gradient(135deg, #ff9800, #ffb74d);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
        }

        .btn-skip:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default FollowUpQuestionsPage;

