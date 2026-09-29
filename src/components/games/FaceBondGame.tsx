import React, { useState, useEffect } from 'react';
import {
  Heart,
  Users,
  Volume2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ZoomIn,
  Smile,
  X,
  Phone,
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { BridgeBanner } from '../BridgeBanner';
import { GameResultsModal } from '../GameResultsModal';
import { playGentleClick, playSuccessChime, speakText } from '../../utils/audio';
import type { FamilyMember } from '../../types';

interface FaceBondGameProps {
  currentLevel?: number;
  onComplete?: (score: number, points: number, accuracy: number, level: number) => void;
  onClose: () => void;
  voiceGuidanceEnabled?: boolean;
}

interface QuestionItem {
  id: string;
  type: 'face' | 'kinship' | 'memory';
  prompt: string;
  subPrompt: string;
  targetMember: FamilyMember;
  options: string[];
  correctAnswer: string;
  hint: string;
}

export const FaceBondGame: React.FC<FaceBondGameProps> = ({
  currentLevel = 2,
  onComplete,
  onClose,
  voiceGuidanceEnabled = true,
}) => {
  const [level, setLevel] = useState<number>(Math.min(4, Math.max(1, currentLevel)));
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    points: number;
    accuracy: number;
    leveledUp: boolean;
  }>({ score: 0, points: 0, accuracy: 0, leveledUp: false });

  const gameProgress = storeService.getGameProgress('facebond');
  const isBridgeActive = gameProgress?.activeBridge?.status === 'active';
  const familyMembers = storeService.getFamilyMembers();

  // Generate dynamic questions based on current level and family members
  useEffect(() => {
    generateQuestions();
  }, [level]);

  const generateQuestions = () => {
    const members = familyMembers.length > 0 ? familyMembers : storeService.getFamilyMembers();
    const qList: QuestionItem[] = [];

    if (level === 1) {
      // Level 1: Face to Name
      members.forEach((m, idx) => {
        const otherNames = members.filter((o) => o.id !== m.id).map((o) => o.name);
        const options = [m.name, otherNames[0] || 'Meera Devi', otherNames[1] || 'Suresh Kumar'].sort(
          () => 0.5 - Math.random()
        );
        qList.push({
          id: `lvl1-${idx}`,
          type: 'face',
          prompt: 'Look at the photograph. Who is this family member?',
          subPrompt: `Family Role: ${m.relation}`,
          targetMember: m,
          options,
          correctAnswer: m.name,
          hint: `They are your cherished ${m.relation}.`,
        });
      });
    } else if (level === 2) {
      // Level 2: Kinship & Role Relationship
      const allRelations = Array.from(
        new Set([...members.map((m) => m.relation), 'Grandson', 'Sister', 'Cousin', 'Uncle'])
      );

      members.forEach((m, idx) => {
        const otherRelations = allRelations.filter((r) => r.toLowerCase() !== m.relation.toLowerCase());
        const options = [m.relation, otherRelations[0] || 'Nephew', otherRelations[1] || 'Cousin'].sort(
          () => 0.5 - Math.random()
        );
        qList.push({
          id: `lvl2-${idx}`,
          type: 'kinship',
          prompt: `What is ${m.name}'s relationship to you?`,
          subPrompt: `Identify their exact kinship and generational bond in your household.`,
          targetMember: m,
          options,
          correctAnswer: m.relation,
          hint: `Consider your family tree and their generational ties with you.`,
        });
      });
    } else if (level === 3) {
      // Level 3: Episodic Memory Retrieval
      members.forEach((m, idx) => {
        const primaryMemory =
          m.keyMemories && m.keyMemories.length > 0
            ? m.keyMemories[0]
            : `Shares warm moments and calls you regularly.`;
        const otherNames = members.filter((o) => o.id !== m.id).map((o) => o.name);
        const options = [m.name, otherNames[0] || 'Sunita Verma', otherNames[1] || 'Rajiv Sharma'].sort(
          () => 0.5 - Math.random()
        );
        qList.push({
          id: `lvl3-${idx}`,
          type: 'memory',
          prompt: `Who shares this special episodic memory with you?`,
          subPrompt: `"${primaryMemory}"`,
          targetMember: m,
          options,
          correctAnswer: m.name,
          hint: `Their relation to you is ${m.relation}.`,
        });
      });
    } else {
      // Level 4: Smart Level Generator (Caregiver Portal dynamic family members & custom notes)
      members.forEach((m, idx) => {
        const isOdd = idx % 2 === 0;
        if (isOdd) {
          const otherNames = members.filter((o) => o.id !== m.id).map((o) => o.name);
          const options = [m.name, otherNames[0] || 'Aarav Sharma', otherNames[1] || 'Pooja Verma'].sort(
            () => 0.5 - Math.random()
          );
          const memory = m.keyMemories?.[1] || m.keyMemories?.[0] || 'Special family moments';
          qList.push({
            id: `lvl4-gen-${idx}`,
            type: 'memory',
            prompt: `Caregiver Dynamic Memory: Who is associated with "${memory}"?`,
            subPrompt: `Personalized memory recorded in your family care directory.`,
            targetMember: m,
            options,
            correctAnswer: m.name,
            hint: `Relation: ${m.relation}`,
          });
        } else {
          const otherRelations = ['Granddaughter', 'Son', 'Brother', 'Daughter-in-law'].filter(
            (r) => r.toLowerCase() !== m.relation.toLowerCase()
          );
          const options = [m.relation, otherRelations[0] || 'Friend', otherRelations[1] || 'Caregiver'].sort(
            () => 0.5 - Math.random()
          );
          qList.push({
            id: `lvl4-gen-${idx}`,
            type: 'kinship',
            prompt: `Smart Directory: What is ${m.name}'s recorded relationship to you?`,
            subPrompt: `Personalized profile from your family directory.`,
            targetMember: m,
            options,
            correctAnswer: m.relation,
            hint: `Their age is ${m.age} and lives in your family circle.`,
          });
        }
      });
    }

    setQuestions(qList);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setIsPhotoZoomed(false);

    if (qList[0]) {
      speakText(`${qList[0].prompt}. ${qList[0].subPrompt}`, voiceGuidanceEnabled);
    }
  };

  const handleSelectOption = (opt: string) => {
    playGentleClick();
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: opt }));
    speakText(opt, voiceGuidanceEnabled);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      const nextQ = questions[currentQIndex + 1];
      speakText(`${nextQ.prompt}. ${nextQ.subPrompt}`, voiceGuidanceEnabled);
    } else {
      evaluateResults();
    }
  };

  const evaluateResults = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const accuracy = score;
    const basePoints = 45;

    const res = storeService.recordGameResult({
      gameId: 'facebond',
      score,
      pointsEarned: basePoints,
      accuracy,
      durationMinutes: 4,
      category: 'Memory',
      title: `FaceBond (Family Kinship Level ${level})`,
      notes: `Correctly recalled ${correctCount}/${questions.length} family bonds`,
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

  const currentQ = questions[currentQIndex];
  if (!currentQ) return null;

  const selectedAnswer = selectedAnswers[currentQIndex];
  const isAnswered = selectedAnswer !== undefined;

  // Bridge option filter: eliminate 1 distractor
  const optionsToRender = React.useMemo(() => {
    if (!isBridgeActive || currentQ.options.length <= 2) return currentQ.options;
    const wrong = currentQ.options.filter((o) => o !== currentQ.correctAnswer);
    return [currentQ.correctAnswer, wrong[0]].sort();
  }, [currentQ, isBridgeActive]);

  return (
    <div
      id="facebond-game-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="facebond-game-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F9FA] text-[#0F172A] w-full max-w-4xl rounded-3xl shadow-2xl border-3 border-[#0F172A]/20 overflow-hidden flex flex-col max-h-[94vh] my-auto"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-5 sm:px-7 py-4 flex items-center justify-between shadow-md border-b-3 border-[#FF6321]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-[#FF6321] to-[#EA580C] text-white rounded-2xl shadow-md">
              <Heart className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  FaceBond
                </h2>
                <span className="bg-[#FF6321] text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Kinship & Face Recognition
                </span>
                <span className="bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Level {level} of 4
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Recognize family portraits, kinship ties, and fond memories
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close FaceBond"
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Cognitive Bridge Banner if active */}
          {isBridgeActive && (
            <BridgeBanner
              reason="Highlighted relationship badges, voice greeting previews, and eliminated distractors enabled."
              voiceGuidanceEnabled={voiceGuidanceEnabled}
            />
          )}

          {/* Level Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-slate-500">
                Cognitive Depth:
              </span>
              <div className="flex space-x-1.5 flex-wrap gap-y-1">
                {[
                  { lvl: 1, label: 'L1: Face to Name' },
                  { lvl: 2, label: 'L2: Kinship Roles' },
                  { lvl: 3, label: 'L3: Episodic Recall' },
                  { lvl: 4, label: 'L4: Smart Generator' },
                ].map((item) => (
                  <button
                    key={item.lvl}
                    onClick={() => setLevel(item.lvl)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      level === item.lvl
                        ? 'bg-[#FF6321] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  speakText(
                    `Question ${currentQIndex + 1}: ${currentQ.prompt}. ${currentQ.subPrompt}`,
                    true
                  );
                }}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#FF6321]" />
                <span>Read Aloud</span>
              </button>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-slate-600">
              <span>
                Family Member {currentQIndex + 1} of {questions.length}
              </span>
              <span className="text-[#FF6321]">
                {Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6321] to-[#EA580C] transition-all duration-300"
                style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Interactive Photo & Kinship Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left: Photo Portrait with Zoom & Voice Greeting */}
            <div className="md:col-span-5 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative group w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden shadow-md border-4 border-[#F8F9FA] mb-3">
                <img
                  src={currentQ.targetMember.photoUrl}
                  alt={currentQ.targetMember.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isPhotoZoomed ? 'scale-125' : 'group-hover:scale-105'
                  }`}
                />
                <button
                  onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
                  className="absolute bottom-2.5 right-2.5 bg-[#0F172A]/80 hover:bg-[#0F172A] text-white p-2 rounded-xl backdrop-blur-xs text-xs font-bold flex items-center space-x-1 transition-transform active:scale-95"
                  title="Toggle Photo Zoom"
                >
                  <ZoomIn className="w-4 h-4 text-[#FF6321]" />
                  <span>{isPhotoZoomed ? 'Zoom Out' : 'Zoom'}</span>
                </button>
              </div>

              {/* Kinship Pill */}
              <div className="flex items-center space-x-2 mb-2 flex-wrap justify-center">
                <span className="bg-orange-100 text-[#9A3412] text-xs font-black px-3 py-1 rounded-full border border-orange-200">
                  {currentQ.targetMember.relation}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Age {currentQ.targetMember.age}
                </span>
              </div>

              {/* Audio Voice Note Player Button */}
              {currentQ.targetMember.voiceNote && (
                <button
                  onClick={() => {
                    speakText(currentQ.targetMember.voiceNote, true);
                  }}
                  className="w-full mt-2 bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-2 border-amber-300 p-2.5 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4 text-[#FF6321]" />
                  <span>Hear Voice Greeting Note</span>
                </button>
              )}
            </div>

            {/* Right: Question & Multiple Choice Options */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {level === 1 ? 'Facial Identity' : level === 2 ? 'Family Kinship' : 'Shared Recollection'}
                </span>
                <h3 className="text-base sm:text-xl font-black text-[#0F172A]">
                  {currentQ.prompt}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {currentQ.subPrompt}
                </p>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5 pt-2">
                  {optionsToRender.map((opt) => {
                    const isSelected = selectedAnswer === opt;
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
                        <span className="font-extrabold">{opt}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-[#FF6321] flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Clue if Bridge Active */}
                {isBridgeActive && currentQ.hint && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-bold flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Gentle Kinship Clue: {currentQ.hint}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-100 px-5 sm:px-7 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={generateQuestions}
            className="text-slate-700 hover:text-[#0F172A] font-black text-xs sm:text-sm flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Exercise</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="bg-[#FF6321] hover:bg-[#EA580C] disabled:opacity-40 text-white py-3 px-7 rounded-2xl font-black text-sm sm:text-base shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
          >
            <span>
              {currentQIndex < questions.length - 1
                ? 'Next Family Member'
                : 'Complete FaceBond (+45 Pts)'}
            </span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Results Modal */}
        <GameResultsModal
          isOpen={showResultsModal}
          score={lastResult.score}
          pointsEarned={lastResult.points}
          accuracy={lastResult.accuracy}
          gameTitle="FaceBond (Family Kinship)"
          level={level}
          leveledUp={lastResult.leveledUp}
          bridgeActive={isBridgeActive}
          voiceGuidanceEnabled={voiceGuidanceEnabled}
          onPlayAgain={generateQuestions}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
