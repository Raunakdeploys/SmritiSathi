import React, { useState, useEffect } from 'react';
import { playGentleClick, playSuccessBell, playSoftMistakeSound } from '../../utils/audio';

interface SpatialGridGameProps {
  currentLevel?: number;
  maxLevel?: number;
  customLevelData?: any;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const SpatialGridGame: React.FC<SpatialGridGameProps> = ({
  currentLevel = 2,
  maxLevel = 10,
  customLevelData,
  onComplete,
  onClose,
}) => {
  const gridSize = customLevelData?.gridSize || (currentLevel <= 3 ? 3 : currentLevel <= 7 ? 4 : 5);
  const flashDurationMs = customLevelData?.flashDurationMs || Math.max(400, 900 - currentLevel * 50);

  // Tile sequence to memorize
  const sequenceLength = Math.min(8, 3 + Math.floor(currentLevel / 1.5));
  const defaultSequence = customLevelData?.sequence || [0, 4, 8, 2, 6].slice(0, sequenceLength);

  const [sequence] = useState<number[]>(defaultSequence);
  const [activeFlashTile, setActiveFlashTile] = useState<number | null>(null);
  const [isDemonstrating, setIsDemonstrating] = useState<boolean>(false);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const startDemonstration = () => {
    setIsDemonstrating(true);
    setUserSequence([]);
    setActiveFlashTile(null);

    let step = 0;
    const interval = setInterval(() => {
      if (step >= sequence.length) {
        clearInterval(interval);
        setActiveFlashTile(null);
        setIsDemonstrating(false);
        return;
      }

      setActiveFlashTile(sequence[step]);
      playGentleClick();

      setTimeout(() => {
        setActiveFlashTile(null);
      }, flashDurationMs * 0.7);

      step++;
    }, flashDurationMs);
  };

  useEffect(() => {
    startDemonstration();
  }, [currentLevel]);

  const handleTileClick = (tileIdx: number) => {
    if (isDemonstrating || isGameOver) return;
    playGentleClick();

    const newSeq = [...userSequence, tileIdx];
    setUserSequence(newSeq);

    const stepIdx = newSeq.length - 1;
    if (tileIdx !== sequence[stepIdx]) {
      playSoftMistakeSound();
      setAttempts((a) => a + 1);
      // Re-demonstrate after mistake
      setTimeout(() => {
        startDemonstration();
      }, 800);
      return;
    }

    if (newSeq.length === sequence.length) {
      setScore(100 + currentLevel * 25);
      playSuccessBell();
      setIsGameOver(true);
    }
  };

  const handleFinish = () => {
    const accuracy = attempts === 0 ? 100 : Math.max(50, 100 - attempts * 20);
    const finalPoints = Math.max(30, score);
    onComplete(score, finalPoints, accuracy, currentLevel);
  };

  const totalTiles = gridSize * gridSize;

  return (
    <div className="fixed inset-0 z-50 bg-[#001026]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f1d38] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-[#1e3a6a] text-[#002045] dark:text-slate-100">
        {/* Header */}
        <div className="bg-[#002045] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6321] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">crop_square</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[26px]">
                Spatial Grid Pattern Memory
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Level {currentLevel} of {maxLevel} • {gridSize}x{gridSize} Matrix Recall
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-between space-y-6">
          {!isGameOver && (
            <div className="w-full flex flex-col items-center space-y-6 my-auto">
              <div className="text-center bg-slate-100 dark:bg-[#111e38] p-4 rounded-2xl border border-slate-300 dark:border-[#1e3a6a] w-full max-w-md">
                <p className="text-xs uppercase font-black text-slate-600 dark:text-slate-400 tracking-wider mb-1">
                  {isDemonstrating ? '👀 Watch the Flashing Pattern' : '👇 Tap Tiles in Exact Sequence'}
                </p>
                <p className="font-black text-base text-[#002045] dark:text-slate-100">
                  {isDemonstrating
                    ? `Flashing ${sequence.length} tiles in order...`
                    : `Your turn: ${userSequence.length} of ${sequence.length} tapped`}
                </p>
              </div>

              {/* Grid Matrix */}
              <div
                className={`grid gap-3 p-4 rounded-3xl bg-slate-100 dark:bg-[#0a1128] border-2 border-slate-300 dark:border-[#1e3a6a] shadow-inner max-w-sm w-full`}
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: totalTiles }).map((_, tileIdx) => {
                  const isFlashing = activeFlashTile === tileIdx;
                  const isSelectedByUser = userSequence.includes(tileIdx);

                  return (
                    <button
                      key={tileIdx}
                      type="button"
                      onClick={() => handleTileClick(tileIdx)}
                      disabled={isDemonstrating}
                      className={`aspect-square rounded-2xl transition-all duration-200 border-2 cursor-pointer flex items-center justify-center font-black text-2xl ${
                        isFlashing
                          ? 'bg-[#002045] text-amber-300 border-4 border-amber-400 scale-105 shadow-xl'
                          : isSelectedByUser
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-white dark:bg-[#111e38] border-slate-300 dark:border-[#1e3a6a] hover:bg-sky-50 dark:hover:bg-blue-950/40 text-[#002045] dark:text-white'
                      }`}
                    >
                      {isFlashing ? '✨' : isSelectedByUser ? '✓' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Replay Pattern Button */}
              {!isDemonstrating && (
                <button
                  type="button"
                  onClick={startDemonstration}
                  className="px-5 py-2.5 rounded-2xl bg-[#002045] text-white font-extrabold text-xs flex items-center space-x-2 border border-[#002045] hover:bg-[#1a365d] cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  <span>Replay Flashing Pattern</span>
                </button>
              )}
            </div>
          )}

          {isGameOver && (
            <div className="text-center space-y-5 max-w-md my-auto animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined text-[44px]">military_tech</span>
              </div>

              <h3 className="font-extrabold text-[26px] text-[#002045] dark:text-white">Level {currentLevel} Mastered!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                Excellent visual spatial recall! Your parietal-hippocampal grid circuits are highly active.
              </p>

              <div className="bg-slate-50 dark:bg-[#111e38] p-4 rounded-2xl border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>Score:</span>
                  <span className="text-[#FF6321] font-black">{score} points</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Accuracy:</span>
                  <span className="text-emerald-600 font-black">
                    {attempts === 0 ? '100% (First Try!)' : `${Math.max(50, 100 - attempts * 20)}%`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-4 rounded-2xl bg-[#002045] hover:bg-[#1a365d] text-white font-extrabold text-[18px] shadow-lg cursor-pointer transition-all active:scale-95"
              >
                Claim Mind Points &amp; Complete Level
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
