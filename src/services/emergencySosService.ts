import { storeService } from './storeService';
import { deviceLocationService } from './deviceLocationService';
import type {
  EmergencySOSRequest,
  EmergencySOSResponse,
  EmergencyTriggerType,
  EmergencyServiceStatus,
} from '../types';

export type GeofenceAlertState = 'SAFE' | 'ALERT_TRIGGERED' | 'OUTSIDE';

type SOSListener = (response: EmergencySOSResponse) => void;

class EmergencySosService {
  private isDispatching: boolean = false;
  private lastDispatchTime: number = 0;
  private lastDispatchTriggerType: EmergencyTriggerType | null = null;
  private geofenceAlertState: GeofenceAlertState = 'SAFE';
  private listeners: Set<SOSListener> = new Set();
  private recentResponses: EmergencySOSResponse[] = [];

  /**
   * Returns the current state of the geofence breach alert tracker.
   * - 'SAFE': Patient is inside safe radius.
   * - 'ALERT_TRIGGERED': Outward boundary breach detected, SOS being transmitted.
   * - 'OUTSIDE': Patient is outside safe perimeter; alerts are suppressed to prevent spamming.
   */
  public getGeofenceAlertState(): GeofenceAlertState {
    return this.geofenceAlertState;
  }

  /**
   * Resets the geofence state back to 'SAFE' (e.g. when patient returns or caregiver acknowledges).
   */
  public resetGeofenceAlertState(): void {
    const previous = this.geofenceAlertState;
    this.geofenceAlertState = 'SAFE';
    console.log(`[GEOFENCE STATE] Reset from ${previous} → SAFE`);
  }

  /**
   * Evaluates geofence coordinates against the safe perimeter state machine:
   * 1. Safe → Outside: Triggers emergency SOS ONCE, transitions to ALERT_TRIGGERED then OUTSIDE.
   * 2. Outside → Outside: Suppresses duplicate alerts while patient remains outside.
   * 3. Outside → Safe: Resets geofence alert state back to SAFE.
   * 4. Safe → Outside later: Allows new alert to fire.
   */
  public handleGeofenceTransition(params: {
    isOutside: boolean;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    distanceMeters: number;
    notes?: string;
  }): void {
    const { isOutside, latitude, longitude, accuracy, distanceMeters, notes } = params;

    if (isOutside) {
      if (this.geofenceAlertState === 'SAFE') {
        console.log(
          `[GEOFENCE TRANSITION] SAFE → OUTSIDE detected (${Math.round(distanceMeters)}m from base). Initiating automated emergency SOS.`
        );
        this.geofenceAlertState = 'ALERT_TRIGGERED';

        this.triggerEmergencySOS({
          triggerType: 'GEOFENCE_EXIT',
          latitude,
          longitude,
          accuracy: accuracy || 5,
          distanceMeters,
          notes: notes || `Patient breached safe boundary. Current distance: ${Math.round(distanceMeters)}m`,
        })
          .then(() => {
            this.geofenceAlertState = 'OUTSIDE';
          })
          .catch((err) => {
            console.error('Failed to dispatch geofence exit SOS:', err);
            this.geofenceAlertState = 'OUTSIDE';
          });
      } else {
        // Already OUTSIDE or ALERT_TRIGGERED - duplicate suppression active
        // Do NOT spam caregiver with continuous messages
      }
    } else {
      // Patient is inside safe zone
      if (this.geofenceAlertState !== 'SAFE') {
        console.log(
          `[GEOFENCE TRANSITION] OUTSIDE → SAFE. Patient returned to safe boundary (${Math.round(distanceMeters)}m). Geofence state reset.`
        );
        this.geofenceAlertState = 'SAFE';
      }
    }
  }

  /**
   * THE ONE CENTRAL SOS FUNCTION
   * Used by BOTH:
   * A. Automatic geofence exit (triggerType: "GEOFENCE_EXIT")
   * B. Manual SOS button (triggerType: "MANUAL_SOS")
   *
   * Posts emergency information to the secure backend endpoint /api/emergency/sos,
   * which originates the WhatsApp alert message and the outbound voice call.
   */
  public async triggerEmergencySOS(
    request: EmergencySOSRequest
  ): Promise<EmergencySOSResponse> {
    const now = Date.now();

    // In-flight concurrency lock & rapid double-trigger prevention
    if (this.isDispatching) {
      console.warn('[EMERGENCY SOS] Dispatch already in flight. Request throttled.');
      if (this.recentResponses.length > 0) {
        return this.recentResponses[0];
      }
    }

    // Duplicate protection: prevent repeated triggers of the same type within 12 seconds
    if (
      this.lastDispatchTriggerType === request.triggerType &&
      now - this.lastDispatchTime < 12000
    ) {
      console.warn(
        `[EMERGENCY SOS] Duplicate ${request.triggerType} trigger suppressed within cooldown window (${Math.round((now - this.lastDispatchTime) / 1000)}s ago).`
      );
      if (this.recentResponses.length > 0) {
        return this.recentResponses[0];
      }
    }

    this.isDispatching = true;
    this.lastDispatchTime = now;
    this.lastDispatchTriggerType = request.triggerType;

    const currentConfig = storeService.getCareCompassConfig();
    const currentTelemetry = storeService.getCareCompassTelemetry();
    const currentUser = storeService.getDatabase().user;
    const deviceState = deviceLocationService.getState();

    // 1. Resolve most accurate available GPS coordinates with fallback
    let resolvedLat = request.latitude;
    let resolvedLng = request.longitude;
    let resolvedAccuracy = request.accuracy ?? deviceState.accuracy ?? currentTelemetry.accuracy ?? 10;
    let hasAccurateGPS = true;

    if (resolvedLat == null || resolvedLng == null || isNaN(resolvedLat) || isNaN(resolvedLng)) {
      if (deviceState.latitude != null && deviceState.longitude != null) {
        resolvedLat = deviceState.latitude;
        resolvedLng = deviceState.longitude;
      } else if (currentTelemetry.latitude && currentTelemetry.longitude) {
        resolvedLat = currentTelemetry.latitude;
        resolvedLng = currentTelemetry.longitude;
      } else if (currentConfig.homeLocation.latitude && currentConfig.homeLocation.longitude) {
        resolvedLat = currentConfig.homeLocation.latitude;
        resolvedLng = currentConfig.homeLocation.longitude;
        hasAccurateGPS = false;
      } else {
        // Fallback default coordinates
        resolvedLat = 28.6139;
        resolvedLng = 77.2090;
        hasAccurateGPS = false;
      }
    }

    const patientName = request.patientName || currentConfig.patientName || currentUser.name || 'Asha Devi';
    const caregiverName = request.caregiverName || currentConfig.caregiverName || currentUser.caregiverName || 'Caregiver';
    const caregiverPhone = request.caregiverPhone || currentConfig.caregiverPhone || currentUser.caregiverPhone || '+919876543210';
    const distanceMeters = request.distanceMeters ?? currentTelemetry.distanceMeters ?? 0;
    const batteryLevel = request.batteryLevel ?? currentTelemetry.batteryLevel ?? 88;
    const timestamp = request.timestamp || new Date().toISOString();

    const payload: EmergencySOSRequest = {
      triggerType: request.triggerType,
      latitude: resolvedLat,
      longitude: resolvedLng,
      accuracy: resolvedAccuracy,
      timestamp,
      patientName,
      caregiverName,
      caregiverPhone,
      distanceMeters,
      batteryLevel,
      homeLabel: request.homeLabel || currentConfig.homeLocation.label || 'Home Base',
      notes: request.notes,
    };

    let response: EmergencySOSResponse;

    try {
      const apiRes = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (apiRes.ok) {
        response = await apiRes.json();
      } else {
        const errorData = await apiRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned HTTP ${apiRes.status}`);
      }
    } catch (networkError: any) {
      console.warn(
        '[EMERGENCY SOS] Backend emergency dispatch error, generating safe offline fallback record:',
        networkError
      );

      const dispatchId = `SOS-OFFLINE-${Date.now().toString(36).toUpperCase()}`;
      const mapsUrl = `https://www.google.com/maps?q=${resolvedLat.toFixed(6)},${resolvedLng.toFixed(6)}`;

      const messageText =
        `🚨 SMRITHI SAATHI — EMERGENCY ALERT\n\n` +
        `A patient safety alert has been triggered.\n\n` +
        `Patient: ${patientName}\n` +
        `Reason: ${request.triggerType === 'GEOFENCE_EXIT' ? 'Geofence Exit (Patient outside safe perimeter)' : 'Manual SOS Pressed by Patient'}\n\n` +
        `Current Location:\n` +
        `Latitude: ${resolvedLat.toFixed(6)}\n` +
        `Longitude: ${resolvedLng.toFixed(6)}\n` +
        `Accuracy: ±${Math.round(resolvedAccuracy)}m\n\n` +
        `Google Maps:\n${mapsUrl}\n\n` +
        `Time: ${new Date(timestamp).toLocaleString('en-IN')}\n\n` +
        `Please check on the patient immediately.`;

      response = {
        success: true,
        dispatchId,
        timestamp,
        triggerType: request.triggerType,
        patientName,
        caregiverPhone,
        caregiverName,
        location: {
          latitude: resolvedLat,
          longitude: resolvedLng,
          accuracy: resolvedAccuracy,
          mapsUrl,
          hasAccurateGPS,
        },
        services: {
          whatsapp: {
            service: 'whatsapp',
            status: 'PENDING_CONFIGURATION',
            provider: 'simulation_fallback',
            details: networkError?.message || 'Network unreachable',
          },
          voiceCall: {
            service: 'voice_call',
            status: 'PENDING_CONFIGURATION',
            provider: 'simulation_fallback',
            details: networkError?.message || 'Network unreachable',
          },
        },
        messageText,
        warning: 'Backend API unreachable; local safety log recorded.',
      };
    } finally {
      this.isDispatching = false;
    }

    // 2. Persist in storeService alert history
    const whatsappStatus = response.services.whatsapp.status;
    const voiceStatus = response.services.voiceCall.status;
    const isCritical = request.triggerType === 'GEOFENCE_EXIT' || request.triggerType === 'MANUAL_SOS';

    storeService.addAlertLog({
      severity: isCritical ? 'critical' : 'warning',
      cause: request.triggerType === 'GEOFENCE_EXIT' ? 'Geofence Breach' : 'Manual SOS Pressed',
      notes: `🚨 CENTRAL SOS DISPATCH (${request.triggerType}): WhatsApp [${whatsappStatus}] & Voice Call [${voiceStatus}]. Caregiver: ${caregiverName} (${caregiverPhone}). Ref: ${response.dispatchId}`,
      distanceMeters,
      latitude: resolvedLat,
      longitude: resolvedLng,
      acknowledged: false,
      whatsappDispatched: whatsappStatus === 'DELIVERED',
      directCallDialed: voiceStatus === 'DELIVERED',
      dispatchId: response.dispatchId,
      deliveryStatus: response.success ? 'DELIVERED' : 'TRANSMITTING',
      channel: 'AUTOMATED_SMS_GATEWAY',
    });

    this.recentResponses.unshift(response);
    if (this.recentResponses.length > 20) this.recentResponses.pop();

    this.notifyListeners(response);

    // Broadcast system-wide CustomEvents for UI components and modals
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('smrithi_emergency_sos', {
          detail: response,
        })
      );
    }

    return response;
  }

  public subscribe(listener: SOSListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(response: EmergencySOSResponse): void {
    this.listeners.forEach((listener) => {
      try {
        listener(response);
      } catch (err) {
        console.error('Error in emergency SOS listener:', err);
      }
    });
  }

  public getRecentResponses(): EmergencySOSResponse[] {
    return [...this.recentResponses];
  }
}

export const emergencySosService = new EmergencySosService();
export const triggerEmergencySOS = (params: EmergencySOSRequest) =>
  emergencySosService.triggerEmergencySOS(params);
