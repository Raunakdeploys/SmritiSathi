import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Sparkles, CheckCircle2, RotateCcw, ArrowRight, X, Volume2 } from 'lucide-react';
import { playSuccessChime, playLevelUpFanfare, speakText } from '../utils/audio';

interface GameResultsModalProps {
  isOpen: boolean;
  score: number; // 0 - 100
  pointsEarned: number;
  bonusPoints?: number;
  accuracy?: number;
  gameTitle: string;
  level: number;
  leveledUp?: boolean;
  bridgeActive?: boolean;
  voiceGuidanceEnabled?: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
  onNextGame?: () => void;
}

export const GameResultsModal: React.FC<GameResultsModalProps> = ({
  isOpen,
  score,
  pointsEarned,
  bonusPoints = 0,
  accuracy = 100,
  gameTitle,
  level,
  leveledUp = false,
  bridgeActive = false,
  voiceGuidanceEnabled = true,
  onPlayAgain,
  onClose,
  onNextGame,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (score >= 70) {
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF6321', '#F59E0B', '#10B981', '#0F172A'],
          });
        } catch (e) {
          // ignore
        }
      }

      if (leveledUp) {
        playLevelUpFanfare();
      } else {
        playSuccessChime();
      }

      const spokenFeedback =
        score >= 85
          ? `Splendid job! You scored ${score} percent in ${gameTitle} and earned ${pointsEarned + bonusPoints} Mind Points.`
          : `Well done! You completed ${gameTitle} with ${score} percent score. Keep up the wonderful daily practice.`;
      speakText(spokenFeedback, voiceGuidanceEnabled);
    }
  }, [isOpen, score, leveledUp, gameTitle, pointsEarned, bonusPoints, voiceGuidanceEnabled]);

  if (!isOpen) return null;

  const totalEarned = pointsEarned + bonusPoints;
  const isHighPass = score >= 80;

  return (
    <div
      id="game-results-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="game-results-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F9FA] text-[#0F172A] w-full max-w-lg rounded-3xl shadow-2xl border-3 border-[#FF6321]/30 overflow-hidden flex flex-col my-auto"
      >
        {/* Header Ribbon */}
        <div
          className={`px-6 py-5 flex items-center justify-between text-white ${
            isHighPass
              ? 'bg-gradient-to-r from-[#FF6321] via-[#EA580C] to-[#C2410C]'
              : 'bg-gradient-to-r from-[#0F172A] to-[#1E293B]'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isHighPass ? 'Splendid Accomplishment!' : 'Session Complete!'}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 font-medium">
                {gameTitle} • Level {level}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Leveled Up Notification Banner */}
          {leveledUp && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-bounce" />
                <div>
                  <h4 className="font-black text-emerald-950 text-sm sm:text-base">
                    Level Up Achieved!
                  </h4>
                  <p className="text-xs text-emerald-800 font-medium">
                    You have unlocked Level {level + 1} with +50 Bonus Points!
                  </p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full">
                +50 PTS
              </span>
            </div>
          )}

          {/* Primary Score & Mind Points Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Cognitive Score
              </span>
              <div className="flex items-baseline space-x-1 my-1">
                <span className="text-4xl sm:text-5xl font-black text-[#FF6321]">
                  {score}
                </span>
                <span className="text-xl font-bold text-slate-400">%</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {accuracy}% Accuracy
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                Mind Points Earned
              </span>
              <div className="flex items-center space-x-1.5 my-1">
                <span className="text-3xl text-amber-500 font-black">⚡</span>
                <span className="text-4xl sm:text-5xl font-black text-amber-950">
                  +{totalEarned}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                Daily Streak Maintained
              </span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs sm:text-sm font-bold">
            <div className="flex items-center justify-between text-slate-600">
              <span>Base Exercise Reward</span>
              <span className="font-black text-slate-900">+{pointsEarned} pts</span>
            </div>
            {bonusPoints > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Mastery / Milestone Bonus</span>
                <span className="font-black text-emerald-700">+{bonusPoints} pts</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-900 font-extrabold">
              <span>Total Points Added to Profile</span>
              <span className="text-[#FF6321] text-base font-black">+{totalEarned} pts</span>
            </div>
          </div>

          {/* Voice Prompt Playback Button */}
          <button
            onClick={() => {
              const text = `You scored ${score} percent and earned ${totalEarned} Mind Points. Excellent progress today!`;
              speakText(text, true);
            }}
            className="w-full flex items-center justify-center space-x-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#FF6321]" />
            <span>Hear Summary Aloud</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 py-3 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-slate-600" />
            <span>Play Again</span>
          </button>

          {onNextGame ? (
            <button
              onClick={onNextGame}
              className="flex-1 bg-[#FF6321] hover:bg-[#EA580C] text-white py-3 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition-transform active:scale-95 cursor-pointer"
            >
              <span>Next Game</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 bg-[#0F172A] hover:bg-[#1E293B] text-white py-3 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Back to Hub</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
