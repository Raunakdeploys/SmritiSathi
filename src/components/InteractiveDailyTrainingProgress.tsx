import React, { useState } from 'react';
import type { UserProfile, CognitiveProgress } from '../types';
import { playGentleClick, playSuccessChime, speakText } from '../utils/audio';
import { storeService } from '../services/storeService';
import confetti from 'canvas-confetti';
import {
  Brain,
  Compass,
  CheckCircle2,
  Sparkles,
  Volume2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Play,
  Award,
  Zap,
  RotateCcw,
  ArrowUpRight,
  Target,
  Activity,
  Trophy,
} from 'lucide-react';

interface InteractiveDailyTrainingProgressProps {
  user: UserProfile | null;
  progress: CognitiveProgress | null;
  onPlayGame: (gameId: string) => void;
  onStartDailyTraining: () => void;
}

interface QuickDrill {
  id: string;
  domain: 'memory' | 'spatial' | 'planning' | 'attention';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUICK_DRILLS: Record<string, QuickDrill> = {
  memory: {
    id: 'drill-memory',
    domain: 'memory',
    question: 'Kinship Recall: Who is your designated primary caregiver & family support?',
    options: ['Rohan Sharma (Son)', 'Unknown Neighbor', 'Courier Agent', 'Dr. Verma'],
    correctIndex: 0,
    explanation: 'Rohan Sharma is your caring son and primary family emergency contact.',
  },
  spatial: {
    id: 'drill-spatial',
    domain: 'spatial',
    question: 'Orientation: In which direction does the morning sun rise over your home?',
    options: ['North', 'East', 'West', 'South'],
    correctIndex: 1,
    explanation: 'The morning sun always rises in the East.',
  },
  planning: {
    id: 'drill-planning',
    domain: 'planning',
    question: 'Daily Routine: What is the safest sequence before stepping out for an evening walk?',
    options: ['Wear comfortable footwear & carry house keys', 'Leave stove on', 'Ignore walking stick', 'Turn off all porch lights'],
    correctIndex: 0,
    explanation: 'Checking comfortable walking shoes and carrying house keys maintains safety.',
  },
  attention: {
    id: 'drill-attention',
    domain: 'attention',
    question: 'Visual Focus: Which shape does NOT belong in a set of tea cups?',
    options: ['Ceramic Mug', 'Porcelain Chai Cup', 'Metal Teaspoon', 'Clay Kulhar Cup'],
    correctIndex: 2,
    explanation: 'The teaspoon is a utensil, while the rest are drinking vessels.',
  },
};

export const InteractiveDailyTrainingProgress: React.FC<InteractiveDailyTrainingProgressProps> = ({
  user,
  progress,
  onPlayGame,
  onStartDailyTraining,
}) => {
  const [activeTab, setActiveTab] = useState<'domains' | 'checklist' | 'trajectory'>('domains');
  const [expandedDomain, setExpandedDomain] = useState<string | null>('memory');
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'memory' | 'spatial' | 'planning' | 'attention'>('overall');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>({});
  const [drillCompleted, setDrillCompleted] = useState<Record<string, boolean>>({});

  // Interactive Checklist states
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'Morning Reality Orientation Quest', domain: 'Planning', completed: true, points: 30 },
    { id: 'c2', label: 'Kinship & FaceBond Family Recall', domain: 'Memory', completed: true, points: 40 },
    { id: 'c3', label: 'WayBack Neighborhood Route Drill', domain: 'Spatial', completed: false, points: 35 },
    { id: 'c4', label: 'Shape Sorter & Attention Focus', domain: 'Attention', completed: false, points: 35 },
  ]);

  // Scores
  const memoryPct = progress?.memory ?? 85;
  const spatialPct = progress?.spatial ?? 82;
  const planningPct = progress?.planning ?? 75;
  const attentionPct = progress?.attention ?? 78;

  const averageScore = Math.round((memoryPct + spatialPct + planningPct + attentionPct) / 4);

  // Read status aloud for accessibility
  const handleReadStatus = () => {
    playGentleClick();
    const msg = `Daily Cognitive Progress Summary: Overall stability is ${averageScore} percent. Memory score is ${memoryPct} percent. Spatial orientation is ${spatialPct} percent. Executive planning is ${planningPct} percent. Attention focus is ${attentionPct} percent. Keep up your active daily routine!`;
    speakText(msg, true);
  };

  // Toggle checklist item interactively
  const handleToggleChecklist = (id: string) => {
    playGentleClick();
    setChecklist((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.completed;
          if (nextState) {
            playSuccessChime();
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
            // Award mind points
            storeService.updateUser({
              totalMindPoints: (user?.totalMindPoints || user?.mindPoints || 1240) + item.points,
            });
          }
          return { ...item, completed: nextState };
        }
        return item;
      });

      const allDone = updated.every((item) => item.completed);
      if (allDone) {
        storeService.updateUser({ dailyGoalCompleted: true });
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      }
      return updated;
    });
  };

  // Handle answering an inline quick drill
  const handleAnswerDrill = (domainKey: string, optionIndex: number) => {
    const drill = QUICK_DRILLS[domainKey];
    if (!drill) return;

    setSelectedAnswers((prev) => ({ ...prev, [domainKey]: optionIndex }));
    playGentleClick();

    if (optionIndex === drill.correctIndex) {
      playSuccessChime();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setDrillCompleted((prev) => ({ ...prev, [domainKey]: true }));

      // Boost specific cognitive domain
      const updates: Partial<CognitiveProgress> = {};
      if (domainKey === 'memory') updates.memory = Math.min(100, memoryPct + 4);
      if (domainKey === 'spatial') updates.spatial = Math.min(100, spatialPct + 4);
      if (domainKey === 'planning') updates.planning = Math.min(100, planningPct + 4);
      if (domainKey === 'attention') updates.attention = Math.min(100, attentionPct + 4);

      storeService.updateProgress(updates);
      storeService.updateUser({
        totalMindPoints: (user?.totalMindPoints || user?.mindPoints || 1240) + 25,
      });

      // Log activity
      storeService.recordGameResult({
        gameId: domainKey === 'memory' ? 'facebond' : domainKey === 'spatial' ? 'wayback' : domainKey === 'planning' ? 'dailyroutine' : 'shape-sorter',
        score: 100,
        pointsEarned: 25,
        accuracy: 100,
        durationMinutes: 2,
        category: domainKey === 'memory' ? 'Memory' : domainKey === 'spatial' ? 'Spatial' : domainKey === 'planning' ? 'Planning' : 'Attention',
        title: `Interactive ${domainKey.charAt(0).toUpperCase() + domainKey.slice(1)} Mini-Drill`,
        notes: `Correctly answered: "${drill.question}"`,
      });
    }
  };

  const domains = [
    {
      key: 'memory',
      title: 'Memory & Kinship Recall',
      subtitle: 'FaceBond & LifeThread Milestones',
      score: memoryPct,
      color: '#EA580C',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      barColor: 'bg-orange-600',
      gameId: 'facebond',
      rationale: 'Stimulates temporal lobe reminiscence and family identity recognition.',
    },
    {
      key: 'spatial',
      title: 'Spatial Orientation & GPS',
      subtitle: 'WayBack Landmark Navigation',
      score: spatialPct,
      color: '#0F172A',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-300',
      barColor: 'bg-[#0F172A]',
      gameId: 'wayback',
      rationale: 'Reinforces hippocampal spatial mapping and local neighborhood wayfinding.',
    },
    {
      key: 'planning',
      title: 'Executive Routine & Daily Living',
      subtitle: 'DailyRoutine & TimeSense Sequencing',
      score: planningPct,
      color: '#0284C7',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      barColor: 'bg-sky-600',
      gameId: 'dailyroutine',
      rationale: 'Enhances frontal lobe executive planning for medicine and daily habits.',
    },
    {
      key: 'attention',
      title: 'Attention & Visual Focus',
      subtitle: 'Shape Sorter & Pattern Sorting',
      score: attentionPct,
      color: '#059669',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      barColor: 'bg-emerald-600',
      gameId: 'shape-sorter',
      rationale: 'Sharpens parietal visual discrimination and active reaction speed.',
    },
  ];

  // 7-Day History Simulation
  const weeklyData = [
    { day: 'Mon', score: 78, sessions: 2 },
    { day: 'Tue', score: 82, sessions: 3 },
    { day: 'Wed', score: 80, sessions: 2 },
    { day: 'Thu', score: 85, sessions: 3 },
    { day: 'Fri', score: 84, sessions: 2 },
    { day: 'Sat', score: 88, sessions: 4 },
    { day: 'Today', score: averageScore, sessions: 3, isToday: true },
  ];

  return (
    <div
      id="card-daily-progress"
      className="bg-[#f9f9ff] p-5 sm:p-7 rounded-2xl border-2 border-[#c4c6cf] shadow-sm transition-all space-y-6"
    >
      {/* Header Section with Live Status & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d5e2e9]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#002045] text-white flex items-center justify-center shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-[22px] sm:text-[24px] text-[#002045] leading-snug">
                Daily Cognitive Training Progress
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-[#43474e]">
                  Stability Index: <strong className="text-[#002045] font-extrabold">{averageScore}%</strong> • Level Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-voice-read-progress"
            onClick={handleReadStatus}
            title="Listen to cognitive summary"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[#002045] bg-[#e7eeff] hover:bg-[#d6e3ff] rounded-xl transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#002045]" />
            <span className="hidden sm:inline">Voice Summary</span>
          </button>

          <button
            id="btn-quick-train-all"
            onClick={() => {
              playGentleClick();
              onStartDailyTraining();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#002045] hover:bg-[#1a365d] active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Full Workout</span>
          </button>
        </div>
      </div>

      {/* Premium Interactive Progress Hero Bar */}
      <div className="bg-gradient-to-br from-[#ffffff] to-[#f4f7fb] p-5 rounded-2xl border border-[#d2ddee] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#002045] text-white rounded-xl shadow-xs">
              <Activity className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#002045]">
                  {selectedMetric === 'overall'
                    ? 'Combined Cognitive Stability Index'
                    : selectedMetric === 'memory'
                    ? 'Memory Recall & Kinship'
                    : selectedMetric === 'spatial'
                    ? 'Spatial Navigation & Landmarks'
                    : selectedMetric === 'planning'
                    ? 'Executive Function & Routine'
                    : 'Attention & Visual Focus'}
                </span>
                <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-600" />
                  {selectedMetric === 'overall' && averageScore >= 80 ? 'Optimal Baseline' : 'Good Focus'}
                </span>
              </div>
              <p className="text-xs text-[#526071] mt-0.5">
                {selectedMetric === 'overall'
                  ? 'Real-time multi-domain score dynamically weighted across daily mental drills.'
                  : selectedMetric === 'memory'
                  ? 'Temporal lobe capacity calibrated from FaceBond kin recognition & recall.'
                  : selectedMetric === 'spatial'
                  ? 'Hippocampal spatial acuity calibrated from WayBack navigation.'
                  : selectedMetric === 'planning'
                  ? 'Frontal lobe executive planning calibrated from daily routine sequencing.'
                  : 'Parietal visual discrimination calibrated from shape and color puzzles.'}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 self-end sm:self-auto">
            <span className="text-3xl font-black text-[#002045] tracking-tight">
              {selectedMetric === 'overall'
                ? averageScore
                : selectedMetric === 'memory'
                ? memoryPct
                : selectedMetric === 'spatial'
                ? spatialPct
                : selectedMetric === 'planning'
                ? planningPct
                : attentionPct}
              %
            </span>
            <span className="text-xs font-bold text-[#627285]">/ 100%</span>
          </div>
        </div>

        {/* Dynamic Interactive Segmented Progress Bar */}
        <div className="space-y-2">
          <div className="relative w-full bg-[#e3ebf6] h-4 rounded-full overflow-hidden p-0.5 shadow-inner flex">
            {selectedMetric === 'overall' ? (
              <>
                <div
                  title={`Memory: ${memoryPct}%`}
                  className="bg-orange-500 h-full rounded-l-full transition-all duration-700 hover:brightness-110 cursor-pointer"
                  style={{ width: `${(memoryPct / 4).toFixed(1)}%` }}
                  onClick={() => setSelectedMetric('memory')}
                />
                <div
                  title={`Spatial: ${spatialPct}%`}
                  className="bg-[#0F172A] h-full transition-all duration-700 hover:brightness-125 cursor-pointer"
                  style={{ width: `${(spatialPct / 4).toFixed(1)}%` }}
                  onClick={() => setSelectedMetric('spatial')}
                />
                <div
                  title={`Planning: ${planningPct}%`}
                  className="bg-sky-500 h-full transition-all duration-700 hover:brightness-110 cursor-pointer"
                  style={{ width: `${(planningPct / 4).toFixed(1)}%` }}
                  onClick={() => setSelectedMetric('planning')}
                />
                <div
                  title={`Attention: ${attentionPct}%`}
                  className="bg-emerald-500 h-full rounded-r-full transition-all duration-700 hover:brightness-110 cursor-pointer"
                  style={{ width: `${(attentionPct / 4).toFixed(1)}%` }}
                  onClick={() => setSelectedMetric('attention')}
                />
              </>
            ) : (
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  selectedMetric === 'memory'
                    ? 'bg-orange-500'
                    : selectedMetric === 'spatial'
                    ? 'bg-[#0F172A]'
                    : selectedMetric === 'planning'
                    ? 'bg-sky-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${
                    selectedMetric === 'memory'
                      ? memoryPct
                      : selectedMetric === 'spatial'
                      ? spatialPct
                      : selectedMetric === 'planning'
                      ? planningPct
                      : attentionPct
                  }%`,
                }}
              />
            )}
          </div>

          {/* Metric Selector Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  playGentleClick();
                  setSelectedMetric('overall');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMetric === 'overall'
                    ? 'bg-[#002045] text-white shadow-xs'
                    : 'bg-[#eef2f9] text-[#43474e] hover:bg-[#e2e8f0]'
                }`}
              >
                Combined ({averageScore}%)
              </button>
              <button
                onClick={() => {
                  playGentleClick();
                  setSelectedMetric('memory');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedMetric === 'memory'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Memory {memoryPct}%
              </button>
              <button
                onClick={() => {
                  playGentleClick();
                  setSelectedMetric('spatial');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedMetric === 'spatial'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#0F172A]" />
                Spatial {spatialPct}%
              </button>
              <button
                onClick={() => {
                  playGentleClick();
                  setSelectedMetric('planning');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedMetric === 'planning'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Planning {planningPct}%
              </button>
              <button
                onClick={() => {
                  playGentleClick();
                  setSelectedMetric('attention');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedMetric === 'attention'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Attention {attentionPct}%
              </button>
            </div>

            <span className="text-[11px] text-[#64748b] font-medium hidden md:inline">
              Click any pillar to inspect focus
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center p-1 bg-[#eef2f9] rounded-xl border border-[#d5e2e9] text-sm font-bold">
        <button
          id="tab-domain-drills"
          onClick={() => {
            playGentleClick();
            setActiveTab('domains');
          }}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'domains'
              ? 'bg-white text-[#002045] shadow-xs font-extrabold'
              : 'text-[#43474e] hover:text-[#002045]'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Cognitive Pillars</span>
        </button>

        <button
          id="tab-daily-checklist"
          onClick={() => {
            playGentleClick();
            setActiveTab('checklist');
          }}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-white text-[#002045] shadow-xs font-extrabold'
              : 'text-[#43474e] hover:text-[#002045]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Routine Checklist</span>
          <span className="bg-[#ffdeaa] text-[#2d1d00] text-xs px-2 py-0.5 rounded-full font-black">
            {checklist.filter((i) => i.completed).length}/{checklist.length}
          </span>
        </button>

        <button
          id="tab-weekly-trajectory"
          onClick={() => {
            playGentleClick();
            setActiveTab('trajectory');
          }}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'trajectory'
              ? 'bg-white text-[#002045] shadow-xs font-extrabold'
              : 'text-[#43474e] hover:text-[#002045]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Trend</span>
        </button>
      </div>

      {/* TAB 1: COGNITIVE PILLARS & INTERACTIVE MINI DRILLS */}
      {activeTab === 'domains' && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-sm text-[#43474e] font-medium">
            Tap any cognitive domain to reveal its clinical target, play an instant 30-second mini-drill, or launch the complete training game:
          </p>

          <div className="space-y-3.5">
            {domains.map((dom) => {
              const isExpanded = expandedDomain === dom.key;
              const drill = QUICK_DRILLS[dom.key];
              const selectedAnswer = selectedAnswers[dom.key];
              const isDrillSolved = drillCompleted[dom.key];

              return (
                <div
                  key={dom.key}
                  id={`domain-card-${dom.key}`}
                  className={`rounded-xl border transition-all ${
                    isExpanded ? `${dom.borderColor} ${dom.bgColor} shadow-sm` : 'border-[#d5e2e9] bg-white hover:border-[#adc7f7]'
                  }`}
                >
                  {/* Domain Header Row */}
                  <div
                    onClick={() => {
                      playGentleClick();
                      setExpandedDomain(isExpanded ? null : dom.key);
                    }}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-[17px] sm:text-[18px] text-[#002045] flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: dom.color }}
                          ></span>
                          {dom.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[18px] text-[#002045]">
                            {dom.score}%
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white border border-[#c4c6cf] text-[#43474e]">
                            {dom.score >= 80 ? 'Optimal' : dom.score >= 65 ? 'Stable' : 'Needs Practice'}
                          </span>
                        </div>
                      </div>

                      {/* Smooth Progress Bar */}
                      <div className="w-full bg-[#d5e2e9] h-3.5 rounded-full overflow-hidden">
                        <div
                          className={`h-3.5 rounded-full transition-all duration-700 ease-out ${dom.barColor}`}
                          style={{ width: `${Math.min(100, Math.max(10, dom.score))}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[#002045] p-1 rounded-lg hover:bg-black/5">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Interactive Mini-Drill Accordion */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-black/5 space-y-3">
                      <p className="text-xs text-[#43474e] italic">
                        {dom.rationale}
                      </p>

                      {/* Mini Drill Box */}
                      {drill && (
                        <div className="bg-white p-3.5 rounded-xl border border-[#d5e2e9] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-[#002045] flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              Instant 30-Sec Cognitive Drill (+25 pts)
                            </span>
                            {isDrillSolved && (
                              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Solved!
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-[15px] text-[#002045]">
                            {drill.question}
                          </p>

                          {/* Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {drill.options.map((opt, idx) => {
                              const isSelected = selectedAnswer === idx;
                              const isCorrect = idx === drill.correctIndex;
                              let btnStyle = 'border-[#d5e2e9] bg-[#f9f9ff] text-[#002045] hover:bg-[#e7eeff]';

                              if (selectedAnswer !== null && selectedAnswer !== undefined) {
                                if (isCorrect) {
                                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                                } else if (isSelected) {
                                  btnStyle = 'border-rose-300 bg-rose-50 text-rose-800';
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  id={`drill-btn-${dom.key}-${idx}`}
                                  disabled={isDrillSolved}
                                  onClick={() => handleAnswerDrill(dom.key, idx)}
                                  className={`p-2.5 text-left rounded-lg text-sm border font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                                >
                                  <span>{opt}</span>
                                  {selectedAnswer !== null && selectedAnswer !== undefined && isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation if answered */}
                          {selectedAnswer !== null && selectedAnswer !== undefined && (
                            <p className="text-xs text-[#43474e] pt-1">
                              💡 <strong>Explanation:</strong> {drill.explanation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Game Launch Shortcut */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-[#43474e]">
                          Ready for comprehensive training?
                        </span>
                        <button
                          id={`btn-launch-game-${dom.gameId}`}
                          onClick={() => {
                            playGentleClick();
                            onPlayGame(dom.gameId);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#002045] hover:bg-[#1a365d] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Launch {dom.subtitle.split(' ')[0]}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE DAILY ROUTINE CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#43474e] font-medium">
              Complete these micro-drills to anchor orientation and boost daily mind points:
            </p>
            <span className="text-xs font-extrabold text-[#002045] bg-[#e7eeff] px-2.5 py-1 rounded-lg">
              Daily Goal: {checklist.filter((i) => i.completed).length === checklist.length ? '100% Complete! 🎉' : 'In Progress'}
            </span>
          </div>

          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                id={`checklist-item-${item.id}`}
                onClick={() => handleToggleChecklist(item.id)}
                className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer select-none ${
                  item.completed
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-white border-[#d5e2e9] hover:border-[#002045] text-[#002045]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      item.completed ? 'bg-emerald-600 text-white' : 'border-2 border-[#c4c6cf]'
                    }`}
                  >
                    {item.completed && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`font-bold text-[16px] ${item.completed ? 'line-through text-slate-500' : 'text-[#002045]'}`}>
                      {item.label}
                    </p>
                    <span className="text-xs text-[#43474e] font-medium">
                      Cognitive Domain: {item.domain}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    item.completed ? 'bg-emerald-200 text-emerald-900' : 'bg-[#ffdeaa] text-[#2d1d00]'
                  }`}>
                    +{item.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Celebration Footer */}
          <div className="bg-[#fff7ed] p-4 rounded-xl border border-[#ffedd5] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-[#EA580C]" />
              <div>
                <h4 className="font-extrabold text-[15px] text-[#0F172A]">Streak Multiplier Active</h4>
                <p className="text-xs text-[#9A3412]">
                  Completing today preserves your <strong>{user?.currentStreak || user?.dailyStreak || 6}-day streak</strong>.
                </p>
              </div>
            </div>
            <button
              id="btn-full-workout-from-checklist"
              onClick={() => {
                playGentleClick();
                onStartDailyTraining();
              }}
              className="px-3 py-2 bg-[#002045] text-white text-xs font-bold rounded-lg hover:bg-[#1a365d] transition-colors cursor-pointer"
            >
              Start Guided Drill
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: WEEKLY TRAJECTORY & CHART */}
      {activeTab === 'trajectory' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-[17px] text-[#002045]">7-Day Cognitive Stability Trend</h3>
              <p className="text-xs text-[#43474e]">Normalized composite score across all four active domains</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              ↑ 8% Higher vs Last Week
            </span>
          </div>

          {/* Interactive Bar Visualization */}
          <div className="bg-white p-5 rounded-xl border border-[#d5e2e9] space-y-4">
            <div className="h-40 flex items-end justify-between gap-2 pt-6 px-2">
              {weeklyData.map((d, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#002045] text-white text-[11px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                    {d.score}% ({d.sessions} drills)
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-[#f0f3ff] rounded-t-lg flex items-end h-32 overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-110 ${
                        d.isToday ? 'bg-[#002045]' : 'bg-[#708db7]'
                      }`}
                      style={{ height: `${d.score}%` }}
                    ></div>
                  </div>

                  {/* Day Label */}
                  <span className={`text-xs font-bold ${d.isToday ? 'text-[#002045] font-black underline' : 'text-[#43474e]'}`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#eef2f9] flex flex-wrap items-center justify-between text-xs text-[#43474e]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#002045]"></span>
                <span>Today's Score ({averageScore}%)</span>
                <span className="w-3 h-3 rounded-sm bg-[#708db7] ml-2"></span>
                <span>Prior Days (Avg 82%)</span>
              </div>
              <span className="font-semibold text-[#002045]">
                Consistency: High (All 7 days logged)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
