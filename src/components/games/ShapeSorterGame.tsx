import React, { useState, useEffect, useRef } from 'react';
import { playSuccessChime, playGentleClick, speakText } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Trophy, Volume2, HelpCircle, Layers, Grid, Play, CheckCircle2, AlertCircle, Eye, EyeOff, Timer, Lock } from 'lucide-react';

interface ShapeSorterGameProps {
  currentLevel?: number;
  maxLevel?: number;
  onComplete: (score: number, pointsEarned: number, accuracy: number, levelPlayed: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

interface ShapeItem {
  id: string;
  name: string;
  icon: string;
  colorName: string;
  colorClass: string;
  bgColor: string;
  borderColor: string;
}

const ALL_SHAPES: ShapeItem[] = [
  { id: 'circle-gold', name: 'Golden Sun Circle', icon: 'circle', colorName: 'Gold', colorClass: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-400' },
  { id: 'heart-red', name: 'Crimson Heart', icon: 'favorite', colorName: 'Ruby Red', colorClass: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-400' },
  { id: 'triangle-green', name: 'Emerald Triangle', icon: 'change_history', colorName: 'Emerald Green', colorClass: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-400' },
  { id: 'star-yellow', name: 'Luminous Star', icon: 'star', colorName: 'Bright Yellow', colorClass: 'text-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400' },
  { id: 'diamond-blue', name: 'Azure Diamond', icon: 'diamond', colorName: 'Royal Blue', colorClass: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-400' },
  { id: 'square-navy', name: 'Sapphire Square', icon: 'square', colorName: 'Navy Blue', colorClass: 'text-[#002045]', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-400' },
  { id: 'hexagon-purple', name: 'Amethyst Hexagon', icon: 'hexagon', colorName: 'Purple', colorClass: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-400' },
  { id: 'sun-orange', name: 'Marigold Sunburst', icon: 'wb_sunny', colorName: 'Warm Orange', colorClass: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-400' },
];

export const ShapeSorterGame: React.FC<ShapeSorterGameProps> = ({
  currentLevel = 1,
  maxLevel = 3,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  // Game Sub-modes:
  // 1. 'sequence' (Simon-says working memory sequence)
  // 2. 'matrix' (Odd-one-out / Dual attribute matrix puzzle)
  // 3. 'bins' (Multi-tray shape & color sorter)
  const [subMode, setSubMode] = useState<'sequence' | 'matrix' | 'bins'>('sequence');
  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel);
  const [score, setScore] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // --- SUB-MODE 1: SEQUENCE MEMORY STATES ---
  const [sequenceTarget, setSequenceTarget] = useState<ShapeItem[]>([]);
  const [userSequence, setUserSequence] = useState<ShapeItem[]>([]);
  const [isDisplayingSequence, setIsDisplayingSequence] = useState(false);
  const [isPatternVisible, setIsPatternVisible] = useState(true);
  const [memorizeSecondsLeft, setMemorizeSecondsLeft] = useState(3);
  const [sequenceFeedback, setSequenceFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- SUB-MODE 2: MATRIX / ODD-ONE-OUT STATES ---
  const [matrixOptions, setMatrixOptions] = useState<{ item: ShapeItem; isOdd: boolean; reason: string }[]>([]);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [matrixFeedback, setMatrixFeedback] = useState<boolean | null>(null);
  const [matrixRule, setMatrixRule] = useState<string>('');

  // --- SUB-MODE 3: BINS SORTER STATES ---
  const [activeItemToSort, setActiveItemToSort] = useState<ShapeItem | null>(null);
  const [binTargets, setBinTargets] = useState<{ id: string; name: string; colorClass: string; icon: string; matchedCount: number }[]>([]);
  const [remainingItems, setRemainingItems] = useState<ShapeItem[]>([]);
  const [binsSuccess, setBinsSuccess] = useState(false);

  const totalRounds = 4;

  // Start 3-second pattern display countdown then hide
  const startMemorizeCountdown = (seq: ShapeItem[]) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setIsPatternVisible(true);
    setIsDisplayingSequence(true);
    setMemorizeSecondsLeft(3);
    setUserSequence([]);
    setSequenceFeedback('idle');
    playGentleClick();

    if (voiceGuidanceEnabled) {
      speakText('Memorize the pattern! You have 3 seconds.', true);
    }

    let timeLeft = 3;
    countdownTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        setMemorizeSecondsLeft(timeLeft);
        playGentleClick();
      } else {
        setMemorizeSecondsLeft(0);
        setIsPatternVisible(false);
        setIsDisplayingSequence(false);
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        playSuccessChime();
        if (voiceGuidanceEnabled) {
          speakText('Time is up! Recreate the pattern from memory in exact order.', true);
        }
      }
    }, 1000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Initialize round based on mode and level
  const initRound = (mode = subMode, level = selectedLevel, rIdx = roundIndex) => {
    setShowHint(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (mode === 'sequence') {
      // Sequence length: Level 1 -> 3 items, Level 2 -> 4 items, Level 3 -> 5 items
      const pool = ALL_SHAPES.slice(0, level === 1 ? 4 : level === 2 ? 6 : 8);
      const seqLen = level === 1 ? 3 : level === 2 ? 4 : 5;
      const newSeq: ShapeItem[] = [];
      for (let i = 0; i < seqLen; i++) {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        newSeq.push(rand);
      }
      setSequenceTarget(newSeq);
      startMemorizeCountdown(newSeq);
    } else if (mode === 'matrix') {
      setSelectedMatrixId(null);
      setMatrixFeedback(null);
      // Generate Odd-One-Out Puzzle
      // Level 1: 4 shapes, 3 are same color, 1 is different color
      // Level 2: 4 shapes, 3 are same shape family, 1 is different
      // Level 3: 6 shapes with dual-attribute rule
      if (level === 1) {
        setMatrixRule('Spot the shape that has a DIFFERENT color from all the others:');
        const mainColor = ALL_SHAPES[0];
        const oddColor = ALL_SHAPES[1];
        const opts = [
          { item: { ...ALL_SHAPES[0], id: 'm1' }, isOdd: false, reason: 'Shares the golden warm theme' },
          { item: { ...ALL_SHAPES[2], id: 'm2', colorClass: mainColor.colorClass, colorName: mainColor.colorName }, isOdd: false, reason: 'Shares the golden warm theme' },
          { item: { ...ALL_SHAPES[3], id: 'm3', colorClass: mainColor.colorClass, colorName: mainColor.colorName }, isOdd: false, reason: 'Shares the golden warm theme' },
          { item: { ...oddColor, id: 'm4' }, isOdd: true, reason: 'Has a distinctive ruby red color unlike all the golden shapes' },
        ].sort(() => (Math.sin(rIdx * 7.5) > 0 ? 1 : -1));
        setMatrixOptions(opts);
      } else if (level === 2) {
        setMatrixRule('Spot the geometric shape that has CURVED borders, while all others have STRAIGHT edges:');
        const opts = [
          { item: { ...ALL_SHAPES[5], id: 'm1' }, isOdd: false, reason: 'Has 4 straight edges' },
          { item: { ...ALL_SHAPES[2], id: 'm2' }, isOdd: false, reason: 'Has 3 straight edges' },
          { item: { ...ALL_SHAPES[4], id: 'm3' }, isOdd: false, reason: 'Has 4 straight edges' },
          { item: { ...ALL_SHAPES[0], id: 'm4' }, isOdd: true, reason: 'A smooth continuous curve with zero sharp corners' },
        ].sort(() => (Math.sin((rIdx + 2) * 5.3) > 0 ? 1 : -1));
        setMatrixOptions(opts);
      } else {
        setMatrixRule('Identify the odd shape: Spot the single shape with 6 points/vertices:');
        const opts = [
          { item: { ...ALL_SHAPES[0], id: 'm1' }, isOdd: false, reason: 'Continuous circle (0 vertices)' },
          { item: { ...ALL_SHAPES[2], id: 'm2' }, isOdd: false, reason: 'Triangle (3 vertices)' },
          { item: { ...ALL_SHAPES[5], id: 'm3' }, isOdd: false, reason: 'Square (4 vertices)' },
          { item: { ...ALL_SHAPES[3], id: 'm4' }, isOdd: false, reason: 'Star (5 outer points)' },
          { item: { ...ALL_SHAPES[4], id: 'm5' }, isOdd: false, reason: 'Diamond (4 vertices)' },
          { item: { ...ALL_SHAPES[6], id: 'm6' }, isOdd: true, reason: 'Hexagon cell (6 equal vertices & sides)' },
        ].sort(() => (Math.sin((rIdx + 3) * 9.1) > 0 ? 1 : -1));
        setMatrixOptions(opts);
      }
    } else if (mode === 'bins') {
      setBinsSuccess(false);
      const bins = [
        { id: 'b-gold', name: 'Gold / Warm Tray', colorClass: 'text-amber-500 border-amber-400 bg-amber-50', icon: 'wb_sunny', matchedCount: 0 },
        { id: 'b-blue', name: 'Royal Blue Tray', colorClass: 'text-blue-600 border-blue-400 bg-blue-50', icon: 'diamond', matchedCount: 0 },
        { id: 'b-emerald', name: 'Emerald Green Tray', colorClass: 'text-emerald-600 border-emerald-400 bg-emerald-50', icon: 'change_history', matchedCount: 0 },
      ];
      const items: ShapeItem[] = [
        ALL_SHAPES[0], // Gold circle
        ALL_SHAPES[4], // Blue diamond
        ALL_SHAPES[2], // Green triangle
        ALL_SHAPES[3], // Yellow star (gold)
        ALL_SHAPES[5], // Navy square (blue)
        ALL_SHAPES[7], // Sun (gold)
      ].sort(() => Math.random() - 0.5);

      setBinTargets(bins);
      setRemainingItems(items);
      setActiveItemToSort(items[0]);
    }
  };

  useEffect(() => {
    initRound(subMode, selectedLevel, 0);
  }, [subMode, selectedLevel]);

  // Handle Sequence user tap
  const handleSequenceTap = (shape: ShapeItem) => {
    if (isDisplayingSequence || isPatternVisible || sequenceFeedback !== 'idle') return;
    playGentleClick();
    const nextUserSeq = [...userSequence, shape];
    setUserSequence(nextUserSeq);

    const stepIndex = nextUserSeq.length - 1;
    // Check current step
    if (shape.name !== sequenceTarget[stepIndex]?.name) {
      // Wrong step!
      setSequenceFeedback('wrong');
      if (voiceGuidanceEnabled) {
        speakText('Oops! Not quite. Watch the pattern again for 3 seconds!', true);
      }
      setTimeout(() => {
        setUserSequence([]);
        setSequenceFeedback('idle');
        startMemorizeCountdown(sequenceTarget);
      }, 1400);
      return;
    }

    // If completed full sequence correctly
    if (nextUserSeq.length === sequenceTarget.length) {
      playSuccessChime();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setSequenceFeedback('correct');
      const pts = 30 + selectedLevel * 15;
      setScore((prev) => prev + pts);
      setCorrectCount((prev) => prev + 1);

      if (voiceGuidanceEnabled) {
        speakText('Splendid memory! You matched the full sequence flawlessly.', true);
      }

      setTimeout(() => {
        if (roundIndex + 1 < totalRounds) {
          setRoundIndex((prev) => prev + 1);
          initRound(subMode, selectedLevel, roundIndex + 1);
        } else {
          setIsFinished(true);
        }
      }, 1600);
    }
  };

  // Handle Matrix choice
  const handleMatrixSelect = (option: { item: ShapeItem; isOdd: boolean; reason: string }) => {
    if (selectedMatrixId !== null) return;
    playGentleClick();
    setSelectedMatrixId(option.item.id);
    setMatrixFeedback(option.isOdd);

    if (option.isOdd) {
      playSuccessChime();
      confetti({ particleCount: 40, spread: 50 });
      const pts = 25 + selectedLevel * 15;
      setScore((prev) => prev + pts);
      setCorrectCount((prev) => prev + 1);
      if (voiceGuidanceEnabled) {
        speakText(`Correct! ${option.reason}.`, true);
      }
    } else {
      if (voiceGuidanceEnabled) {
        speakText('Good observation, but look closer at the attributes.', true);
      }
    }

    setTimeout(() => {
      if (roundIndex + 1 < totalRounds) {
        setRoundIndex((prev) => prev + 1);
        initRound(subMode, selectedLevel, roundIndex + 1);
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  // Handle Bins Sorting
  const handleBinSort = (binId: string) => {
    if (!activeItemToSort) return;
    playGentleClick();

    // Check matching logic
    const isGoldBin = binId === 'b-gold' && (activeItemToSort.colorName === 'Gold' || activeItemToSort.colorName === 'Bright Yellow' || activeItemToSort.colorName === 'Warm Orange');
    const isBlueBin = binId === 'b-blue' && (activeItemToSort.colorName === 'Royal Blue' || activeItemToSort.colorName === 'Navy Blue');
    const isGreenBin = binId === 'b-emerald' && activeItemToSort.colorName === 'Emerald Green';

    if (isGoldBin || isBlueBin || isGreenBin) {
      playSuccessChime();
      const updatedBins = binTargets.map((b) => (b.id === binId ? { ...b, matchedCount: b.matchedCount + 1 } : b));
      setBinTargets(updatedBins);

      const nextRemaining = remainingItems.slice(1);
      setRemainingItems(nextRemaining);

      if (nextRemaining.length > 0) {
        setActiveItemToSort(nextRemaining[0]);
      } else {
        setActiveItemToSort(null);
        setBinsSuccess(true);
        confetti({ particleCount: 70, spread: 70 });
        setScore((prev) => prev + 60);
        setCorrectCount((prev) => prev + 1);

        setTimeout(() => {
          if (roundIndex + 1 < totalRounds) {
            setRoundIndex((prev) => prev + 1);
            initRound(subMode, selectedLevel, roundIndex + 1);
          } else {
            setIsFinished(true);
          }
        }, 1800);
      }
    } else {
      if (voiceGuidanceEnabled) {
        speakText('Try the tray with the matching color tone.', true);
      }
    }
  };

  const handleClaim = () => {
    playSuccessChime();
    const accuracy = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 100;
    const pointsEarned = Math.round(score * 0.8) + (accuracy >= 70 ? 35 : 15);
    onComplete(score, pointsEarned, accuracy, selectedLevel);
  };

  return (
    <div id="shape-sorter-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#f8f9fc] text-[#002045] w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-[#1a365d]/20 overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* Top Header Bar */}
        <div className="bg-[#002045] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#d7e2ff] text-[#002045] rounded-xl flex items-center justify-center shadow-inner">
              <Layers className="w-6 h-6 text-[#002045]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">Shape & Geometry Studio</h2>
                <span className="bg-[#facc15] text-[#002045] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Interactive Cognitive Puzzles
                </span>
              </div>
              <p className="text-xs text-[#a0c4ff]">Pattern sequence, spatial reasoning & tactile sorting</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="close-shape-game-btn"
              onClick={() => {
                playGentleClick();
                onClose();
              }}
              className="p-2 text-[#a0c4ff] hover:text-white hover:bg-[#1a365d] rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sub-Mode Selector */}
        {!isFinished && (
          <div className="bg-[#e2eafc] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-[#c8d8f8] gap-2">
            <div className="flex items-center space-x-1.5 bg-[#002045] p-1 rounded-xl shadow-xs">
              <button
                id="mode-sequence-btn"
                onClick={() => {
                  playGentleClick();
                  setSubMode('sequence');
                  setRoundIndex(0);
                  initRound('sequence', selectedLevel, 0);
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  subMode === 'sequence' ? 'bg-[#d7e2ff] text-[#002045] shadow-xs' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                🔁 Sequence Recall
              </button>
              <button
                id="mode-matrix-btn"
                onClick={() => {
                  playGentleClick();
                  setSubMode('matrix');
                  setRoundIndex(0);
                  initRound('matrix', selectedLevel, 0);
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  subMode === 'matrix' ? 'bg-[#d7e2ff] text-[#002045] shadow-xs' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                🧩 Odd-One-Out
              </button>
              <button
                id="mode-bins-btn"
                onClick={() => {
                  playGentleClick();
                  setSubMode('bins');
                  setRoundIndex(0);
                  initRound('bins', selectedLevel, 0);
                }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  subMode === 'bins' ? 'bg-[#d7e2ff] text-[#002045] shadow-xs' : 'text-[#a0c4ff] hover:text-white'
                }`}
              >
                📥 Tray Sorter
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-black text-[#002045] uppercase">Level {selectedLevel}:</span>
              <div className="flex space-x-1">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      playGentleClick();
                      setSelectedLevel(lvl);
                      setRoundIndex(0);
                      initRound(subMode, lvl, 0);
                    }}
                    className={`px-2.5 py-0.5 text-xs font-black rounded-md border ${
                      selectedLevel === lvl ? 'bg-[#002045] text-white border-[#002045]' : 'bg-white text-[#002045] border-[#c8d8f8]'
                    }`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
              <span className="bg-[#d7e2ff] text-[#002045] font-black text-xs px-2.5 py-1 rounded-md border border-[#a0c4ff]">
                Score: {score}
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          {isFinished ? (
            <div className="text-center py-6 flex flex-col items-center space-y-5">
              <div className="w-20 h-20 bg-[#d7e2ff] text-[#002045] rounded-full flex items-center justify-center shadow-lg border-4 border-[#002045]">
                <Trophy className="w-10 h-10 text-[#002045]" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#002045]">Shape Mastery Completed!</h3>
                <p className="text-[#3b5998] text-base mt-1">Excellent visual discrimination and sequential memory.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm bg-[#eef3fc] p-4 rounded-xl border border-[#c8d8f8]">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987]">Total Score</p>
                  <p className="text-2xl font-black text-[#002045]">{score}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-[#556987]">Puzzles Solved</p>
                  <p className="text-2xl font-black text-[#002045]">{correctCount} / {totalRounds}</p>
                </div>
              </div>

              <button
                id="claim-shape-reward-btn"
                onClick={handleClaim}
                className="bg-[#002045] hover:bg-[#1a365d] text-white px-8 py-3.5 rounded-xl font-black text-base shadow-lg transition-all"
              >
                Collect Rewards & Finish
              </button>
            </div>
          ) : (
            <>
              {/* MODE 1: SEQUENCE RECALL */}
              {subMode === 'sequence' && (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-2xl border-2 border-[#002045] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#3b5998]">
                        Round {roundIndex + 1} of {totalRounds} • Visual Working Memory
                      </span>
                      <h3 className="text-xl font-black text-[#002045]">
                        {isPatternVisible
                          ? `👀 Memorize the Pattern! (${memorizeSecondsLeft}s remaining)`
                          : '🧠 Recreate from Memory!'}
                      </h3>
                      <p className="text-xs text-[#556987] mt-0.5">
                        {isPatternVisible
                          ? 'Look closely at the shapes in order before they disappear.'
                          : `Tap the shapes below in the exact order (${userSequence.length} of ${sequenceTarget.length} placed).`}
                      </p>
                    </div>

                    <button
                      id="peek-pattern-btn"
                      onClick={() => startMemorizeCountdown(sequenceTarget)}
                      disabled={isPatternVisible}
                      className="px-4 py-2.5 bg-[#eef3fc] hover:bg-[#d0e0fc] disabled:opacity-40 text-[#002045] rounded-xl text-xs font-bold flex items-center space-x-2 border border-[#c8d8f8] shadow-xs transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isPatternVisible ? `Disappearing in ${memorizeSecondsLeft}s...` : 'Peek Pattern (3s)'}</span>
                    </button>
                  </div>

                  {/* Sequence Display Screen */}
                  <div className="bg-[#00142e] p-6 rounded-2xl border-4 border-[#1a365d] flex flex-col items-center justify-center min-h-[180px] shadow-inner relative overflow-hidden">
                    
                    {/* Status Badge */}
                    {isPatternVisible ? (
                      <div className="flex items-center space-x-2 bg-[#facc15] text-[#002045] px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider animate-pulse mb-4 shadow-md">
                        <Timer className="w-4 h-4" />
                        <span>Memorizing Phase • Disappearing in {memorizeSecondsLeft}s</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 bg-[#d7e2ff] text-[#002045] px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider mb-4 border border-[#a0c4ff] shadow-sm">
                        <Lock className="w-4 h-4" />
                        <span>Memory Slots • {userSequence.length} of {sequenceTarget.length} Recalled</span>
                      </div>
                    )}

                    {/* Shape Slots Grid */}
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap justify-center gap-y-3">
                      {sequenceTarget.map((item, idx) => {
                        const isPlaced = userSequence.length > idx;
                        const isCurrentSlot = !isPatternVisible && userSequence.length === idx;

                        if (isPatternVisible) {
                          // SHOWN DURING 3 SECONDS MEMORIZATION
                          return (
                            <div
                              key={idx}
                              className="flex flex-col items-center space-y-1.5 animate-in zoom-in-95 duration-200"
                            >
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white flex flex-col items-center justify-center border-3 border-[#facc15] shadow-[0_0_20px_rgba(250,204,21,0.5)] transform scale-105">
                                <span className={`material-symbols-outlined text-[34px] sm:text-[40px] ${item.colorClass}`}>
                                  {item.icon}
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-[#facc15] bg-[#002045] px-2 py-0.5 rounded-full border border-[#facc15]/40">
                                #{idx + 1}
                              </span>
                            </div>
                          );
                        }

                        // HIDDEN / RECALL MODE
                        if (isPlaced) {
                          const placedItem = userSequence[idx];
                          return (
                            <div key={idx} className="flex flex-col items-center space-y-1.5 animate-in zoom-in-90 duration-150">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-3 border-emerald-500 shadow-md flex flex-col items-center justify-center relative">
                                <span className={`material-symbols-outlined text-[34px] sm:text-[40px] ${placedItem.colorClass}`}>
                                  {placedItem.icon}
                                </span>
                                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <span className="text-[10px] font-black text-emerald-400 bg-[#002045] px-2 py-0.5 rounded-full border border-emerald-500/40">
                                #{idx + 1} Solved
                              </span>
                            </div>
                          );
                        }

                        if (isCurrentSlot) {
                          return (
                            <div key={idx} className="flex flex-col items-center space-y-1.5">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#002045] border-3 border-[#facc15] ring-4 ring-[#facc15]/30 flex flex-col items-center justify-center animate-pulse">
                                <span className="text-2xl font-black text-[#facc15]">?</span>
                              </div>
                              <span className="text-[10px] font-black text-[#facc15] bg-[#002045] px-2 py-0.5 rounded-full border border-[#facc15]">
                                Next #{idx + 1}
                              </span>
                            </div>
                          );
                        }

                        // Future Locked Slot
                        return (
                          <div key={idx} className="flex flex-col items-center space-y-1.5 opacity-50">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#001f3f]/50 border-2 border-white/20 flex flex-col items-center justify-center">
                              <Lock className="w-5 h-5 text-white/40" />
                            </div>
                            <span className="text-[10px] font-bold text-white/40">
                              #{idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {sequenceFeedback === 'wrong' && (
                    <div className="bg-rose-100 border border-rose-300 text-rose-800 p-3 rounded-xl text-center font-bold text-sm">
                      ⚠️ Not quite the right shape in sequence. Showing pattern again for 3 seconds...
                    </div>
                  )}
                  {sequenceFeedback === 'correct' && (
                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-center font-bold text-sm flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Brilliant memory! Perfect sequence recall!</span>
                    </div>
                  )}

                  {/* Interactive Tap Buttons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#556987]">
                      <span>{isPatternVisible ? '⏳ Memorize first... Buttons will unlock when pattern hides.' : 'Tap shape to fill next slot:'}</span>
                      <span>Level {selectedLevel} Options</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {ALL_SHAPES.slice(0, selectedLevel === 1 ? 4 : selectedLevel === 2 ? 6 : 8).map((shape) => (
                        <button
                          key={shape.id}
                          id={`shape-tap-${shape.id}`}
                          onClick={() => handleSequenceTap(shape)}
                          disabled={isDisplayingSequence || isPatternVisible || sequenceFeedback !== 'idle'}
                          className={`p-3.5 sm:p-4 rounded-xl border-2 ${shape.borderColor} ${shape.bgColor} hover:brightness-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center space-y-1.5 shadow-sm`}
                        >
                          <span className={`material-symbols-outlined text-[38px] sm:text-[42px] ${shape.colorClass}`}>
                            {shape.icon}
                          </span>
                          <span className="text-xs font-black text-[#002045] text-center">{shape.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: ODD-ONE-OUT MATRIX */}
              {subMode === 'matrix' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border-2 border-[#002045] shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#3b5998]">Round {roundIndex + 1} of {totalRounds} • Spatial Analysis</span>
                      <h3 className="text-xl font-black text-[#002045]">{matrixRule}</h3>
                    </div>
                    <button
                      onClick={() => speakText(matrixRule, true)}
                      className="p-2.5 bg-[#eef3fc] hover:bg-[#d0e0fc] text-[#002045] rounded-xl border border-[#c8d8f8]"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {matrixOptions.map((opt) => {
                      const isSelected = selectedMatrixId === opt.item.id;
                      let cardStyle = 'bg-white border-[#c8d8f8] hover:border-[#002045]';
                      if (isSelected) {
                        cardStyle = opt.isOdd
                          ? 'bg-emerald-50 border-emerald-500 shadow-md ring-4 ring-emerald-200'
                          : 'bg-rose-50 border-rose-500 ring-4 ring-rose-200';
                      }

                      return (
                        <button
                          key={opt.item.id}
                          onClick={() => handleMatrixSelect(opt)}
                          disabled={selectedMatrixId !== null}
                          className={`p-6 rounded-2xl border-3 shadow-sm transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${cardStyle}`}
                        >
                          <span className={`material-symbols-outlined text-[54px] ${opt.item.colorClass}`}>
                            {opt.item.icon}
                          </span>
                          <span className="text-sm font-black text-[#002045] text-center">{opt.item.name}</span>

                          {isSelected && (
                            <p className="text-xs font-bold text-center mt-1 text-[#3b5998]">{opt.reason}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 3: TRAY SORTER */}
              {subMode === 'bins' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border-2 border-[#002045] shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#3b5998]">Tactile Sorting Tray</span>
                      <h3 className="text-xl font-black text-[#002045]">Sort the active piece into its matching color tray below!</h3>
                    </div>
                  </div>

                  {/* Active piece */}
                  <div className="bg-[#002045] p-6 rounded-2xl text-center text-white flex flex-col items-center justify-center space-y-2 border-2 border-[#1a365d]">
                    <span className="text-xs font-black uppercase tracking-widest text-[#a0c4ff]">Active Item To Sort</span>
                    {activeItemToSort ? (
                      <div className="flex items-center space-x-3 bg-white p-3 px-6 rounded-2xl text-[#002045] shadow-lg animate-bounce">
                        <span className={`material-symbols-outlined text-[44px] ${activeItemToSort.colorClass}`}>
                          {activeItemToSort.icon}
                        </span>
                        <div className="text-left">
                          <p className="text-base font-black text-[#002045]">{activeItemToSort.name}</p>
                          <p className="text-xs text-[#556987] font-bold">Color Theme: {activeItemToSort.colorName}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-emerald-400 font-bold">All items sorted!</p>
                    )}
                  </div>

                  {/* Target Trays */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {binTargets.map((bin) => (
                      <button
                        key={bin.id}
                        onClick={() => handleBinSort(bin.id)}
                        disabled={!activeItemToSort}
                        className={`p-6 rounded-2xl border-3 ${bin.colorClass} shadow-md flex flex-col items-center justify-center space-y-3 transition-all hover:scale-102 active:scale-98`}
                      >
                        <span className="material-symbols-outlined text-[48px]">{bin.icon}</span>
                        <span className="text-base font-black text-[#002045]">{bin.name}</span>
                        <span className="text-xs font-bold bg-white/80 px-3 py-1 rounded-full text-[#002045] shadow-xs">
                          {bin.matchedCount} Items Sorted
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
