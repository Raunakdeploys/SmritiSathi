import React, { useState, useEffect } from 'react';
import {
  Home,
  Phone,
  Volume2,
  VolumeX,
  X,
  Compass,
  MapPin,
  CheckCircle2,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import type { CareCompassTelemetry, CareCompassConfig } from '../types';
import { speakReassurance, stopVoiceSpeech } from '../utils/audioUtils';
import { INDIAN_LANGUAGES } from '../utils/geoUtils';
import { DirectCallModal } from './DirectCallModal';

interface WhereAmIModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: CareCompassTelemetry;
  config: CareCompassConfig;
}

export const WhereAmIModal: React.FC<WhereAmIModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  config,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDirectCallOpen, setIsDirectCallOpen] = useState(false);

  const langConfig =
    INDIAN_LANGUAGES.find((l) => l.code === config.preferredLanguage) ||
    INDIAN_LANGUAGES[0];

  const spokenMessage =
    langConfig.sampleReassurance ||
    `Dadaji, you are completely safe. Your home is ${Math.round(
      telemetry.distanceMeters
    )} meters away. Raunak is nearby and heading towards you right now.`;

  // Auto-speak on open if elder voice guidance is active
  useEffect(() => {
    if (isOpen) {
      handleSpeak();
    } else {
      stopVoiceSpeech();
      setIsSpeaking(false);
    }
    return () => {
      stopVoiceSpeech();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpeak = () => {
    setIsSpeaking(true);
    speakReassurance({
      text: spokenMessage,
      languageCode: config.preferredLanguage || 'en-IN',
      rate: 0.86,
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleStopSpeech = () => {
    stopVoiceSpeech();
    setIsSpeaking(false);
  };

  return (
    <div
      id="where-am-i-reassurance-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border-4 border-emerald-500/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Reassurance Banner */}
        <div className="flex items-center space-x-3 bg-emerald-950/80 border-2 border-emerald-500/60 p-4 rounded-2xl">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-300">
              You Are Safe, {config.patientName}
            </h2>
            <p className="text-sm text-emerald-100/90 font-medium">
              We know exactly where you are. {config.caregiverName} is watching over you.
            </p>
          </div>
        </div>

        {/* Distance & Compass Orientation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Distance Box */}
          <div className="p-5 bg-slate-800/90 rounded-2xl border-2 border-slate-700 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Distance to Home
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white my-2 font-mono">
              {Math.round(telemetry.distanceMeters)}m
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {telemetry.geofenceStatus === 'SAFE_ZONE'
                ? 'Inside Safe Home Perimeter'
                : 'Near Home Neighborhood'}
            </span>
          </div>

          {/* Heading Box */}
          <div className="p-5 bg-slate-800/90 rounded-2xl border-2 border-slate-700 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Direction to Walk
            </span>
            <div className="flex items-center space-x-2 my-2">
              <div
                style={{ transform: `rotate(${telemetry.bearingDegrees}deg)` }}
                className="w-10 h-10 rounded-full bg-[#002045] border-2 border-[#38bdf8] flex items-center justify-center text-[#38bdf8] transition-transform"
              >
                <Navigation className="w-5 h-5 -rotate-45" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {telemetry.bearingText.split(' ')[0]}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-medium">
              Head towards {config.homeLocation.label}
            </span>
          </div>
        </div>

        {/* Visual Anchor: Photo of Home */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=80"
            alt="Family House in Guwahati"
            className="w-full sm:w-36 h-28 rounded-xl object-cover border-2 border-emerald-500/50 shadow-md"
          />
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#FF6321]">
              <Home className="w-4 h-4" />
              <span>Your Familiar Sanctuary</span>
            </div>
            <h4 className="text-base font-black text-white">
              {config.homeLocation.label}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {config.homeLocation.area}, {config.homeLocation.city} (Capital Base). The green gate and reading chair are right here.
            </p>
          </div>
        </div>

        {/* Spoken Voice Script Card */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/40 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Spoken Voice Guidance ({langConfig.name})
            </span>
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
              "{spokenMessage}"
            </p>
          </div>

          <button
            onClick={isSpeaking ? handleStopSpeech : handleSpeak}
            className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-900/80 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-emerald-900/80 border-emerald-500 text-emerald-200 hover:bg-emerald-800'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Listen</span>
              </>
            )}
          </button>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => setIsDirectCallOpen(true)}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-black text-lg flex items-center justify-center space-x-3 shadow-lg transition-all cursor-pointer"
          >
            <Phone className="w-6 h-6" />
            <span>Call {config.caregiverName} Directly</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded-2xl font-black text-lg flex items-center justify-center space-x-2 border-2 border-slate-600 transition-all cursor-pointer"
          >
            <span>I Understand, Close</span>
          </button>
        </div>
      </div>

      {/* Direct In-App Emergency Voice Call */}
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
    </div>
  );
};
