import React, { useState } from 'react';
import type { UserProfile, CognitiveProgress } from '../types';
import { playSuccessChime, playGentleClick, speakText } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DailyTrainingModalProps {
  user: UserProfile | null;
  progress: CognitiveProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (gameId: string) => void;
  onToggleDrillComplete: (drillId: string) => void;
}

export const DailyTrainingModal: React.FC<DailyTrainingModalProps> = ({
  user,
  progress,
  isOpen,
  onClose,
  onStartGame,
  onToggleDrillComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'drills' | 'schedule' | 'coaching'>('drills');
  const [streakCelebration, setStreakCelebration] = useState(false);

  if (!isOpen) return null;

  const handleCelebrate = () => {
    setStreakCelebration(true);
    playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => setStreakCelebration(false), 3000);
  };

  const streakDays = progress?.streakDays || 5;
  const completedToday = progress?.dailyDrillsCompleted || 2;
  const totalDaily = 4;
  const progressPercent = Math.round((completedToday / totalDaily) * 100);

  const drills = [
    {
      id: 'morning_orientation',
      title: 'Morning Reality & Date Check',
      category: 'Orientation & Time',
      duration: '3 mins',
      completed: true,
      gameId: 'memory_vault',
      icon: '☀️',
      difficulty: 'Gentle',
    },
    {
      id: 'face_recall',
      title: 'Family Face & Name Warmup',
      category: 'Facial Memory',
      duration: '5 mins',
      completed: true,
      gameId: 'face_match',
      icon: '👥',
      difficulty: 'Easy',
    },
    {
      id: 'pattern_focus',
      title: 'Color & Pattern Sequences',
      category: 'Executive Function',
      duration: '4 mins',
      completed: false,
      gameId: 'simon_memory',
      icon: '🧩',
      difficulty: 'Medium',
    },
    {
      id: 'evening_story',
      title: 'Nostalgic Story Audio Recall',
      category: 'Auditory Memory',
      duration: '6 mins',
      completed: false,
      gameId: 'story_recall',
      icon: '📻',
      difficulty: 'Relaxing',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-training-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#0d172e] border-2 border-slate-200 dark:border-[#1e3a6a] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🎯
            </div>
            <div>
              <h2 id="daily-training-modal-title" className="text-xl font-bold tracking-tight text-white">
                Daily Brain Workout Protocol
              </h2>
              <p className="text-blue-100 text-xs font-medium">
                Personalized for {user?.name || 'Sadhana Ji'} • Designed for MCI Neuroplasticity
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all focus:outline-hidden focus:ring-2 focus:ring-white"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Streak & Progress Ribbon */}
        <div className="bg-blue-50 dark:bg-[#111f3d] p-4 border-b border-blue-100 dark:border-[#1e3a6a] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCelebrate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-900 dark:text-amber-300 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
              title="Click to celebrate streak!"
            >
              🔥 <span className="underline">{streakDays} Day Active Streak</span>
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {completedToday} of {totalDaily} completed today ({progressPercent}%)
            </span>
          </div>

          <div className="w-32 bg-slate-200 dark:bg-[#1e3a6a] h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#1e3a6a] bg-slate-100 dark:bg-[#0a1122] px-6 pt-3 gap-2">
          <button
            onClick={() => {
              playGentleClick();
              setActiveTab('drills');
            }}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all ${
              activeTab === 'drills'
                ? 'bg-white dark:bg-[#0d172e] text-blue-700 dark:text-sky-300 border-t-2 border-x-2 border-slate-200 dark:border-[#1e3a6a]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            📋 Today's Drills
          </button>
          <button
            onClick={() => {
              playGentleClick();
              setActiveTab('schedule');
            }}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-[#0d172e] text-blue-700 dark:text-sky-300 border-t-2 border-x-2 border-slate-200 dark:border-[#1e3a6a]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ⏰ Daily Rhythm
          </button>
          <button
            onClick={() => {
              playGentleClick();
              setActiveTab('coaching');
            }}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all ${
              activeTab === 'coaching'
                ? 'bg-white dark:bg-[#0d172e] text-blue-700 dark:text-sky-300 border-t-2 border-x-2 border-slate-200 dark:border-[#1e3a6a]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            💡 AI Neuro-Tips
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50 dark:bg-[#070e1c]">
          {activeTab === 'drills' && (
            <div className="space-y-3">
              {drills.map((drill) => (
                <div
                  key={drill.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    drill.completed
                      ? 'bg-white dark:bg-[#111f3d] border-emerald-300 dark:border-emerald-600/50 shadow-xs'
                      : 'bg-white dark:bg-[#0f1b36] border-slate-200 dark:border-[#1e3a6a] hover:border-blue-400 dark:hover:border-blue-500 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => onToggleDrillComplete(drill.id)}
                      className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all ${
                        drill.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-[#192847] border-slate-300 dark:border-[#2a4d85] text-transparent hover:border-emerald-500'
                      }`}
                      aria-label={`Mark ${drill.title} as ${drill.completed ? 'incomplete' : 'complete'}`}
                    >
                      ✓
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{drill.icon}</span>
                        <h4 className={`font-bold text-sm ${drill.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {drill.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{drill.category}</span>
                        <span>•</span>
                        <span>⏱️ {drill.duration}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-md font-semibold">
                          {drill.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playGentleClick();
                      onStartGame(drill.gameId);
                      onClose();
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shrink-0 ${
                      drill.completed
                        ? 'bg-slate-200 dark:bg-[#1a2d52] text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#233d6d]'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {drill.completed ? 'Replay ↻' : 'Start Drill 🚀'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#111f3d] p-5 rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  🌅 Circadian Cognitive Routine
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Consistent time-of-day cognitive stimulation preserves orientation, reduces sundowning anxiety, and enhances sleep quality.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e3a6a]">
                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 dark:bg-[#0b1426] rounded-xl">
                    <span className="font-bold text-blue-700 dark:text-sky-300">09:00 AM</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">Morning Orientation & Chai Memory Warmup</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 dark:bg-[#0b1426] rounded-xl">
                    <span className="font-bold text-blue-700 dark:text-sky-300">02:30 PM</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">Post-Rest Pattern Recognition Games</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 dark:bg-[#0b1426] rounded-xl">
                    <span className="font-bold text-blue-700 dark:text-sky-300">06:00 PM</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">Gentle Reminiscence & Family Photo Audio Review</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coaching' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-[#121c38] p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Clinical Neuro-Insight
                  </span>
                  <button
                    onClick={() =>
                      speakText(
                        'Short 10-minute bursts of daily cognitive exercise offer significantly higher neuroplastic benefits than one long weekly session.'
                      )
                    }
                    className="p-1.5 bg-white dark:bg-[#1e2c4d] text-indigo-700 dark:text-indigo-300 rounded-lg hover:scale-105 transition-transform"
                    aria-label="Read tip aloud"
                  >
                    🔊 Listen
                  </button>
                </div>
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-100">
                  Consistency beats intensity in cognitive retention.
                </h4>
                <p className="text-xs text-indigo-900/80 dark:text-indigo-200 leading-relaxed">
                  Completing 2 to 3 micro-drills daily creates stable synaptic pathways. Always take a 5-minute hydration break between exercises.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-[#0d172e] border-t border-slate-200 dark:border-[#1e3a6a] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Auto-synced with Caregiver Portal
          </span>
          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            Done for Now
          </button>
        </div>
      </div>
    </div>
  );
};
