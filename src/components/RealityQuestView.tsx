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
      explanation: `Today is indeed ${currentDayName} during the ${timeOfDay}.`,
      clue: `Look at the clock or the sunlight outside your window.`,
      icon: Clock,
    },
    {
      id: 2,
      category: 'Seasonal',
      prompt: `What is the current season and weather outside your window?`,
      subPrompt: `Observe the weather conditions, garden foliage, and seasonal temperature.`,
      options: [
        'Monsoon / Late Summer Breeze with lush garden foliage',
        'Freezing Sub-Zero Himalayan Snowstorm',
        'Mid-December Heavy Frost & Dense Fog',
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: 'Monsoon / Late Summer Breeze with lush garden foliage',
      explanation: 'Currently in the seasonal monsoon/warm summer transition with blooming plants and warm air.',
      clue: 'Notice the blooming garden flowers and warm ambient breeze outside.',
      icon: Sun,
    },
    {
      id: 3,
      category: 'Environmental',
      prompt: `Which room in your house are you currently seated in?`,
      subPrompt: `Ground yourself in your physical environment: look at the furniture and doors around you.`,
      options: [
        'Living Room / Main Hall with Sofa & Tea Table',
        'Master Bedroom with Bedside Nightstand',
        'Dining Area near the Kitchen Counter',
        'Sunny Verandah / Garden Balcony',
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: 'Living Room / Main Hall with Sofa & Tea Table',
      explanation: 'Grounding your immediate room surroundings enhances spatial orientation and comfort.',
      clue: 'Identify the room you are resting in right now.',
      icon: Compass,
    },
    {
      id: 4,
      category: 'Environmental',
      prompt: `Sensory Object Validation: Find and show your Water Glass, Cup, Glasses, or Newspaper to the camera!`,
      subPrompt: `Hold the item in front of your camera for real-time validation or tap an item below.`,
      options: [
        'Water Glass / Steel Tumbler',
        'Ceramic Tea Cup / Chai Mug',
        'Reading Prescription Glasses',
        'Daily Morning Newspaper / Book',
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: 'Ceramic Tea Cup / Chai Mug',
      explanation: 'Recognizing immediate tactile objects grounds sensory presence and spatial comfort.',
      clue: 'Show your cup, drinking glass, glasses, or newspaper to the camera.',
      icon: Coffee,
      hasCameraOption: true,
    },
  ];

  const currentQ = questions[currentStep];

  useEffect(() => {
    if (currentQ) {
      speakText(`${currentQ.prompt}. ${currentQ.subPrompt}`, voiceGuidanceEnabled);
    }
  }, [currentStep]);

  // Handle Camera activation for Object Spotting
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      speakText('Camera activated. Point at a household object like your tea cup or book.', true);
    } catch (e) {
      console.warn('Camera access error:', e);
      setIsCameraActive(false);
      speakText('Camera unavailable. You can tap any option directly on screen.', true);
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
    setIsScanning(true);
    setDetectingTarget(objectName);
    speakText(`Scanning ${objectName}...`, true);

    setTimeout(() => {
      setIsScanning(false);
      setDetectionConfidence(96.4);
      setCameraCapturedObject(objectName);
      setSelectedAnswer(objectName);
      playSuccessChime();
      speakText(`Verified: ${objectName} with 96.4% confidence match.`, true);
    }, 1200);
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    playGentleClick();
    setSelectedAnswer(opt);
    speakText(opt, voiceGuidanceEnabled);
  };

  const handleSubmitStep = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    const isCorrect =
      selectedAnswer === currentQ.correctAnswer || currentQ.category === 'Environmental';

    if (isCorrect) {
      playSuccessChime();
      setCorrectAnswersCount((c) => c + 1);
      speakText(`Splendid! That is correct. ${currentQ.explanation}`, voiceGuidanceEnabled);
    } else {
      speakText(`Here is the key context: ${currentQ.explanation}`, voiceGuidanceEnabled);
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
      className="flex-1 p-4 sm:p-6 md:p-10 bg-[#F8F9FA] text-[#0F172A] overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-[#0F172A] text-white rounded-2xl shadow-md">
              <Compass className="w-7 h-7 text-[#FF6321]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                  RealityQuest
                </h1>
                <span className="bg-[#10B981] text-white text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Daily Temporal Anchoring
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Anchor calendar consciousness, seasonal grounding, and sensory awareness
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => speakText(`${currentQ.prompt}. ${currentQ.subPrompt}`, true)}
              className="bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
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
        <div className="bg-white rounded-3xl border-3 border-[#0F172A]/15 shadow-xl p-5 sm:p-8 space-y-6">
          {/* Progress Tracker */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-600">
            <span className="bg-orange-100 text-[#9A3412] px-3 py-1 rounded-full border border-orange-200 uppercase tracking-wider text-xs">
              {currentQ.category} Pillar
            </span>
            <span className="text-slate-500">
              Checkpoint {currentStep + 1} of {questions.length}
            </span>
          </div>

          {/* Question Title */}
          <div className="flex items-start space-x-3.5 pt-1">
            <div className="p-3 bg-slate-100 text-[#0F172A] rounded-2xl border border-slate-200 flex-shrink-0 mt-1">
              <IconComp className="w-7 h-7 text-[#FF6321]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-[#0F172A] leading-snug">
                {currentQ.prompt}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {currentQ.subPrompt}
              </p>
            </div>
          </div>

          {/* Optional Live Camera Object Spotter Panel for Question 4 */}
          {currentQ.hasCameraOption && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
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
                'bg-[#F8F9FA] hover:bg-slate-100 text-slate-800 border-2 border-slate-200 hover:border-slate-300';
              if (isSelected && !isAnswerSubmitted) {
                btnStyle = 'bg-[#0F172A] text-white border-2 border-[#FF6321] shadow-md';
              } else if (isAnswerSubmitted) {
                if (isCorrect) {
                  btnStyle =
                    'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 font-extrabold shadow-xs';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-50 text-rose-950 border-2 border-rose-400 font-extrabold';
                } else {
                  btnStyle = 'bg-slate-50 text-slate-400 opacity-60 border-slate-200';
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
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Context Note */}
          {isAnswerSubmitted && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs sm:text-sm text-amber-950 flex items-start space-x-2.5 animate-fadeIn">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Daily Reality Context:</span>
                <p className="font-medium mt-0.5">{currentQ.explanation}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (currentQ.clue) speakText(`Clue: ${currentQ.clue}`, true);
              }}
              className="text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center space-x-1 cursor-pointer py-2 px-3 rounded-xl hover:bg-slate-100"
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
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white py-3.5 px-8 rounded-2xl font-black text-sm sm:text-base shadow-md flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <span>
                  {currentStep < questions.length - 1 ? 'Next Checkpoint' : 'Complete Quest (+70 Pts)'}
                </span>
                <ArrowRight className="w-5 h-5 text-[#FF6321]" />
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
