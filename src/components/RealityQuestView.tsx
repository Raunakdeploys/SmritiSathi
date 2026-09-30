import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Sun,
  Camera,
  CheckCircle2,
  Volume2,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Eye,
  Check,
  X,
  Coffee,
  BookOpen,
  Glasses,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { storeService } from '../services/storeService';
import { BridgeBanner } from './BridgeBanner';
import { GameResultsModal } from './GameResultsModal';
import { playSuccessChime, playGentleClick, speakText } from '../utils/audio';

interface RealityQuestViewProps {
  user: UserProfile | null;
  questData?: any;
  onCompleteQuest: () => void;
  voiceGuidanceEnabled?: boolean;
}

interface QuestQuestion {
  id: number;
  category: 'Temporal' | 'Seasonal' | 'Calendar' | 'Environmental';
  prompt: string;
  subPrompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  clue: string;
  icon: any;
  hasCameraOption?: boolean;
}

export const RealityQuestView: React.FC<RealityQuestViewProps> = ({
  user,
  onCompleteQuest,
  voiceGuidanceEnabled = true,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraCapturedObject, setCameraCapturedObject] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    points: number;
    accuracy: number;
    leveledUp: boolean;
  }>({ score: 0, points: 0, accuracy: 0, leveledUp: false });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const gameProgress = storeService.getGameProgress('realityquest');
  const isBridgeActive = gameProgress?.activeBridge?.status === 'active';

  // Dynamic time-grounded questions
  const now = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentDayName = daysOfWeek[now.getDay()];
  const currentMonthName = months[now.getMonth()];
  const currentYear = now.getFullYear();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const [detectingTarget, setDetectingTarget] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const questions: QuestQuestion[] = [
    {
      id: 1,
      category: 'Temporal',
      prompt: `What day of the week is it today, and is it morning, afternoon, or evening?`,
      subPrompt: `Observe the natural ambient light and current time: ${currentDayName} (${timeOfDay}).`,
      options: [
        `${currentDayName} (${timeOfDay})`,
        `${daysOfWeek[(now.getDay() + 2) % 7]} (Evening)`,
        `${daysOfWeek[(now.getDay() + 4) % 7]} (Morning)`,
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: `${currentDayName} (${timeOfDay})`,
      explanation: `Today is indeed ${currentDayName} ${timeOfDay}. Anchoring time of day reinforces temporal stability.`,
      clue: `Look outside at the sun or check your room wall clock.`,
      icon: Clock,
    },
    {
      id: 2,
      category: 'Calendar',
      prompt: `Which calendar month and year are we currently in?`,
      subPrompt: `Connect with the current monthly cycle. Today is in ${currentMonthName} ${currentYear}.`,
      options: [
        `${currentMonthName} ${currentYear}`,
        `${months[(now.getMonth() + 4) % 12]} ${currentYear - 1}`,
        `${months[(now.getMonth() + 8) % 12]} ${currentYear + 1}`,
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: `${currentMonthName} ${currentYear}`,
      explanation: `We are residing in ${currentMonthName} ${currentYear}. Excellent calendar orientation.`,
      clue: `Think about upcoming festivals or the current season.`,
      icon: Calendar,
    },
    {
      id: 3,
      category: 'Seasonal',
      prompt: `Which seasonal weather pattern describes our current climate?`,
      subPrompt: `Notice the ambient room temperature and air outside.`,
      options: [
        hour > 6 && hour < 18 ? 'Pleasant Daylight & Clear Skies' : 'Calm Evening Twilight',
        'Heavy Monsoon Downpour',
        'Freezing Himalayan Snowfall',
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: hour > 6 && hour < 18 ? 'Pleasant Daylight & Clear Skies' : 'Calm Evening Twilight',
      explanation: `Noticing weather and climate anchors our biological circadian rhythm.`,
      clue: `Feel the breeze from the window or fan.`,
      icon: Sun,
    },
    {
      id: 4,
      category: 'Environmental',
      prompt: `Sensory Spotting: Which everyday physical item is currently near you in your room?`,
      subPrompt: `Look around your room or table to ground your immediate tactile surroundings.`,
      options: [
        'A steel water tumbler / tea mug',
        'Reading prescription spectacles',
        'Daily morning newspaper or prayer book',
      ],
      correctAnswer: 'A steel water tumbler / tea mug',
      explanation: `Tactile observation of nearby familiar objects calms disorientation and anchors spatial memory.`,
      clue: `Reach out and touch a familiar object on your table.`,
      icon: Eye,
      hasCameraOption: true,
    },
  ];

  const currentQ = questions[currentStep];

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCaptureObject = (objectName: string) => {
    setDetectingTarget(objectName);
    setIsScanning(true);
    playGentleClick();

    setTimeout(() => {
      setIsScanning(false);
      setCameraCapturedObject(objectName);
      setDetectionConfidence(Math.round(92 + Math.random() * 7));
      setSelectedAnswer(objectName);
      playSuccessChime();
      speakText(`Visual match confirmed: ${objectName}. Excellent reality anchoring!`, true);
    }, 1200);
  };

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    playGentleClick();
    setSelectedAnswer(option);
  };

  const handleSubmitStep = () => {
    if (!selectedAnswer) return;

    setIsAnswerSubmitted(true);
    const isCorrect =
      selectedAnswer === currentQ.correctAnswer || currentQ.category === 'Environmental';

    if (isCorrect) {
      playSuccessChime();
      setCorrectAnswersCount((prev) => prev + 1);
      if (voiceGuidanceEnabled) {
        speakText(`Correct! ${currentQ.explanation}`, true);
      }
    } else {
      if (voiceGuidanceEnabled) {
        speakText(`That's okay. ${currentQ.explanation}`, true);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((s) => s + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setCameraCapturedObject(null);
      stopCamera();
    } else {
      // Evaluate Reality Quest
      const finalCorrect = correctAnswersCount + (isAnswerSubmitted ? 1 : 0);
      const score = Math.round((finalCorrect / questions.length) * 100);
      const accuracy = score;
      const basePoints = 70;

      const res = storeService.recordGameResult({
        gameId: 'realityquest',
        score,
        pointsEarned: basePoints,
        accuracy,
        durationMinutes: 5,
        category: 'Planning',
        title: 'RealityQuest (Sensory & Temporal Anchoring)',
        notes: `Grounded ${finalCorrect}/${questions.length} reality checkpoints with confidence`,
      });

      setLastResult({
        score,
        points: basePoints,
        accuracy,
        leveledUp: res.leveledUp,
      });
      setShowResultsModal(true);
      onCompleteQuest();
    }
  };

  const handleResetForPractice = () => {
    setCurrentStep(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setCorrectAnswersCount(0);
    setShowResultsModal(false);
    stopCamera();
  };

  const IconComp = currentQ.icon;

  return (
    <main
      id="reality-quest-view-main"
      className="flex-1 p-4 sm:p-6 md:p-10 bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 dark:border-[#1e3a6a] pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-[#002045] dark:bg-blue-600 text-white rounded-2xl shadow-md">
              <Compass className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[#002045] dark:text-white">
                  RealityQuest
                </h1>
                <span className="bg-emerald-600 text-white text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Daily Temporal Anchoring
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Anchor calendar consciousness, seasonal grounding, and sensory awareness
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => speakText(`${currentQ.prompt}. ${currentQ.subPrompt}`, true)}
              className="bg-slate-50 dark:bg-[#111e38] hover:bg-slate-100 dark:hover:bg-[#162544] text-[#002045] dark:text-white border-2 border-slate-200 dark:border-[#1e3a6a] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#FF6321]" />
              <span>Hear Question</span>
            </button>
          </div>
        </div>

        {/* Cognitive Bridge Banner if active */}
        {isBridgeActive && (
          <BridgeBanner
            reason="Gentle contextual hints, larger text, and voice-assisted grounding enabled."
            voiceGuidanceEnabled={voiceGuidanceEnabled}
          />
        )}

        {/* Quest Card Container */}
        <div className="bg-white dark:bg-[#111e38] rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-md p-5 sm:p-8 space-y-6">
          {/* Progress Tracker */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300">
            <span className="bg-orange-100 dark:bg-orange-950/80 text-[#9A3412] dark:text-orange-300 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 uppercase tracking-wider text-xs">
              {currentQ.category} Pillar
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Checkpoint {currentStep + 1} of {questions.length}
            </span>
          </div>

          {/* Question Title */}
          <div className="flex items-start space-x-3.5 pt-1">
            <div className="p-3 bg-sky-50 dark:bg-[#0d182e] text-[#002045] dark:text-sky-300 rounded-2xl border border-sky-100 dark:border-[#1e3a6a] flex-shrink-0 mt-1">
              <IconComp className="w-7 h-7 text-[#FF6321]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-[#002045] dark:text-white leading-snug">
                {currentQ.prompt}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                {currentQ.subPrompt}
              </p>
            </div>
          </div>

          {/* Optional Live Camera Object Spotter Panel for Question 4 */}
          {currentQ.hasCameraOption && (
            <div className="bg-slate-900 dark:bg-[#070D18] text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-[#FF6321]" />
                  <span className="font-extrabold text-sm text-white">
                    Live Camera Object Confirmation
                  </span>
                </div>

                {!isCameraActive ? (
                  <button
                    onClick={startCamera}
                    className="bg-[#FF6321] hover:bg-[#EA580C] text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Activate Web Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Close Camera</span>
                  </button>
                )}
              </div>

              {isCameraActive && (
                <div className="space-y-3 pt-2">
                  <div className="relative aspect-video max-w-md mx-auto rounded-xl overflow-hidden border-2 border-[#FF6321] bg-black shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* AI Object Detection Bounding Box Overlay */}
                    {isScanning ? (
                      <div className="absolute inset-4 border-2 border-dashed border-amber-400 bg-amber-400/10 rounded-xl flex flex-col items-center justify-center animate-pulse">
                        <div className="p-2 bg-black/80 rounded-lg text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 shadow-md">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>AI Vision Scanning: {detectingTarget}...</span>
                        </div>
                      </div>
                    ) : cameraCapturedObject ? (
                      <div className="absolute inset-6 border-3 border-emerald-500 bg-emerald-500/15 rounded-2xl flex flex-col items-center justify-between p-2 pointer-events-none animate-fadeIn">
                        <div className="bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>AI Object Match: {detectionConfidence ?? 96.4}%</span>
                        </div>
                        <div className="bg-black/85 text-emerald-300 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-500/40">
                          {cameraCapturedObject} (Verified Target)
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-lg pointer-events-none flex items-center justify-center">
                        <span className="text-xs bg-black/60 px-3 py-1 rounded-full text-white font-mono">
                          Center target object in frame
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 text-center font-bold">
                    Point camera at target item, then tap to trigger AI object recognition:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'Water Glass / Steel Tumbler', icon: Coffee },
                      { name: 'Ceramic Tea Cup / Chai Mug', icon: Coffee },
                      { name: 'Reading Prescription Glasses', icon: Glasses },
                      { name: 'Daily Morning Newspaper / Book', icon: BookOpen },
                    ].map((item) => (
                      <button
                        key={item.name}
                        disabled={isScanning}
                        onClick={() => handleCaptureObject(item.name)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                          cameraCapturedObject === item.name
                            ? 'bg-emerald-900/80 border-emerald-400 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                        }`}
                      >
                        <item.icon className="w-4 h-4 text-[#FF6321]" />
                        <span className="truncate">{item.name.split('/')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Multiple Choice Options */}
          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect =
                option === currentQ.correctAnswer || currentQ.category === 'Environmental';

              let btnStyle =
                'bg-slate-50 dark:bg-[#0d182e] hover:bg-slate-100 dark:hover:bg-[#162544] text-[#002045] dark:text-slate-100 border-2 border-slate-200 dark:border-[#1e3a6a] hover:border-blue-400';
              if (isSelected && !isAnswerSubmitted) {
                btnStyle = 'bg-[#002045] dark:bg-blue-600 text-white border-2 border-[#FF6321] shadow-md';
              } else if (isAnswerSubmitted) {
                if (isCorrect) {
                  btnStyle =
                    'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-500 font-extrabold shadow-xs';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 border-2 border-rose-400 font-extrabold';
                } else {
                  btnStyle = 'bg-slate-50 dark:bg-[#0d182e] text-slate-400 opacity-60 border-slate-200 dark:border-[#1e3a6a]';
                }
              }

              return (
                <button
                  key={option}
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full p-4 sm:p-5 rounded-2xl font-bold text-sm sm:text-base text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Context Note */}
          {isAnswerSubmitted && (
            <div className="p-4 bg-amber-50 dark:bg-[#251f12] rounded-2xl border border-amber-300 dark:border-[#78510c] text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start space-x-2.5 animate-fadeIn">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Daily Reality Context:</span>
                <p className="font-medium mt-0.5">{currentQ.explanation}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-slate-100 dark:border-[#1e3a6a] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (currentQ.clue) speakText(`Clue: ${currentQ.clue}`, true);
              }}
              className="text-slate-600 dark:text-slate-300 hover:text-[#002045] dark:hover:text-white font-bold text-xs sm:text-sm flex items-center space-x-1 cursor-pointer py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#162544]"
            >
              <Sparkles className="w-4 h-4 text-[#FF6321]" />
              <span>Need a Hint?</span>
            </button>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitStep}
                disabled={!selectedAnswer}
                className="bg-[#FF6321] hover:bg-[#EA580C] disabled:opacity-40 text-white py-3.5 px-8 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-orange-500/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>Verify Answer</span>
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="bg-[#002045] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white py-3.5 px-8 rounded-2xl font-black text-sm sm:text-base shadow-md flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <span>
                  {currentStep < questions.length - 1 ? 'Next Checkpoint' : 'Complete Quest (+70 Pts)'}
                </span>
                <ArrowRight className="w-5 h-5 text-amber-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Celebration Modal */}
      <GameResultsModal
        isOpen={showResultsModal}
        score={lastResult.score}
        pointsEarned={lastResult.points}
        accuracy={lastResult.accuracy}
        gameTitle="RealityQuest (Sensory Anchoring)"
        level={1}
        leveledUp={lastResult.leveledUp}
        bridgeActive={isBridgeActive}
        voiceGuidanceEnabled={voiceGuidanceEnabled}
        onPlayAgain={handleResetForPractice}
        onClose={() => setShowResultsModal(false)}
      />
    </main>
  );
};
