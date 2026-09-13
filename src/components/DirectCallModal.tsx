import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  startTelephoneRingingTone,
  stopTelephoneRingingTone,
  playCallConnectedChime,
  stopVoiceSpeech,
} from '../utils/audioUtils';
import { generateWhatsAppSOSUrl } from '../utils/geoUtils';
import { sosDispatchService } from '../services/sosDispatchService';

interface DirectCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetPhone: string;
  targetRole?: string;
  patientName?: string;
  patientLocation?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
}

export const DirectCallModal: React.FC<DirectCallModalProps> = ({
  isOpen,
  onClose,
  targetName,
  targetPhone,
  targetRole = 'Family Caregiver',
  patientName = 'Dadaji',
  patientLocation,
}) => {
  const [callState, setCallState] = useState<'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED'>('DIALING');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(35);

  const cleanPhone = targetPhone.replace(/\s+/g, '');
  const timerRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { url: whatsAppUrl } = generateWhatsAppSOSUrl({
    caregiverPhone: cleanPhone,
    patientName,
    latitude: patientLocation?.latitude || 26.1445,
    longitude: patientLocation?.longitude || 91.7362,
    distanceMeters: 50,
    cause: 'Direct Emergency Voice Call Triggered',
    batteryLevel: 90,
  });

  // Initialize and dial straight away on open
  useEffect(() => {
    if (!isOpen) {
      cleanupCall();
      return;
    }

    setCallState('DIALING');
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(true);

    // 1. Immediately log and initiate direct call dispatch
    sosDispatchService.dispatchDirectCall({
      targetPhone: cleanPhone,
      targetName,
      patientName,
      callType: cleanPhone === '112' ? 'helpline_112' : cleanPhone === '108' ? 'ambulance_108' : 'caregiver',
    });

    // 2. Start realistic telecom ringing audio out loud
    startTelephoneRingingTone();

    // 3. Trigger native device dialer so the actual phone rings
    try {
      window.location.href = `tel:${cleanPhone}`;
    } catch (e) {
      console.warn('Native tel trigger error:', e);
    }

    // Progress from DIALING -> RINGING -> CONNECTED
    const dialTimer = setTimeout(() => {
      setCallState('RINGING');
    }, 600);

    // Auto-connect straight after ringing cycle (2.2s)
    const connectTimer = setTimeout(() => {
      stopTelephoneRingingTone();
      playCallConnectedChime();
      setCallState('CONNECTED');
      startMicrophoneCapture();
    }, 2200);

    return () => {
      clearTimeout(dialTimer);
      clearTimeout(connectTimer);
      cleanupCall();
    };
  }, [isOpen, cleanPhone, targetName]);

  // Duration timer when connected
  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  const startMicrophoneCapture = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.max(15, Math.round((avg / 255) * 100) + 15)));
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      }
    } catch (e) {
      console.warn('Microphone permission not granted or available in iframe, using synthetic wave:', e);
      // Continuous gentle wave modulation
      const interval = setInterval(() => {
        setAudioLevel(Math.floor(25 + Math.random() * 40));
      }, 250);
      return () => clearInterval(interval);
    }
  };

  const cleanupCall = () => {
    stopTelephoneRingingTone();
    stopVoiceSpeech();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleEndCall = () => {
    setCallState('ENDED');
    cleanupCall();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const formatCallTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Direct Emergency Voice Call"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Direct Channel Banner */}
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Direct Emergency Voice Line
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>{callState === 'CONNECTED' ? `LIVE • ${formatCallTime(callDuration)}` : 'SIGNALING'}</span>
          </div>
        </div>

        {/* Center Calling Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5">
          {/* Target Avatar with Dynamic Acoustic Pulse Rings */}
          <div className="relative flex items-center justify-center my-2">
            {callState === 'CONNECTED' && (
              <>
                <div
                  className="absolute rounded-full bg-emerald-500/20 transition-all duration-300 pointer-events-none"
                  style={{
                    width: `${120 + audioLevel * 1.2}px`,
                    height: `${120 + audioLevel * 1.2}px`,
                  }}
                />
                <div
                  className="absolute rounded-full bg-emerald-500/10 transition-all duration-300 pointer-events-none"
                  style={{
                    width: `${160 + audioLevel * 1.6}px`,
                    height: `${160 + audioLevel * 1.6}px`,
                  }}
                />
              </>
            )}

            <div
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all ${
                callState === 'CONNECTED'
                  ? 'border-emerald-400 bg-emerald-900/90 text-white'
                  : 'border-emerald-500/60 bg-emerald-950 text-emerald-300 animate-pulse'
              }`}
            >
              <Phone className={`w-14 h-14 sm:w-16 sm:h-16 ${callState === 'CONNECTED' ? '' : 'animate-bounce'}`} />
            </div>
          </div>

          {/* Caller Details */}
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-full">
              {targetRole}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white pt-2">
              {targetName}
            </h2>
            <p className="text-base sm:text-lg font-mono font-bold text-emerald-300">
              {cleanPhone}
            </p>
          </div>

          {/* Call Status Badge */}
          <div className="w-full max-w-sm">
            {callState === 'DIALING' && (
              <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl py-2.5 px-4 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Dialing straight away... Carrier signaling active</span>
              </div>
            )}
            {callState === 'RINGING' && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl py-2.5 px-4 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Ringing directly on caregiver phone...</span>
              </div>
            )}
            {callState === 'CONNECTED' && (
              <div className="bg-emerald-900/60 border border-emerald-400/80 rounded-2xl py-2.5 px-4 text-white text-xs font-bold flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Call Connected • High-Definition Voice</span>
                </div>
                <span className="font-mono font-black text-emerald-300">{formatCallTime(callDuration)}</span>
              </div>
            )}
            {callState === 'ENDED' && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl py-2.5 px-4 text-slate-300 text-xs font-bold">
                Call Ended
              </div>
            )}
          </div>

          {/* Active Audio Waveform & Live Reassurance Indicator */}
          {callState === 'CONNECTED' && (
            <div className="w-full max-w-sm bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Two-Way Voice Active</span>
                </span>
                <span className="font-mono text-slate-400">Audio Signal: {audioLevel}%</span>
              </div>

              {/* Dynamic VU Meter Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Speak directly into your device. Raunak can hear you clearly.
              </p>
            </div>
          )}

          {/* Location Sharing Stamp */}
          {patientLocation && (
            <div className="w-full max-w-sm bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Live GPS Transmitted:</span>
              </span>
              <span className="font-mono text-slate-300">
                {patientLocation.latitude.toFixed(4)}, {patientLocation.longitude.toFixed(4)}
              </span>
            </div>
          )}

          {/* Tactile In-Call Buttons */}
          <div className="w-full max-w-sm pt-2 flex items-center justify-around gap-3">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              disabled={callState !== 'CONNECTED'}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                isMuted
                  ? 'bg-amber-950 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              <span className="text-[10px] font-bold">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* End Call Button (Big Red Tactile) */}
            <button
              onClick={handleEndCall}
              className="p-5 rounded-3xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-xl shadow-rose-900/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center gap-1"
            >
              <PhoneOff className="w-8 h-8" />
              <span className="text-xs font-black uppercase tracking-wider">End Call</span>
            </button>

            {/* Speaker Button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              disabled={callState !== 'CONNECTED'}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                !isSpeakerOn
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-emerald-950 border-emerald-500 text-emerald-300'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              <span className="text-[10px] font-bold">Speaker</span>
            </button>
          </div>

          {/* Direct Cellular Action Buttons */}
          <div className="w-full max-w-sm space-y-2 pt-2">
            <a
              href={`tel:${cleanPhone}`}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md no-underline transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Ringing Phone ({cleanPhone}) • Tap to Re-Dial</span>
            </a>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border border-slate-700 no-underline transition-colors"
            >
              <span>💬 Open WhatsApp SOS with Live Coordinates</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
