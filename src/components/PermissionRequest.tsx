import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';

interface PermissionRequestProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    console.log('🎯 PermissionRequest 컴포넌트 마운트됨');
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    console.log('🔍 checkPermissionStatus 함수 호출됨');
    
    if ('permissions' in navigator) {
      console.log('✅ navigator.permissions 지원됨');
      try {
        console.log('📍 geolocation 권한 상태 확인 중...');
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        const state = permission.state as 'granted' | 'denied' | 'prompt';
        console.log('📊 현재 권한 상태:', state);
        
        if (state === 'prompt') {
          setPermissionStatus('unknown');
          console.log('🔄 권한 상태를 unknown으로 설정');
        } else {
          setPermissionStatus(state);
          console.log('🔄 권한 상태를', state, '로 설정');
        }
        
        if (state === 'granted') {
          console.log('✅ 권한이 허용되어 onPermissionGranted 호출');
          onPermissionGranted();
        }
      } catch (error) {
        console.log('❌ Permission API 오류:', error);
        console.log('Permission API not supported');
      }
    } else {
      console.log('❌ navigator.permissions 지원되지 않음');
    }
  };

  const requestPermission = async () => {
    console.log('🚀 requestPermission 함수 호출됨');
    setIsRequesting(true);
    
    try {
      console.log('📍 getCurrentPosition 호출 중...');
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ 위치 정보 획득 성공:', position);
            resolve(position);
          },
          (error) => {
            console.log('❌ 위치 정보 획득 실패:', error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
      
      console.log('✅ 권한 요청 성공, 상태를 granted로 설정');
      setPermissionStatus('granted');
      onPermissionGranted();
    } catch (error: any) {
      console.error('❌ Permission request failed:', error);
      setPermissionStatus('denied');
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'denied':
        return <MapPin className="w-8 h-8 text-blue-500" />;
      default:
        return <MapPin className="w-8 h-8 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (permissionStatus) {
      case 'denied':
        return '활성화해서 수행해주시면 추천시스템 개선에 도움이 됩니다.';
      default:
        return '활성화해서 수행해주시면 추천시스템 개선에 도움이 됩니다.';
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-blue-600';
      default:
        return 'text-blue-600';
    }
  };

  // 권한이 허용되어 있으면 컴포넌트를 숨김
  if (permissionStatus === 'granted') {
    return null;
  }

  return (
    <div className="permission-request bg-white rounded-lg shadow-lg mb-6">
      <div className="text-center">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold mt-4 mb-2">위치 서비스</h3>
        <p className={`text-sm mb-4 ${getStatusColor()}`}>
          {getStatusMessage()}
        </p>
        

        <div className="flex justify-center">
          <button
            onClick={requestPermission}
            disabled={isRequesting}
            className={`
              flex items-center justify-center px-6 py-3 rounded-lg font-semibold
              transition-all duration-200 transform active:scale-95
              ${isRequesting 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            <MapPin className="w-5 h-5 mr-2" />
            {isRequesting ? '요청 중...' : '위치 켜기'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PermissionRequest;
