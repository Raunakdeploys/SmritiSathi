/**
 * CareCompass Audio & Voice Synthesis Utility
 * - Web Audio API emergency siren generator (880Hz -> 1200Hz continuous two-tone sweep)
 * - Calming Solfeggio tone synthesizer (432Hz & 528Hz)
 * - Multilingual Web Speech API TTS Engine supporting 11 Indian languages
 */

let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenGainNode: GainNode | null = null;
let sirenLfo: OscillatorNode | null = null;
let isSirenActive = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Starts the dual-tone emergency siren (oscillates between 880Hz and 1200Hz)
 */
export function startEmergencySiren(): void {
  if (isSirenActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);

    // LFO frequency modulates main oscillator (2 Hz warble)
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.2, now); // 2.2 cycles per second

    // Modulate pitch by +/- 220Hz (giving 730Hz to 1170Hz two-tone sweep)
    lfoGain.gain.setValueAtTime(220, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.15); // ramp up smoothly

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);

    sirenOscillator = osc;
    sirenGainNode = gain;
    sirenLfo = lfo;
    isSirenActive = true;
  } catch (err) {
    console.warn('Could not start emergency siren:', err);
  }
}

/**
 * Stops the emergency siren
 */
export function stopEmergencySiren(): void {
  if (!isSirenActive) return;
  const ctx = getAudioContext();
  if (ctx && sirenGainNode) {
    try {
      const now = ctx.currentTime;
      sirenGainNode.gain.cancelScheduledValues(now);
      sirenGainNode.gain.setValueAtTime(sirenGainNode.gain.value, now);
      sirenGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      setTimeout(() => {
        try {
          sirenOscillator?.stop();
          sirenLfo?.stop();
          sirenOscillator?.disconnect();
          sirenGainNode?.disconnect();
          sirenLfo?.disconnect();
        } catch (_) {}
        sirenOscillator = null;
        sirenGainNode = null;
        sirenLfo = null;
        isSirenActive = false;
      }, 120);
    } catch (_) {
      isSirenActive = false;
    }
  } else {
    isSirenActive = false;
  }
}

export function isSirenPlaying(): boolean {
  return isSirenActive;
}

// Telephone Audio Synthesis Nodes
let telephoneRingTimer: any = null;
let telephoneRingOsc1: OscillatorNode | null = null;
let telephoneRingOsc2: OscillatorNode | null = null;
let telephoneRingGain: GainNode | null = null;
let isTelephoneRinging = false;

/**
 * Synthesizes realistic outgoing telecom ringing tone (440Hz + 480Hz cadence)
 */
export function startTelephoneRingingTone(): void {
  if (isTelephoneRinging) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  isTelephoneRinging = true;

  const playRingBurst = () => {
    if (!isTelephoneRinging) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } catch (_) {}
  };

  // Play immediately and cycle every 3 seconds (1.35s ring + 1.65s silence)
  playRingBurst();
  telephoneRingTimer = setInterval(playRingBurst, 3000);
}

/**
 * Stops telephone ringing tone
 */
export function stopTelephoneRingingTone(): void {
  isTelephoneRinging = false;
  if (telephoneRingTimer) {
    clearInterval(telephoneRingTimer);
    telephoneRingTimer = null;
  }
}

/**
 * Plays short DTMF key chirp tone when dialing numbers
 */
export function playKeypadTone(digit = '1'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const dtmfFrequencies: Record<string, [number, number]> = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
    '0': [941, 1336], '*': [941, 1209], '#': [941, 1477],
  };

  const freqs = dtmfFrequencies[digit] || [697, 1209];

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.14);
    osc2.stop(now + 0.14);
  } catch (_) {}
}

/**
 * Plays telephone call connected chime
 */
export function playCallConnectedChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440, 880]; // A4 to A5 crisp connect tone
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  } catch (_) {}
}

/**
 * Plays calming harmonic Solfeggio tones (432Hz or 528Hz) for elder anxiety reduction & breathing
 */
export function playCalmingTone(freq = 432, durationSeconds = 3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Warm envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);
  } catch (err) {
    console.warn('Error playing calming tone:', err);
  }
}

/**
 * Plays a short confirmation / success chime
 */
export function playConfirmationChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.36);
    });
  } catch (_) {}
}

/**
 * Plays a gentle warning beep for border warning
 */
export function playWarningBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch (_) {}
}

/**
 * Text to Speech Voice Synthesizer with 11 Indian Language Support
 */
export function speakReassurance({
  text,
  languageCode = 'en-IN',
  rate = 0.88,
  pitch = 1.0,
  onEnd,
}: {
  text: string;
  languageCode?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser');
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate; // slightly slower for elderly comprehension
    utterance.pitch = pitch;
    utterance.lang = languageCode;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = languageCode.split('-')[0].toLowerCase();

    const matchingVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === languageCode.toLowerCase() ||
        v.lang.toLowerCase().startsWith(langPrefix) ||
        (languageCode.startsWith('en') && v.lang.toLowerCase().includes('in'))
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Error during voice synthesis:', err);
    onEnd?.();
  }
}

/**
 * Stops any ongoing SpeechSynthesis
 */
export function stopVoiceSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
