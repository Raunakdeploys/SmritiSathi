import React, { useState, useEffect } from 'react';
import {
  Phone,
  Compass,
  Heart,
  AlertOctagon,
  ShieldCheck,
  Volume2,
  VolumeX,
  Navigation,
  Wind,
  Home,
  CheckCircle2,
  Lock,
  Unlock,
  Radio,
  Sparkles,
} from 'lucide-react';
import type { CareCompassTelemetry, CareCompassConfig } from '../types';
import {
  storeService,
  INITIAL_CARE_COMPASS_CONFIG,
  INITIAL_CARE_COMPASS_TELEMETRY,
} from '../services/storeService';
import { WhereAmIModal } from './WhereAmIModal';
import { MemoryBankModal } from './MemoryBankModal';
import {
  speakReassurance,
  stopVoiceSpeech,
  playCalmingTone,
  startEmergencySiren,
  stopEmergencySiren,
} from '../utils/audioUtils';
import { INDIAN_LANGUAGES, generateWhatsAppSOSUrl } from '../utils/geoUtils';
import { DirectCallModal } from './DirectCallModal';
import { sosDispatchService } from '../services/sosDispatchService';
import type { AutomatedSOSDispatchResult } from '../types';

export interface PatientModeProps {
  telemetry?: CareCompassTelemetry;
  config?: CareCompassConfig;
  onTriggerSOS?: (cause?: string) => void;
  onSwitchToCaregiver?: () => void;
  onExitToCaregiver?: () => void;
}

export const PatientMode: React.FC<PatientModeProps> = ({
  telemetry: propTelemetry,
  config: propConfig,
  onTriggerSOS,
  onSwitchToCaregiver,
  onExitToCaregiver,
}) => {
  const [localTelemetry, setLocalTelemetry] = useState<CareCompassTelemetry>(() =>
    propTelemetry || storeService.getCareCompassTelemetry() || INITIAL_CARE_COMPASS_TELEMETRY
  );
  const [localConfig, setLocalConfig] = useState<CareCompassConfig>(() =>
    propConfig || storeService.getCareCompassConfig() || INITIAL_CARE_COMPASS_CONFIG
  );

  useEffect(() => {
    if (propTelemetry) setLocalTelemetry(propTelemetry);
  }, [propTelemetry]);

  useEffect(() => {
    if (propConfig) setLocalConfig(propConfig);
  }, [propConfig]);

  useEffect(() => {
    const unsub = storeService.subscribe(() => {
      if (!propTelemetry) setLocalTelemetry(storeService.getCareCompassTelemetry());
      if (!propConfig) setLocalConfig(storeService.getCareCompassConfig());
    });
    return () => unsub();
  }, [propTelemetry, propConfig]);

  const telemetry = propTelemetry || localTelemetry || INITIAL_CARE_COMPASS_TELEMETRY;
  const config = propConfig || localConfig || INITIAL_CARE_COMPASS_CONFIG;

  const handleExitToCaregiver = () => {
    if (onSwitchToCaregiver) onSwitchToCaregiver();
    else if (onExitToCaregiver) onExitToCaregiver();
  };
  const [isWhereAmIOpen, setIsWhereAmIOpen] = useState(false);
  const [isMemoryBankOpen, setIsMemoryBankOpen] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [isSpeakingGreeting, setIsSpeakingGreeting] = useState(false);
  const [isDirectCallOpen, setIsDirectCallOpen] = useState(false);
  const [sosDispatchedNotification, setSosDispatchedNotification] = useState<AutomatedSOSDispatchResult | null>(null);

  const langConfig =
    INDIAN_LANGUAGES.find((l) => l.code === config.preferredLanguage) ||
    INDIAN_LANGUAGES[0];

  // Ambient breathing loop
  useEffect(() => {
    let timer: any;
    if (isBreathingActive) {
      playCalmingTone(432, 2.5);
      const phases: Array<'Inhale' | 'Hold' | 'Exhale'> = ['Inhale', 'Hold', 'Exhale'];
      let idx = 0;
      timer = setInterval(() => {
        idx = (idx + 1) % 3;
        setBreathPhase(phases[idx]);
        if (phases[idx] === 'Inhale') {
          playCalmingTone(528, 2.5);
        }
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathingActive]);

  // Handle SOS button press with 3-second tactile countdown
  const handleStartSOS = () => {
    // Vibrate device if supported
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300]);
    }

    setSosCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setSosCountdown(count);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(200);
        }
      } else {
        clearInterval(interval);
        setSosCountdown(null);
        triggerActualSOS();
      }
    }, 1000);
  };

  const handleCancelSOS = () => {
    setSosCountdown(null);
    stopEmergencySiren();
  };

  const triggerActualSOS = () => {
    startEmergencySiren();
    if (onTriggerSOS) onTriggerSOS('Manual SOS Pressed by Elder');

    const sosData = generateWhatsAppSOSUrl({
      caregiverPhone: config.caregiverPhone,
      patientName: config.patientName,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      distanceMeters: telemetry.distanceMeters,
      homeLabel: config.homeLocation.label,
      batteryLevel: telemetry.batteryLevel,
      cause: 'Manual 1-Tap SOS Pressed by Elder',
    });

    // Auto-launch WhatsApp message
    try {
      window.open(sosData.url, '_blank');
    } catch (e) {
      console.warn('Auto WhatsApp trigger error:', e);
    }

    // Auto-trigger native phone dialer to ring phone
    try {
      window.location.href = sosData.telUrl;
    } catch (e) {
      console.warn('Native phone trigger error:', e);
    }

    // AUTOMATICALLY DISPATCH SOS MESSAGE (Cellular Relay)
    sosDispatchService
      .dispatchAutomatedSOSMessage({
        patientName: config.patientName,
        caregiverPhone: config.caregiverPhone,
        caregiverName: config.caregiverName,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        distanceMeters: telemetry.distanceMeters,
        cause: 'Manual 1-Tap SOS Pressed by Elder',
        batteryLevel: telemetry.batteryLevel,
        homeLabel: config.homeLocation.label,
      })
      .then((res) => {
        setSosDispatchedNotification(res);
      })
      .catch((e) => {
        console.warn('Automated SOS dispatch completed with fallback:', e);
      });

    // Open Direct Call dialog
    setIsDirectCallOpen(true);
  };

  const handlePlayGreeting = () => {
    if (isSpeakingGreeting) {
      stopVoiceSpeech();
      setIsSpeakingGreeting(false);
      return;
    }
    setIsSpeakingGreeting(true);
    speakReassurance({
      text: langConfig.sampleReassurance || `Pranam ${config.patientName}. You are completely safe. Raunak is with you.`,
      languageCode: config.preferredLanguage || 'en-IN',
      rate: 0.86,
      onEnd: () => setIsSpeakingGreeting(false),
    });
  };

  return (
    <main
      id="patient-mode-root"
      aria-label="Elder Safety Mode"
      className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col justify-between select-none"
    >
      {/* Top Reassurance Greeting Bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border-2 border-emerald-500/60 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/90 border border-emerald-400 flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                CareCompass Safety Active
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Shanti & Protection. You are safe, {config.patientName}.
            </h1>
          </div>
        </div>

        {/* Spoken greeting & Caregiver Portal switcher */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayGreeting}
            className={`p-3 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              isSpeakingGreeting
                ? 'bg-rose-900/90 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-emerald-900/80 border-emerald-500 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            {isSpeakingGreeting ? (
              <>
                <VolumeX className="w-5 h-5" />
                <span>Pause Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-emerald-300" />
                <span>Hear Voice</span>
              </>
            )}
          </button>

          <button
            onClick={handleExitToCaregiver}
            title="Switch to Caregiver Command Center"
            className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-white rounded-2xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#FF6321]" />
            <span className="hidden sm:inline">Caregiver Portal</span>
          </button>
        </div>
      </header>

      {/* Automated SOS Delivery Confirmation Banner */}
      {sosDispatchedNotification && (
        <div className="my-3 max-w-5xl mx-auto w-full bg-emerald-950/95 border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    Automated SOS Delivered (0 Taps Required)
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    {sosDispatchedNotification.dispatchId}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  Alert & Live GPS sent to {config.caregiverName} ({config.caregiverPhone})
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Message was sent straight through without requiring any manual tap.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setIsDirectCallOpen(true)}
                className="w-full sm:w-auto py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Speak to {config.caregiverName} Live Now</span>
              </button>
              <button
                onClick={() => setSosDispatchedNotification(null)}
                className="py-3 px-4 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-xl text-xs font-bold border border-emerald-500/40 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Main Action Grid (4 Big 24px+ Tactile Touch Buttons) */}
      <section className="my-6 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Button 1: Call Raunak Directly */}
        <button
          onClick={() => setIsDirectCallOpen(true)}
          className="group min-h-[140px] sm:min-h-[160px] p-6 sm:p-8 bg-gradient-to-br from-emerald-900/90 to-emerald-950 border-3 border-emerald-500/70 hover:border-emerald-400 rounded-3xl shadow-xl flex items-center space-x-5 text-left transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg transition-colors">
            <Phone className="w-9 h-9 sm:w-11 sm:h-11 animate-bounce" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block mb-1">
              Direct Voice Line • Dials Straight
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Call {config.caregiverName}
            </h2>
            <p className="text-sm text-emerald-200 font-mono mt-1 font-bold">
              {config.caregiverPhone} (Direct Audio Line)
            </p>
          </div>
        </button>

        {/* Button 2: Where Am I? (Show My Way Home) */}
        <button
          onClick={() => setIsWhereAmIOpen(true)}
          className="group min-h-[140px] sm:min-h-[160px] p-6 sm:p-8 bg-gradient-to-br from-sky-900/90 to-slate-900 border-3 border-sky-500/70 hover:border-sky-400 rounded-3xl shadow-xl flex items-center space-x-5 text-left transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-sky-600 group-hover:bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg transition-colors">
            <Compass className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-black uppercase tracking-wider text-sky-300 block mb-1">
              Step-by-Step Guidance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Where Am I?
            </h2>
            <p className="text-sm text-sky-200 mt-1 font-bold">
              Show My Way Home ({Math.round(telemetry.distanceMeters)}m away)
            </p>
          </div>
        </button>

        {/* Button 3: Family Memories & Photos */}
        <button
          onClick={() => setIsMemoryBankOpen(true)}
          className="group min-h-[140px] sm:min-h-[160px] p-6 sm:p-8 bg-gradient-to-br from-indigo-950 to-slate-900 border-3 border-indigo-500/70 hover:border-indigo-400 rounded-3xl shadow-xl flex items-center space-x-5 text-left transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg transition-colors">
            <Heart className="w-9 h-9 sm:w-11 sm:h-11 text-pink-300" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block mb-1">
              Familiar Voices & Photos
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Family Memories
            </h2>
            <p className="text-sm text-indigo-200 mt-1 font-bold">
              Raunak, Ananya, Meera & Home
            </p>
          </div>
        </button>

        {/* Button 4: EMERGENCY HELP (1-Tap SOS) */}
        <div className="relative">
          {sosCountdown !== null ? (
            <div className="min-h-[140px] sm:min-h-[160px] p-6 bg-rose-600 border-4 border-white rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center animate-pulse">
              <span className="text-xs font-black uppercase tracking-widest text-white">
                Dispatching Emergency SOS In
              </span>
              <div className="text-5xl sm:text-6xl font-black text-white font-mono my-1">
                {sosCountdown}
              </div>
              <button
                onClick={handleCancelSOS}
                className="mt-2 py-1.5 px-6 bg-black text-white rounded-full text-xs font-black uppercase border border-white hover:bg-slate-900 cursor-pointer"
              >
                Tap to Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartSOS}
              className="w-full group min-h-[140px] sm:min-h-[160px] p-6 sm:p-8 bg-gradient-to-br from-rose-700 to-rose-900 border-4 border-rose-500 hover:border-white rounded-3xl shadow-2xl flex items-center space-x-5 text-left transition-all transform hover:scale-[1.02] active:scale-100 cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-500 group-hover:bg-rose-400 text-white flex items-center justify-center shrink-0 shadow-xl animate-pulse">
                <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-black uppercase tracking-widest text-rose-200 block mb-1">
                  Automated SOS (0 Taps Required)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  EMERGENCY HELP
                </h2>
                <p className="text-sm text-rose-100 mt-1 font-bold">
                  Siren, Vibrate & Sends GPS Alert Automatically
                </p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Bottom Info: Live Compass & Calming Breathing Guide */}
      <footer className="max-w-5xl mx-auto w-full space-y-4">
        {/* Live Mini Compass Ribbon */}
        <div className="p-4 sm:p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
          <div className="flex items-center space-x-3">
            <div
              style={{ transform: `rotate(${telemetry.bearingDegrees}deg)` }}
              className="w-10 h-10 rounded-full bg-[#002045] border-2 border-emerald-400 flex items-center justify-center text-emerald-400 transition-transform shadow"
            >
              <Navigation className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Live Home Anchor
              </span>
              <p className="text-sm sm:text-base font-black text-white">
                You are {Math.round(telemetry.distanceMeters)}m from {config.homeLocation.label} ({telemetry.bearingText})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                telemetry.geofenceStatus === 'SAFE_ZONE'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : telemetry.geofenceStatus === 'WARNING_BORDER'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                  : 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {telemetry.geofenceStatus === 'SAFE_ZONE'
                  ? 'Safe inside perimeter'
                  : telemetry.geofenceStatus === 'WARNING_BORDER'
                  ? 'Near border boundary'
                  : 'Outside safe zone'}
              </span>
            </span>
          </div>
        </div>

        {/* Ambient Breathing Guide */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBreathingActive(!isBreathingActive)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isBreathingActive
                  ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wind className="w-4 h-4 text-emerald-400" />
              <span>{isBreathingActive ? 'Stop Breathing Guide' : 'Calm Breathing Guide'}</span>
            </button>

            {isBreathingActive && (
              <div className="flex items-center space-x-2 animate-fadeIn">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="text-sm font-black text-emerald-300">
                  {breathPhase} (4 seconds)...
                </span>
              </div>
            )}
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            432Hz Harmonic Frequency Guidance
          </span>
        </div>
      </footer>

      {/* Direct In-App Emergency Voice Calling */}
      <DirectCallModal
        isOpen={isDirectCallOpen}
        onClose={() => setIsDirectCallOpen(false)}
        targetName={config.caregiverName}
        targetPhone={config.caregiverPhone}
        targetRole="Primary Family Caregiver"
        patientName={config.patientName}
        patientLocation={{
          latitude: telemetry.latitude,
          longitude: telemetry.longitude,
          label: config.homeLocation.label,
        }}
      />

      {/* Modals */}
      <WhereAmIModal
        isOpen={isWhereAmIOpen}
        onClose={() => setIsWhereAmIOpen(false)}
        telemetry={telemetry}
        config={config}
      />

      <MemoryBankModal
        isOpen={isMemoryBankOpen}
        onClose={() => setIsMemoryBankOpen(false)}
        config={config}
      />
    </main>
  );
};
