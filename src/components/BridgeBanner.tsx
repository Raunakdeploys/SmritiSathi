import React from 'react';
import { Sparkles, Info, Volume2 } from 'lucide-react';
import { speakText } from '../utils/audio';

interface BridgeBannerProps {
  reason?: string;
  voiceGuidanceEnabled?: boolean;
}

export const BridgeBanner: React.FC<BridgeBannerProps> = ({
  reason = 'Extra guidance, extended study time, and highlighted visual clues enabled to support calm recall.',
  voiceGuidanceEnabled = true,
}) => {
  const handleReadAloud = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakText(`Cognitive Bridge Active. ${reason}`, voiceGuidanceEnabled);
  };

  return (
    <div
      id="cognitive-bridge-banner"
      className="w-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/80 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-sm flex items-center justify-between gap-3 text-amber-950 transition-all animate-fadeIn"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs flex-shrink-0 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase bg-amber-200/90 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
              Cognitive Bridge Active
            </span>
            <span className="text-xs text-amber-800 font-semibold hidden sm:inline">
              Adaptive Pace & Visual Support
            </span>
          </div>
          <p className="text-xs sm:text-sm text-amber-950 font-bold mt-0.5 line-clamp-2">
            {reason}
          </p>
        </div>
      </div>

      <button
        onClick={handleReadAloud}
        title="Hear guidance aloud"
        className="p-2 bg-white/80 hover:bg-white text-amber-900 rounded-xl border border-amber-300 shadow-xs flex-shrink-0 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
      >
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
  );
};
