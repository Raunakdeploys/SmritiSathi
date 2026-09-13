import { storeService } from './storeService';
import {
  calculateHaversineDistanceMeters,
  calculateBearingDegrees,
  degreesToCompassText,
  determineGeofenceStatus,
  generateWhatsAppSOSUrl,
  reverseGeocodeCoordinates,
} from '../utils/geoUtils';
import type { CareCompassTelemetry, GeofenceZoneStatus } from '../types';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'error';

export interface DeviceLocationState {
  status: GeolocationStatus;
  isWatching: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  speedKmh: number | null;
  headingDegrees: number | null;
  lastUpdated: string | null;
  errorMessage: string | null;
}

type LocationUpdateListener = (state: DeviceLocationState, telemetry: CareCompassTelemetry) => void;
type BreachListener = (info: {
  latitude: number;
  longitude: number;
  distanceMeters: number;
  status: GeofenceZoneStatus;
  whatsAppUrl: string;
  caregiverPhone: string;
}) => void;

class DeviceLocationManager {
  private watchId: number | null = null;
  private state: DeviceLocationState = {
    status: 'idle',
    isWatching: false,
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    speedKmh: null,
    headingDegrees: null,
    lastUpdated: null,
    errorMessage: null,
  };

  private listeners: Set<LocationUpdateListener> = new Set();
  private breachListeners: Set<BreachListener> = new Set();
  private lastBreachTriggerTime: number = 0;

  public getState(): DeviceLocationState {
    return { ...this.state };
  }

  public subscribe(listener: LocationUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onBreach(listener: BreachListener): () => void {
    this.breachListeners.add(listener);
    return () => {
      this.breachListeners.delete(listener);
    };
  }

  /**
   * Start live GPS device tracking
   */
  public startTracking(): Promise<DeviceLocationState> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      this.state.status = 'unavailable';
      this.state.errorMessage = 'Geolocation API is not supported by your browser/device';
      this.notifyListeners();
      return Promise.resolve(this.getState());
    }

    this.state.status = 'requesting';
    this.state.errorMessage = null;
    this.notifyListeners();

    return new Promise((resolve) => {
      // Immediate single position query for fast lock
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.handlePositionSuccess(pos);
          resolve(this.getState());
        },
        (err) => {
          this.handlePositionError(err);
          resolve(this.getState());
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );

      // Continuous high-precision watch
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
      }

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePositionSuccess(pos),
        (err) => this.handlePositionError(err),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
        }
      );

      this.state.isWatching = true;
    });
  }

  /**
   * Stop watching device location
   */
  public stopTracking(): void {
    if (this.watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.state.isWatching = false;
    this.state.status = 'idle';
    this.notifyListeners();
  }

  /**
   * Set current device position as the fixed Home Base radar center
   */
  public setCurrentLocationAsHomeBase(label = 'My Current Physical Location'): boolean {
    if (this.state.latitude === null || this.state.longitude === null) {
      return false;
    }

    const config = storeService.getCareCompassConfig();
    storeService.updateCareCompassConfig({
      homeLocation: {
        ...config.homeLocation,
        label,
        latitude: this.state.latitude,
        longitude: this.state.longitude,
      },
    });

    // Re-evaluate distance and status
    this.recalculateAndSync(this.state.latitude, this.state.longitude, this.state.accuracy || 5);
    return true;
  }

  private handlePositionSuccess(pos: GeolocationPosition): void {
    const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;

    this.state = {
      status: 'active',
      isWatching: true,
      latitude,
      longitude,
      accuracy: Math.round(accuracy),
      altitude: altitude !== null ? Math.round(altitude) : null,
      speedKmh: speed !== null ? Math.round(speed * 3.6 * 10) / 10 : 0,
      headingDegrees: heading !== null && !isNaN(heading) ? Math.round(heading) : null,
      lastUpdated: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      errorMessage: null,
    };

    // Cache real physical coordinates
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_last_real_lat', String(latitude));
      localStorage.setItem('cc_last_real_lng', String(longitude));
    }

    // Auto-calibrate Home Base if it's currently legacy Guwahati or unset
    const currentConfig = storeService.getCareCompassConfig();
    const isGuwahati =
      currentConfig.homeLocation &&
      Math.abs(currentConfig.homeLocation.latitude - 26.1445) < 0.05 &&
      Math.abs(currentConfig.homeLocation.longitude - 91.7362) < 0.05;
    const hasCustomHome =
      typeof window !== 'undefined' &&
      localStorage.getItem('cc_custom_home_set') === 'true';

    if (isGuwahati || !hasCustomHome) {
      storeService.updateCareCompassConfig({
        homeLocation: {
          label: 'Live Physical Home Base',
          city: 'Detecting...',
          area: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          latitude,
          longitude,
        },
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cc_custom_home_set', 'true');
      }

      // Reverse geocode to resolve actual street and city name
      reverseGeocodeCoordinates(latitude, longitude).then((res) => {
        if (res) {
          const cfg = storeService.getCareCompassConfig();
          storeService.updateCareCompassConfig({
            homeLocation: {
              ...cfg.homeLocation,
              label: `Home Base (${res.city})`,
              city: res.city,
              area: res.area,
            },
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('cc_last_real_city', res.city);
            localStorage.setItem('cc_last_real_area', res.area);
          }
        }
      });
    }

    this.recalculateAndSync(latitude, longitude, accuracy, this.state.speedKmh, this.state.headingDegrees);
  }

  private handlePositionError(err: GeolocationPositionError): void {
    let status: GeolocationStatus = 'error';
    let msg = 'Failed to obtain device location.';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        status = 'denied';
        msg = 'Location permission was denied. Please allow GPS access in your browser.';
        break;
      case err.POSITION_UNAVAILABLE:
        status = 'unavailable';
        msg = 'Location information is unavailable from your device GPS sensors.';
        break;
      case err.TIMEOUT:
        status = 'timeout';
        msg = 'GPS location request timed out. Retrying high-accuracy fix...';
        break;
    }

    this.state.status = status;
    this.state.errorMessage = msg;
    this.notifyListeners();
  }

  private recalculateAndSync(
    lat: number,
    lng: number,
    acc: number,
    speedKmh = 0,
    headingDeg: number | null = null
  ): void {
    const config = storeService.getCareCompassConfig();
    const currentTelemetry = storeService.getCareCompassTelemetry();

    const homeLat = config.homeLocation.latitude;
    const homeLng = config.homeLocation.longitude;

    const distanceMeters = calculateHaversineDistanceMeters(homeLat, homeLng, lat, lng);
    const bearingDegrees =
      headingDeg !== null && !isNaN(headingDeg)
        ? headingDeg
        : calculateBearingDegrees(homeLat, homeLng, lat, lng);
    const bearingText = degreesToCompassText(bearingDegrees);
    const geofenceStatus = determineGeofenceStatus(
      distanceMeters,
      config.safeRadiusMeters,
      config.alertRadiusMeters
    );

    const newBreadcrumb = {
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      distanceMeters,
      status: geofenceStatus,
    };

    const updatedTelemetry: CareCompassTelemetry = {
      ...currentTelemetry,
      latitude: lat,
      longitude: lng,
      accuracy: Math.round(acc),
      distanceMeters,
      bearingDegrees,
      bearingText,
      geofenceStatus,
      isRealtimeGps: true,
      speedKmh,
      movementState: speedKmh > 2 ? 'Walking' : 'Stationary',
      breadcrumbs: [...(currentTelemetry.breadcrumbs || []), newBreadcrumb].slice(-30),
      lastUpdated: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    storeService.updateCareCompassTelemetry(updatedTelemetry);
    this.notifyListeners(updatedTelemetry);

    // Check if Geofence Breach occurred and notify
    if (geofenceStatus === 'CRITICAL_BREACH') {
      const now = Date.now();
      // Throttle breach triggers to at most once every 30 seconds
      if (now - this.lastBreachTriggerTime > 30000) {
        this.lastBreachTriggerTime = now;
        const { url: whatsAppUrl } = generateWhatsAppSOSUrl({
          caregiverPhone: config.caregiverPhone,
          patientName: config.patientName,
          latitude: lat,
          longitude: lng,
          distanceMeters,
          homeLabel: config.homeLocation.label,
          batteryLevel: updatedTelemetry.batteryLevel,
          cause: 'Automated Real-Time GPS Geofence Breach',
        });

        // Fire breach listeners
        this.breachListeners.forEach((listener) => {
          try {
            listener({
              latitude: lat,
              longitude: lng,
              distanceMeters,
              status: geofenceStatus,
              whatsAppUrl,
              caregiverPhone: config.caregiverPhone,
            });
          } catch (e) {
            console.error('Error in breach listener:', e);
          }
        });
      }
    }
  }

  private notifyListeners(telemetry?: CareCompassTelemetry): void {
    const t = telemetry || storeService.getCareCompassTelemetry();
    this.listeners.forEach((listener) => {
      try {
        listener(this.getState(), t);
      } catch (e) {
        console.error('Error in location update listener:', e);
      }
    });
  }
}

export const deviceLocationService = new DeviceLocationManager();
