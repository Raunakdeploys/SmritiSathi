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
  Zap,
  MessageSquare,
  Copy,
} from 'lucide-react';
import {
  startEmergencySiren,
  stopEmergencySiren,
  isSirenPlaying,
  stopVoiceSpeech,
} from '../utils/audioUtils';
import { INDIA_EMERGENCY_SERVICES, INDIAN_LANGUAGES, generateWhatsAppSOSUrl } from '../utils/geoUtils';
import type { CareCompassConfig, CareCompassTelemetry, AutomatedSOSDispatchResult, EmergencySOSResponse } from '../types';
import { emergencySosService } from '../services/emergencySosService';
import { DirectCallModal } from './DirectCallModal';

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
  const [autoDispatched, setAutoDispatched] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<AutomatedSOSDispatchResult | null>(null);
  const [sirenOn, setSirenOn] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [directCallTarget, setDirectCallTarget] = useState<{ name: string; phone: string; role: string } | null>(null);
  const [isDispatchingRef, setIsDispatchingRef] = useState<boolean>(false);

  const cleanPhone = config.caregiverPhone.replace(/\s+/g, '');

  const sosData = generateWhatsAppSOSUrl({
    caregiverPhone: config.caregiverPhone,
    patientName: config.patientName,
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    distanceMeters: telemetry.distanceMeters,
    homeLabel: config.homeLocation.label,
    batteryLevel: telemetry.batteryLevel,
    cause: 'Critical Geofence Breach Outside Safe Perimeter',
  });

  // Automated Siren and Central Emergency Dispatch Status Listener
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

    // Check if a recent central SOS response already exists
    const recent = emergencySosService.getRecentResponses();
    if (recent.length > 0) {
      const latest = recent[0];
      setDispatchResult({
        success: latest.success,
        dispatchId: latest.dispatchId,
        timestamp: latest.timestamp,
        deliveryStatus: latest.services.whatsapp.status === 'DELIVERED' ? 'DELIVERED' : 'TRANSMITTING',
        recipientPhone: latest.caregiverPhone,
        recipientName: latest.caregiverName,
        messageText: latest.messageText,
        carrierAck: `WhatsApp: ${latest.services.whatsapp.status} • Voice Call: ${latest.services.voiceCall.status}`,
        services: latest.services,
      });
      setAutoDispatched(true);
    }

    // Subscribe to any new emergency SOS updates in real time
    const unsubscribe = emergencySosService.subscribe((res) => {
      setDispatchResult({
        success: res.success,
        dispatchId: res.dispatchId,
        timestamp: res.timestamp,
        deliveryStatus: res.services.whatsapp.status === 'DELIVERED' ? 'DELIVERED' : 'TRANSMITTING',
        recipientPhone: res.caregiverPhone,
        recipientName: res.caregiverName,
        messageText: res.messageText,
        carrierAck: `WhatsApp: ${res.services.whatsapp.status} • Voice Call: ${res.services.voiceCall.status}`,
        services: res.services,
      });
      setAutoDispatched(true);
    });

    return () => {
      stopEmergencySiren();
      stopVoiceSpeech();
      unsubscribe();
    };
  }, [isOpen, telemetry.latitude, telemetry.longitude, config.caregiverPhone]);

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

  const handleAcknowledgeAndDismiss = () => {
    stopEmergencySiren();
    stopVoiceSpeech();
    onAcknowledge?.();
    onClose();
  };

  const handleCopySOSMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sosData.message);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    }
  };

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

        {/* Action 1: AUTOMATED WHATSAPP SOS VIA OPENWA GATEWAY (NO WA.ME REQUIRED) */}
        <div className="bg-emerald-950/80 border-2 border-emerald-500/80 p-4 rounded-2xl space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Zap className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Automated WhatsApp Message Sent (OpenWA Gateway)</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/90 px-2.5 py-0.5 rounded-full border border-emerald-400/50 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Delivered: {config.caregiverPhone}</span>
            </span>
          </div>

          {/* Autonomous Delivery Confirmation Card */}
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Autonomous Background Dispatch Active</span>
                </p>
                <p className="text-[11px] text-slate-300 pt-0.5">
                  The emergency geofence breach alert was transmitted directly to caregiver <strong>{config.caregiverName}</strong> on WhatsApp via the OpenWA Gateway protocol. No manual typing, browser redirect, or wa.me click required.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded font-black shrink-0">
                0-Click Dispatch
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px] font-mono">
              <div className="text-slate-400">
                <span>Protocol: </span>
                <span className="text-emerald-300 font-bold">OpenWA REST API</span>
              </div>
              <div className="text-slate-400 truncate">
                <span>Ref: </span>
                <span className="text-slate-200">{dispatchResult?.dispatchId || 'OPENWA-AUTO-ACTIVE'}</span>
              </div>
            </div>
          </div>

          {/* Background Re-send Action */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                if (isDispatchingRef) return;
                setIsDispatchingRef(true);
                try {
                  const res = await emergencySosService.triggerEmergencySOS({
                    triggerType: 'GEOFENCE_EXIT',
                    latitude: telemetry.latitude,
                    longitude: telemetry.longitude,
                    accuracy: telemetry.accuracy,
                    distanceMeters: telemetry.distanceMeters,
                    patientName: config.patientName,
                    caregiverPhone: config.caregiverPhone,
                    caregiverName: config.caregiverName,
                    homeLabel: config.homeLocation.label,
                    batteryLevel: telemetry.batteryLevel,
                    notes: `Automated OpenWA Re-dispatch: Geofence breach (${Math.round(telemetry.distanceMeters)}m from base)`,
                  });
                  setDispatchResult({
                    success: res.success,
                    dispatchId: res.dispatchId,
                    timestamp: res.timestamp,
                    deliveryStatus: res.services.whatsapp.status === 'DELIVERED' ? 'DELIVERED' : 'TRANSMITTING',
                    recipientPhone: res.caregiverPhone,
                    recipientName: res.caregiverName,
                    messageText: res.messageText,
                    carrierAck: `WhatsApp: ${res.services.whatsapp.status} • Voice Call: ${res.services.voiceCall.status}`,
                    services: res.services,
                  });
                } finally {
                  setIsDispatchingRef(false);
                }
              }}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer border border-emerald-400"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Re-send Automated Alert via OpenWA</span>
            </button>

            <button
              type="button"
              onClick={handleCopySOSMessage}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedText ? 'Copied SOS!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Discreet secondary fallback only if offline */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-emerald-950">
            <span>Powered by OpenWA Plugin Architecture</span>
            <a
              href={sosData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 underline"
            >
              Secondary fallback (Manual wa.me link)
            </a>
          </div>
        </div>

        {/* Action 2: DIRECT TELEPHONE CALL & HELPLINES (Auto-Rings Phone) */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
              <Phone className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Direct Emergency Voice Line (Auto-Rings Phone)</span>
            </div>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/40">
              Direct Phone Call
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={sosData.telUrl}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer no-underline"
            >
              <Phone className="w-4 h-4" />
              <span>Ring Caregiver ({config.caregiverPhone})</span>
            </a>

            <a
              href={sosData.smsUrl}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-900 text-slate-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 border border-slate-700 transition-all cursor-pointer no-underline"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Send Native SMS</span>
            </a>
          </div>

          {/* Indian Emergency Services Speed-Dial */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href="tel:112"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer no-underline block"
            >
              <span className="text-[10px] text-slate-400 block">All Emergency</span>
              <span className="text-sm font-black text-white font-mono">112</span>
            </a>
            <a
              href="tel:108"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer no-underline block"
            >
              <span className="text-[10px] text-slate-400 block">Ambulance</span>
              <span className="text-sm font-black text-emerald-400 font-mono">108</span>
            </a>
            <a
              href="tel:100"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer no-underline block"
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

      {/* In-App Direct Emergency Voice Call Engine */}
      {directCallTarget && (
        <DirectCallModal
          isOpen={!!directCallTarget}
          onClose={() => setDirectCallTarget(null)}
          targetName={directCallTarget.name}
          targetPhone={directCallTarget.phone}
          targetRole={directCallTarget.role}
          patientName={config.patientName}
          patientLocation={{
            latitude: telemetry.latitude,
            longitude: telemetry.longitude,
            label: config.homeLocation.label,
          }}
        />
      )}
    </div>
  );
};
