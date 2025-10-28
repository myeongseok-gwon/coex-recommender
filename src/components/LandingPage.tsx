import React, { useState, useEffect } from 'react';
import { userService } from '../services/supabase';
import { GPSService } from '../services/gpsService';

interface LandingPageProps {
  onUserValid: (userId: string, userData: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onUserValid }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsService, setGpsService] = useState<GPSService | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [consentTestParticipation, setConsentTestParticipation] = useState(false);
  const [consentPrivacyCollection, setConsentPrivacyCollection] = useState(false);
  const [consentThirdPartySharing, setConsentThirdPartySharing] = useState(false);
  const [expand1, setExpand1] = useState(false);
  const [expand2, setExpand2] = useState(false);
  const [expand3, setExpand3] = useState(false);

  // 위치 정보 권한 확인 함수
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      console.log('❌ navigator.permissions 지원되지 않음');
      setLocationPermission('unknown');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      console.log('📍 위치 정보 권한 상태:', permission.state);
      setLocationPermission(permission.state);
      
      // 권한 상태 변경 감지
      permission.onchange = () => {
        console.log('📍 위치 정보 권한 상태 변경:', permission.state);
        setLocationPermission(permission.state);
      };
    } catch (error) {
      console.log('❌ 위치 정보 권한 확인 실패:', error);
      setLocationPermission('unknown');
    }
  };

  useEffect(() => {
    console.log('🎯 LandingPage 컴포넌트 마운트됨');
    // GPS 서비스 초기화
    const service = new GPSService('');
    setGpsService(service);
    console.log('📍 GPS 서비스 초기화 완료.');
    
    // 위치 정보 권한 확인
    checkLocationPermission();
    
    // 컴포넌트 언마운트 시 GPS 추적 정리
    return () => {
      if (service) {
        console.log('🧹 GPS 서비스 정리 중...');
        service.stopTracking();
      }
    };
  }, []);


  // 현재 GPS 권한 상태를 실시간으로 체크하는 함수
  const checkCurrentGpsPermission = async (): Promise<boolean> => {
    console.log('🔍 checkCurrentGpsPermission 함수 호출됨');
    
    if (!navigator.geolocation) {
      console.log('❌ navigator.geolocation 지원되지 않음');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS 권한 확인 성공:', position);
          resolve(true);
        },
        (error) => {
          console.log('❌ GPS 권한 확인 실패:', error);
          resolve(false);
        },
        { timeout: 5000 }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이미 로딩 중이면 중복 실행 방지
    if (loading) {
      console.log('⚠️ 이미 로딩 중입니다.');
      return;
    }

    // 동의 체크 확인
    if (!consentTestParticipation || !consentPrivacyCollection || !consentThirdPartySharing) {
      setError('모든 동의 항목에 체크해야 진행할 수 있습니다.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // GPS 권한 체크는 하되, 권한이 없어도 진행 가능
      console.log('🔍 제출 시점에 GPS 권한 확인 중...');
      const currentPermission = await checkCurrentGpsPermission();
      console.log('📊 현재 GPS 권한 상태:', currentPermission);
      
      if (currentPermission) {
        console.log('✅ GPS 권한 허용됨');
      } else {
        console.log('⚠️ GPS 권한 없음, 하지만 진행 가능');
      }
    
      // Admin 모드 체크
      if (phoneNumber.toLowerCase() === 'admin') {
        // Admin 모드로 진입 (user_id = '0', 빈 추천으로 지도 페이지 접근)
        const adminUser = {
          user_id: '0',
          initial_form_started_at: null,
          initial_form_submitted_at: null,
          skipped_at: null,
          additional_form_submitted_at: null,
          ended_at: null
        };
        onUserValid('0', adminUser);
        return;
      }

      // 전화번호를 문자열로 처리
      const trimmedPhoneNumber = phoneNumber.trim();
      
      if (!trimmedPhoneNumber) {
        setError('전화번호를 입력해주세요.');
        setLoading(false);
        return;
      }

      // 전화번호 형식 간단 검증 (숫자만)
      if (!/^\d+$/.test(trimmedPhoneNumber)) {
        setError('올바른 전화번호 형식을 입력해주세요.');
        setLoading(false);
        return;
      }
      setError('');

      try {
        // 데이터베이스에서 사용자 정보 조회 시도
        let userData;
        try {
          userData = await userService.getUser(trimmedPhoneNumber);
        } catch (error: any) {
          // 사용자가 존재하지 않는 경우 새로 생성
          if (error.code === 'PGRST116') {
            userData = await userService.createUser(trimmedPhoneNumber, {
              consent_test_participation: consentTestParticipation,
              consent_privacy_collection: consentPrivacyCollection,
              consent_third_party_sharing: consentThirdPartySharing
            });
          } else {
            throw error;
          }
        }
        
        // GPS 서비스를 사용자 ID로 업데이트
        if (gpsService) {
          gpsService.userId = trimmedPhoneNumber;
        }
        
        onUserValid(trimmedPhoneNumber, userData);
      } catch (error) {
        console.error('사용자 정보 처리 오류:', error);
        setError('사용자 정보를 처리할 수 없습니다. 다시 시도해주세요.');
        setLoading(false);
      }
    } catch (error) {
      console.error('전체 처리 오류:', error);
      setError('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>푸드위크 추천 시스템</h1>
        <p>전화번호를 입력해주세요. (로그인 및 추첨 목적)</p>
        {locationPermission !== 'granted' && (
          <div className="location-notice">
            <p>📍 브라우저 설정에서 위치 정보 수집을 동의해주세요.</p>
          </div>
        )}
      </div>

    

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phoneNumber" className="form-label">
            전화번호
          </label>
          <input
            type="text"
            id="phoneNumber"
            className="form-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="01012345678"
            required
          />
          {error && <div className="error-message">{error}</div>}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !(consentTestParticipation && consentPrivacyCollection && consentThirdPartySharing)}
        >
          {loading ? (
            <>
              확인 중...
            </>
          ) : (
            '시작하기'
          )}
        </button>
      </form>

      <div className="consent-section">
        <div className="consent-header">
          <label className="consent-all">
            <input
              type="checkbox"
              className="mr-2"
              checked={consentTestParticipation && consentPrivacyCollection && consentThirdPartySharing}
              onChange={(e) => {
                const checked = e.target.checked;
                setConsentTestParticipation(checked);
                setConsentPrivacyCollection(checked);
                setConsentThirdPartySharing(checked);
              }}
            />
            전체 동의하기
          </label>
        </div>

        <div className="consent-item">
          <div className="consent-title">
            <label>
              <input
                type="checkbox"
                className="mr-2"
                checked={consentTestParticipation}
                onChange={(e) => setConsentTestParticipation(e.target.checked)}
              />
              테스트 참가 동의서
            </label>
            <button type="button" className="consent-toggle" onClick={() => setExpand1(!expand1)}>
              {expand1 ? '접기' : '내용 확인하기'}
            </button>
          </div>
          {expand1 && (
            <div className="consent-content">
              <p><strong>본인은 COEX, Impact AI, KAIST에서 진행하는 데모 테스트 참가 및 아래 내용에 자발적으로 동의합니다.</strong></p>
              <p>본 테스트는 2025 FOOD WEEK 기간 중 A홀 및 B홀 내 지정된 장소에서 진행되며, 제공되는 시스템을 실제로 체험하고 이에 대한 간단한 피드백을 제공하겠습니다.</p>
              <p>본 테스트는 약 2시간이 소요될 것으로 예상됩니다. 다만, 진행 속도에 따라 더 빠르게 완료될 수도 있습니다.</p>
              <p>본인은 테스트 참가 중 얻게 되는 모든 정보(테스트 내용, 시스템 등)는 비밀로 유지하고 외부로 유출하지 않겠습니다.</p>
              <p>테스트 진행에 협조하며 연구진의 안내를 성실히 따르겠습니다.</p>
            </div>
          )}
        </div>

        <div className="consent-item">
          <div className="consent-title">
            <label>
              <input
                type="checkbox"
                className="mr-2"
                checked={consentPrivacyCollection}
                onChange={(e) => setConsentPrivacyCollection(e.target.checked)}
              />
              개인정보 수집 및 활용 동의서
            </label>
            <button type="button" className="consent-toggle" onClick={() => setExpand2(!expand2)}>
              {expand2 ? '접기' : '내용 확인하기'}
            </button>
          </div>
          {expand2 && (
            <div className="consent-content">
              <p><strong>본인은 COEX, Impact AI, KAIST에서 진행하는 데모 테스트를 위해 COEX, Impact AI, KAIST가 아래와 같이 본인의 개인 정보를 수집 및 활용하는 것에 동의합니다.</strong></p>
              <p><strong>수집 및 활용 목적:</strong> 테스트 참가자 본인 확인, 참가 보상 지급, 추천 시스템 개발의 연구 목적</p>
              <p><strong>수집 항목:</strong> 이름, 연락처(휴대폰 번호), 성별, 연령대, 설문조사에 대한 답변 내용 (서비스 만족도 관련), 위치 정보(동의 시)</p>
              <p><strong>보유 및 이용 기간:</strong> 참가 신청일로 부터 본 연구 종료일과 참가 신청일로부터 3년이 경과한 날 중 먼저 도래한 날까지 보유하고, 그 익일에 개인정보 파기</p>
              <p><strong>개인정보주체는 위 동의를 거부할 수 있습니다. 다만, 거부 시에는 데모 테스트에 참여할 수 없습니다.</strong></p>
            </div>
          )}
        </div>

        <div className="consent-item">
          <div className="consent-title">
            <label>
              <input
                type="checkbox"
                className="mr-2"
                checked={consentThirdPartySharing}
                onChange={(e) => setConsentThirdPartySharing(e.target.checked)}
              />
              개인정보 제3자 제공 동의서
            </label>
            <button type="button" className="consent-toggle" onClick={() => setExpand3(!expand3)}>
              {expand3 ? '접기' : '내용 확인하기'}
            </button>
          </div>
          {expand3 && (
            <div className="consent-content">
              <p><strong>COEX, Impact AI, KAIST는 데모 테스트를 위해 아래와 같이 개인 정보의 제공에 관한 동의를 요청 드립니다.</strong></p>
              <p><strong>제공받는 자:</strong> 추천 시스템 연구 업무를 수행하는 COEX, Impact AI, KAIST 임직원, 서울경제진흥원</p>
              <p><strong>제공받는 자의 이용 목적:</strong> 추천 시스템 개발의 연구 목적</p>
              <p><strong>제공하는 항목:</strong> 이름, 연락처(휴대폰 번호), 성별, 연령대, 설문조사에 대한 답변 내용 (서비스 만족도 관련), 위치 정보 (동의 시)</p>
              <p><strong>제공받는 자의 보유 및 이용 기간:</strong> 참가 신청일로 부터 본 연구 종료일과 참가 신청일로부터 3년이 경과한 날 중 먼저 도래한 날까지 보유하고, 그 익일에 개인정보 파기</p>
              <p><strong>개인정보주체는 위 동의에 거부할 수 있습니다. 다만, 거부 시에는 데모 테스트에 참여할 수 없습니다.</strong></p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px 16px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }

        .header p {
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .location-notice {
          margin-top: 12px;
          padding: 8px 12px;
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          text-align: center;
        }

        .location-notice p {
          font-size: 0.9rem;
          color: #0369a1;
          margin: 0;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
          padding: 0;
          margin-left: 0;
          margin-right: 0;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          margin-left: 16px;
          margin-right: 16px;
          font-size: 0.9rem;
        }

        .form-input {
          width: calc(100% - 32px);
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
          margin: 0 16px;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .btn {
          width: calc(100% - 32px);
          padding: 14px 16px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
          box-sizing: border-box;
          margin: 0 16px;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-primary:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 8px;
          font-weight: 500;
        }

        form {
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .permission-request {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
          padding: 24px 16px;
        }

        .permission-request h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .permission-request p {
          margin: 0;
        }

        .permission-request button {
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .permission-request button:disabled {
          cursor: not-allowed;
        }

        .permission-request .flex {
          display: flex;
        }

        .permission-request .items-center {
          align-items: center;
        }

        .permission-request .justify-center {
          justify-content: center;
        }

        .permission-request .gap-3 {
          gap: 12px;
        }

        .permission-request .flex-col {
          flex-direction: column;
        }

        .permission-request .sm\\:flex-row {
          flex-direction: row;
        }

        .permission-request .text-center {
          text-align: center;
        }

        .permission-request .bg-white {
          background-color: white;
        }

        .permission-request .text-green-500 {
          color: #10b981;
        }

        .permission-request .text-red-500 {
          color: #ef4444;
        }

        .permission-request .text-blue-500 {
          color: #3b82f6;
        }

        .permission-request .text-green-600 {
          color: #059669;
        }

        .permission-request .text-red-600 {
          color: #dc2626;
        }

        .permission-request .text-blue-600 {
          color: #2563eb;
        }

        .permission-request .text-gray-500 {
          color: #6b7280;
        }

        .permission-request .text-gray-600 {
          color: #4b5563;
        }

        .permission-request .text-gray-700 {
          color: #374151;
        }

        .permission-request .text-red-700 {
          color: #b91c1c;
        }

        .permission-request .text-red-600 {
          color: #dc2626;
        }

        .permission-request .bg-red-50 {
          background-color: #fef2f2;
        }

        .permission-request .border-red-200 {
          border-color: #fecaca;
        }

        .permission-request .bg-yellow-50 {
          background-color: #fefce8;
        }

        .permission-request .border-yellow-200 {
          border-color: #fde047;
        }

        .permission-request .text-yellow-500 {
          color: #eab308;
        }

        .permission-request .text-yellow-600 {
          color: #ca8a04;
        }

        .permission-request .text-yellow-700 {
          color: #a16207;
        }

        .permission-request .bg-gray-100 {
          background-color: #f3f4f6;
        }

        .permission-request .bg-blue-500 {
          background-color: #3b82f6;
        }

        .permission-request .hover\\:bg-blue-600:hover {
          background-color: #2563eb;
        }

        .permission-request .hover\\:bg-gray-200:hover {
          background-color: #e5e7eb;
        }

        .permission-request .text-white {
          color: white;
        }

        .permission-request .shadow-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .permission-request .hover\\:shadow-xl:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .permission-request .w-8 {
          width: 2rem;
        }

        .permission-request .h-8 {
          height: 2rem;
        }

        .permission-request .w-5 {
          width: 1.25rem;
        }

        .permission-request .h-5 {
          height: 1.25rem;
        }

        .permission-request .mr-2 {
          margin-right: 0.5rem;
        }

        .permission-request .mt-4 {
          margin-top: 1rem;
        }

        .permission-request .mb-2 {
          margin-bottom: 0.5rem;
        }

        .permission-request .mb-4 {
          margin-bottom: 1rem;
        }

        .permission-request .mt-2 {
          margin-top: 0.5rem;
        }

        .permission-request .mt-0\\.5 {
          margin-top: 0.125rem;
        }

        .permission-request .text-lg {
          font-size: 1.125rem;
        }

        .permission-request .text-sm {
          font-size: 0.875rem;
        }

        .permission-request .text-xs {
          font-size: 0.75rem;
        }

        .permission-request .font-semibold {
          font-weight: 600;
        }

        .permission-request .font-medium {
          font-weight: 500;
        }

        .permission-request .space-y-1 > * + * {
          margin-top: 0.25rem;
        }

        .permission-request .rounded-lg {
          border-radius: 0.5rem;
        }

        .permission-request .p-4 {
          padding: 1rem;
        }

        .permission-request .p-6 {
          padding: 1.5rem;
        }

        .permission-request .px-6 {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        .permission-request .py-3 {
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }

        .permission-request .items-start {
          align-items: flex-start;
        }

        .permission-request .text-left {
          text-align: left;
        }

        .permission-request .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        .permission-request .duration-200 {
          transition-duration: 200ms;
        }

        .permission-request .transform {
          transform: translateZ(0);
        }

        .permission-request .active\\:scale-95:active {
          transform: scale(0.95);
        }

        .gps-status-simple {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          margin: 12px 0;
          font-size: 0.85rem;
          color: #166534;
        }

        .gps-status-simple .status-icon {
          font-size: 1rem;
        }

        .gps-status-simple .status-text {
          flex: 1;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn:disabled:hover {
          transform: none;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .consent-section {
          margin-top: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 12px;
        }

        /* 체크박스와 라벨 텍스트 사이 간격을 조금 더 넓힘 */
        .consent-section .mr-2 {
          margin-right: 0.5rem;
        }

        .consent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .consent-all {
          font-weight: 600;
          color: #111827;
        }

        .consent-item {
          border-top: 1px dashed #e5e7eb;
          padding-top: 10px;
          margin-top: 10px;
        }

        .consent-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .consent-toggle {
          background: transparent;
          border: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
        }

        .consent-content {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          margin-top: 8px;
          color: #374151;
          font-size: 0.9rem;
        }


      `}</style>
    </div>
  );
};

export default LandingPage;