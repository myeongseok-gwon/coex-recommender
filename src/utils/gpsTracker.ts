import { gpsTrackingService } from '../services/supabase';
import { GpsLocation } from '../types';

export class GpsTracker {
  private watchId: number | null = null;
  private locations: GpsLocation[] = [];
  private startTime: number = 0;
  public userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => {
          alert('위치 서비스 권한이 필요합니다. 서비스를 이용하려면 위치 권한을 허용해주세요.');
          resolve(false);
        },
        { timeout: 10000 }
      );
    });
  }

  startTracking(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
        resolve(false);
        return;
      }

      this.startTime = Date.now();
      this.locations = [];

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: GpsLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          };

          this.locations.push(location);
        },
        (error) => {
          console.error('GPS tracking error:', error);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );

      resolve(true);
    });
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async saveTrackingData(): Promise<void> {
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

  getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => resolve(null),
        { timeout: 10000 }
      );
    });
  }
}
