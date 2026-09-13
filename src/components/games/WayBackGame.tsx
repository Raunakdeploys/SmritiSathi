import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Volume2,
  Eye,
  Sparkles,
  TreePine,
  Coffee,
  Home,
  Building2,
  ShoppingBag,
  Landmark,
  X,
  Radio,
  Clock,
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { BridgeBanner } from '../BridgeBanner';
import { GameResultsModal } from '../GameResultsModal';
import { RealTimeLocationOrientationTest } from './RealTimeLocationOrientationTest';
import { playGentleClick, playSuccessChime, speakText } from '../../utils/audio';
import type { UserProfile, LocationCheckRecord } from '../../types';

interface WayBackGameProps {
  user?: UserProfile;
  currentLevel?: number;
  maxLevel?: number;
  onComplete?: (score: number, points: number, accuracy: number, level: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

interface LandmarkItem {
  id: number;
  name: string;
  turnDirection: string;
  iconName: 'home' | 'tree' | 'coffee' | 'landmark' | 'shop' | 'building';
  description: string;
}

interface RouteLevel {
  level: number;
  title: string;
  subTitle: string;
  baseStudySeconds: number;
  landmarks: LandmarkItem[];
  questions: {
    id: number;
    prompt: string;
    options: string[];
    correctAnswer: string;
    hint: string;
  }[];
}

const ROUTE_LEVELS: RouteLevel[] = [
  {
    level: 1,
    title: 'Morning Walk to Temple',
    subTitle: '3 neighborhood landmarks & turns',
    baseStudySeconds: 15,
    landmarks: [
      {
        id: 1,
        name: 'Green Park Gate',
        turnDirection: 'Start & Walk Straight 100m',
        iconName: 'tree',
        description: 'Iron gate with bougainvillea flowers',
      },
      {
        id: 2,
        name: 'Chai Stall & Banyan Tree',
        turnDirection: 'Turn Right at Banyan Tree',
        iconName: 'coffee',
        description: 'Corner tea stall smelling of cardamoms',
      },
      {
        id: 3,
        name: 'Community Shiva Temple',
        turnDirection: 'Final Destination on Left',
        iconName: 'landmark',
        description: 'Peaceful temple steps with morning bells',
      },
    ],
    questions: [
      {
        id: 1,
        prompt: 'Which landmark came immediately AFTER the Green Park Gate?',
        options: ['Chai Stall & Banyan Tree', 'Community Shiva Temple', 'Bus Depot'],
        correctAnswer: 'Chai Stall & Banyan Tree',
        hint: 'Look for the warm tea stall on the route.',
      },
      {
        id: 2,
        prompt: 'What turn did you make when you reached the Chai Stall & Banyan Tree?',
        options: ['Turn Right', 'Turn Left', 'U-Turn Backwards'],
        correctAnswer: 'Turn Right',
        hint: 'You turned towards the temple on the right.',
      },
      {
        id: 3,
        prompt: 'What was your final peaceful destination?',
        options: ['Community Shiva Temple', 'Vegetable Market', 'Metro Station'],
        correctAnswer: 'Community Shiva Temple',
        hint: 'Where the morning bells ring.',
      },
    ],
  },
  {
    level: 2,
    title: 'Trip to Post Office & Market',
    subTitle: '4 landmarks & directional sequence',
    baseStudySeconds: 20,
    landmarks: [
      {
        id: 1,
        name: 'Home Gate',
        turnDirection: 'Step out & Turn Left',
        iconName: 'home',
        description: 'Wooden main door & garden gate',
      },
      {
        id: 2,
        name: 'Corner Bakery',
        turnDirection: 'Straight 150m past bakery',
        iconName: 'coffee',
        description: 'Fresh warm bun maska aromas',
      },
      {
        id: 3,
        name: 'Central Post Office',
        turnDirection: 'Turn Right at Red Mailbox',
        iconName: 'building',
        description: 'Colonial brick building with clock',
      },
      {
        id: 4,
        name: 'Vegetable Mandi',
        turnDirection: 'Arrival: Corner Stall #4',
        iconName: 'shop',
        description: 'Fresh spinach, cauliflowers, and apples',
      },
    ],
    questions: [
      {
        id: 1,
        prompt: 'What was the very FIRST turn you took when leaving Home Gate?',
        options: ['Turn Left', 'Turn Right', 'Walk Straight Across'],
        correctAnswer: 'Turn Left',
        hint: 'You stepped outside and turned towards the left.',
      },
      {
        id: 2,
        prompt: 'Which landmark was situated between the Corner Bakery and Vegetable Mandi?',
        options: ['Central Post Office', 'Green Park Gate', 'Petrol Station'],
        correctAnswer: 'Central Post Office',
        hint: 'The red mailbox building.',
      },
      {
        id: 3,
        prompt: 'What turn did you take at the Central Post Office?',
        options: ['Turn Right at Red Mailbox', 'Turn Left into lane', 'Cross Footbridge'],
        correctAnswer: 'Turn Right at Red Mailbox',
        hint: 'Right at the mailbox leads to the mandi.',
      },
    ],
  },
  {
    level: 3,
    title: 'Community Garden & Metro Station',
    subTitle: '5 landmarks with complex navigation',
    baseStudySeconds: 25,
    landmarks: [
      {
        id: 1,
        name: 'Home Sweet Home',
        turnDirection: 'Exit East onto Main Avenue',
        iconName: 'home',
        description: 'Your registered residence anchor',
      },
      {
        id: 2,
        name: 'Mother Dairy Milk Booth',
        turnDirection: 'Turn Left past Milk Booth',
        iconName: 'shop',
        description: 'Blue and white morning milk counter',
      },
      {
        id: 3,
        name: 'Rose Garden Pavilion',
        turnDirection: 'Walk through central path (200m)',
        iconName: 'tree',
        description: 'Fragrant roses and benches',
      },
      {
        id: 4,
        name: 'Saket Metro Gate 2',
        turnDirection: 'Turn Right at Escalator plaza',
        iconName: 'building',
        description: 'Yellow line metro concourse',
      },
      {
        id: 5,
        name: 'Community Reading Library',
        turnDirection: 'Final Destination (2nd Floor)',
        iconName: 'landmark',
        description: 'Quiet book tables & daily newspapers',
      },
    ],
    questions: [
      {
        id: 1,
        prompt: 'What landmark was located immediately AFTER Mother Dairy Milk Booth?',
        options: ['Rose Garden Pavilion', 'Metro Station Gate', 'Tea Stall'],
        correctAnswer: 'Rose Garden Pavilion',
        hint: 'The fragrant flower path.',
      },
      {
        id: 2,
        prompt: 'What direction turn did you take at Saket Metro Gate 2?',
        options: ['Turn Right at Escalator plaza', 'Turn Left towards parking', 'U-turn'],
        correctAnswer: 'Turn Right at Escalator plaza',
        hint: 'Right side escalators led to the library.',
      },
      {
        id: 3,
        prompt: 'What was your 5th and final destination on this route?',
        options: ['Community Reading Library', 'Post Office', 'Shiva Temple'],
        correctAnswer: 'Community Reading Library',
        hint: 'Where you read the daily newspaper.',
      },
    ],
  },
];

export const WayBackGame: React.FC<WayBackGameProps> = ({
  user,
  currentLevel = 2,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<'neighborhood' | 'live-gps'>('neighborhood');
  const [level, setLevel] = useState<number>(Math.min(3, Math.max(1, currentLevel)));
  const [gamePhase, setGamePhase] = useState<'study' | 'recall'>('study');
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    points: number;
    accuracy: number;
    leveledUp: boolean;
  }>({ score: 0, points: 0, accuracy: 0, leveledUp: false });

  // Cognitive Bridge status from store
  const gameProgress = storeService.getGameProgress('wayback');
  const isBridgeActive = gameProgress?.activeBridge?.status === 'active';
  const currentUser = user || storeService.getUser();

  const currentRoute = ROUTE_LEVELS[level - 1] || ROUTE_LEVELS[0];

  // Adjust study time with Cognitive Bridge bonus (+50% time)
  const studyTimeCalculated = isBridgeActive
    ? Math.round(currentRoute.baseStudySeconds * 1.5)
    : currentRoute.baseStudySeconds;

  // Study timer countdown
  useEffect(() => {
    if (activeTab !== 'neighborhood' || gamePhase !== 'study') return;

    setTimeLeft(studyTimeCalculated);
    speakText(
      `Study the route to ${currentRoute.title}. Memorize the landmarks and turns. You have ${studyTimeCalculated} seconds.`,
      voiceGuidanceEnabled
    );

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGamePhase('recall');
          speakText('Time is up! Now answer the route recall questions.', voiceGuidanceEnabled);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, level, activeTab]);

  const handleSelectOption = (opt: string) => {
    playGentleClick();
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: opt }));
    speakText(opt, voiceGuidanceEnabled);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < currentRoute.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      const nextQ = currentRoute.questions[currentQIndex + 1];
      speakText(nextQ.prompt, voiceGuidanceEnabled);
    } else {
      // Evaluate results
      evaluateScore();
    }
  };

  const evaluateScore = () => {
    let correct = 0;
    currentRoute.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct += 1;
      }
    });

    const score = Math.round((correct / currentRoute.questions.length) * 100);
    const accuracy = score;
    const basePoints = 40;

    const res = storeService.recordGameResult({
      gameId: 'wayback',
      score,
      pointsEarned: basePoints,
      accuracy,
      durationMinutes: 4,
      category: 'Spatial',
      title: `WayBack (${currentRoute.title})`,
      notes: `Scored ${score}% in Level ${level} route memory recall`,
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

  const handleRestartGame = () => {
    setShowResultsModal(false);
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setGamePhase('study');
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home className="w-7 h-7 text-[#FF6321]" />;
      case 'tree':
        return <TreePine className="w-7 h-7 text-emerald-600" />;
      case 'coffee':
        return <Coffee className="w-7 h-7 text-amber-600" />;
      case 'landmark':
        return <Landmark className="w-7 h-7 text-indigo-600" />;
      case 'shop':
        return <ShoppingBag className="w-7 h-7 text-rose-600" />;
      case 'building':
        return <Building2 className="w-7 h-7 text-sky-600" />;
      default:
        return <MapPin className="w-7 h-7 text-[#FF6321]" />;
    }
  };

  const currentQ = currentRoute.questions[currentQIndex];
  const isCurrentQAnswered = selectedAnswers[currentQIndex] !== undefined;

  // Bridge mode helper: eliminate 1 distractor option if bridge active
  const filteredOptions = React.useMemo(() => {
    if (!currentQ) return [];
    if (!isBridgeActive || currentQ.options.length <= 2) return currentQ.options;
    // Keep correct answer and 1 distractor
    const wrongOptions = currentQ.options.filter((o) => o !== currentQ.correctAnswer);
    return [currentQ.correctAnswer, wrongOptions[0]].sort();
  }, [currentQ, isBridgeActive]);

  return (
    <div
      id="wayback-game-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="wayback-game-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F9FA] text-[#0F172A] w-full max-w-4xl rounded-3xl shadow-2xl border-3 border-[#0F172A]/20 overflow-hidden flex flex-col max-h-[94vh] my-auto"
      >
        {/* Top App Bar with High-Contrast Warm Accent */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-5 sm:px-7 py-4 flex items-center justify-between shadow-md border-b-3 border-[#FF6321]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-[#FF6321] to-[#EA580C] text-white rounded-2xl shadow-md">
              <Navigation className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  WayBack
                </h2>
                <span className="bg-[#FF6321] text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Spatial Orientation
                </span>
                <span className="bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Level {level} of 3
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Neighborhood Route Sequencing & Live GPS Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              aria-label="Close WayBack game"
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Mode A (Route Walk) vs Mode B (Live GPS Assessment) */}
        <div className="bg-slate-200/80 p-2 flex items-center justify-center gap-2 border-b border-slate-300">
          <button
            onClick={() => {
              setActiveTab('neighborhood');
              playGentleClick();
            }}
            className={`flex-1 max-w-xs py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'neighborhood'
                ? 'bg-[#0F172A] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#FF6321]" />
            <span>Route Memory Walk</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('live-gps');
              playGentleClick();
            }}
            className={`flex-1 max-w-xs py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'live-gps'
                ? 'bg-[#0F172A] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Live GPS Assessment</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Cognitive Bridge Banner if active */}
          {isBridgeActive && (
            <BridgeBanner
              reason="Extended study time (+50%), simplified answer choices, and guided landmarks enabled."
              voiceGuidanceEnabled={voiceGuidanceEnabled}
            />
          )}

          {activeTab === 'live-gps' ? (
            <RealTimeLocationOrientationTest
              user={currentUser}
              voiceGuidanceEnabled={voiceGuidanceEnabled}
              onComplete={(record) => {
                // Record created
              }}
            />
          ) : (
            <>
              {/* Route Difficulty Level Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-slate-500">
                    Select Route:
                  </span>
                  <div className="flex space-x-1.5">
                    {[1, 2, 3].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setLevel(lvl);
                          setGamePhase('study');
                          setSelectedAnswers({});
                          setCurrentQIndex(0);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          level === lvl
                            ? 'bg-[#FF6321] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        L{lvl}: {ROUTE_LEVELS[lvl - 1].title}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const speech =
                      gamePhase === 'study'
                        ? `Study the route to ${currentRoute.title}. Landmarks: ${currentRoute.landmarks.map((l) => `${l.name}, then ${l.turnDirection}`).join('. ')}`
                        : `Question ${currentQIndex + 1}: ${currentQ.prompt}. Options: ${filteredOptions.join(', ')}`;
                    speakText(speech, true);
                  }}
                  className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#FF6321]" />
                  <span>Read Screen Aloud</span>
                </button>
              </div>

              {/* PHASE 1: STUDY MODE */}
              {gamePhase === 'study' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Study Timer Header Card */}
                  <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 p-4 rounded-2xl border-2 border-amber-300 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                        <Eye className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-amber-950">
                          Phase 1: Memorize the Route Sequence
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-900 font-medium">
                          Study the numbered landmark order and turn directions.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border-2 border-amber-400 shadow-sm">
                      <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                      <span className="font-mono font-black text-xl sm:text-2xl text-amber-950">
                        {timeLeft}s
                      </span>
                    </div>
                  </div>

                  {/* Route Visualizer Cards (Animated Landmarks & Turns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {currentRoute.landmarks.map((landmark, idx) => (
                      <div
                        key={landmark.id}
                        className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#FF6321] transition-all relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                            {renderIcon(landmark.iconName)}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-base text-[#0F172A]">
                            {landmark.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                            {landmark.description}
                          </p>
                        </div>

                        {/* Turn Direction Badge */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-1.5 text-xs font-black text-[#FF6321] bg-orange-50/80 px-2.5 py-1.5 rounded-xl border border-orange-200">
                          <Navigation className="w-3.5 h-3.5 flex-shrink-0 rotate-45" />
                          <span className="truncate">{landmark.turnDirection}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skip to Recall button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setGamePhase('recall');
                        speakText('Beginning recall questions.', voiceGuidanceEnabled);
                      }}
                      className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer shadow-sm"
                    >
                      <span>Ready for Questions Now</span>
                      <ArrowRight className="w-4 h-4 text-[#FF6321]" />
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 2: RECALL MODE */}
              {gamePhase === 'recall' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Progress bar */}
                  <div className="flex items-center justify-between text-xs font-black text-slate-600">
                    <span>
                      Question {currentQIndex + 1} of {currentRoute.questions.length}
                    </span>
                    <span className="text-[#FF6321]">
                      {Math.round(((currentQIndex + 1) / currentRoute.questions.length) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6321] to-[#EA580C] transition-all duration-300"
                      style={{
                        width: `${((currentQIndex + 1) / currentRoute.questions.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Active Question Card */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-md space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Route Sequence Recall
                        </span>
                        <h3 className="text-base sm:text-xl font-black text-[#0F172A]">
                          {currentQ.prompt}
                        </h3>
                      </div>
                      <button
                        onClick={() => speakText(currentQ.prompt, true)}
                        className="p-2 text-slate-500 hover:text-[#0F172A] rounded-xl hover:bg-slate-100"
                        title="Hear question aloud"
                      >
                        <Volume2 className="w-5 h-5 text-[#FF6321]" />
                      </button>
                    </div>

                    {/* Multiple Choice Options */}
                    <div className="space-y-2.5 pt-2">
                      {filteredOptions.map((opt) => {
                        const isSelected = selectedAnswers[currentQIndex] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(opt)}
                            className={`w-full p-4 rounded-2xl font-bold text-sm sm:text-base text-left transition-all border-2 flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F172A] text-white border-[#FF6321] shadow-md transform scale-[1.01]'
                                : 'bg-[#F8F9FA] hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-[#FF6321] flex-shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Hint Box if Cognitive Bridge Active */}
                    {isBridgeActive && currentQ.hint && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-bold flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Gentle Clue: {currentQ.hint}</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setGamePhase('study')}
                      className="text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center space-x-1 cursor-pointer py-2 px-3 rounded-xl hover:bg-slate-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Review Route (5s)</span>
                    </button>

                    <button
                      onClick={handleNextQuestion}
                      disabled={!isCurrentQAnswered}
                      className="bg-[#FF6321] hover:bg-[#EA580C] disabled:opacity-40 text-white py-3 px-6 rounded-2xl font-black text-sm sm:text-base shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      <span>
                        {currentQIndex < currentRoute.questions.length - 1
                          ? 'Next Question'
                          : 'Complete WayBack (+40 Pts)'}
                      </span>
                      <ArrowRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Results Modal */}
        <GameResultsModal
          isOpen={showResultsModal}
          score={lastResult.score}
          pointsEarned={lastResult.points}
          accuracy={lastResult.accuracy}
          gameTitle={`WayBack (Spatial Navigation)`}
          level={level}
          leveledUp={lastResult.leveledUp}
          bridgeActive={isBridgeActive}
          voiceGuidanceEnabled={voiceGuidanceEnabled}
          onPlayAgain={handleRestartGame}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
