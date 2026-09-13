import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Sparkles,
  ArrowRight,
  Pill,
  Coffee,
  Flower2,
  Clock,
  HelpCircle,
  X,
  ListOrdered,
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { BridgeBanner } from '../BridgeBanner';
import { GameResultsModal } from '../GameResultsModal';
import { playGentleClick, playSuccessChime, speakText } from '../../utils/audio';

interface RoutineStep {
  id: string;
  order: number;
  title: string;
  description: string;
  icon?: string;
  hint: string;
}

interface RoutineTask {
  id: string;
  level: number;
  title: string;
  subtitle: string;
  category: string;
  icon: any;
  steps: RoutineStep[];
}

const ROUTINE_TASKS: RoutineTask[] = [
  {
    id: 'routine-medication',
    level: 1,
    title: 'Morning Medication & Blood Pressure Check',
    subtitle: 'Safe morning health routine',
    category: 'Health & Vital Care',
    icon: Pill,
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Drink a glass of warm water & sit comfortably',
        description: 'Hydrate your body and relax your arms for 5 minutes before checking vitals.',
        hint: 'First, hydrate and rest before measuring anything.',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Wrap BP cuff on upper arm & record reading',
        description: 'Rest arm at heart level, stay silent, and note the systolic & diastolic numbers.',
        hint: 'Second, take your resting blood pressure measurement.',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Open labeled morning pill box slot (Breakfast)',
        description: 'Verify the day of the week on your organizer compartment.',
        hint: 'Third, open your organizer compartment for today.',
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Take prescribed morning tablets with breakfast',
        description: 'Swallow with lukewarm water after eating your warm breakfast.',
        hint: 'Finally, take your tablets safely with food.',
      },
    ],
  },
  {
    id: 'routine-chai',
    level: 2,
    title: 'Preparing Morning Masala Chai with Ginger',
    subtitle: 'Classic morning kitchen sequencing',
    category: 'Culinary Sequencing',
    icon: Coffee,
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Measure 1 cup water & crushed fresh ginger into saucepan',
        description: 'Place the stainless pan on stove and add freshly grated ginger.',
        hint: 'First, put water and aromatics into the pan.',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Turn on stove flame and bring to rolling boil',
        description: 'Allow ginger oils and green cardamom to infuse into the water.',
        hint: 'Second, bring the ginger water to a fragrant boil.',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Add Assam black tea leaves & simmer for 2 minutes',
        description: 'Let the strong golden tea color develop gently.',
        hint: 'Third, add the tea leaves to brew the rich color.',
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Pour in milk, boil up, and turn off stove flame safely',
        description: 'Allow the chai to froth up to the rim, then switch off the burner.',
        hint: 'Fourth, add milk and ensure the burner is safely turned off.',
      },
      {
        id: 'step-5',
        order: 5,
        title: 'Strain through fine sieve into ceramic cup and enjoy',
        description: 'Serve hot alongside your morning biscuits.',
        hint: 'Finally, strain the hot chai into your cup.',
      },
    ],
  },
  {
    id: 'routine-garden',
    level: 3,
    title: 'Evening Garden Plant Watering & Tulsi Care',
    subtitle: 'Peaceful garden upkeep sequencing',
    category: 'Home & Nature',
    icon: Flower2,
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Check soil moisture with fingertips around pots',
        description: 'Ensure soil is dry before adding water to avoid over-saturating roots.',
        hint: 'First, inspect the soil condition before watering.',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Fill watering can at outdoor garden tap',
        description: 'Fill with room-temperature fresh water.',
        hint: 'Second, fill the watering vessel.',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Water the sacred Tulsi pot and offer respectful pranams',
        description: 'Gently water the base and light the evening earthen diya lamp.',
        hint: 'Third, water the holy Tulsi altar.',
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Water flowering hibiscus & jasmine bushes evenly',
        description: 'Pour slowly at root level around the perimeter of the pots.',
        hint: 'Fourth, water the flower pots evenly.',
      },
      {
        id: 'step-5',
        order: 5,
        title: 'Close garden water tap firmly and store can safely',
        description: 'Ensure no drips remain and walkway is free from tripping hazards.',
        hint: 'Finally, turn off the tap securely and stow tools.',
      },
    ],
  },
];

interface DailyRoutineGameProps {
  currentLevel?: number;
  onComplete?: (score: number, points: number, accuracy: number, level: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const DailyRoutineGame: React.FC<DailyRoutineGameProps> = ({
  currentLevel = 2,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [level, setLevel] = useState<number>(Math.min(3, Math.max(1, currentLevel)));
  const [placedSteps, setPlacedSteps] = useState<(RoutineStep | null)[]>([]);
  const [unplacedSteps, setUnplacedSteps] = useState<RoutineStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<RoutineStep | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showStepHints, setShowStepHints] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    points: number;
    accuracy: number;
    leveledUp: boolean;
  }>({ score: 0, points: 0, accuracy: 0, leveledUp: false });

  const gameProgress = storeService.getGameProgress('dailyroutine');
  const isBridgeActive = gameProgress?.activeBridge?.status === 'active';

  const currentTask = ROUTINE_TASKS[level - 1] || ROUTINE_TASKS[0];

  useEffect(() => {
    resetTask();
  }, [level]);

  const resetTask = () => {
    const original = [...currentTask.steps];
    const shuffled = [...original].sort(() => 0.5 - Math.random());
    setPlacedSteps(new Array(original.length).fill(null));
    setUnplacedSteps(shuffled);
    setSelectedStep(null);
    setIsSubmitted(false);
    setShowStepHints(isBridgeActive);

    speakText(
      `Daily Routine Sequencing. ${currentTask.title}. Reorder these shuffled steps into the safe, logical sequence from first to last.`,
      voiceGuidanceEnabled
    );
  };

  const handleCardClick = (step: RoutineStep) => {
    playGentleClick();
    setSelectedStep(step);
    speakText(`${step.title}. ${step.description}`, voiceGuidanceEnabled);
  };

  const handleSlotClick = (slotIdx: number) => {
    playGentleClick();
    if (!selectedStep) {
      // Remove item from slot
      const existing = placedSteps[slotIdx];
      if (existing) {
        setPlacedSteps((prev) => {
          const next = [...prev];
          next[slotIdx] = null;
          return next;
        });
        setUnplacedSteps((prev) => [...prev, existing]);
      }
      return;
    }

    const previousInSlot = placedSteps[slotIdx];

    setPlacedSteps((prev) => {
      const next = [...prev];
      next[slotIdx] = selectedStep;
      return next;
    });

    setUnplacedSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== selectedStep.id);
      return previousInSlot ? [...filtered, previousInSlot] : filtered;
    });

    setSelectedStep(null);
  };

  const handleValidate = () => {
    setIsSubmitted(true);
    let correctCount = 0;

    placedSteps.forEach((step, idx) => {
      if (step && step.order === idx + 1) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / currentTask.steps.length) * 100);
    const accuracy = score;
    const basePoints = 35;

    const res = storeService.recordGameResult({
      gameId: 'dailyroutine',
      score,
      pointsEarned: basePoints,
      accuracy,
      durationMinutes: 3,
      category: 'Executive',
      title: `Daily Routine (${currentTask.title})`,
      notes: `Correctly arranged ${correctCount}/${currentTask.steps.length} sequential task steps`,
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

  const allFilled = placedSteps.every((s) => s !== null);
  const IconComponent = currentTask.icon;

  return (
    <div
      id="dailyroutine-game-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="dailyroutine-game-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F9FA] text-[#0F172A] w-full max-w-4xl rounded-3xl shadow-2xl border-3 border-[#0F172A]/20 overflow-hidden flex flex-col max-h-[94vh] my-auto"
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-5 sm:px-7 py-4 flex items-center justify-between shadow-md border-b-3 border-[#FF6321]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-[#FF6321] to-[#EA580C] text-white rounded-2xl shadow-md">
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  DailyRoutine
                </h2>
                <span className="bg-[#FF6321] text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Executive Function
                </span>
                <span className="bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Level {level} of 3
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {currentTask.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close DailyRoutine"
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
              reason="Highlighted sequential number clues, simplified step choices, and spoken instructions enabled."
              voiceGuidanceEnabled={voiceGuidanceEnabled}
            />
          )}

          {/* Routine Task Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-slate-500">
                Self-Care Task:
              </span>
              <div className="flex space-x-1.5 flex-wrap">
                {ROUTINE_TASKS.map((task) => (
                  <button
                    key={task.level}
                    onClick={() => setLevel(task.level)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      level === task.level
                        ? 'bg-[#FF6321] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    L{task.level}: {task.title.split('&')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStepHints(!showStepHints)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  showStepHints
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {showStepHints ? 'Hide Clues' : 'Show Step Clues'}
              </button>

              <button
                onClick={() => {
                  const text = `Routine: ${currentTask.title}. Shuffled steps: ${currentTask.steps.map((s) => s.title).join(', ')}`;
                  speakText(text, true);
                }}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#FF6321]" />
                <span>Read Aloud</span>
              </button>
            </div>
          </div>

          {/* SEQUENTIAL ORDER SLOTS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-[#0F172A] flex items-center space-x-2">
                <ListOrdered className="w-5 h-5 text-[#FF6321]" />
                <span>Correct Step-by-Step Sequence (Step 1 to {currentTask.steps.length})</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Click a card below, then click a slot
              </span>
            </div>

            <div className="space-y-2.5">
              {placedSteps.map((slotStep, slotIdx) => {
                const isCorrect = isSubmitted && slotStep && slotStep.order === slotIdx + 1;
                const isWrong = isSubmitted && slotStep && slotStep.order !== slotIdx + 1;

                return (
                  <div
                    key={slotIdx}
                    onClick={() => handleSlotClick(slotIdx)}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSubmitted
                        ? isCorrect
                          ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                          : 'bg-rose-50 border-rose-400 shadow-xs'
                        : slotStep
                        ? 'bg-white border-[#FF6321] shadow-sm'
                        : selectedStep
                        ? 'bg-orange-50/60 border-orange-400 border-dashed hover:bg-orange-100/50'
                        : 'bg-slate-100/80 border-slate-300 border-dashed hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-[#0F172A] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                        {slotIdx + 1}
                      </span>

                      {slotStep ? (
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#0F172A]">
                            {slotStep.title}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {slotStep.description}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          {selectedStep ? `Click to place "${selectedStep.title}" as Step ${slotIdx + 1}` : `Empty Step ${slotIdx + 1}`}
                        </span>
                      )}
                    </div>

                    {/* Step Feedback Indicator */}
                    {isSubmitted && slotStep && (
                      <div className="flex items-center space-x-1 flex-shrink-0 text-xs font-black">
                        {isCorrect ? (
                          <span className="text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Correct Step</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center space-x-1">
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Order Mismatch</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHUFFLED UNPLACED CARDS */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-[#0F172A]">
                Shuffled Routine Steps ({unplacedSteps.length} remaining)
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Click to select
              </span>
            </div>

            {unplacedSteps.length === 0 ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center">
                <p className="font-bold text-xs sm:text-sm text-emerald-950">
                  ✓ All steps placed in the sequence! Click "Validate Routine Sequence" below.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unplacedSteps.map((step) => {
                  const isCardSelected = selectedStep?.id === step.id;

                  return (
                    <div
                      key={step.id}
                      onClick={() => handleCardClick(step)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isCardSelected
                          ? 'bg-[#0F172A] text-white border-[#FF6321] shadow-lg transform scale-101'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className={`font-black text-xs sm:text-sm ${
                            isCardSelected ? 'text-white' : 'text-[#0F172A]'
                          }`}
                        >
                          {step.title}
                        </h4>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(`${step.title}. ${step.description}`, true);
                          }}
                          className={`p-1.5 rounded-lg ${
                            isCardSelected ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-[#0F172A]'
                          }`}
                          title="Read step aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p
                        className={`text-[11px] sm:text-xs line-clamp-2 ${
                          isCardSelected ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {step.description}
                      </p>

                      {showStepHints && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-extrabold text-[#FF6321]">
                          <span>Hint: {step.hint}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-5 sm:px-7 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={resetTask}
            className="text-slate-700 hover:text-[#0F172A] font-black text-xs sm:text-sm flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Sequence</span>
          </button>

          <button
            onClick={handleValidate}
            disabled={!allFilled || isSubmitted}
            className="bg-[#FF6321] hover:bg-[#EA580C] disabled:opacity-40 text-white py-3.5 px-7 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-orange-500/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Validate Routine Sequence (+35 Pts)</span>
          </button>
        </div>

        {/* Results Modal */}
        <GameResultsModal
          isOpen={showResultsModal}
          score={lastResult.score}
          pointsEarned={lastResult.points}
          accuracy={lastResult.accuracy}
          gameTitle={`DailyRoutine (${currentTask.title})`}
          level={level}
          leveledUp={lastResult.leveledUp}
          bridgeActive={isBridgeActive}
          voiceGuidanceEnabled={voiceGuidanceEnabled}
          onPlayAgain={resetTask}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
