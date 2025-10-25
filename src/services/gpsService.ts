import { gpsTrackingService } from './supabase';
import { GpsLocation } from '../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface GPSError {
  code: number;
  message: string;
}

export class GPSService {
  private watchId: number | null = null;
  private isTracking = false;
  private locations: GpsLocation[] = [];
  private startTime: number = 0;
  public userId: string;
  private onLocationUpdate?: (location: LocationData) => void;
  private onError?: (error: GPSError) => void;
  private intervalId: NodeJS.Timeout | null = null;
  private lastSentTime: number = 0;

  constructor(userId: string) {
    console.log('🏗️ GPSService 생성자 호출됨', { 
      userId, 
      userIdType: typeof userId,
      userIdLength: userId?.length 
    });
    this.userId = userId;
    const hasSupport = this.checkGeolocationSupport();
    console.log('🏗️ GPSService 생성자 완료', { 
      userId: this.userId, 
      hasSupport,
      finalUserId: this.userId 
    });
  }

  private checkGeolocationSupport(): boolean {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return false;
    }
    return true;
  }

  public async requestPermission(): Promise<boolean> {
    console.log('🔍 GPSService: requestPermission 호출됨', {
      userId: this.userId,
      hasGeolocation: !!navigator.geolocation,
      userAgent: navigator.userAgent
    });
    
    if (!this.checkGeolocationSupport()) {
      console.log('❌ GPSService: Geolocation 지원되지 않음');
      return false;
    }

    try {
      console.log('📍 GPSService: getCurrentPosition으로 권한 요청 중...');
      // Request permission by getting current position
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ GPSService: 위치 정보 획득 성공:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            });
            resolve();
          },
          (error) => {
            console.log('❌ GPSService: 위치 정보 획득 실패:', {
              code: error.code,
              message: error.message,
              error: error
            });
            reject(new Error('Permission denied'));
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
      console.log('✅ GPSService: 권한 요청 성공');
      return true;
    } catch (error) {
      console.log('❌ GPSService: 권한 요청 실패:', error);
      return false;
    }
  }

  public startTracking(
    onLocationUpdate?: (location: LocationData) => void,
    onError?: (error: GPSError) => void
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      console.log('🚀 GPSService: startTracking 호출됨', {
        userId: this.userId,
        isTracking: this.isTracking,
        hasGeolocation: !!navigator.geolocation,
        userIdValid: !!this.userId && this.userId !== ''
      });
      
      // user_id 유효성 검사
      if (!this.userId || this.userId === '') {
        console.error('❌ GPS 추적 시작 실패: user_id가 유효하지 않음', { userId: this.userId });
        reject(new Error('Invalid user_id'));
        return;
      }
      
      if (!this.checkGeolocationSupport()) {
        console.log('❌ GPSService: Geolocation 지원되지 않음');
        reject(new Error('Geolocation not supported by this browser'));
        return;
      }

      if (this.isTracking) {
        console.log('❌ GPSService: 이미 추적 중');
        reject(new Error('GPS tracking is already active'));
        return;
      }

      // Request permission first
      console.log('🔍 GPSService: 권한 확인 중...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('❌ GPSService: 권한 없음');
        reject(new Error('Location permission denied. Please allow location access in your browser settings.'));
        return;
      }

      this.onLocationUpdate = onLocationUpdate;
      this.onError = onError;
      this.startTime = Date.now();
      this.locations = [];

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000
      };

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log('📍 GPS 위치 수신됨:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
          
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          };

          // Store location data
          const gpsLocation: GpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          };

          this.locations.push(gpsLocation);
          this.isTracking = true;
          this.onLocationUpdate?.(locationData);
        },
        (error) => {
          const gpsError: GPSError = {
            code: error.code,
            message: this.getErrorMessage(error.code)
          };
          this.onError?.(gpsError);
          reject(gpsError);
        },
        options
      );

      console.log('✅ GPS 추적 시작됨 (하이브리드 모드)');
      
      // 하이브리드 모드: watchPosition + 주기적 전송
      this.startHybridTracking();
      
      resolve();
    });
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied. Please allow location permissions in your browser settings.';
      case 2:
        return 'Location unavailable. Please check your GPS settings and try again.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while accessing location.';
    }
  }

  public stopTracking(): void {
    console.log('🛑 GPSService: stopTracking 호출됨', {
      userId: this.userId,
      isTracking: this.isTracking,
      watchId: this.watchId,
      intervalId: this.intervalId
    });
    
    if (this.watchId !== null) {
      console.log('🛑 GPS watchPosition 중지 중...');
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('✅ GPS watchPosition 중지 완료');
    }
    
    if (this.intervalId !== null) {
      console.log('🛑 GPS interval 중지 중...');
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('✅ GPS interval 중지 완료');
    }
    
    this.isTracking = false;
    console.log('✅ GPS 추적 완전 중지됨');
  }

  private async sendLocationToSupabase(location: GpsLocation): Promise<void> {
    try {
      console.log('🚀 GPS 데이터 전송 시작:', {
        currentUserId: this.userId,
        location: location,
        timestamp: new Date().toISOString()
      });
      
      // user_id가 유효한지 확인
      if (!this.userId || this.userId === '') {
        console.error('❌ GPS 전송 실패: user_id가 유효하지 않음', { userId: this.userId });
        return;
      }
      
      await gpsTrackingService.sendRealtimeLocation(this.userId, location);
      console.log('✅ 실시간 위치 데이터 전송 완료:', {
        userId: this.userId,
        location: location
      });
    } catch (error) {
      console.error('❌ 실시간 위치 데이터 전송 실패:', {
        error: error,
        userId: this.userId,
        location: location,
        timestamp: new Date().toISOString()
      });
    }
  }

  public getCurrentPosition(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.checkGeolocationSupport()) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: false, // 정확도를 낮춰서 더 빠르게 응답
        timeout: 15000, // 타임아웃을 15초로 줄임
        maximumAge: 300000 // 5분 이내의 캐시된 위치도 허용
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          };
          resolve(locationData);
        },
        (error) => {
          console.error('getCurrentPosition error:', {
            code: error.code,
            message: error.message,
            error: error
          });
          
          // 에러 코드별 상세 메시지
          let errorMessage = '위치 정보를 가져올 수 없습니다.';
          switch (error.code) {
            case 1:
              errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case 2:
              errorMessage = '위치 정보를 사용할 수 없습니다. GPS가 켜져 있는지 확인해주세요.';
              break;
            case 3:
              errorMessage = '위치 요청이 시간 초과되었습니다. 잠시 후 다시 시도해주세요.';
              break;
          }
          
          const gpsError: GPSError = {
            code: error.code,
            message: errorMessage
          };
          reject(gpsError);
        },
        options
      );
    });
  }

  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  public getTrackingStatus(): string {
    if (!navigator.geolocation) {
      return 'unsupported';
    }
    if (this.isTracking) {
      return 'tracking';
    }
    return 'stopped';
  }

  public async saveTrackingData(): Promise<void> {
    if (this.locations.length === 0) {
      console.log('No GPS data to save');
      return;
    }

    const duration = Date.now() - this.startTime;
    const durationString = this.formatDuration(duration);
    const totalDistance = this.calculateTotalDistance(this.locations);

    const trackingData = {
      totalPoints: this.locations.length,
      totalDistance,
      duration: durationString,
      locations: this.locations
    };

    try {
      await gpsTrackingService.createTracking(this.userId, trackingData);
      console.log('GPS tracking data saved successfully');
    } catch (error) {
      console.error('Failed to save GPS tracking data:', error);
    }
  }

  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  private calculateTotalDistance(locations: GpsLocation[]): number {
    let totalDistance = 0;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const distance = this.getDistanceFromLatLonInMeters(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      
      totalDistance += distance;
    }

    return totalDistance;
  }

  private getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of the earth in meters
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in meters
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 하이브리드 추적 시작 (watchPosition + 주기적 전송)
  private startHybridTracking(): void {
    console.log('🔄 하이브리드 GPS 추적 시작');
    
    // 1. watchPosition으로 위치 변경 감지
    // (이미 위에서 설정됨)
    
    // 2. 주기적으로 현재 위치를 가져와서 전송 (15초마다)
    this.intervalId = setInterval(async () => {
      try {
        console.log('⏰ 주기적 GPS 전송 (15초)');
        const position = await this.getCurrentPosition();
        const gpsLocation: GpsLocation = {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: position.timestamp,
          altitude: position.altitude,
          speed: position.speed,
          heading: position.heading
        };
        
        await this.sendLocationToSupabase(gpsLocation);
        console.log('✅ 주기적 GPS 전송 완료');
      } catch (error: any) {
        console.error('❌ 주기적 GPS 전송 실패:', error);
        
        // 타임아웃 에러인 경우 더 관대한 설정으로 재시도
        if (error.code === 3) {
          console.log('🔄 타임아웃 에러 - 더 관대한 설정으로 재시도');
          try {
            const fallbackOptions: PositionOptions = {
              enableHighAccuracy: false,
              timeout: 5000, // 5초로 더 짧게
              maximumAge: 600000 // 10분 이내 캐시 허용
            };
            
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, fallbackOptions);
            });
            
            const gpsLocation: GpsLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              altitude: position.coords.altitude || undefined,
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined
            };
            
            await this.sendLocationToSupabase(gpsLocation);
            console.log('✅ 폴백 GPS 전송 성공');
          } catch (fallbackError) {
            console.error('❌ 폴백 GPS 전송도 실패:', fallbackError);
          }
        }
      }
    }, 15000); // 15초마다
    
    console.log('✅ 하이브리드 GPS 추적 설정 완료');
  }

  // 수동으로 현재 위치를 전송하는 메서드
  public async sendCurrentLocation(): Promise<void> {
    console.log('📍 sendCurrentLocation 메서드 호출됨', { 
      userId: this.userId,
      isTracking: this.isTracking,
      hasGeolocation: !!navigator.geolocation
    });
    
    try {
      console.log('📍 수동 GPS 전송 요청:', { userId: this.userId });
      
      console.log('📍 getCurrentPosition 호출 중...');
      const position = await this.getCurrentPosition();
      console.log('📍 getCurrentPosition 성공:', position);
      
      const gpsLocation: GpsLocation = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: position.timestamp,
        altitude: position.altitude,
        speed: position.speed,
        heading: position.heading
      };
      
      console.log('📍 수동 GPS 전송:', {
        userId: this.userId,
        location: gpsLocation,
        timestamp: new Date().toISOString()
      });
      
      console.log('📍 sendLocationToSupabase 호출 중...');
      await this.sendLocationToSupabase(gpsLocation);
      console.log('✅ 수동 GPS 전송 완료');
    } catch (error) {
      console.error('❌ 수동 GPS 전송 실패:', error);
      throw error;
    }
  }

  // 디버깅용 메서드
  public getDebugInfo() {
    return {
      userId: this.userId,
      isTracking: this.isTracking,
      watchId: this.watchId,
      locationsCount: this.locations.length,
      lastSentTime: this.lastSentTime,
      hasGeolocation: !!navigator.geolocation
    };
  }
}
