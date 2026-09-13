import React, { useState } from 'react';
import {
  X,
  Heart,
  Volume2,
  VolumeX,
  Phone,
  Sparkles,
  RotateCcw,
  BookOpen,
  MapPin,
} from 'lucide-react';
import type { MemoryCard, CareCompassConfig } from '../types';
import { INITIAL_FAMILY_MEMORIES } from '../data/memoriesData';
import { speakReassurance, stopVoiceSpeech } from '../utils/audioUtils';

interface MemoryBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CareCompassConfig;
  customMemories?: MemoryCard[];
}

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  isOpen,
  onClose,
  config,
  customMemories,
}) => {
  const memories = customMemories && customMemories.length > 0 ? customMemories : INITIAL_FAMILY_MEMORIES;

  const [activeMemoryId, setActiveMemoryId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handlePlayVoiceNote = (memory: MemoryCard) => {
    if (isPlayingAudio === memory.id) {
      stopVoiceSpeech();
      setIsPlayingAudio(null);
      return;
    }

    setIsPlayingAudio(memory.id);
    speakReassurance({
      text: memory.audioVoiceNote || memory.description,
      languageCode: config.preferredLanguage || 'en-IN',
      rate: 0.88,
      onEnd: () => setIsPlayingAudio(null),
    });
  };

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      id="memory-bank-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border-4 border-indigo-500/80 rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-md">
              <Heart className="w-7 h-7 text-pink-300" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Family Memories & Anchors
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Beloved faces, voices, and comforting stories for {config.patientName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopVoiceSpeech();
              onClose();
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="bg-indigo-950/70 border border-indigo-500/40 p-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-indigo-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <span>
              Tap <strong>"Listen"</strong> to hear loving voice notes or tap <strong>"Flip Card"</strong> to read familiar stories.
            </span>
          </div>
        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {memories.map((mem) => {
            const isFlipped = flippedCards[mem.id];
            const isSpeaking = isPlayingAudio === mem.id;

            return (
              <div
                key={mem.id}
                className={`group relative bg-slate-800 rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden shadow-lg ${
                  isSpeaking
                    ? 'border-pink-500 shadow-pink-500/20 shadow-2xl ring-2 ring-pink-500'
                    : 'border-slate-700 hover:border-indigo-400'
                }`}
              >
                {!isFlipped ? (
                  /* Front Side: Photo & Primary Info */
                  <>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                      <img
                        src={mem.imageUrl}
                        alt={mem.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-black text-pink-300 border border-pink-500/40 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-pink-400" />
                        <span>{mem.relation}</span>
                      </div>

                      {mem.location && (
                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FF6321]" />
                          <span>{mem.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-lg font-black text-white">
                          {mem.name}
                        </h3>
                        <p className="text-xs text-indigo-300 font-bold">
                          {mem.title}
                        </p>
                        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {mem.description}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-700/80">
                        <button
                          onClick={() => handlePlayVoiceNote(mem)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSpeaking
                              ? 'bg-pink-600 border-pink-400 text-white animate-pulse'
                              : 'bg-indigo-900/80 hover:bg-indigo-800 border-indigo-500 text-indigo-100'
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-4 h-4" />
                              <span>Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4 text-pink-300" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => toggleFlip(mem.id)}
                          title="Flip for Story"
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-amber-300" />
                          <span className="hidden sm:inline">Story</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Back Side: Story & Anecdote */
                  <div className="p-5 flex-1 flex flex-col justify-between bg-slate-850 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                        <span className="text-xs font-black text-pink-400 uppercase tracking-wider">
                          {mem.relation} • {mem.year || 'Timeless'}
                        </span>
                        <button
                          onClick={() => toggleFlip(mem.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-base font-black text-white">{mem.name}</h4>
                      <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                        "{mem.audioVoiceNote}"
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {mem.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-700">
                      <button
                        onClick={() => handlePlayVoiceNote(mem)}
                        className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-500 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Hear Beloved Voice</span>
                      </button>

                      <button
                        onClick={() => toggleFlip(mem.id)}
                        className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-200 cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct Caregiver Action Call */}
        <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80"
              alt="Raunak"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
            />
            <div>
              <h4 className="text-sm font-black text-white">
                Want to speak with {config.caregiverName}?
              </h4>
              <p className="text-xs text-slate-300">
                Direct mobile line: {config.caregiverPhone}
              </p>
            </div>
          </div>

          <a
            href={`tel:${config.caregiverPhone.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Call {config.caregiverName}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
