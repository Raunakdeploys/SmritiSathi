import React, { useState, useEffect } from 'react';
import { playGentleClick, playSuccessBell, playSoftMistakeSound } from '../../utils/audio';

interface StroopGameProps {
  currentLevel?: number;
  maxLevel?: number;
  customLevelData?: any;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const StroopGame: React.FC<StroopGameProps> = ({
  currentLevel = 2,
  maxLevel = 10,
  customLevelData,
  onComplete,
  onClose,
}) => {
  const timePerItemSeconds = customLevelData?.timePerItemSeconds || Math.max(3, 9 - Math.floor(currentLevel / 2));

  const defaultItems = customLevelData?.items || [
    {
      id: 'st1',
      wordText: 'RED',
      textColorHex: '#38bdf8', // Bright Blue
      textColorName: 'Blue',
      isIncongruent: true,
      options: ['Red', 'Blue', 'Green', 'Yellow'],
      correctAnswer: 'Blue',
    },
    {
      id: 'st2',
      wordText: 'GREEN',
      textColorHex: '#ef4444', // Bright Red
      textColorName: 'Red',
      isIncongruent: true,
      options: ['Green', 'Red', 'Yellow', 'Purple'],
      correctAnswer: 'Red',
    },
    {
      id: 'st3',
      wordText: 'YELLOW',
      textColorHex: '#22c55e', // Bright Green
      textColorName: 'Green',
      isIncongruent: true,
      options: ['Yellow', 'Green', 'Red', 'Blue'],
      correctAnswer: 'Green',
    },
    {
      id: 'st4',
      wordText: 'BLUE',
      textColorHex: '#facc15', // Bright Yellow
      textColorName: 'Yellow',
      isIncongruent: true,
      options: ['Blue', 'Yellow', 'Green', 'Orange'],
      correctAnswer: 'Yellow',
    },
    {
      id: 'st5',
      wordText: 'PURPLE',
      textColorHex: '#f97316', // Bright Orange
      textColorName: 'Orange',
      isIncongruent: true,
      options: ['Purple', 'Orange', 'Blue', 'Red'],
      correctAnswer: 'Orange',
    },
  ];

  const [items] = useState(defaultItems);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(timePerItemSeconds);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hintActive, setHintActive] = useState<boolean>(false);

  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextItem(null); // Time out
          return timePerItemSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isGameOver]);

  const handleNextItem = (answer: string | null) => {
    setSelectedAnswer(answer);
    const currItem = items[currentIndex];

    if (answer && answer.toLowerCase() === currItem.correctAnswer.toLowerCase()) {
      setScore((s) => s + 50);
      setCorrectCount((c) => c + 1);
      playSuccessBell();
    } else if (answer) {
      playSoftMistakeSound();
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setHintActive(false);
      setTimeLeft(timePerItemSeconds);

      if (currentIndex + 1 >= items.length) {
        setIsGameOver(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 600);
  };

  const handleOptionClick = (option: string) => {
    playGentleClick();
    handleNextItem(option);
  };

  const handleFinish = () => {
    const accuracy = items.length > 0 ? Math.round((correctCount / items.length) * 100) : 100;
    const finalPoints = Math.max(30, Math.round(score + accuracy * 0.5));
    onComplete(score, finalPoints, accuracy, currentLevel);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#001026]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f1d38] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-[#1e3a6a] text-[#002045] dark:text-slate-100">
        {/* Header */}
        <div className="bg-[#002045] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6321] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">palette</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[26px]">
                Stroop Executive Inhibition
              </h2>
              <p className="text-xs text-blue-200">
                Level {currentLevel} of {maxLevel} • Resist Visual Color Conflict
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
          {!isGameOver && currentItem && (
            <div className="w-full flex flex-col items-center space-y-6 my-auto">
              {/* Question Progress & Timer */}
              <div className="w-full flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>
                  Question {currentIndex + 1} of {items.length}
                </span>
                <span className="flex items-center text-amber-600 dark:text-amber-400 font-extrabold">
                  <span className="material-symbols-outlined text-[18px] mr-1">timer</span>
                  {timeLeft}s
                </span>
                <span className="text-[#FF6321] font-black">Score: {score} pts</span>
              </div>

              {/* Instruction Prompt */}
              <div className="text-center bg-slate-100 dark:bg-[#111e38] p-4 rounded-2xl border border-slate-300 dark:border-[#1e3a6a] w-full max-w-md">
                <p className="text-xs uppercase font-black text-slate-600 dark:text-slate-400 tracking-wider mb-1">
                  Task Rule
                </p>
                <p className="font-extrabold text-base text-[#002045] dark:text-slate-100">
                  Select the <strong>FONT COLOR</strong> (ignore what the word says!)
                </p>
              </div>

              {/* Large Colored Word Display - ALWAYS ON DARK BACKDROP FOR HIGH CONTRAST */}
              <div className="p-8 sm:p-12 rounded-3xl bg-[#00142e] border-4 border-[#1a365d] w-full max-w-md flex flex-col items-center justify-center shadow-xl">
                <span
                  className="font-black text-5xl sm:text-6xl tracking-widest select-none transition-all drop-shadow-md"
                  style={{ color: currentItem.textColorHex }}
                >
                  {currentItem.wordText}
                </span>

                {hintActive && (
                  <p className="mt-4 text-xs font-extrabold text-emerald-400 animate-pulse">
                    💡 Hint: The ink is {currentItem.textColorName}!
                  </p>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-3.5 w-full max-w-md">
                {currentItem.options.map((opt) => {
                  const isSelected = selectedAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleOptionClick(opt)}
                      className={`py-4 rounded-2xl font-black text-[18px] border-2 transition-all cursor-pointer min-h-[60px] flex items-center justify-center shadow-sm ${
                        isSelected
                          ? opt.toLowerCase() === currentItem.correctAnswer.toLowerCase()
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                            : 'bg-rose-500 text-white border-rose-600 shadow-md'
                          : 'bg-white dark:bg-[#111e38] text-[#002045] dark:text-white border-slate-300 dark:border-[#1e3a6a] hover:border-[#002045] dark:hover:border-blue-400'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Errorless Learning Bridge Hint Button */}
              {!hintActive && (
                <button
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    setHintActive(true);
                  }}
                  className="text-xs font-extrabold text-blue-700 dark:text-blue-300 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  <span>Need a hint? (Errorless Learning)</span>
                </button>
              )}
            </div>
          )}

          {isGameOver && (
            <div className="text-center space-y-5 max-w-md my-auto animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined text-[44px]">military_tech</span>
              </div>

              <h3 className="font-extrabold text-[26px]">Level {currentLevel} Completed!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                Outstanding focus! You successfully restrained cognitive interference.
              </p>

              <div className="bg-slate-50 dark:bg-[#111e38] p-4 rounded-2xl border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>Score Earned:</span>
                  <span className="text-[#FF6321]">{score} points</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Accuracy Rate:</span>
                  <span className="text-emerald-600">
                    {Math.round((correctCount / items.length) * 100)}%
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
