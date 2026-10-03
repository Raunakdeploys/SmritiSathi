import React, { useState, useEffect } from 'react';
import type {
  UserProfile,
  CognitiveProgress,
  ActivityItem,
  FamilyMember,
  CareCompassTelemetry,
  CareCompassConfig,
} from '../types';
import { playGentleClick, speakText } from '../utils/audio';
import {
  Compass,
  Phone,
  ShieldCheck,
  Brain,
  Sparkles,
  Award,
  Clock,
  MapPin,
  Calendar,
  Flame,
  ChevronRight,
  Play,
  Heart,
  Users,
  CheckCircle2,
  Navigation,
  History,
  MessageSquare,
  Smile,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile | null;
  progress: CognitiveProgress | null;
  activities: ActivityItem[];
  familyMembers?: FamilyMember[];
  telemetry?: CareCompassTelemetry;
  config?: CareCompassConfig;
  onPlayGame: (gameId: string) => void;
  onStartDailyTraining: () => void;
  onOpenRewards: () => void;
  onViewHistory: () => void;
  onOpenWhereAmI?: () => void;
  onOpenDirectCall?: () => void;
  onOpenCareCompass?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  progress,
  activities,
  familyMembers = [],
  telemetry,
  config,
  onPlayGame,
  onStartDailyTraining,
  onOpenRewards,
  onViewHistory,
  onOpenWhereAmI,
  onOpenDirectCall,
  onOpenCareCompass,
}) => {
  const memoryPct = progress?.memory ?? 80;
  const attentionPct = progress?.attention ?? 75;
  const planningPct = progress?.planning ?? 70;
  const spatialPct = progress?.spatial ?? 78;
  const overallIndex = Math.round((memoryPct + attentionPct + planningPct + spatialPct) / 4);
  const mindPoints = (user?.mindPoints || user?.totalMindPoints || 1240).toLocaleString();
  const userName = user?.name ?? 'Asha Devi';
  const streakDays = user?.currentStreak || user?.dailyStreak || 5;

  // Real-time time & date anchor for cognitive orientation
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>('');
  const [greetingTimeOfDay, setGreetingTimeOfDay] = useState<string>('Morning');
  const [isPlayingWelcomeAudio, setIsPlayingWelcomeAudio] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      };
      setCurrentDateTime(now.toLocaleDateString('en-IN', options));
      setCurrentTimeFormatted(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );

      const hour = now.getHours();
      if (hour < 12) {
        setGreetingTimeOfDay('Morning');
      } else if (hour < 17) {
        setGreetingTimeOfDay('Afternoon');
      } else {
        setGreetingTimeOfDay('Evening');
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReadAloud = () => {
    playGentleClick();
    setIsPlayingWelcomeAudio(true);
    const text = `Namaste ${userName}. Good ${greetingTimeOfDay}. Today is ${currentDateTime}. The time is ${currentTimeFormatted}. You are safe at your home sanctuary with your family. You have ${mindPoints} Mind Points and a 5 day memory streak. Tap Start Today's Mind Workout whenever you are ready.`;
    speakText(text, true);
    setTimeout(() => setIsPlayingWelcomeAudio(false), 8000);
  };

  return (
    <main
      id="dashboard-canvas-main"
      className="flex-1 min-h-screen bg-[#F8FAFC] dark:bg-[#070d18] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors pb-28"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 space-y-8 sm:space-y-10">
        {/* =========================================================================
            1. CALM & DIGNIFIED SANCTUARY HERO BANNER
            Spacious, high-contrast, peaceful orientation for seniors
           ========================================================================= */}
        <section
          id="dashboard-orientation-banner"
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#002045] via-[#092954] to-[#0d366b] text-white p-7 sm:p-12 shadow-2xl border border-blue-900/40"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Unboxed orientation metadata with generous spacing */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-200/90 font-medium">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Calendar className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>{currentDateTime || 'Today'}</span>
                </span>
                <span aria-hidden="true" className="text-sky-400/50">·</span>
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Clock className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>{currentTimeFormatted || '10:30 AM'}</span>
                </span>
                <span aria-hidden="true" className="text-sky-400/50">·</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Safe at Home Sanctuary ({config?.homeLocation?.label || 'Saket'})</span>
                </span>
              </div>

              {/* Audio Read Aloud Button for Accessible Low-Vision Reading */}
              <button
                type="button"
                onClick={handleReadAloud}
                title="Hear this daily orientation read aloud"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-sky-200 transition-all cursor-pointer active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>{isPlayingWelcomeAudio ? 'Playing Audio...' : 'Read Aloud'}</span>
              </button>
            </div>

            {/* Reassuring Big Title & Calm Subtitle */}
            <div className="space-y-3 max-w-3xl">
              <h1
                id="dashboard-welcome-heading"
                className="font-black text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-white"
              >
                Namaste, {userName}.
              </h1>
              <p className="text-base sm:text-xl text-sky-100/90 leading-relaxed font-normal">
                Good {greetingTimeOfDay}. You are resting safely in your home sanctuary with your family. Today is peaceful, bright, and your memory exercises are ready.
              </p>
            </div>

            {/* Senior Touch-Friendly Action Buttons (Height >= 56px, generous hit targets) */}
            <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                id="btn-dashboard-start-routine"
                type="button"
                onClick={() => {
                  playGentleClick();
                  onStartDailyTraining();
                }}
                className="flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-[#FF6321] hover:bg-[#EA580C] text-white font-black text-base sm:text-lg shadow-xl shadow-orange-950/30 active:scale-98 transition-all cursor-pointer min-h-[58px]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Today's Mind Workout</span>
              </button>

              {onOpenWhereAmI && (
                <button
                  id="btn-dashboard-where-am-i"
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    onOpenWhereAmI();
                  }}
                  className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-sm sm:text-base backdrop-blur-xs active:scale-98 transition-all cursor-pointer min-h-[58px]"
                >
                  <Compass className="w-5 h-5 text-sky-300" />
                  <span>Where Am I?</span>
                </button>
              )}

              {onOpenDirectCall && (
                <button
                  id="btn-dashboard-call-caregiver"
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    onOpenDirectCall();
                  }}
                  className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-sm sm:text-base backdrop-blur-xs active:scale-98 transition-all cursor-pointer min-h-[58px]"
                >
                  <Phone className="w-5 h-5 text-emerald-300" />
                  <span>Call {config?.caregiverName ? config.caregiverName.split(' ')[0] : 'Caregiver'}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. CALM VITALITY SUMMARY STRIP (Uncluttered, Unboxed, Senior Friendly)
           ========================================================================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0f1b36] p-5 rounded-2xl border border-slate-200/90 dark:border-[#1e3a6a] shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-[#FF6321] flex items-center justify-center font-bold shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Workout</p>
              <p className="text-base font-extrabold text-[#002045] dark:text-white">Ready (3 Drills)</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f1b36] p-5 rounded-2xl border border-slate-200/90 dark:border-[#1e3a6a] shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Home Perimeter</p>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Safe (&lt; 250m)</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f1b36] p-5 rounded-2xl border border-slate-200/90 dark:border-[#1e3a6a] shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Habit Streak</p>
              <p className="text-base font-extrabold text-[#002045] dark:text-white">{streakDays} Days Active</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f1b36] p-5 rounded-2xl border border-slate-200/90 dark:border-[#1e3a6a] shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mind Points</p>
              <p className="text-base font-extrabold text-[#002045] dark:text-white font-mono">{mindPoints} pts</p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. THREE DIRECT WELLNESS GATEWAYS (Spacious, Clear & High Contrast)
           ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-black text-[#002045] dark:text-white tracking-tight">
              Recommended for Today
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              3 gentle drills · ~10 mins total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gateway 1: FaceBond Kinship */}
            <div
              id="card-gateway-saathi"
              onClick={() => {
                playGentleClick();
                onPlayGame('facebond');
              }}
              className="bg-white dark:bg-[#0f1b36] p-7 rounded-[28px] border border-slate-200/90 dark:border-[#1e3a6a] hover:border-orange-500 dark:hover:border-orange-400 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[240px]"
            >
              <div className="space-y-3.5">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#FF6321] flex items-center justify-center font-bold">
                  <Heart className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#002045] dark:text-white group-hover:text-[#FF6321] transition-colors">
                    FaceBond Kinship
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Recognize cherished family faces, remember joyful memories, and hear loving greetings from your children.
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#FF6321] dark:text-orange-400">
                <span>Family Reminiscence · 3 mins</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Play Exercise <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Gateway 2: Spatial Route Navigation */}
            <div
              id="card-gateway-wayback"
              onClick={() => {
                playGentleClick();
                onPlayGame('wayback');
              }}
              className="bg-white dark:bg-[#0f1b36] p-7 rounded-[28px] border border-slate-200/90 dark:border-[#1e3a6a] hover:border-sky-500 dark:hover:border-sky-400 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[240px]"
            >
              <div className="space-y-3.5">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <Navigation className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#002045] dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    WayBack Landmarks
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Navigate through familiar temple, garden, and market landmarks to strengthen spatial orientation.
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
                <span>Spatial Recall · 4 mins</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Navigate <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Gateway 3: Daily Routine Sequencing */}
            <div
              id="card-gateway-routine"
              onClick={() => {
                playGentleClick();
                onPlayGame('dailyroutine');
              }}
              className="bg-white dark:bg-[#0f1b36] p-7 rounded-[28px] border border-slate-200/90 dark:border-[#1e3a6a] hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[240px]"
            >
              <div className="space-y-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#002045] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Daily Routine Steps
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Organize morning tea, herbal garden watering, and medicine schedules in harmonious sequence.
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>Executive Planning · 3 mins</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Plan Steps <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. FAMILY PORTRAIT REASSURANCE ROW (Warm & Heartwarming Connection)
           ========================================================================= */}
        {familyMembers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#002045] dark:text-white tracking-tight flex items-center gap-2.5">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <span>Your Loving Family</span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Tap any portrait to reminisce or hear their voice greeting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {familyMembers.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  onClick={() => {
                    playGentleClick();
                    onPlayGame('facebond');
                  }}
                  className="bg-white dark:bg-[#0f1b36] p-5 rounded-[24px] border border-slate-200/90 dark:border-[#1e3a6a] hover:border-[#002045] dark:hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center space-x-4"
                >
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-base text-[#002045] dark:text-white truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs font-bold text-[#FF6321]">{member.relation}</p>
                    {member.keyMemories?.[0] && (
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate mt-1">
                        "{member.keyMemories[0]}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            5. COGNITIVE VITALITY & CAREGIVER PEACE OF MIND
            Spacious two-column layout: Left is Progress, Right is Safety & Rewards
           ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Gentle Cognitive Health Overview */}
          <div className="bg-white dark:bg-[#0f1b36] p-7 sm:p-9 rounded-[32px] border border-slate-200/90 dark:border-[#1e3a6a] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#002045] dark:text-white flex items-center gap-2.5">
                  <Brain className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  <span>Memory Health Overview</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Calibrated via daily cognitive games
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-[#002045] dark:text-white font-mono">
                  {overallIndex}%
                </span>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Stable & Optimal</p>
              </div>
            </div>

            {/* 4 Pillars with Thicker, Highly Visible Progress Bars */}
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>Memory & Kinship Recall</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{memoryPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${memoryPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>Spatial Route Orientation</span>
                  <span className="font-mono text-orange-600 dark:text-orange-400">{spatialPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF6321] h-full rounded-full transition-all duration-700"
                    style={{ width: `${spatialPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>Visual Attention & Focus</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{attentionPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${attentionPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>Executive Planning</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{planningPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${planningPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a6a] flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Active Habit Streak: <strong className="text-[#FF6321]">🔥 {streakDays} days</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  playGentleClick();
                  onViewHistory();
                }}
                className="text-blue-600 dark:text-sky-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Full Training History</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Caregiver Safety Anchor & Mind Points */}
          <div className="space-y-6">
            {/* Safety Anchor Card */}
            <div className="bg-white dark:bg-[#0f1b36] p-7 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-[#1e3a6a] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-[#002045] dark:text-white">
                      Caregiver Safety Anchor
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Continuous CareCompass protection
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Protected</span>
                </span>
              </div>

              <div className="p-4.5 bg-slate-50 dark:bg-[#111e38] rounded-2xl border border-slate-100 dark:border-[#1e3a6a] space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Primary Caregiver:</span>
                  <strong className="text-[#002045] dark:text-white">
                    {config?.caregiverName || 'Rohan Sharma (Son)'}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Sanctuary Base Location:</span>
                  <strong className="text-[#002045] dark:text-white truncate max-w-[200px]">
                    {config?.homeLocation?.label || 'Saket, South Delhi'}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Current Distance:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    Inside Safe Boundary (&lt; 250m)
                  </strong>
                </div>
              </div>

              {onOpenCareCompass && (
                <button
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    onOpenCareCompass();
                  }}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#162544] dark:hover:bg-[#1e325c] text-[#002045] dark:text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-[#1e3a6a]"
                >
                  <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Open CareCompass Live Radar</span>
                </button>
              )}
            </div>

            {/* Mind Points & Rewards Banner */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-[#1e1708] dark:to-[#291e0a] p-7 rounded-[32px] border border-amber-200 dark:border-[#573d10] flex items-center justify-between gap-5">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Total Mind Points
                </span>
                <p className="text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-200 font-mono">
                  {mindPoints} <span className="text-sm font-bold font-sans">pts</span>
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300/80">
                  Redeemable for herbal teas, puzzle digests & custom photo prints
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  playGentleClick();
                  onOpenRewards();
                }}
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Rewards</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
