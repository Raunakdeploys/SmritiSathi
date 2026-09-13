import React, { useState, useEffect, useRef } from 'react';
import { playSuccessChime, playGentleClick, speakText } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  Volume2,
  HelpCircle,
  Clock,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Target,
  Brain,
  Timer,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Info,
  Check,
  Zap,
  Shuffle,
  Plus,
  Minus,
  Sliders,
  Sun,
  Moon,
  VolumeX,
  Sparkle,
  BookmarkCheck,
} from 'lucide-react';
import {
  TimeSenseLevelKey,
  TimeSenseTaskConfig,
  generateRandomLevelConfig,
} from '../../utils/clockLevels';

interface ClockPlannerGameProps {
  currentLevel?: number;
  maxLevel?: number;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const ClockPlannerGame: React.FC<ClockPlannerGameProps> = ({
  currentLevel = 1,
  maxLevel = 10,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  // Current active level key
  const [activeLevelKey, setActiveLevelKey] = useState<TimeSenseLevelKey>(
    (currentLevel as TimeSenseLevelKey) || 1
  );

  // Dynamic Randomized Configuration
  const [currentConfig, setCurrentConfig] = useState<TimeSenseTaskConfig>(() =>
    generateRandomLevelConfig((currentLevel as TimeSenseLevelKey) || 1)
  );

  // Senior Accessibility: Extra Large Text Mode Toggle
  const [isLargeTextMode, setIsLargeTextMode] = useState<boolean>(false);

  // Round & Performance Metrics
  const [roundScore, setRoundScore] = useState(0);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // Time & Timer tracking
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [memorizeCountdown, setMemorizeCountdown] = useState<number | null>(null);
  const [isInspectionActive, setIsInspectionActive] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clock Hand States
  const [userHour, setUserHour] = useState(12);
  const [userMinute, setUserMinute] = useState(0);
  const [userPeriod, setUserPeriod] = useState<'AM' | 'PM'>('PM');

  // Clock Number Placements (For L4, L5)
  const [placedNumbers, setPlacedNumbers] = useState<Record<number, number | null>>({});
  const [availableNumbersPool, setAvailableNumbersPool] = useState<number[]>([]);
  const [selectedPoolNumber, setSelectedPoolNumber] = useState<number | null>(null);

  // Episodic / Schedule Question state (L9, L10)
  const [selectedScheduleAnswer, setSelectedScheduleAnswer] = useState<string | null>(null);

  // Bridge Level Generation Tracking
  const [bridgeLevelAvailable, setBridgeLevelAvailable] = useState<TimeSenseLevelKey | null>(null);

  // Dragging on clock dial state
  const clockRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingMinute, setIsDraggingMinute] = useState(false);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'correct' | 'wrong' | 'partial';
    message: string;
  }>({ type: 'idle', message: '' });

  // Initial / Randomized Level Setup
  const loadLevel = (lvlKey: TimeSenseLevelKey, forceNewRandom: boolean = true) => {
    const config = generateRandomLevelConfig(lvlKey);
    setActiveLevelKey(lvlKey);
    setCurrentConfig(config);
    setFeedback({ type: 'idle', message: '' });
    setSecondsElapsed(0);
    setTotalAttempts(0);
    setHintsUsedCount(0);
    setSelectedScheduleAnswer(null);

    // Initial randomized hands offset (different from target)
    const offsetH = ((config.targetHour + Math.floor(Math.random() * 5 + 3)) % 12) || 12;
    const offsetM = (config.targetMinute + 30) % 60;
    setUserHour(offsetH);
    setUserMinute(offsetM);
    setUserPeriod(config.targetPeriod);

    // Number placements setup (L4: 12,3,6,9 missing; L5: 1..12 missing)
    if (config.needsNumberPlacement) {
      const initialPlaced: Record<number, number | null> = {};
      const missingSet = new Set(config.missingNumbers);
      for (let n = 1; n <= 12; n++) {
        if (missingSet.has(n)) {
          initialPlaced[n] = null;
        } else {
          initialPlaced[n] = n;
        }
      }
      setPlacedNumbers(initialPlaced);
      const shuffledPool = [...config.missingNumbers].sort(() => Math.random() - 0.5);
      setAvailableNumbersPool(shuffledPool);
      setSelectedPoolNumber(shuffledPool[0] || null);
    } else {
      const allPresent: Record<number, number | null> = {};
      for (let n = 1; n <= 12; n++) {
        allPresent[n] = n;
      }
      setPlacedNumbers(allPresent);
      setAvailableNumbersPool([]);
      setSelectedPoolNumber(null);
    }

    // Inspection / Memorization Countdown setup
    if (config.hasPreInspectionCountdown && config.hasPreInspectionCountdown > 0) {
      setIsInspectionActive(true);
      setMemorizeCountdown(config.hasPreInspectionCountdown);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      if (voiceGuidanceEnabled) {
        speakText(
          `Study this clock closely. You have ${config.hasPreInspectionCountdown} seconds to memorize it.`,
          true
        );
      }

      let count = config.hasPreInspectionCountdown;
      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setMemorizeCountdown(count);
          playGentleClick();
        } else {
          setMemorizeCountdown(0);
          setIsInspectionActive(false);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          playSuccessChime();
          if (voiceGuidanceEnabled) {
            speakText('Time is up! Recreate the time on the clock face from memory.', true);
          }
        }
      }, 1000);
    } else {
      setIsInspectionActive(false);
      setMemorizeCountdown(null);
      if (voiceGuidanceEnabled) {
        if (config.spokenAudioText) {
          speakText(config.spokenAudioText, true);
        } else if (config.reasoningStory?.promptText) {
          speakText(config.reasoningStory.promptText, true);
        }
      }
    }
  };

  useEffect(() => {
    loadLevel(activeLevelKey, false);
  }, []);

  // Main game stopwatch timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Place number into clock face slot
  const handlePlaceNumberAtSlot = (slotPosition: number) => {
    if (!currentConfig.needsNumberPlacement || isInspectionActive) return;
    playGentleClick();

    if (selectedPoolNumber !== null) {
      const existingInSlot = placedNumbers[slotPosition];
      const newPlaced = { ...placedNumbers, [slotPosition]: selectedPoolNumber };
      setPlacedNumbers(newPlaced);

      const newPool = availableNumbersPool.filter((n) => n !== selectedPoolNumber);
      if (existingInSlot !== null) {
        newPool.push(existingInSlot);
      }
      setAvailableNumbersPool(newPool);
      setSelectedPoolNumber(newPool[0] || null);
    }
  };

  // Adjust minute by delta (e.g. +1, -1, +5, -5, +15, -15)
  const adjustMinute = (delta: number) => {
    if (isInspectionActive) return;
    playGentleClick();
    let newM = userMinute + delta;
    let newH = userHour;

    while (newM >= 60) {
      newM -= 60;
      newH = (newH % 12) + 1;
    }
    while (newM < 0) {
      newM += 60;
      newH = newH === 1 ? 12 : newH - 1;
    }

    setUserMinute(newM);
    setUserHour(newH);
  };

  // Direct minute slider change (0..59)
  const handleMinuteSliderChange = (newMin: number) => {
    if (isInspectionActive) return;
    const clamped = Math.max(0, Math.min(59, newMin));
    setUserMinute(clamped);
  };

  // Adjust hour by delta (+1 or -1)
  const adjustHour = (delta: number) => {
    if (isInspectionActive) return;
    playGentleClick();
    let newH = userHour + delta;
    if (newH > 12) newH = 1;
    if (newH < 1) newH = 12;
    setUserHour(newH);
  };

  // Click direct hour digit on clock
  const handleDirectHourClick = (num: number) => {
    if (isInspectionActive) return;
    playGentleClick();
    setUserHour(num);
  };

  // Interactive Touch & Mouse pointer event on clock face to set exact minute
  const updateMinuteFromPointer = (clientX: number, clientY: number) => {
    if (isInspectionActive || currentConfig.needsNumberPlacement) return;
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Center dead zone
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 26) return;

    const rad = Math.atan2(dy, dx);
    let deg = rad * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    // Map 360 degrees into 60 minutes
    const minute = Math.round((deg / 360) * 60) % 60;
    setUserMinute(minute);
    playGentleClick();
  };

  const handleClockMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isInspectionActive || currentConfig.needsNumberPlacement) return;
    setIsDraggingMinute(true);
    updateMinuteFromPointer(e.clientX, e.clientY);
  };

  const handleClockMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMinute) return;
    updateMinuteFromPointer(e.clientX, e.clientY);
  };

  const handleClockMouseUp = () => {
    setIsDraggingMinute(false);
  };

  const handleClockTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isInspectionActive || currentConfig.needsNumberPlacement) return;
    setIsDraggingMinute(true);
    if (e.touches[0]) {
      updateMinuteFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleClockTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingMinute) return;
    if (e.touches[0]) {
      updateMinuteFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleClockTouchEnd = () => {
    setIsDraggingMinute(false);
  };

  // Check current submission against target logic
  const handleCheckSubmission = () => {
    playGentleClick();
    setTotalAttempts((prev) => prev + 1);

    // 1. Check numbers placed (if level requires placement)
    let numbersCorrect = true;
    if (currentConfig.needsNumberPlacement) {
      for (let n = 1; n <= 12; n++) {
        if (placedNumbers[n] !== n) {
          numbersCorrect = false;
          break;
        }
      }
    }

    // 2. Check hands position
    const hourMatch = userHour === currentConfig.targetHour;
    const minuteMatch = userMinute === currentConfig.targetMinute;
    const handsCorrect = hourMatch && minuteMatch;

    // 3. Check schedule question (if present)
    let scheduleCorrect = true;
    if (currentConfig.scheduleQuestion) {
      scheduleCorrect = selectedScheduleAnswer === currentConfig.scheduleQuestion.correctAnswerId;
    }

    const isTotalSuccess = numbersCorrect && handsCorrect && scheduleCorrect;

    // Dementia-Targeted Scoring Formula:
    // Accuracy (60%) + Independence (25% - hints used penalty) + Time efficiency (15%)
    const accuracyScore = isTotalSuccess ? 60 : numbersCorrect || handsCorrect ? 30 : 10;
    const independenceScore = Math.max(0, 25 - hintsUsedCount * 8);
    const timeScore = Math.max(5, Math.min(15, Math.round(15 - secondsElapsed / 10)));
    const earnedRoundScore = accuracyScore + independenceScore + timeScore;

    if (isTotalSuccess) {
      playSuccessChime();
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      setRoundScore((prev) => prev + earnedRoundScore);
      setFeedback({
        type: 'correct',
        message: `Wonderful! You set the time and planning puzzle correctly! (+${earnedRoundScore} pts)`,
      });

      if (voiceGuidanceEnabled) {
        speakText(
          `Wonderful job! Correct solution. ${
            currentConfig.reasoningStory?.calculatedSolutionExplanation || ''
          }`,
          true
        );
      }

      // If completing a bridge level, return to Level 6
      if (activeLevelKey === '5.4' || activeLevelKey === '5.2') {
        setTimeout(() => {
          setBridgeLevelAvailable(null);
          loadLevel(6, true);
        }, 2200);
        return;
      }

      setTimeout(() => {
        if (typeof activeLevelKey === 'number' && activeLevelKey < 10) {
          const nextLvl = (activeLevelKey + 1) as TimeSenseLevelKey;
          loadLevel(nextLvl, true);
        } else {
          setIsFinished(true);
        }
      }, 2000);
    } else {
      let reason = '';
      if (currentConfig.needsNumberPlacement && !numbersCorrect) {
        reason = 'Please make sure all numbers around the clock dial are in order (1 at top-right to 12 at the very top).';
      } else if (!handsCorrect) {
        reason = `The target time is ${currentConfig.targetHour}:${currentConfig.targetMinute
          .toString()
          .padStart(2, '0')}. Point the short blue hand to ${currentConfig.targetHour}, and long red hand to ${
          currentConfig.targetMinute
        } minutes.`;
      } else if (currentConfig.scheduleQuestion && !scheduleCorrect) {
        reason = 'Please select the correct scheduled event from the options.';
      }

      setFeedback({
        type: 'wrong',
        message: `Let's check again: ${reason}`,
      });

      if (voiceGuidanceEnabled) {
        speakText(`Let's adjust carefully. ${reason}`, true);
      }

      // Bridge trigger on Level 6
      if (activeLevelKey === 6 && totalAttempts >= 1) {
        setBridgeLevelAvailable('5.4');
      }
    }
  };

  // Final Claim Rewards & Log Activity
  const handleClaim = () => {
    playSuccessChime();
    const finalAccuracy = Math.min(100, Math.max(60, Math.round(roundScore / 8)));
    const totalPoints = Math.round(roundScore * 1.2) + 50;
    const highestLevel = typeof activeLevelKey === 'number' ? activeLevelKey : 5;
    onComplete(roundScore, totalPoints, finalAccuracy, highestLevel);
  };

  // Angles for clock hands
  const minuteAngle = userMinute * 6;
  const hourAngle = (userHour % 12) * 30 + (userMinute / 60) * 30;

  // Display angle for inspection/preview mode
  const inspectionMinuteAngle = currentConfig.inspectionTarget
    ? currentConfig.inspectionTarget.minute * 6
    : 0;
  const inspectionHourAngle = currentConfig.inspectionTarget
    ? (currentConfig.inspectionTarget.hour % 12) * 30 +
      (currentConfig.inspectionTarget.minute / 60) * 30
    : 0;

  // Quick minute presets
  const minutePresets = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div
      id="timesense-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#001026]/85 p-2 sm:p-4 backdrop-blur-md overflow-y-auto"
      onMouseUp={handleClockMouseUp}
    >
      <div className="bg-[#f8fafd] text-[#002045] w-full max-w-5xl rounded-3xl shadow-2xl border-3 border-[#002b5c]/30 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        {/* Eye-Catching Header Banner with High Contrast & Senior Comfort Toggles */}
        <div className="bg-gradient-to-r from-[#00193d] via-[#00285a] to-[#00193d] text-white px-4 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg border-b-3 border-[#f59e0b]">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#002045] rounded-2xl flex items-center justify-center shadow-md border-2 border-[#f59e0b] flex-shrink-0">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-[#002045]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  TimeSense
                </h2>
                <span className="bg-[#f59e0b] text-[#00193d] text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                  {currentConfig.pillar}
                </span>
                <span className="bg-[#dbeafe] text-[#00285a] text-[11px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[#bfdbfe] whitespace-nowrap">
                  {currentConfig.levelDisplay}
                </span>
              </div>
              <p className="text-xs text-[#bfdbfe] font-medium mt-0.5">
                Everyday Clock & Routine Cognition Practice
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Senior Comfort: Text Size Toggle */}
            <button
              id="timesense-text-size-btn"
              onClick={() => {
                playGentleClick();
                setIsLargeTextMode(!isLargeTextMode);
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm border-2 transition-all flex items-center space-x-1.5 shadow-sm ${
                isLargeTextMode
                  ? 'bg-[#f59e0b] text-[#00193d] border-[#f59e0b]'
                  : 'bg-[#00285a] text-[#bfdbfe] border-[#3b82f6]/40 hover:text-white'
              }`}
              title="Toggle Extra Large Font for easier reading"
            >
              <span className="text-base font-black">A+</span>
              <span className="hidden md:inline">{isLargeTextMode ? 'Large' : 'Normal'}</span>
            </button>

            {/* Read Audio Prompt Button */}
            <button
              id="header-read-audio-btn"
              onClick={() => {
                playGentleClick();
                if (currentConfig.spokenAudioText) {
                  speakText(currentConfig.spokenAudioText, true);
                } else if (currentConfig.reasoningStory?.promptText) {
                  speakText(currentConfig.reasoningStory.promptText, true);
                }
              }}
              className="p-2.5 bg-[#fef3c7] hover:bg-[#fde68a] text-[#002045] rounded-xl font-bold shadow-md transition-all flex items-center space-x-1 border border-[#f59e0b]"
              title="Read instruction aloud"
            >
              <Volume2 className="w-5 h-5 text-[#002045]" />
              <span className="hidden sm:inline text-xs font-black">Read Aloud</span>
            </button>

            <button
              id="close-timesense-btn"
              onClick={() => {
                playGentleClick();
                onClose();
              }}
              className="p-2.5 text-[#bfdbfe] hover:text-white hover:bg-[#00285a] rounded-xl transition-all text-xl font-black"
              title="Close game"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Level Progression Tabs & Scoring Breakdown */}
        {!isFinished && (
          <div className="bg-[#e9f0fc] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b-2 border-[#cbdcf8] gap-2">
            {/* Level Quick Selectors 1 to 10 */}
            <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full py-0.5 scrollbar-thin">
              <span className="text-xs font-black text-[#002045] uppercase tracking-wide mr-1 hidden sm:inline">
                Levels:
              </span>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as TimeSenseLevelKey[]).map((lvl) => {
                const isCurrent = activeLevelKey === lvl;
                return (
                  <button
                    key={lvl}
                    id={`timesense-lvl-btn-${lvl}`}
                    onClick={() => {
                      playGentleClick();
                      loadLevel(lvl, true);
                    }}
                    className={`min-w-[36px] h-8 px-2.5 text-xs sm:text-sm font-black rounded-xl transition-all whitespace-nowrap border ${
                      isCurrent
                        ? 'bg-[#002045] text-[#fef3c7] border-[#f59e0b] shadow-md scale-105'
                        : 'bg-white text-[#002045] border-[#cbdcf8] hover:bg-[#dbeafe]'
                    }`}
                  >
                    L{lvl}
                  </button>
                );
              })}
            </div>

            {/* Metric Pillar Stats & Re-Roll Button */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-[#002045]">
              <button
                id="timesense-reroll-btn"
                onClick={() => {
                  playGentleClick();
                  loadLevel(activeLevelKey, true);
                }}
                className="flex items-center space-x-1.5 bg-[#fef3c7] hover:bg-[#fde68a] text-[#002045] px-3 py-1.5 rounded-xl border-2 border-[#f59e0b] transition-all shadow-xs"
                title="Generate a new randomized puzzle for this level"
              >
                <Shuffle className="w-4 h-4 text-[#002045]" />
                <span className="font-black">Shuffle</span>
              </button>

              <div className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-xl border border-[#cbdcf8] shadow-xs">
                <Timer className="w-4 h-4 text-[#2563eb]" />
                <span className="font-bold">{secondsElapsed}s</span>
              </div>
              <div className="bg-[#002045] text-[#fef3c7] font-black px-3.5 py-1.5 rounded-xl shadow-xs border border-[#f59e0b]">
                Score: {roundScore}
              </div>
            </div>
          </div>
        )}

        {/* Personalized Bridge Level Alert Banner */}
        {bridgeLevelAvailable && !isFinished && (
          <div className="bg-amber-50 border-b-2 border-amber-400 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <span className="bg-amber-500 text-white px-2 py-1 rounded-lg font-black text-xs shadow-xs">
                ⭐ GENTLE BRIDGE
              </span>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Personalized Bridge Challenge 5.4 Ready! Extra 10-second memorization window + cardinal anchors for easy recall.
              </p>
            </div>
            <button
              onClick={() => {
                playGentleClick();
                loadLevel('5.4', true);
              }}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all flex items-center space-x-1"
            >
              <span>Play Bridge 5.4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col">
          {isFinished ? (
            /* Completion Screen */
            <div className="text-center py-6 flex flex-col items-center space-y-6 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#002045] rounded-full flex items-center justify-center shadow-xl border-4 border-[#f59e0b] animate-bounce">
                <Trophy className="w-12 h-12 text-[#002045]" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#002045]">
                  Time & Planning Mastery Achieved!
                </h3>
                <p className="text-[#3b5998] text-base mt-2 leading-relaxed">
                  Outstanding effort! You successfully trained clock reading, temporal reasoning, auditory comprehension, and everyday routine planning.
                </p>
              </div>

              {/* Multi-Component Score Card */}
              <div className="w-full bg-white p-6 rounded-3xl border-3 border-[#cbdcf8] shadow-md space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#e9f0fc]">
                  <span className="text-sm font-bold text-[#556987]">
                    Temporal Cognition Score
                  </span>
                  <span className="text-2xl font-black text-[#002045]">{roundScore} pts</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-[#eef5fc] rounded-2xl border border-[#cbdcf8]">
                    <p className="text-xs text-[#556987] font-bold">Accuracy (60%)</p>
                    <p className="text-lg font-black text-emerald-700">Excellent</p>
                  </div>
                  <div className="p-3 bg-[#eef5fc] rounded-2xl border border-[#cbdcf8]">
                    <p className="text-xs text-[#556987] font-bold">Independence (25%)</p>
                    <p className="text-lg font-black text-[#002045]">
                      {hintsUsedCount === 0 ? 'High' : 'Assisted'}
                    </p>
                  </div>
                  <div className="p-3 bg-[#eef5fc] rounded-2xl border border-[#cbdcf8]">
                    <p className="text-xs text-[#556987] font-bold">Time (15%)</p>
                    <p className="text-lg font-black text-[#002045]">{secondsElapsed}s</p>
                  </div>
                </div>
              </div>

              <button
                id="claim-timesense-reward-btn"
                onClick={handleClaim}
                className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white py-4 rounded-2xl font-black text-lg shadow-xl transition-all border-2 border-emerald-400 transform active:scale-98"
              >
                ✓ Log Activity & Collect MindPoints
              </button>
            </div>
          ) : (
            /* Active Game Interaction */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Challenge Prompt & Reasoning Narrative */}
              <div className="lg:col-span-5 space-y-4">
                {/* Challenge Prompt Box */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border-3 border-[#002045] shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2563eb] bg-[#dbeafe] px-3 py-1 rounded-full">
                      {currentConfig.levelDisplay} • {currentConfig.pillar}
                    </span>
                    <button
                      onClick={() => {
                        if (currentConfig.spokenAudioText) {
                          speakText(currentConfig.spokenAudioText, true);
                        } else {
                          speakText(currentConfig.reasoningStory?.promptText || '', true);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#fef3c7] hover:bg-[#fde68a] text-[#002045] rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-xs border border-[#f59e0b] transition-transform active:scale-95"
                      title="Read instruction aloud"
                    >
                      <Volume2 className="w-4 h-4 text-[#002045]" />
                      <span>Hear Prompt</span>
                    </button>
                  </div>

                  {/* Auditory-only Mode (L7) or Story Reasoning Mode */}
                  {currentConfig.hasAudioOnlyPrompt ? (
                    <div className="p-5 bg-gradient-to-br from-[#00142e] to-[#00244d] text-white rounded-2xl space-y-3 border-2 border-[#f59e0b] shadow-inner">
                      <div className="flex items-center space-x-2 text-[#facc15]">
                        <Volume2 className="w-6 h-6 animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-wider">
                          Auditory Spoken Prompt
                        </span>
                      </div>
                      <p className={`text-[#dbeafe] leading-relaxed ${isLargeTextMode ? 'text-lg' : 'text-base'}`}>
                        “Listen to the spoken voice prompt carefully and set the hands on the clock face.”
                      </p>
                      <button
                        onClick={() => {
                          if (currentConfig.spokenAudioText) {
                            speakText(currentConfig.spokenAudioText, true);
                          }
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-[#fef3c7] to-[#fde68a] text-[#002045] rounded-xl text-sm font-black hover:from-white hover:to-[#fef3c7] transition-all shadow-md flex items-center justify-center space-x-2 border-2 border-[#f59e0b]"
                      >
                        <Volume2 className="w-5 h-5 text-[#002045]" />
                        <span>🔊 Tap to Play Voice Prompt</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3
                        className={`font-black text-[#002045] leading-snug ${
                          isLargeTextMode ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                        }`}
                      >
                        {currentConfig.reasoningStory?.promptText}
                      </h3>
                      <p
                        className={`text-[#475569] leading-relaxed font-medium ${
                          isLargeTextMode ? 'text-base sm:text-lg' : 'text-sm'
                        }`}
                      >
                        {currentConfig.reasoningStory?.subtext}
                      </p>
                    </div>
                  )}

                  {/* Pre-game Bridge Hint */}
                  {currentConfig.preGameHint && (
                    <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs sm:text-sm font-bold text-amber-950 flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <span>{currentConfig.preGameHint}</span>
                    </div>
                  )}

                  {/* Episodic Daily Schedule Events List (L9, L10) */}
                  {currentConfig.scheduleEvents && (
                    <div className="space-y-2.5 pt-2 border-t-2 border-[#e9f0fc]">
                      <span className="text-xs sm:text-sm font-black text-[#002045] uppercase tracking-wide flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-[#2563eb]" />
                        <span>Daily Routine Timeline:</span>
                      </span>
                      <div className="space-y-2">
                        {currentConfig.scheduleEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="p-3 bg-[#f8fafd] rounded-2xl border-2 border-[#cbdcf8] flex items-center justify-between text-xs sm:text-sm"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="material-symbols-outlined text-[24px] text-[#002045]">
                                {evt.icon}
                              </span>
                              <span className="font-extrabold text-[#002045]">{evt.title}</span>
                            </div>
                            <span className="font-black text-[#1e3a8a] bg-[#dbeafe] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                              {evt.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule Multi-Choice Question (L9, L10) */}
                  {currentConfig.scheduleQuestion && (
                    <div className="p-4 bg-[#eef5fc] rounded-2xl border-2 border-[#cbdcf8] space-y-3">
                      <p className={`font-black text-[#002045] ${isLargeTextMode ? 'text-base' : 'text-sm'}`}>
                        {currentConfig.scheduleQuestion.questionText}
                      </p>
                      <div className="space-y-2">
                        {currentConfig.scheduleQuestion.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              playGentleClick();
                              setSelectedScheduleAnswer(opt.id);
                            }}
                            className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 ${
                              selectedScheduleAnswer === opt.id
                                ? 'bg-[#002045] text-white border-[#f59e0b] shadow-md scale-[1.01]'
                                : 'bg-white text-[#002045] border-[#cbdcf8] hover:bg-[#dbeafe]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Number Placement Palette (For Level 4 and Level 5) */}
                {currentConfig.needsNumberPlacement && !isInspectionActive && (
                  <div className="bg-white p-5 rounded-3xl border-3 border-[#002045] shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002045]">
                        🧩 Missing Clock Digits ({availableNumbersPool.length} Left)
                      </span>
                      <span className="text-xs text-[#556987] font-bold">
                        Tap digit, then tap slot on clock
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 justify-center">
                      {availableNumbersPool.map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            playGentleClick();
                            setSelectedPoolNumber(num);
                          }}
                          className={`w-11 h-11 rounded-2xl font-black text-base transition-all border-3 ${
                            selectedPoolNumber === num
                              ? 'bg-[#002045] text-[#fef3c7] border-[#f59e0b] shadow-lg scale-115'
                              : 'bg-[#eef5fc] text-[#002045] border-[#cbdcf8] hover:bg-[#dbeafe]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Notification Box */}
                {feedback.type === 'wrong' && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-900 p-4 rounded-2xl text-xs sm:text-sm font-bold leading-relaxed shadow-sm">
                    ⚠️ {feedback.message}
                  </div>
                )}
                {feedback.type === 'correct' && (
                  <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2.5 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <span>{feedback.message}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Eye-Catching Interactive Clock & Precision Nav */}
              <div className="lg:col-span-7 flex flex-col items-center space-y-4">
                {/* 5s / 10s Memorization Countdown Overlay Mode */}
                {isInspectionActive ? (
                  <div className="w-full bg-gradient-to-br from-[#00142e] via-[#002045] to-[#00142e] text-white p-6 sm:p-8 rounded-3xl border-4 border-[#f59e0b] shadow-2xl flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95">
                    <div className="flex items-center space-x-2 bg-[#f59e0b] text-[#00193d] px-5 py-1.5 rounded-full font-black text-sm uppercase tracking-wider shadow-md">
                      <Timer className="w-5 h-5 animate-spin" />
                      <span>Memorize Time • Vanishing in {memorizeCountdown}s</span>
                    </div>

                    <div className="text-4xl sm:text-5xl font-black text-[#fef3c7] tracking-widest font-mono drop-shadow-md">
                      {currentConfig.inspectionTarget?.text}
                    </div>

                    {/* Preview Clock Face */}
                    <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-[#ffffff] rounded-full border-8 border-[#002045] shadow-2xl flex items-center justify-center overflow-hidden">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                        const angle = (num * 30 - 90) * (Math.PI / 180);
                        const radiusPercent = 38;
                        const leftPercent = 50 + radiusPercent * Math.cos(angle);
                        const topPercent = 50 + radiusPercent * Math.sin(angle);
                        return (
                          <span
                            key={num}
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className="absolute text-sm sm:text-base font-black text-[#002045] pointer-events-none select-none"
                          >
                            {num}
                          </span>
                        );
                      })}
                      <svg className="w-full h-full pointer-events-none" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="7" fill="#002045" />
                        <line
                          x1="100"
                          y1="100"
                          x2="100"
                          y2="55"
                          stroke="#002045"
                          strokeWidth="7"
                          strokeLinecap="round"
                          transform={`rotate(${inspectionHourAngle} 100 100)`}
                        />
                        <line
                          x1="100"
                          y1="100"
                          x2="100"
                          y2="28"
                          stroke="#e11d48"
                          strokeWidth="4"
                          strokeLinecap="round"
                          transform={`rotate(${inspectionMinuteAngle} 100 100)`}
                        />
                      </svg>
                    </div>

                    <p className="text-sm text-[#bfdbfe] font-bold">
                      Keep this picture in your mind! Recreate it once the timer ends.
                    </p>
                  </div>
                ) : (
                  /* Interactive Clock Face Stage with Visual Legend, 60-Minute Ticks & Touch Drag */
                  <div className="flex flex-col items-center space-y-3 w-full">
                    {/* Visual Hand Distinction Legend (Crucial for Elderly Ease) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-black bg-white px-4 py-2 rounded-2xl border-2 border-[#cbdcf8] shadow-xs text-center">
                      <div className="flex items-center space-x-1.5 text-[#002045]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#002045] border-2 border-[#f59e0b] inline-block shadow-xs"></span>
                        <span>Short Blue = Hour</span>
                      </div>
                      <span className="text-[#cbdcf8] hidden sm:inline">•</span>
                      <div className="flex items-center space-x-1.5 text-[#e11d48]">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#e11d48] border-2 border-white inline-block shadow-xs"></span>
                        <span>Long Red = Minute</span>
                      </div>
                    </div>

                    {/* Clock Stage with Deep Bezel & Golden Dial Rim */}
                    <div
                      ref={clockRef}
                      onMouseDown={handleClockMouseDown}
                      onMouseMove={handleClockMouseMove}
                      onTouchStart={handleClockTouchStart}
                      onTouchMove={handleClockTouchMove}
                      onTouchEnd={handleClockTouchEnd}
                      className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-gradient-to-b from-[#ffffff] to-[#f4f7fc] rounded-full border-[8px] sm:border-[10px] border-[#001d40] shadow-2xl flex items-center justify-center select-none cursor-pointer touch-none ring-4 ring-[#f59e0b]/40"
                      title="Click, tap, or drag anywhere around the dial to set exact minutes"
                    >
                      {/* Inner Gold Accent Bezel */}
                      <div className="absolute inset-1.5 rounded-full border-2 border-[#d97706]/30 pointer-events-none"></div>

                      {/* SVG Minute Ticks (all 60 minutes) */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 200 200"
                      >
                        {Array.from({ length: 60 }).map((_, i) => {
                          const isMajor = i % 5 === 0;
                          const isQuarter = i % 15 === 0;
                          const tickAngle = i * 6;
                          return (
                            <line
                              key={i}
                              x1="100"
                              y1={isQuarter ? '7' : isMajor ? '9' : '11'}
                              x2="100"
                              y2={isQuarter ? '18' : isMajor ? '16' : '13'}
                              stroke={isQuarter ? '#002045' : isMajor ? '#1e3a8a' : '#94a3b8'}
                              strokeWidth={isQuarter ? '3' : isMajor ? '2' : '1'}
                              transform={`rotate(${tickAngle} 100 100)`}
                            />
                          );
                        })}
                      </svg>

                      {/* Clock Numbers (either fixed or interactive slots for L4/L5) */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((slotNum) => {
                        const angle = (slotNum * 30 - 90) * (Math.PI / 180);
                        const radiusPercent = 38;
                        const leftPercent = 50 + radiusPercent * Math.cos(angle);
                        const topPercent = 50 + radiusPercent * Math.sin(angle);
                        const placedValue = placedNumbers[slotNum];
                        const isMissingSlot =
                          currentConfig.needsNumberPlacement && placedValue === null;

                        if (currentConfig.needsNumberPlacement) {
                          return (
                            <button
                              key={slotNum}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceNumberAtSlot(slotNum);
                              }}
                              style={{
                                left: `${leftPercent}%`,
                                top: `${topPercent}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                              className={`absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-black flex items-center justify-center transition-all z-10 ${
                                isMissingSlot
                                  ? 'bg-amber-100 border-2 border-dashed border-amber-600 text-amber-900 animate-pulse scale-110 shadow-sm'
                                  : 'bg-[#002045] text-[#fef3c7] shadow-md border-2 border-[#f59e0b]'
                              }`}
                              title={`Position ${slotNum}`}
                            >
                              {placedValue !== null ? placedValue : '?'}
                            </button>
                          );
                        }

                        // Standard mode: Clickable number to direct-set hour with high contrast styling
                        const isCurrentHour = userHour === slotNum;
                        return (
                          <button
                            key={slotNum}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectHourClick(slotNum);
                            }}
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className={`absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm md:text-base font-black flex items-center justify-center transition-all z-10 ${
                              isCurrentHour
                                ? 'bg-[#002045] text-[#fef3c7] border-2 border-[#f59e0b] shadow-md scale-115 ring-2 ring-[#f59e0b]/50'
                                : 'text-[#002045] hover:bg-[#dbeafe] hover:scale-105'
                            }`}
                          >
                            {slotNum}
                          </button>
                        );
                      })}

                      {/* SVG Clock Hands with Arrowheads & Center Pivot */}
                      <svg className="w-full h-full pointer-events-none" viewBox="0 0 200 200">
                        {/* Hour Hand (Thicker, Deep Blue with Arrow Tip) */}
                        <g transform={`rotate(${hourAngle} 100 100)`} className="transition-transform duration-200 ease-out">
                          <line
                            x1="100"
                            y1="100"
                            x2="100"
                            y2="54"
                            stroke="#002045"
                            strokeWidth="7"
                            strokeLinecap="round"
                          />
                          {/* Hour Arrowhead */}
                          <polygon points="100,46 95,57 105,57" fill="#002045" />
                        </g>

                        {/* Minute Hand (Longer, Bright Ruby Crimson with Sharp Tip) */}
                        <g transform={`rotate(${minuteAngle} 100 100)`} className="transition-transform duration-150 ease-out">
                          <line
                            x1="100"
                            y1="100"
                            x2="100"
                            y2="28"
                            stroke="#e11d48"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          {/* Minute Arrowhead */}
                          <polygon points="100,20 96,30 104,30" fill="#e11d48" />
                        </g>

                        {/* Center Rivet Brass Pivot */}
                        <circle cx="100" cy="100" r="8" fill="#002045" stroke="#f59e0b" strokeWidth="2" />
                        <circle cx="100" cy="100" r="3.5" fill="#fef3c7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Oversized High-Contrast Digital Readout & Minute Navigation */}
                <div className="w-full max-w-lg bg-white p-4 sm:p-5 rounded-3xl border-3 border-[#cbdcf8] shadow-md space-y-4">
                  {/* Oversized Digital Clock Card */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-gradient-to-r from-[#00193d] to-[#00285a] p-3 sm:p-4 rounded-2xl border-2 border-[#f59e0b] shadow-inner text-white">
                    {/* Hour Control Stepper */}
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#bfdbfe]">
                        Hour
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => adjustHour(-1)}
                          disabled={isInspectionActive}
                          className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-base flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95 shadow-xs"
                          title="Previous Hour"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-2 font-mono font-black text-2xl sm:text-3xl text-[#fef3c7] tracking-wider drop-shadow-xs min-w-[40px] text-center">
                          {String(userHour).padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => adjustHour(1)}
                          disabled={isInspectionActive}
                          className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-base flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95 shadow-xs"
                          title="Next Hour"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#f59e0b] animate-pulse select-none hidden sm:inline">
                      :
                    </span>

                    {/* Minute Control Stepper */}
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#fda4af]">
                        Minute
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => adjustMinute(-1)}
                          disabled={isInspectionActive}
                          className="w-9 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-base flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95 shadow-xs"
                          title="Decrease 1 Minute (-1m)"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-2 font-mono font-black text-2xl sm:text-3xl text-[#fda4af] tracking-wider drop-shadow-xs min-w-[40px] text-center">
                          {String(userMinute).padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => adjustMinute(1)}
                          disabled={isInspectionActive}
                          className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95 shadow-xs"
                          title="Increase 1 Minute (+1m)"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AM / PM Badge Toggle */}
                    <button
                      onClick={() => {
                        if (isInspectionActive) return;
                        playGentleClick();
                        setUserPeriod((prev) => (prev === 'AM' ? 'PM' : 'AM'));
                      }}
                      className="bg-[#f59e0b] hover:bg-[#d97706] text-[#00193d] px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-xs uppercase tracking-wider transition-transform active:scale-95"
                      title="Click to toggle AM / PM"
                    >
                      {userPeriod}
                    </button>
                  </div>

                  {/* High-Visibility Minute Adjustment Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#002045]">
                      <span>Adjust Minutes:</span>
                      <span className="text-[#2563eb]">Quick jumps & fine-tuning</span>
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => adjustMinute(-15)}
                        disabled={isInspectionActive}
                        className="py-2.5 bg-[#eef5fc] hover:bg-[#dbeafe] text-[#002045] text-xs sm:text-sm font-black rounded-xl border-2 border-[#cbdcf8] disabled:opacity-40 transition-colors shadow-xs"
                      >
                        -15m
                      </button>
                      <button
                        onClick={() => adjustMinute(-5)}
                        disabled={isInspectionActive}
                        className="py-2.5 bg-[#eef5fc] hover:bg-[#dbeafe] text-[#002045] text-xs sm:text-sm font-black rounded-xl border-2 border-[#cbdcf8] disabled:opacity-40 transition-colors shadow-xs"
                      >
                        -5m
                      </button>
                      <button
                        onClick={() => adjustMinute(5)}
                        disabled={isInspectionActive}
                        className="py-2.5 bg-[#eef5fc] hover:bg-[#dbeafe] text-[#002045] text-xs sm:text-sm font-black rounded-xl border-2 border-[#cbdcf8] disabled:opacity-40 transition-colors shadow-xs"
                      >
                        +5m
                      </button>
                      <button
                        onClick={() => adjustMinute(15)}
                        disabled={isInspectionActive}
                        className="py-2.5 bg-[#eef5fc] hover:bg-[#dbeafe] text-[#002045] text-xs sm:text-sm font-black rounded-xl border-2 border-[#cbdcf8] disabled:opacity-40 transition-colors shadow-xs"
                      >
                        +15m
                      </button>
                    </div>

                    {/* Prominent Single Minute Steppers */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => adjustMinute(-1)}
                        disabled={isInspectionActive}
                        className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs sm:text-sm font-black rounded-xl border-2 border-rose-300 disabled:opacity-40 transition-all shadow-xs flex items-center justify-center space-x-1.5"
                        title="Step back 1 minute"
                      >
                        <Minus className="w-4 h-4 text-rose-700" />
                        <span>-1 Minute</span>
                      </button>

                      <button
                        onClick={() => adjustMinute(1)}
                        disabled={isInspectionActive}
                        className="py-2.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs sm:text-sm font-black rounded-xl border-2 border-emerald-300 disabled:opacity-40 transition-all shadow-xs flex items-center justify-center space-x-1.5"
                        title="Step forward 1 minute"
                      >
                        <Plus className="w-4 h-4 text-emerald-700" />
                        <span>+1 Minute</span>
                      </button>
                    </div>
                  </div>

                  {/* Smooth Minute Slider (0..59) */}
                  <div className="space-y-1.5 pt-2 border-t-2 border-[#e9f0fc]">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                      <span className="text-[#556987] flex items-center space-x-1.5">
                        <Sliders className="w-4 h-4 text-[#002045]" />
                        <span>Continuous Minute Slider:</span>
                      </span>
                      <span className="font-mono font-black text-[#e11d48] bg-rose-100 px-2.5 py-0.5 rounded-lg text-xs sm:text-sm border border-rose-300">
                        {userMinute} min
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="59"
                      step="1"
                      value={userMinute}
                      onChange={(e) => handleMinuteSliderChange(Number(e.target.value))}
                      disabled={isInspectionActive}
                      className="w-full h-3.5 bg-[#dbeafe] rounded-xl appearance-none cursor-pointer accent-[#002045]"
                    />

                    <div className="flex justify-between text-[11px] text-[#64748b] font-mono font-black px-1">
                      <span>:00</span>
                      <span>:15</span>
                      <span>:30</span>
                      <span>:45</span>
                      <span>:59</span>
                    </div>
                  </div>

                  {/* Quick Minute Preset Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-[#556987]">
                      Common Minute Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {minutePresets.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            if (isInspectionActive) return;
                            playGentleClick();
                            setUserMinute(m);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all border-2 ${
                            userMinute === m
                              ? 'bg-[#002045] text-[#fef3c7] border-[#f59e0b] shadow-xs'
                              : 'bg-[#f8fafd] text-[#002045] border-[#cbdcf8] hover:bg-[#dbeafe]'
                          }`}
                        >
                          :{String(m).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prominent Eye-Catching Check Button */}
                  <button
                    id="submit-timesense-btn"
                    onClick={handleCheckSubmission}
                    disabled={isInspectionActive}
                    className="w-full bg-gradient-to-r from-[#059669] via-[#047857] to-[#059669] hover:from-[#047857] hover:to-[#065f46] text-white py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl flex items-center justify-center space-x-2.5 transition-all transform active:scale-98 disabled:opacity-50 border-2 border-emerald-400 cursor-pointer"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#fef3c7]" />
                    <span>✓ Check My Time Solution</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cognitive Information & ADL Science Modal Overlay */}
        {showHintModal && (
          <div className="bg-[#00142e] text-white p-5 border-t-3 border-[#f59e0b] text-xs sm:text-sm space-y-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#f59e0b] uppercase tracking-wider flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Senior Cognitive Design & ADL Science</span>
              </span>
              <button
                onClick={() => setShowHintModal(false)}
                className="text-[#bfdbfe] hover:text-white font-bold"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-[#dbeafe] leading-relaxed">
              <strong>TimeSense</strong> is designed with high visual contrast, clear hand color differentiation (short blue for hours, long red for minutes), touch-friendly steppers, and adaptive bridge challenges.
            </p>
            <p className="text-[#dbeafe]">
              <strong>Dementia-Targeted Scoring:</strong> Prioritizes accuracy (60%) and independence (25%) over speed (15%) to foster self-paced engagement and executive daily routine autonomy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
