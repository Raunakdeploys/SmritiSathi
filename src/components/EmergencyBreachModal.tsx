import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Phone,
  Send,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  MapPin,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Clock,
  Battery,
} from 'lucide-react';
import {
  startEmergencySiren,
  stopEmergencySiren,
  isSirenPlaying,
  speakReassurance,
  stopVoiceSpeech,
} from '../utils/audioUtils';
import { generateWhatsAppSOSUrl, INDIA_EMERGENCY_SERVICES, INDIAN_LANGUAGES } from '../utils/geoUtils';
import type { CareCompassConfig, CareCompassTelemetry } from '../types';

interface EmergencyBreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CareCompassConfig;
  telemetry: CareCompassTelemetry;
  onAcknowledge?: () => void;
}

export const EmergencyBreachModal: React.FC<EmergencyBreachModalProps> = ({
  isOpen,
  onClose,
  config,
  telemetry,
  onAcknowledge,
}) => {
  const [countdown, setCountdown] = useState<number>(5);
  const [autoDispatched, setAutoDispatched] = useState<boolean>(false);
  const [sirenOn, setSirenOn] = useState<boolean>(true);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState<boolean>(false);

  const { message: sosMessage, url: whatsAppUrl } = generateWhatsAppSOSUrl({
    caregiverPhone: config.caregiverPhone,
    patientName: config.patientName,
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    distanceMeters: telemetry.distanceMeters,
    homeLabel: config.homeLocation.label,
    batteryLevel: telemetry.batteryLevel,
    cause: 'Critical Geofence Breach Outside Fixed Radar',
  });

  // Siren and countdown effects
  useEffect(() => {
    if (!isOpen) {
      stopEmergencySiren();
      stopVoiceSpeech();
      return;
    }

    if (config.autoSirenOnBreach) {
      startEmergencySiren();
      setSirenOn(true);
    }

    // Spoken Indian language voice alert
    const lang = INDIAN_LANGUAGES.find((l) => l.code === config.preferredLanguage) || INDIAN_LANGUAGES[0];
    speakReassurance({
      text: lang.emergencyAlertIntro || `Alert: ${config.patientName} has moved outside the designated safe zone.`,
      languageCode: config.preferredLanguage || 'en-IN',
      rate: 0.9,
    });
    setIsSpeakingVoice(true);

    // Auto-dispatch countdown
    setCountdown(5);
    setAutoDispatched(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (config.autoWhatsAppOnBreach && !autoDispatched) {
            setAutoDispatched(true);
            try {
              window.open(whatsAppUrl, '_blank');
            } catch (e) {
              console.warn('Browser prevented popup:', e);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopEmergencySiren();
      stopVoiceSpeech();
    };
  }, [isOpen, whatsAppUrl, config.autoSirenOnBreach, config.autoWhatsAppOnBreach]);

  if (!isOpen) return null;

  const handleToggleSiren = () => {
    if (isSirenPlaying() || sirenOn) {
      stopEmergencySiren();
      setSirenOn(false);
    } else {
      startEmergencySiren();
      setSirenOn(true);
    }
  };

  const handleManualDispatchWhatsApp = () => {
    setAutoDispatched(true);
    window.open(whatsAppUrl, '_blank');
  };

  const handleAcknowledgeAndDismiss = () => {
    stopEmergencySiren();
    stopVoiceSpeech();
    if (onAcknowledge) onAcknowledge();
    onClose();
  };

  const cleanPhone = config.caregiverPhone.replace(/[^0-9+]/g, '');

  return (
    <div
      id="carecompass-emergency-breach-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="breach-title"
    >
      <div className="bg-slate-900 border-4 border-rose-500 rounded-3xl max-w-2xl w-full p-5 sm:p-7 text-white shadow-[0_0_50px_rgba(244,63,94,0.45)] space-y-5 relative max-h-[95vh] overflow-y-auto">
        {/* Urgent Header Banner */}
        <div className="bg-rose-950/80 border-2 border-rose-500/80 p-4 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-600 rounded-xl text-white shadow-lg shrink-0">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-rose-500 text-white font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full">
                  Level 1 Distress
                </span>
                <span className="text-xs font-mono text-rose-300">
                  Fixed Radar Breach
                </span>
              </div>
              <h2 id="breach-title" className="text-lg sm:text-2xl font-black text-rose-200">
                CRITICAL GEOFENCE BREACH DETECTED!
              </h2>
            </div>
          </div>

          <button
            onClick={handleToggleSiren}
            title={sirenOn ? 'Mute Siren Alarm' : 'Play Siren Alarm'}
            className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              sirenOn
                ? 'bg-rose-600 border-rose-400 text-white animate-bounce'
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            {sirenOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Live Breach Telemetry Readout */}
        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Radio className="w-4 h-4 text-rose-400 animate-ping" />
              <span>Elder: <strong>{config.patientName}</strong> ({config.patientHonorific})</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Perimeter Limit: {config.alertRadiusMeters}m
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-rose-500/30">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance to Base</span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                {Math.round(telemetry.distanceMeters)}m
              </span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bearing</span>
              <span className="text-base sm:text-lg font-black text-white">
                {telemetry.bearingText.split(' ')[0]} ({telemetry.bearingDegrees}°)
              </span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GPS Coordinates</span>
              <span className="text-[11px] font-mono text-slate-300 block truncate">
                {telemetry.latitude.toFixed(5)}, {telemetry.longitude.toFixed(5)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Device Battery</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {telemetry.batteryLevel}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Fixed Radar Base: {config.homeLocation.label}</span>
            </span>
            <a
              href={`https://maps.google.com/?q=${telemetry.latitude.toFixed(6)},${telemetry.longitude.toFixed(6)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold underline"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action 1: AUTOMATIC WHATSAPP SOS ALERT */}
        <div className="bg-emerald-950/60 border-2 border-emerald-500/60 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Send className="w-4 h-4" />
              <span>WhatsApp SOS Emergency Dispatch</span>
            </div>
            {countdown > 0 && !autoDispatched ? (
              <span className="text-xs font-mono font-black text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/50 animate-pulse">
                Auto-opening in {countdown}s
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready / Dispatched</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Sends live GPS coordinates, distance, and direct navigation links to primary caregiver:
            <strong className="text-white font-mono block mt-0.5">
              {config.caregiverName} ({config.caregiverPhone})
            </strong>
          </p>

          <button
            onClick={handleManualDispatchWhatsApp}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Open WhatsApp SOS Dispatch Now</span>
          </button>
        </div>

        {/* Action 2: AUTOMATIC DIRECT CALL TO CAREGIVER & HELPLINES */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
            <Phone className="w-4 h-4 text-rose-400" />
            <span>Emergency Calling Options</span>
          </div>

          <a
            href={`tel:${cleanPhone}`}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Call Caregiver ({config.caregiverName}) Directly</span>
          </a>

          {/* Indian Emergency Services Speed-Dial */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href="tel:112"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">All Emergency</span>
              <span className="text-sm font-black text-white font-mono">112</span>
            </a>
            <a
              href="tel:108"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">Ambulance</span>
              <span className="text-sm font-black text-emerald-400 font-mono">108</span>
            </a>
            <a
              href="tel:100"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">Police</span>
              <span className="text-sm font-black text-sky-400 font-mono">100</span>
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleAcknowledgeAndDismiss}
            className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-750 active:bg-slate-900 text-slate-200 rounded-xl font-bold text-sm border border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Acknowledge Breach & Silence Alarm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
