import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Radio,
  Compass,
  BatteryCharging,
  Battery,
  Heart,
  Activity,
  Moon,
  Sun,
  Navigation,
  Phone,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Settings,
  Download,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Mic,
  Key,
  Layers,
  MapPin,
  Clock,
  UserCheck,
  PhoneCall,
  Flame,
  Locate,
  Crosshair,
  Satellite,
  Globe,
} from 'lucide-react';
import type {
  CareCompassTelemetry,
  CareCompassConfig,
  AlertLogEntry,
  GeofenceZoneStatus,
  MovementState,
} from '../types';
import {
  storeService,
  INITIAL_CARE_COMPASS_CONFIG,
  INITIAL_CARE_COMPASS_TELEMETRY,
  INITIAL_ALERT_LOGS,
} from '../services/storeService';
import { MapModule } from './MapModule';
import { CareCompassSettingsModal } from './CareCompassSettingsModal';
import { GoogleMapsKeyModal } from './GoogleMapsKeyModal';
import { EmergencyBreachModal } from './EmergencyBreachModal';
import {
  deviceLocationService,
  DeviceLocationState,
} from '../services/deviceLocationService';
import {
  startEmergencySiren,
  stopEmergencySiren,
  isSirenPlaying,
  speakReassurance,
  stopVoiceSpeech,
  playWarningBeep,
  playConfirmationChime,
} from '../utils/audioUtils';
import {
  calculateHaversineDistanceMeters,
  calculateBearingDegrees,
  degreesToCompassText,
  determineGeofenceStatus,
  checkSundowningRisk,
  generateWhatsAppSOSUrl,
  INDIA_EMERGENCY_SERVICES,
  INDIAN_LANGUAGES,
} from '../utils/geoUtils';

export interface CaregiverDashboardProps {
  telemetry?: CareCompassTelemetry;
  config?: CareCompassConfig;
  alertLogs?: AlertLogEntry[];
  onUpdateTelemetry?: (updated: Partial<CareCompassTelemetry>) => void;
  onUpdateConfig?: (updated: Partial<CareCompassConfig>) => void;
  onAddAlertLog?: (entry: Omit<AlertLogEntry, 'id' | 'timestamp'>) => void;
  onAcknowledgeAlert?: (id: string) => void;
  onSwitchToPatientMode?: () => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  telemetry: propTelemetry,
  config: propConfig,
  alertLogs: propAlertLogs,
  onUpdateTelemetry: propOnUpdateTelemetry,
  onUpdateConfig: propOnUpdateConfig,
  onAddAlertLog: propOnAddAlertLog,
  onAcknowledgeAlert: propOnAcknowledgeAlert,
  onSwitchToPatientMode,
}) => {
  // Resilient state fallbacks with live storeService synchronization
  const [localTelemetry, setLocalTelemetry] = useState<CareCompassTelemetry>(() =>
    propTelemetry || storeService.getCareCompassTelemetry() || INITIAL_CARE_COMPASS_TELEMETRY
  );
  const [localConfig, setLocalConfig] = useState<CareCompassConfig>(() =>
    propConfig || storeService.getCareCompassConfig() || INITIAL_CARE_COMPASS_CONFIG
  );
  const [localAlertLogs, setLocalAlertLogs] = useState<AlertLogEntry[]>(() =>
    propAlertLogs || storeService.getAlertLogs() || INITIAL_ALERT_LOGS
  );

  useEffect(() => {
    if (propTelemetry) setLocalTelemetry(propTelemetry);
  }, [propTelemetry]);

  useEffect(() => {
    if (propConfig) setLocalConfig(propConfig);
  }, [propConfig]);

  useEffect(() => {
    if (propAlertLogs) setLocalAlertLogs(propAlertLogs);
  }, [propAlertLogs]);

  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      if (!propTelemetry) setLocalTelemetry(storeService.getCareCompassTelemetry());
      if (!propConfig) setLocalConfig(storeService.getCareCompassConfig());
      if (!propAlertLogs) setLocalAlertLogs(storeService.getAlertLogs());
    });
    return () => unsubscribe();
  }, [propTelemetry, propConfig, propAlertLogs]);

  const telemetry = propTelemetry || localTelemetry || INITIAL_CARE_COMPASS_TELEMETRY;
  const config = propConfig || localConfig || INITIAL_CARE_COMPASS_CONFIG;
  const alertLogs = propAlertLogs || localAlertLogs || INITIAL_ALERT_LOGS;

  const onUpdateTelemetry = (updated: Partial<CareCompassTelemetry>) => {
    if (propOnUpdateTelemetry) {
      propOnUpdateTelemetry(updated);
    } else {
      const res = storeService.updateCareCompassTelemetry(updated);
      setLocalTelemetry(res);
    }
  };

  const onUpdateConfig = (updated: Partial<CareCompassConfig>) => {
    if (propOnUpdateConfig) {
      propOnUpdateConfig(updated);
    } else {
      const res = storeService.updateCareCompassConfig(updated);
      setLocalConfig(res);
    }
  };

  const onAddAlertLog = (entry: Omit<AlertLogEntry, 'id' | 'timestamp'>) => {
    if (propOnAddAlertLog) {
      propOnAddAlertLog(entry);
    } else {
      storeService.addAlertLog(entry);
      setLocalAlertLogs(storeService.getAlertLogs());
    }
  };

  const onAcknowledgeAlert = (id: string) => {
    if (propOnAcknowledgeAlert) {
      propOnAcknowledgeAlert(id);
    } else {
      storeService.acknowledgeAlertLog(id);
      setLocalAlertLogs(storeService.getAlertLogs());
    }
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isWanderSimRunning, setIsWanderSimRunning] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deviceGpsState, setDeviceGpsState] = useState<DeviceLocationState>(() =>
    deviceLocationService.getState()
  );

  // AI Distress Reassurance Assistant State
  const [isAnalyzingDistress, setIsAnalyzingDistress] = useState(false);
  const [distressLevel, setDistressLevel] = useState<'Calm' | 'Mild Disorientation' | 'High Agitation'>('Calm');
  const [aiReassuranceScript, setAiReassuranceScript] = useState<string>(
    'Dadaji, this is Raunak. You are completely safe near our home. I am on my way to you right now.'
  );
  const [isSpeakingReassurance, setIsSpeakingReassurance] = useState(false);

  // Automatically start acquiring live device location on dashboard mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      deviceLocationService.startTracking();
    }
  }, []);

  // Subscribe to live GPS device updates
  useEffect(() => {
    const unsub = deviceLocationService.subscribe((state) => {
      setDeviceGpsState(state);
    });
    return () => unsub();
  }, []);

  // Listen for automatic breach triggers from live device tracking
  useEffect(() => {
    const unsubBreach = deviceLocationService.onBreach((info) => {
      handleTriggerBreachAlert(info.distanceMeters, info.latitude, info.longitude);
    });
    return () => unsubBreach();
  }, [config.alertRadiusMeters, config.autoSirenOnBreach, config.autoWhatsAppOnBreach, config.homeLocation]);

  // Listen for set home base calibration events
  useEffect(() => {
    const handleSetHome = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        onUpdateConfig({ homeLocation: customEvent.detail });
      }
    };
    window.addEventListener('cc_set_home_base', handleSetHome);
    return () => window.removeEventListener('cc_set_home_base', handleSetHome);
  }, []);

  const wanderIntervalRef = useRef<any>(null);

  // Sync siren playing status
  useEffect(() => {
    setIsSirenActive(isSirenPlaying());
  }, []);

  // Sundowning check timer
  useEffect(() => {
    const check = () => {
      const risk = checkSundowningRisk();
      onUpdateTelemetry({
        isSundowningHours: risk.isRiskHours,
        sundowningRisk: risk.riskLevel,
      });
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  // Automated Wander Simulation loop
  useEffect(() => {
    if (isWanderSimRunning) {
      wanderIntervalRef.current = setInterval(() => {
        // Step outward by 35 meters towards North-East
        const currentDist = telemetry.distanceMeters + 35;
        const newLat = config.homeLocation.latitude + (currentDist / 111139) * 0.7;
        const newLon =
          config.homeLocation.longitude +
          (currentDist / (111139 * Math.cos((config.homeLocation.latitude * Math.PI) / 180))) *
            0.7;

        const newStatus = determineGeofenceStatus(
          currentDist,
          config.safeRadiusMeters,
          config.alertRadiusMeters
        );

        const newBreadcrumb = {
          latitude: newLat,
          longitude: newLon,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          distanceMeters: currentDist,
          status: newStatus,
        };

        onUpdateTelemetry({
          latitude: newLat,
          longitude: newLon,
          distanceMeters: currentDist,
          geofenceStatus: newStatus,
          movementState: 'Wandering',
          breadcrumbs: [...(telemetry.breadcrumbs || []), newBreadcrumb].slice(-25),
          lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });

        // Trigger alarm if boundary breached
        if (newStatus === 'CRITICAL_BREACH' && telemetry.geofenceStatus !== 'CRITICAL_BREACH') {
          handleTriggerBreachAlert(currentDist, newLat, newLon);
        } else if (newStatus === 'WARNING_BORDER' && telemetry.geofenceStatus === 'SAFE_ZONE') {
          playWarningBeep();
          onAddAlertLog({
            severity: 'warning',
            cause: 'Border Warning',
            distanceMeters: currentDist,
            latitude: newLat,
            longitude: newLon,
            notes: `Approaching ${config.alertRadiusMeters}m perimeter boundary`,
          });
        }
      }, 2500);
    } else {
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);
    }
    return () => {
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);
    };
  }, [isWanderSimRunning, telemetry.distanceMeters, telemetry.geofenceStatus]);

  // Handle manual trigger of breach alert
  const handleTriggerBreachAlert = (dist: number, lat: number, lon: number) => {
    setIsBreachModalOpen(true);

    if (config.autoSirenOnBreach) {
      startEmergencySiren();
      setIsSirenActive(true);
    }

    onAddAlertLog({
      severity: 'critical',
      cause: 'Geofence Breach',
      distanceMeters: dist,
      latitude: lat,
      longitude: lon,
      notes: `Breached ${config.alertRadiusMeters}m perimeter limit around ${config.homeLocation.label}`,
      whatsappDispatched: config.autoWhatsAppOnBreach,
    });

    if (config.autoWhatsAppOnBreach) {
      const { url } = generateWhatsAppSOSUrl({
        caregiverPhone: config.caregiverPhone,
        patientName: config.patientName,
        latitude: lat,
        longitude: lon,
        distanceMeters: dist,
        homeLabel: config.homeLocation.label,
        batteryLevel: telemetry.batteryLevel,
        cause: 'Automated Geofence Breach',
      });
      try {
        window.open(url, '_blank');
      } catch (e) {
        console.warn('Popup blocked:', e);
      }
    }
  };

  // Handle map click or manual repositioning
  const handleMapUpdateLocation = (lat: number, lon: number) => {
    const dist = calculateHaversineDistanceMeters(
      config.homeLocation.latitude,
      config.homeLocation.longitude,
      lat,
      lon
    );
    const bearing = calculateBearingDegrees(
      config.homeLocation.latitude,
      config.homeLocation.longitude,
      lat,
      lon
    );
    const bearingText = degreesToCompassText(bearing);
    const status = determineGeofenceStatus(
      dist,
      config.safeRadiusMeters,
      config.alertRadiusMeters
    );

    onUpdateTelemetry({
      latitude: lat,
      longitude: lon,
      distanceMeters: dist,
      bearingDegrees: bearing,
      bearingText,
      geofenceStatus: status,
      lastUpdated: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });

    if (status === 'CRITICAL_BREACH') {
      handleTriggerBreachAlert(dist, lat, lon);
    }
  };

  // Preset Simulation Scenarios
  const applyPresetScenario = (
    preset: 'SAFE' | 'BORDER' | 'BREACH' | 'FALL'
  ) => {
    setIsWanderSimRunning(false);
    let dist = 15;
    let state: MovementState = 'Stationary';
    let heartRate = 74;
    let hrStatus: 'normal' | 'elevated' | 'distress' = 'normal';

    if (preset === 'SAFE') {
      dist = 25;
      state = 'Stationary';
      heartRate = 72;
      hrStatus = 'normal';
      stopEmergencySiren();
      setIsSirenActive(false);
    } else if (preset === 'BORDER') {
      dist = config.safeRadiusMeters - 20;
      state = 'Walking';
      heartRate = 88;
      hrStatus = 'elevated';
      playWarningBeep();
    } else if (preset === 'BREACH') {
      dist = config.alertRadiusMeters + 120;
      state = 'Wandering';
      heartRate = 104;
      hrStatus = 'distress';
      handleTriggerBreachAlert(
        dist,
        config.homeLocation.latitude + 0.0065,
        config.homeLocation.longitude + 0.0065
      );
    } else if (preset === 'FALL') {
      dist = 340;
      state = 'Fall_Detected';
      heartRate = 118;
      hrStatus = 'distress';
      startEmergencySiren();
      setIsSirenActive(true);
      onAddAlertLog({
        severity: 'critical',
        cause: 'Fall Detected',
        distanceMeters: dist,
        latitude: config.homeLocation.latitude + 0.003,
        longitude: config.homeLocation.longitude + 0.003,
        notes: 'Sudden vertical drop and impact detected via accelerometer telemetry',
        whatsappDispatched: true,
      });
    }

    const lat = config.homeLocation.latitude + (dist / 111139) * 0.7;
    const lon =
      config.homeLocation.longitude +
      (dist / (111139 * Math.cos((config.homeLocation.latitude * Math.PI) / 180))) *
        0.7;

    const status = determineGeofenceStatus(
      dist,
      config.safeRadiusMeters,
      config.alertRadiusMeters
    );

    onUpdateTelemetry({
      latitude: lat,
      longitude: lon,
      distanceMeters: dist,
      geofenceStatus: status,
      movementState: state,
      heartRateBpm: heartRate,
      heartRateStatus: hrStatus,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  const toggleSiren = () => {
    if (isSirenActive) {
      stopEmergencySiren();
      setIsSirenActive(false);
    } else {
      startEmergencySiren();
      setIsSirenActive(true);
    }
  };

  const handleManualWhatsAppDispatch = () => {
    const { url } = generateWhatsAppSOSUrl({
      caregiverPhone: config.caregiverPhone,
      patientName: config.patientName,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      distanceMeters: telemetry.distanceMeters,
      homeLabel: config.homeLocation.label,
      batteryLevel: telemetry.batteryLevel,
      cause: 'Caregiver Command Center SOS Dispatch',
    });
    window.open(url, '_blank');
  };

  // AI Distress Voice Script Generator
  const handleGenerateAiReassurance = async () => {
    setIsAnalyzingDistress(true);
    try {
      // Simulate Gemini Reassurance response adapted to selected language
      const langConfig =
        INDIAN_LANGUAGES.find((l) => l.code === config.preferredLanguage) ||
        INDIAN_LANGUAGES[0];

      setTimeout(() => {
        setDistressLevel('Mild Disorientation');
        setAiReassuranceScript(
          langConfig.sampleReassurance ||
            `Pranam ${config.patientName}, you are completely safe. Raunak is right around the corner on GS Road. Take slow deep breaths.`
        );
        setIsAnalyzingDistress(false);
        playConfirmationChime();
      }, 1200);
    } catch (err) {
      setIsAnalyzingDistress(false);
    }
  };

  const handleSpeakAiScript = () => {
    if (isSpeakingReassurance) {
      stopVoiceSpeech();
      setIsSpeakingReassurance(false);
      return;
    }
    setIsSpeakingReassurance(true);
    speakReassurance({
      text: aiReassuranceScript,
      languageCode: config.preferredLanguage || 'en-IN',
      rate: 0.86,
      onEnd: () => setIsSpeakingReassurance(false),
    });
  };

  // Export Incident Logs
  const handleExportLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(alertLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `carecompass-incident-log-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <main
      id="caregiver-command-center-root"
      aria-label="Caregiver Safety Dashboard"
      className="min-h-screen bg-[#070D18] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* Top Header & Mode Switcher */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#002045] border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                CareCompass Command Active
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Assam Base: {config.homeLocation.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Elder Wandering & Safety Cockpit ({config.patientName})
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span>Safety Settings</span>
          </button>

          <button
            onClick={onSwitchToPatientMode}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch to Patient Mode</span>
          </button>
        </div>
      </header>

      {/* 1. Top Telemetry Ribbon (6 Vital Telemetry Metrics) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Distance to Home */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Distance to Base</span>
            <MapPin className="w-4 h-4 text-[#FF6321]" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {Math.round(telemetry.distanceMeters)}
            </span>
            <span className="text-xs text-slate-400 ml-1">meters</span>
          </div>
          <span
            className={`text-[11px] font-bold truncate ${
              telemetry.geofenceStatus === 'SAFE_ZONE'
                ? 'text-emerald-400'
                : telemetry.geofenceStatus === 'WARNING_BORDER'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {telemetry.geofenceStatus === 'SAFE_ZONE'
              ? '● Safe Inside 300m'
              : telemetry.geofenceStatus === 'WARNING_BORDER'
              ? '▲ Warning Border'
              : '■ Critical Breach'}
          </span>
        </div>

        {/* Metric 2: Bearing & Heading */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Compass Bearing</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-center space-x-2">
            <div
              style={{ transform: `rotate(${telemetry.bearingDegrees}deg)` }}
              className="w-6 h-6 rounded-full bg-slate-800 border border-amber-400/50 flex items-center justify-center text-amber-300 transition-transform"
            >
              <Navigation className="w-3.5 h-3.5 -rotate-45" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white">
              {telemetry.bearingText.split(' ')[0]}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {telemetry.bearingDegrees}° Heading
          </span>
        </div>

        {/* Metric 3: Movement State */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Movement State</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-2">
            <span
              className={`text-xl sm:text-2xl font-black ${
                telemetry.movementState === 'Fall_Detected'
                  ? 'text-rose-400 animate-pulse'
                  : telemetry.movementState === 'Wandering'
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {telemetry.movementState === 'Fall_Detected'
                ? 'Fall Alert!'
                : telemetry.movementState}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {telemetry.movementState === 'Walking'
              ? '3.8 km/h Pace'
              : telemetry.movementState === 'Wandering'
              ? 'Erratic Vectors'
              : 'GPS Locked'}
          </span>
        </div>

        {/* Metric 4: Vitals / Heart Rate */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Heart Rate</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <div className="my-2 flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {telemetry.heartRateBpm}
            </span>
            <span className="text-xs text-slate-400">BPM</span>
          </div>
          <span
            className={`text-[11px] font-bold ${
              telemetry.heartRateStatus === 'distress'
                ? 'text-rose-400'
                : telemetry.heartRateStatus === 'elevated'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {telemetry.heartRateStatus === 'distress'
              ? 'Tachycardia / Distress'
              : telemetry.heartRateStatus === 'elevated'
              ? 'Elevated Pulse'
              : 'Normal Resting'}
          </span>
        </div>

        {/* Metric 5: Battery & Power */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Device Battery</span>
            {telemetry.isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            ) : (
              <Battery className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {telemetry.batteryLevel}%
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold">
            {telemetry.isCharging ? '⚡ Charging Active' : 'Good (Est. 18 hrs)'}
          </span>
        </div>

        {/* Metric 6: Sundowning Twilight Risk */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Sundowning Risk</span>
            {telemetry.isSundowningHours ? (
              <Moon className="w-4 h-4 text-purple-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="my-2">
            <span
              className={`text-xl sm:text-2xl font-black capitalize ${
                telemetry.sundowningRisk === 'high'
                  ? 'text-purple-400'
                  : telemetry.sundowningRisk === 'moderate'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {telemetry.sundowningRisk} Risk
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {telemetry.isSundowningHours
              ? 'Twilight Hours Active'
              : 'Daylight Phase'}
          </span>
        </div>
      </section>

      {/* 2. Map Module & Quick SOS Action Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Map Radar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Device GPS Sensor Status & Control Ribbon */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  deviceGpsState.isWatching
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-slate-600'
                }`}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Locate className="w-3.5 h-3.5 text-sky-400" />
                    <span>Live Device Location Engine</span>
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      deviceGpsState.isWatching
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {deviceGpsState.isWatching ? 'Streaming Active' : 'Standby / Paused'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {deviceGpsState.isWatching
                    ? `Lat: ${deviceGpsState.latitude?.toFixed(6)}, Lng: ${deviceGpsState.longitude?.toFixed(6)} • Accuracy: ±${deviceGpsState.accuracy}m`
                    : 'Click "Start Live GPS" to stream device coordinates into radar'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (deviceGpsState.isWatching) {
                    deviceLocationService.stopTracking();
                  } else {
                    deviceLocationService.startTracking();
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  deviceGpsState.isWatching
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                }`}
              >
                <Locate className="w-3.5 h-3.5" />
                <span>{deviceGpsState.isWatching ? 'Pause Live GPS' : 'Start Live GPS'}</span>
              </button>

              <button
                onClick={() => {
                  const success = deviceLocationService.setCurrentLocationAsHomeBase(
                    `Calibrated Home Base (${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`
                  );
                  if (!success) {
                    onUpdateConfig({
                      homeLocation: {
                        ...config.homeLocation,
                        latitude: telemetry.latitude,
                        longitude: telemetry.longitude,
                        label: 'Calibrated Device Home Base',
                      },
                    });
                  }
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Calibrate: Use current device coordinates as Fixed Home Base Radar"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Set Current GPS as Home Base</span>
              </button>
            </div>
          </div>

          <MapModule
            telemetry={telemetry}
            config={config}
            onUpdateLocation={handleMapUpdateLocation}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            isSimulating={isWanderSimRunning}
          />

          {/* Quick Simulation Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                Simulation Studio:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => applyPresetScenario('SAFE')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-pointer"
              >
                1. Inside Home (25m)
              </button>

              <button
                onClick={() => applyPresetScenario('BORDER')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer"
              >
                2. Border Walk (280m)
              </button>

              <button
                onClick={() => applyPresetScenario('BREACH')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold cursor-pointer"
              >
                3. Critical Breach (720m)
              </button>

              <button
                onClick={() => applyPresetScenario('FALL')}
                className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500 rounded-lg text-xs font-black cursor-pointer"
              >
                4. Fall Alert!
              </button>

              <button
                onClick={() => setIsWanderSimRunning(!isWanderSimRunning)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                  isWanderSimRunning
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-indigo-700 hover:bg-indigo-600 text-white'
                }`}
              >
                {isWanderSimRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Live Wander</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Live Wander</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Emergency Actions & India Services */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Action 1: WhatsApp SOS Dispatch */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Emergency Dispatch Center</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dispatches formatted coordinate link & device telemetry to primary caregiver:
              <strong className="text-white block font-mono mt-0.5">
                {config.caregiverName} ({config.caregiverPhone})
              </strong>
            </p>

            <button
              onClick={handleManualWhatsAppDispatch}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch WhatsApp SOS Alert</span>
            </button>

            {/* Siren Toggle */}
            <button
              onClick={toggleSiren}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                isSirenActive
                  ? 'bg-rose-600 border-white text-white animate-pulse shadow-rose-600/50 shadow-xl'
                  : 'bg-slate-800 hover:bg-slate-750 border-rose-500/50 text-rose-300'
              }`}
            >
              {isSirenActive ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Silence Emergency Siren</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Sound Two-Tone Siren (880-1200Hz)</span>
                </>
              )}
            </button>

            {/* Direct Call Elder */}
            <a
              href={`tel:${config.caregiverPhone.replace(/\s+/g, '')}`}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Call Primary Caregiver Phone</span>
            </a>
          </div>

          {/* India Emergency Services Presets */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#FF6321]" />
              <span>Indian Emergency Services</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {INDIA_EMERGENCY_SERVICES.map((serv) => (
                <a
                  key={serv.id}
                  href={`tel:${serv.number}`}
                  className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl flex flex-col justify-between transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold text-slate-200">
                    {serv.name}
                  </span>
                  <span className="text-sm font-black font-mono text-[#FF6321] mt-1">
                    Dial {serv.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Distress Analysis & Multilingual Reassurance Assistant */}
      <section className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-900/60 border border-purple-500/40 rounded-2xl text-purple-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                AI Distress Audio & Reassurance Engine
              </h2>
              <p className="text-xs text-slate-400">
                Voice script generator in 11 Indian languages with calm acoustic synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">
              Language:
            </span>
            <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-500/40 rounded-full text-xs font-bold">
              {INDIAN_LANGUAGES.find((l) => l.code === config.preferredLanguage)?.name || 'English (India)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Audio Spectrum & Vitals Gauge */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Distress Analysis</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  distressLevel === 'High Agitation'
                    ? 'bg-rose-900 text-rose-200'
                    : distressLevel === 'Mild Disorientation'
                    ? 'bg-amber-900 text-amber-200'
                    : 'bg-emerald-900 text-emerald-200'
                }`}
              >
                {distressLevel}
              </span>
            </div>

            {/* Fake Audio Visualizer Bars */}
            <div className="h-16 flex items-end justify-center space-x-1 py-1">
              {[30, 55, 80, 45, 90, 60, 40, 70, 95, 50, 65, 35].map(
                (h, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${h}%` }}
                    className="w-1.5 bg-gradient-to-t from-purple-600 to-indigo-400 rounded-full animate-pulse"
                  />
                )
              )}
            </div>

            <button
              onClick={handleGenerateAiReassurance}
              disabled={isAnalyzingDistress}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isAnalyzingDistress ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analyzing Acoustics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Reassurance Script</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Reassurance Script */}
          <div className="md:col-span-2 p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                Synthesized Voice Reassurance Script
              </span>
              <textarea
                value={aiReassuranceScript}
                onChange={(e) => setAiReassuranceScript(e.target.value)}
                rows={3}
                className="w-full mt-1.5 bg-slate-900 border border-slate-800 focus:border-purple-400 rounded-xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Spoken rate adjusted to 0.86 for elder auditory processing
              </span>

              <button
                onClick={handleSpeakAiScript}
                className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  isSpeakingReassurance
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSpeakingReassurance ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Play to Elder Device</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Historical Alert Logs & Incident Record */}
      <section className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-300">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Historical Incident & Perimeter Breach Log
              </h2>
              <p className="text-xs text-slate-400">
                Audited telemetry timestamps, GPS coordinates, and dispatch confirmations
              </p>
            </div>
          </div>

          <button
            onClick={handleExportLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Incident Log (JSON)</span>
          </button>
        </div>

        {/* Table / List of Alerts */}
        <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
          {alertLogs && alertLogs.length > 0 ? (
            alertLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-850/50 rounded-xl transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      log.severity === 'critical'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/50'
                        : log.severity === 'warning'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/50'
                        : 'bg-sky-950 text-sky-400 border border-sky-500/50'
                    }`}
                  >
                    {log.severity === 'critical' ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : log.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-white">
                        {log.cause}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        • {log.timestamp}
                      </span>
                      {log.whatsappDispatched && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                          WhatsApp Sent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {log.notes} ({Math.round(log.distanceMeters)}m from home)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <a
                    href={`https://maps.google.com/?q=${log.latitude},${log.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-750 text-sky-400 rounded-lg border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View GPS</span>
                  </a>

                  {!log.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(log.id)}
                      className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No recent security or geofence breaches recorded.
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <CareCompassSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={onUpdateConfig}
      />

      <GoogleMapsKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={config.googleMapsApiKey}
        onSaveKey={(k) => onUpdateConfig({ googleMapsApiKey: k })}
      />

      <EmergencyBreachModal
        isOpen={isBreachModalOpen}
        onClose={() => setIsBreachModalOpen(false)}
        config={config}
        telemetry={telemetry}
        onAcknowledge={() => {
          setIsSirenActive(false);
          stopEmergencySiren();
        }}
      />
    </main>
  );
};
