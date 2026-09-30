import React, { useState, useEffect, useRef } from 'react';
import { playGentleClick, playSuccessBell, playSoftMistakeSound } from '../../utils/audio';

interface DualNBackGameProps {
  currentLevel?: number;
  maxLevel?: number;
  customLevelData?: any;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const DualNBackGame: React.FC<DualNBackGameProps> = ({
  currentLevel = 2,
  maxLevel = 10,
  customLevelData,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  // Determine N-back value based on level (Level 1-2: N=1, Level 3-5: N=2, Level 6-8: N=3, Level 9-10: N=4)
  const nValue = customLevelData?.nValue || (currentLevel <= 2 ? 1 : currentLevel <= 5 ? 2 : currentLevel <= 8 ? 3 : 4);
  const speedMs = customLevelData?.speedMs || Math.max(1600, 3200 - currentLevel * 150);

  // Stimulus sequence
  const defaultSequence = customLevelData?.stimuliSequence || [
    { id: '1', gridPosition: 0, letter: 'A', isPositionMatch: false, isLetterMatch: false },
    { id: '2', gridPosition: 4, letter: 'C', isPositionMatch: false, isLetterMatch: false },
    { id: '3', gridPosition: 0, letter: 'C', isPositionMatch: nValue === 1, isLetterMatch: true },
    { id: '4', gridPosition: 4, letter: 'K', isPositionMatch: false, isLetterMatch: false },
    { id: '5', gridPosition: 0, letter: 'K', isPositionMatch: false, isLetterMatch: true },
    { id: '6', gridPosition: 4, letter: 'M', isPositionMatch: true, isLetterMatch: false },
    { id: '7', gridPosition: 8, letter: 'M', isPositionMatch: false, isLetterMatch: true },
    { id: '8', gridPosition: 8, letter: 'P', isPositionMatch: true, isLetterMatch: false },
  ];

  const [sequence] = useState(defaultSequence);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [userPosPressed, setUserPosPressed] = useState<boolean>(false);
  const [userLetterPressed, setUserLetterPressed] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech synthesis for letter sound
  const speakLetter = (text: string) => {
    if (!voiceGuidanceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // ignore speech errors
    }
  };

  const startNextStimulus = () => {
    setCurrentIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx >= sequence.length) {
        setIsPlaying(false);
        setIsGameOver(true);
        return prev;
      }
      setUserPosPressed(false);
      setUserLetterPressed(false);
      const currStim = sequence[nextIdx];
      speakLetter(`Letter ${currStim.letter}`);
      return nextIdx;
    });
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      timerRef.current = setTimeout(() => {
        startNextStimulus();
      }, speedMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, isGameOver]);

  const handleStart = () => {
    playGentleClick();
    setIsPlaying(true);
    setIsGameOver(false);
    setCurrentIndex(0);
    setScore(0);
    setCorrectHits(0);
    setTotalAttempts(0);
    setUserPosPressed(false);
    setUserLetterPressed(false);
    speakLetter(`Letter ${sequence[0].letter}`);
  };

  const handleMatchPosition = () => {
    if (!isPlaying || currentIndex < nValue || userPosPressed) return;
    playGentleClick();
    setUserPosPressed(true);

    const curr = sequence[currentIndex];
    const prev = sequence[currentIndex - nValue];
    const isMatch = curr.gridPosition === prev.gridPosition;

    setTotalAttempts((t) => t + 1);
    if (isMatch) {
      setScore((s) => s + 50);
      setCorrectHits((c) => c + 1);
      setFeedbackText('✓ Correct Position Match!');
      playSuccessBell();
    } else {
      setFeedbackText('✗ Not a position match');
      playSoftMistakeSound();
    }
  };

  const handleMatchLetter = () => {
    if (!isPlaying || currentIndex < nValue || userLetterPressed) return;
    playGentleClick();
    setUserLetterPressed(true);

    const curr = sequence[currentIndex];
    const prev = sequence[currentIndex - nValue];
    const isMatch = curr.letter.toUpperCase() === prev.letter.toUpperCase();

    setTotalAttempts((t) => t + 1);
    if (isMatch) {
      setScore((s) => s + 50);
      setCorrectHits((c) => c + 1);
      setFeedbackText('✓ Correct Letter Match!');
      playSuccessBell();
    } else {
      setFeedbackText('✗ Not a letter match');
      playSoftMistakeSound();
    }
  };

  const handleFinishGame = () => {
    const accuracy = totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 100;
    const finalPoints = Math.max(30, Math.round(score + accuracy * 0.5));
    onComplete(score, finalPoints, accuracy, currentLevel);
  };

  const currentStimulus = currentIndex >= 0 && currentIndex < sequence.length ? sequence[currentIndex] : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#001026]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f1d38] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-[#1e3a6a] text-[#002045] dark:text-slate-100">
        {/* Header */}
        <div className="bg-[#002045] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6321] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">grid_view</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[26px]">
                Dual {nValue}-Back Working Memory
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Level {currentLevel} of {maxLevel} • N = {nValue} Step Recall
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

        {/* Game Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col items-center justify-between space-y-6">
          {!isPlaying && !isGameOver && (
            <div className="text-center space-y-4 max-w-lg my-auto">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-[#002045] dark:text-blue-200 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto shadow-md">
                <span className="material-symbols-outlined text-[48px]">psychology</span>
              </div>

              <h3 className="font-extrabold text-[24px] text-[#002045] dark:text-white">How Dual {nValue}-Back Works</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-semibold">
                You will see a tile light up on a 3x3 grid while hearing a spoken letter.
                Press <strong>"Position Match"</strong> if the grid location matches the position from <strong>{nValue} step{nValue > 1 ? 's' : ''} ago</strong>.
                Press <strong>"Letter Match"</strong> if the letter matches <strong>{nValue} step{nValue > 1 ? 's' : ''} ago</strong>!
              </p>

              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 p-4 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-bold">
                💡 <strong>Clinical Benefit:</strong> Dual N-Back stimulates the prefrontal cortex and strengthens working memory capacity in early Alzheimer's and MCI.
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="w-full py-4 rounded-2xl bg-[#002045] hover:bg-[#1a365d] text-white font-extrabold text-[20px] shadow-lg cursor-pointer transition-all active:scale-95"
              >
                Start Dual {nValue}-Back Exercise
              </button>
            </div>
          )}

          {isPlaying && (
            <div className="w-full flex flex-col items-center space-y-6 my-auto">
              {/* Progress Indicator */}
              <div className="w-full max-w-md flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>
                  Stimulus {currentIndex + 1} / {sequence.length}
                </span>
                <span className="text-[#FF6321] font-black">Score: {score} pts</span>
              </div>

              {/* 3x3 Spatial Grid */}
              <div className="grid grid-cols-3 gap-3 w-64 h-64 bg-slate-100 dark:bg-[#111e38] p-3 rounded-2xl border-2 border-slate-300 dark:border-[#1e3a6a] shadow-inner">
                {Array.from({ length: 9 }).map((_, idx) => {
                  const isActive = currentStimulus?.gridPosition === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl transition-all duration-200 flex items-center justify-center font-black text-3xl ${
                        isActive
                          ? 'bg-[#002045] text-amber-300 border-4 border-amber-400 shadow-xl scale-105'
                          : 'bg-white dark:bg-[#1a2d52] border border-slate-300 dark:border-[#2a457a]'
                      }`}
                    >
                      {isActive ? currentStimulus.letter : ''}
                    </div>
                  );
                })}
              </div>

              {/* Spoken Letter Display */}
              <div className="text-center bg-slate-50 dark:bg-[#111e38] px-6 py-3 rounded-2xl border border-slate-200 dark:border-[#1e3a6a]">
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-400">
                  Current Spoken Letter
                </span>
                <p className="font-black text-3xl text-[#002045] dark:text-amber-300">
                  {currentStimulus ? `"${currentStimulus.letter}"` : '—'}
                </p>
              </div>

              {/* Match Action Buttons */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button
                  type="button"
                  onClick={handleMatchPosition}
                  disabled={currentIndex < nValue || userPosPressed}
                  className={`py-4 rounded-2xl font-black text-base flex items-center justify-center space-x-2 border-2 transition-all cursor-pointer ${
                    userPosPressed
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                      : 'bg-white dark:bg-[#111e38] text-[#002045] dark:text-white border-[#002045] dark:border-blue-400 hover:bg-sky-50 dark:hover:bg-blue-950/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">location_on</span>
                  <span>Position Match ({nValue}-Back)</span>
                </button>

                <button
                  type="button"
                  onClick={handleMatchLetter}
                  disabled={currentIndex < nValue || userLetterPressed}
                  className={`py-4 rounded-2xl font-black text-base flex items-center justify-center space-x-2 border-2 transition-all cursor-pointer ${
                    userLetterPressed
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                      : 'bg-white dark:bg-[#111e38] text-[#002045] dark:text-white border-[#002045] dark:border-blue-400 hover:bg-sky-50 dark:hover:bg-blue-950/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">record_voice_over</span>
                  <span>Letter Match ({nValue}-Back)</span>
                </button>
              </div>

              {/* Live Feedback Banner */}
              {feedbackText && (
                <div className="text-sm font-black text-[#FF6321] dark:text-amber-400 animate-pulse">
                  {feedbackText}
                </div>
              )}
            </div>
          )}

          {isGameOver && (
            <div className="text-center space-y-5 max-w-md my-auto animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined text-[44px]">military_tech</span>
              </div>

              <h3 className="font-extrabold text-[26px] text-[#002045] dark:text-white">Level {currentLevel} Completed!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                Superb effort! You successfully exercised your dual working memory buffer.
              </p>

              <div className="bg-slate-50 dark:bg-[#111e38] p-4 rounded-2xl border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>Score:</span>
                  <span className="text-[#FF6321] font-black">{score} points</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Matches Identified:</span>
                  <span className="text-emerald-600 font-black">{correctHits} / {totalAttempts}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishGame}
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
