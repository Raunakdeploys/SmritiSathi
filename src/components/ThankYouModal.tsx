import React from 'react';
import { X, Sparkles, Trophy, ArrowRight, Heart, Share2, Check } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  pointsEarned?: number;
  onNextAction?: () => void;
  nextActionLabel?: string;
}

export function ThankYouModal({
  isOpen,
  onClose,
  title = 'Wonderful Job!',
  subtitle = 'You have completed your cognitive session and nourished your memory today.',
  pointsEarned = 25,
  onNextAction,
  nextActionLabel = 'Continue Exercising',
}: ThankYouModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SmritiSaathi Cognitive Achievement',
        text: `I just earned ${pointsEarned} Mind Points doing cognitive stimulation on SmritiSaathi!`,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`I just earned ${pointsEarned} Mind Points doing cognitive stimulation on SmritiSaathi!`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#0b1d3a] text-white rounded-3xl max-w-sm w-full p-6 sm:p-8 text-center shadow-2xl border border-blue-900/60 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-blue-950 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Trophy Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
          <Trophy className="w-10 h-10 animate-bounce" style={{ animationDuration: '2s' }} />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
            Cognitive Milestone Achieved
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2.5">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Points Pill */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-extrabold">+{pointsEarned} Mind Points Added</span>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          {onNextAction && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNextAction();
              }}
              className="w-full py-3 rounded-2xl bg-[#002045] hover:bg-[#003366] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{nextActionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-2 rounded-xl bg-blue-950 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Share Progress</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-blue-950 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
