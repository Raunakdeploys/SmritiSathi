import React, { useState, useEffect } from 'react';
import {
  History,
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Calendar,
  Heart,
  GraduationCap,
  Baby,
  Building,
  Home,
  Music,
  HelpCircle,
  X,
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { BridgeBanner } from '../BridgeBanner';
import { GameResultsModal } from '../GameResultsModal';
import { playGentleClick, playSuccessChime, speakText } from '../../utils/audio';

interface Milestone {
  id: string;
  year: number;
  decade: string;
  title: string;
  description: string;
  category: 'birth' | 'education' | 'marriage' | 'family' | 'career' | 'home';
  icon: any;
  audioPrompt: string;
  clue: string;
}

const ALL_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    year: 1952,
    decade: '1950s',
    title: 'Born in Old Lucknow',
    description: 'Born on a festive autumn morning near Chowk, Lucknow.',
    category: 'birth',
    icon: Baby,
    audioPrompt: 'You were born in the historic city of Lucknow in 1952.',
    clue: 'Your very earliest beginning in childhood.',
  },
  {
    id: 'ms-2',
    year: 1974,
    decade: '1970s',
    title: 'College Graduation (B.A. Literature)',
    description: 'Graduated with First Division in Hindi & Sanskrit literature from Isabella Thoburn College.',
    category: 'education',
    icon: GraduationCap,
    audioPrompt: 'In 1974, you celebrated your university degree with your professors and friends.',
    clue: 'Happened during your university youth in your early twenties.',
  },
  {
    id: 'ms-3',
    year: 1980,
    decade: '1980s',
    title: 'Traditional Wedding Ceremony',
    description: 'Married in a traditional ceremony adorned with fragrant marigold flowers.',
    category: 'marriage',
    icon: Heart,
    audioPrompt: 'In 1980, you tied the sacred wedding knot surrounded by family blessings.',
    clue: 'The start of your married family life.',
  },
  {
    id: 'ms-4',
    year: 1982,
    decade: '1980s',
    title: 'Welcomed Son Rohan',
    description: 'Birth of your eldest son Rohan at St. Stephen’s Hospital.',
    category: 'family',
    icon: Baby,
    audioPrompt: 'In 1982, you held baby Rohan in your arms for the first time.',
    clue: 'Two years after your wedding.',
  },
  {
    id: 'ms-5',
    year: 1996,
    decade: '1990s',
    title: 'Moved to Saket Residence',
    description: 'Moved into the sunny South Delhi residence with a green front garden.',
    category: 'home',
    icon: Home,
    audioPrompt: 'In 1996, your family moved into your beloved Saket home.',
    clue: 'Established your lifelong South Delhi home.',
  },
];

interface LifeThreadGameProps {
  currentLevel?: number;
  onComplete?: (score: number, points: number, accuracy: number, level: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const LifeThreadGame: React.FC<LifeThreadGameProps> = ({
  currentLevel = 2,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [level, setLevel] = useState<number>(Math.min(3, Math.max(1, currentLevel)));
  const [placedSlots, setPlacedSlots] = useState<(Milestone | null)[]>([]);
  const [unplacedCards, setUnplacedCards] = useState<Milestone[]>([]);
  const [selectedCard, setSelectedCard] = useState<Milestone | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showYearHints, setShowYearHints] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    points: number;
    accuracy: number;
    leveledUp: boolean;
  }>({ score: 0, points: 0, accuracy: 0, leveledUp: false });

  const gameProgress = storeService.getGameProgress('lifethread');
  const isBridgeActive = gameProgress?.activeBridge?.status === 'active';

  // Get milestones for current level
  const targetCount = level === 1 ? 3 : level === 2 ? 4 : 5;
  const currentTargetMilestones = ALL_MILESTONES.slice(0, targetCount);

  // Initialize and shuffle
  useEffect(() => {
    resetLevelData();
  }, [level]);

  const resetLevelData = () => {
    const subset = ALL_MILESTONES.slice(0, targetCount);
    // Shuffle
    const shuffled = [...subset].sort(() => 0.5 - Math.random());
    setPlacedSlots(new Array(targetCount).fill(null));
    setUnplacedCards(shuffled);
    setSelectedCard(null);
    setIsSubmitted(false);
    setShowYearHints(isBridgeActive);

    speakText(
      `LifeThread Milestone Sequencing. Level ${level}. Arrange your ${targetCount} life milestones in correct chronological order from earliest to latest.`,
      voiceGuidanceEnabled
    );
  };

  const handleCardClick = (milestone: Milestone) => {
    playGentleClick();
    setSelectedCard(milestone);
    speakText(`${milestone.title}. ${milestone.description}`, voiceGuidanceEnabled);
  };

  const handleSlotClick = (slotIndex: number) => {
    playGentleClick();
    if (!selectedCard) {
      // If clicking occupied slot, send back to unplaced
      const currentInSlot = placedSlots[slotIndex];
      if (currentInSlot) {
        setPlacedSlots((prev) => {
          const next = [...prev];
          next[slotIndex] = null;
          return next;
        });
        setUnplacedCards((prev) => [...prev, currentInSlot]);
      }
      return;
    }

    // Place selected card into this slot
    const previousInSlot = placedSlots[slotIndex];

    setPlacedSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = selectedCard;
      return next;
    });

    setUnplacedCards((prev) => {
      const filtered = prev.filter((m) => m.id !== selectedCard.id);
      return previousInSlot ? [...filtered, previousInSlot] : filtered;
    });

    setSelectedCard(null);
  };

  const handleValidateTimeline = () => {
    setIsSubmitted(true);
    let correctCount = 0;

    // The correct chronological order is sorted by year
    const sortedTargets = [...currentTargetMilestones].sort((a, b) => a.year - b.year);

    placedSlots.forEach((item, idx) => {
      if (item && item.id === sortedTargets[idx].id) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / targetCount) * 100);
    const accuracy = score;
    const basePoints = 50;

    const res = storeService.recordGameResult({
      gameId: 'lifethread',
      score,
      pointsEarned: basePoints,
      accuracy,
      durationMinutes: 4,
      category: 'Memory',
      title: `LifeThread Chronological Timeline (Level ${level})`,
      notes: `Reconstructed ${correctCount}/${targetCount} milestones correctly`,
    });

    setLastResult({
      score,
      points: basePoints,
      accuracy,
      leveledUp: res.leveledUp,
    });
    setShowResultsModal(true);

    if (onComplete) {
      onComplete(score, basePoints + res.bonusAwarded, accuracy, level);
    }
  };

  const sortedTargets = [...currentTargetMilestones].sort((a, b) => a.year - b.year);
  const allSlotsFilled = placedSlots.every((s) => s !== null);

  return (
    <div
      id="lifethread-game-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="lifethread-game-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F9FA] text-[#0F172A] w-full max-w-4xl rounded-3xl shadow-2xl border-3 border-[#0F172A]/20 overflow-hidden flex flex-col max-h-[94vh] my-auto"
      >
        {/* Top App Bar Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-5 sm:px-7 py-4 flex items-center justify-between shadow-md border-b-3 border-[#FF6321]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-[#FF6321] to-[#EA580C] text-white rounded-2xl shadow-md">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  LifeThread
                </h2>
                <span className="bg-[#FF6321] text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Reminiscence & Milestones
                </span>
                <span className="bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Level {level} of 3
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Reconstruct chronological milestones in order from earliest to latest
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close LifeThread"
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Cognitive Bridge Banner if active */}
          {isBridgeActive && (
            <BridgeBanner
              reason="Highlighted decade tags, direct year hints, and memory audio prompts enabled."
              voiceGuidanceEnabled={voiceGuidanceEnabled}
            />
          )}

          {/* Level Switcher & Voice Assist Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-slate-500">
                Milestone Scale:
              </span>
              <div className="flex space-x-1.5">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      level === lvl
                        ? 'bg-[#FF6321] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Level {lvl} ({lvl === 1 ? '3 Milestones' : lvl === 2 ? '4 Milestones' : '5 Milestones'})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowYearHints(!showYearHints)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  showYearHints
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {showYearHints ? 'Hide Year Clues' : 'Show Year Clues (Hint)'}
              </button>

              <button
                onClick={() => {
                  const speech = `Arrange these milestones in order: ${currentTargetMilestones.map((m) => m.title).join(', ')}`;
                  speakText(speech, true);
                }}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#FF6321]" />
                <span>Read Aloud</span>
              </button>
            </div>
          </div>

          {/* CHRONOLOGICAL TARGET TIMELINE SLOTS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-[#0F172A] flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#FF6321]" />
                <span>Your Ordered Life Timeline (Earliest to Latest)</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Click a card below, then click a slot
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {placedSlots.map((slotItem, slotIdx) => {
                const isCorrect = isSubmitted && slotItem && slotItem.id === sortedTargets[slotIdx].id;
                const isWrong = isSubmitted && slotItem && slotItem.id !== sortedTargets[slotIdx].id;

                return (
                  <div
                    key={slotIdx}
                    onClick={() => handleSlotClick(slotIdx)}
                    className={`min-h-[140px] p-3.5 rounded-2xl border-2 border-dashed flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSubmitted
                        ? isCorrect
                          ? 'bg-emerald-50 border-emerald-500 border-solid'
                          : 'bg-rose-50 border-rose-400 border-solid'
                        : slotItem
                        ? 'bg-white border-[#FF6321] border-solid shadow-sm'
                        : selectedCard
                        ? 'bg-orange-50/50 border-orange-400 hover:bg-orange-100/50'
                        : 'bg-slate-100/80 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {/* Slot Position Marker */}
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-[#0F172A] text-white text-xs font-black flex items-center justify-center">
                        {slotIdx + 1}
                      </span>
                      {showYearHints && (
                        <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                          ~{sortedTargets[slotIdx].year}
                        </span>
                      )}
                    </div>

                    {slotItem ? (
                      <div className="space-y-1 my-1">
                        <div className="flex items-center space-x-1.5">
                          <slotItem.icon className="w-4 h-4 text-[#FF6321]" />
                          <h4 className="font-extrabold text-xs text-[#0F172A] line-clamp-2">
                            {slotItem.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {slotItem.description}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center my-auto py-2">
                        <span className="text-xs font-bold text-slate-400">
                          {selectedCard ? 'Click to Place Here' : `Step ${slotIdx + 1}`}
                        </span>
                      </div>
                    )}

                    {/* Feedback Status */}
                    {isSubmitted && slotItem && (
                      <div className="pt-1.5 border-t border-slate-200 flex items-center space-x-1 text-[11px] font-black">
                        {isCorrect ? (
                          <span className="text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct ({slotItem.year})</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Should be: {sortedTargets[slotIdx].title}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* UNPLACED MILESTONE CARDS TO PICK */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-[#0F172A]">
                Available Milestone Memory Cards ({unplacedCards.length} remaining)
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Click a card to select
              </span>
            </div>

            {unplacedCards.length === 0 ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center">
                <p className="font-bold text-xs sm:text-sm text-emerald-950">
                  ✓ All milestones placed in the timeline! Click "Validate Timeline Order" below to check your score.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {unplacedCards.map((milestone) => {
                  const isCardSelected = selectedCard?.id === milestone.id;
                  const IconComp = milestone.icon;

                  return (
                    <div
                      key={milestone.id}
                      onClick={() => handleCardClick(milestone)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isCardSelected
                          ? 'bg-[#0F172A] text-white border-[#FF6321] shadow-lg transform scale-102'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`p-2 rounded-xl ${
                              isCardSelected ? 'bg-[#FF6321] text-white' : 'bg-orange-50 text-[#FF6321]'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isCardSelected
                                ? 'bg-slate-800 text-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {milestone.decade}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(milestone.audioPrompt, true);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCardSelected
                              ? 'text-white/80 hover:text-white'
                              : 'text-slate-500 hover:text-[#0F172A]'
                          }`}
                          title="Listen to memory note"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h4
                          className={`font-black text-sm ${
                            isCardSelected ? 'text-white' : 'text-[#0F172A]'
                          }`}
                        >
                          {milestone.title}
                        </h4>
                        <p
                          className={`text-xs mt-1 line-clamp-2 ${
                            isCardSelected ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {milestone.description}
                        </p>
                      </div>

                      {showYearHints && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-extrabold text-[#FF6321]">
                          <span>Year: {milestone.year}</span>
                          <span className="text-slate-400 font-normal">{milestone.clue}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-100 px-5 sm:px-7 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={resetLevelData}
            className="text-slate-700 hover:text-[#0F172A] font-black text-xs sm:text-sm flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Timeline</span>
          </button>

          <button
            onClick={handleValidateTimeline}
            disabled={!allSlotsFilled || isSubmitted}
            className="bg-[#FF6321] hover:bg-[#EA580C] disabled:opacity-40 text-white py-3.5 px-7 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-orange-500/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Validate Timeline Order (+50 Pts)</span>
          </button>
        </div>

        {/* Results Modal */}
        <GameResultsModal
          isOpen={showResultsModal}
          score={lastResult.score}
          pointsEarned={lastResult.points}
          accuracy={lastResult.accuracy}
          gameTitle="LifeThread (Milestones)"
          level={level}
          leveledUp={lastResult.leveledUp}
          bridgeActive={isBridgeActive}
          voiceGuidanceEnabled={voiceGuidanceEnabled}
          onPlayAgain={resetLevelData}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
