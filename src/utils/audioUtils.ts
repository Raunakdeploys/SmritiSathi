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
