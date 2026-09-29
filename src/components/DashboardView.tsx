import React, { useState, useEffect } from 'react';
import type {
  UserProfile,
  CognitiveProgress,
  ActivityItem,
  FamilyMember,
  CareCompassTelemetry,
  CareCompassConfig,
} from '../types';
import { playGentleClick } from '../utils/audio';
import { InteractiveDailyTrainingProgress } from './InteractiveDailyTrainingProgress';
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
  const [greetingTimeOfDay, setGreetingTimeOfDay] = useState<string>('Morning');

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
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Display top 4 recent activities
  const recentActivities = activities.slice(0, 4);

  // Spotlight family member
  const spotlightMember = familyMembers.length > 0 ? familyMembers[0] : null;

  return (
    <main
      id="dashboard-canvas-main"
      className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 bg-[#030e21] text-white space-y-6 md:space-y-8 w-full min-w-0 max-w-full overflow-x-hidden box-border"
    >
      {/* 1. Temporal Orientation & Calming Grounding Banner */}
      <section
        id="dashboard-orientation-banner"
        className="bg-gradient-to-r from-[#001f3f] via-[#083366] to-[#0f4c81] rounded-3xl p-6 sm:p-8 text-white shadow-lg border-2 border-blue-900/60 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-sky-200 font-semibold">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                <Calendar className="w-4 h-4 text-sky-300" />
                {currentDateTime || 'Today'}
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Safe Home Anchor Active
              </span>
              <span className="flex items-center gap-1.5 bg-amber-400/20 text-amber-200 border border-amber-300/30 px-3 py-1 rounded-full">
                <Flame className="w-4 h-4 text-amber-300" />
                {streakDays}-Day Brain Streak
              </span>
            </div>

            <h1
              id="dashboard-welcome-heading"
              className="font-extrabold text-[28px] sm:text-[34px] md:text-[38px] leading-tight tracking-tight text-white"
            >
              Good {greetingTimeOfDay}, {userName}
            </h1>

            <p className="text-sky-100 text-base sm:text-lg max-w-2xl leading-relaxed">
              You are safe at home with your family. Today is peaceful, bright, and your cognitive wellness routine is ready for you.
            </p>
          </div>

          {/* Senior Reassurance Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {onOpenWhereAmI && (
              <button
                id="btn-dashboard-where-am-i"
                onClick={() => {
                  playGentleClick();
                  onOpenWhereAmI();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 bg-white text-[#002045] hover:bg-sky-50 active:scale-98 px-5 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base shadow-sm transition-all cursor-pointer min-h-[52px]"
              >
                <Compass className="w-5 h-5 text-sky-600" />
                <span>Where Am I?</span>
              </button>
            )}

            {onOpenDirectCall && (
              <button
                id="btn-dashboard-call-caregiver"
                onClick={() => {
                  playGentleClick();
                  onOpenDirectCall();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 bg-[#FF6321] hover:bg-[#EA580C] text-white active:scale-98 px-5 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base shadow-sm transition-all cursor-pointer min-h-[52px]"
              >
                <Phone className="w-5 h-5" />
                <span>Call Caregiver</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Bento Grid Primary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Left 2 Columns: Training Progress & Cognitive Domains */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          {/* Interactive Daily Training Progress Center */}
          <InteractiveDailyTrainingProgress
            user={user}
            progress={progress}
            onPlayGame={onPlayGame}
            onStartDailyTraining={onStartDailyTraining}
          />

          {/* 3. Cognitive Domain Health Breakdown Matrix */}
          <section
            id="cognitive-domains-matrix"
            className="bg-[#0b1d3a] rounded-3xl p-6 sm:p-7 border border-blue-900/60 shadow-lg space-y-5 text-white"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/50 pb-4">
              <div>
                <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-sky-400" />
                  Cognitive Health Breakdown
                </h2>
                <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                  Continuous multi-domain clinical score calibrated via daily reminiscence and spatial training.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800">
                <span className="text-xs font-bold text-sky-200">Overall Index:</span>
                <span className="text-sm font-black text-sky-400">{overallIndex} / 100</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold px-1.5 py-0.5 rounded">
                  {overallIndex >= 80 ? 'Optimal' : overallIndex >= 65 ? 'Stable' : 'Active'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Memory Recall Domain */}
              <div
                id="domain-card-memory"
                onClick={() => {
                  playGentleClick();
                  onPlayGame('facebond');
                }}
                className="bg-[#0d2347] hover:bg-[#122e5c] p-4.5 rounded-2xl border border-blue-800/60 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                        Memory & Kinship
                      </h3>
                      <p className="text-xs text-blue-200">Face & name recognition</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-indigo-300">{memoryPct}%</span>
                </div>

                <div className="w-full bg-blue-950 h-2.5 rounded-full overflow-hidden border border-blue-900/60">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${memoryPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-blue-200 font-medium">
                  <span>Level 2 • High Recall</span>
                  <span className="flex items-center gap-1 text-sky-300 font-bold group-hover:underline">
                    Train Memory <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Focus & Visual Attention Domain */}
              <div
                id="domain-card-attention"
                onClick={() => {
                  playGentleClick();
                  onPlayGame('shape-sorter');
                }}
                className="bg-[#14233e] hover:bg-[#1a2d50] p-4.5 rounded-2xl border border-amber-500/30 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                        Visual Attention
                      </h3>
                      <p className="text-xs text-amber-200/80">Shape & color focus</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-amber-300">{attentionPct}%</span>
                </div>

                <div className="w-full bg-blue-950 h-2.5 rounded-full overflow-hidden border border-blue-900/60">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${attentionPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-amber-200/90 font-medium">
                  <span>Level 2 • Steady Focus</span>
                  <span className="flex items-center gap-1 text-amber-300 font-bold group-hover:underline">
                    Train Focus <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Executive Planning Domain */}
              <div
                id="domain-card-planning"
                onClick={() => {
                  playGentleClick();
                  onPlayGame('dailyroutine');
                }}
                className="bg-[#0b2738] hover:bg-[#10334a] p-4.5 rounded-2xl border border-emerald-500/30 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                        Executive Planning
                      </h3>
                      <p className="text-xs text-emerald-200/80">Daily routine sequencing</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-emerald-300">{planningPct}%</span>
                </div>

                <div className="w-full bg-blue-950 h-2.5 rounded-full overflow-hidden border border-blue-900/60">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${planningPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-emerald-200/90 font-medium">
                  <span>Level 1 • Adaptive Support</span>
                  <span className="flex items-center gap-1 text-emerald-300 font-bold group-hover:underline">
                    Plan Routine <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Spatial Orientation Domain */}
              <div
                id="domain-card-spatial"
                onClick={() => {
                  playGentleClick();
                  onPlayGame('wayback');
                }}
                className="bg-[#241c30] hover:bg-[#302540] p-4.5 rounded-2xl border border-orange-500/30 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#FF6321] text-white rounded-xl shadow-xs">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-orange-300 transition-colors">
                        Spatial Orientation
                      </h3>
                      <p className="text-xs text-orange-200/80">Landmark & route recall</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-orange-300">{spatialPct}%</span>
                </div>

                <div className="w-full bg-blue-950 h-2.5 rounded-full overflow-hidden border border-blue-900/60">
                  <div
                    className="bg-[#FF6321] h-full rounded-full transition-all duration-500"
                    style={{ width: `${spatialPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-orange-200/90 font-medium">
                  <span>Level 2 • Landmarks Mastered</span>
                  <span className="flex items-center gap-1 text-orange-300 font-bold group-hover:underline">
                    Navigate <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Quick Cognitive Games Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WayBack Spatial Navigation Shortcut */}
            <div
              id="card-wayback-training"
              onClick={() => {
                playGentleClick();
                onPlayGame('wayback');
              }}
              className="bg-[#1a2035] p-6 rounded-2xl border-2 border-orange-500/40 hover:border-orange-400 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[180px] group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="bg-[#FF6321] text-white font-black px-3 py-0.5 rounded-full text-[12px] uppercase tracking-wider inline-block mb-2 shadow-xs">
                    Spatial Core • Live GPS
                  </span>
                  <h3 className="font-extrabold text-[22px] text-white group-hover:text-orange-300 transition-colors">
                    WayBack Route Navigation
                  </h3>
                </div>
                <span className="material-symbols-outlined text-white bg-[#FF6321] p-2.5 rounded-full group-hover:scale-110 transition-all text-[24px] shadow-xs">
                  navigation
                </span>
              </div>

              <div className="relative z-10 mt-3">
                <p className="font-bold text-[16px] text-orange-200 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-[18px]">near_me</span>
                  Temple & Market Landmarks • 4 mins
                </p>
              </div>
            </div>

            {/* LifeThread Milestone Sequencing Shortcut */}
            <div
              id="card-lifethread-launcher"
              onClick={() => {
                playGentleClick();
                onPlayGame('lifethread');
              }}
              className="bg-[#0b1d3a] p-6 rounded-2xl border-2 border-blue-900/60 hover:border-sky-500 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[180px] group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="bg-sky-600 text-white font-black px-3 py-0.5 rounded-full text-[12px] uppercase tracking-wider inline-block mb-2 shadow-xs">
                    Reminiscence Therapy
                  </span>
                  <h3 className="font-extrabold text-[22px] text-white group-hover:text-sky-300 transition-colors">
                    LifeThread Milestones
                  </h3>
                </div>
                <span className="material-symbols-outlined text-white bg-sky-600 p-2.5 rounded-full group-hover:scale-110 transition-all text-[24px] shadow-xs">
                  timeline
                </span>
              </div>

              <div className="relative z-10 mt-3">
                <p className="font-bold text-[16px] text-sky-200 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-[18px]">history_edu</span>
                  Chronological Life Journey • 5 mins
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mind Points, Caregiver Anchor & Family Spotlight */}
        <div className="space-y-6 w-full min-w-0">
          {/* Mind Points Summary Card */}
          <div
            id="card-mind-points-summary"
            className="bg-gradient-to-br from-[#0c234a] via-[#103166] to-[#18468b] p-6 sm:p-7 rounded-3xl border-2 border-amber-400/40 text-center shadow-lg flex flex-col items-center justify-between text-white"
          >
            <div>
              <span
                className="material-symbols-outlined filled-icon text-amber-400 mb-2 inline-block animate-pulse"
                style={{ fontSize: '48px' }}
              >
                stars
              </span>
              <h3 className="font-bold text-[18px] text-amber-200 mb-1">Total Mind Points</h3>
              <p className="font-extrabold text-[44px] md:text-[48px] leading-tight text-white tracking-tight my-2">
                {mindPoints}
              </p>
              <p className="text-xs text-blue-200 font-semibold">
                Earned from daily cognitive games & orientation recall
              </p>
            </div>

            <button
              id="btn-redeem-rewards-card"
              onClick={() => {
                playGentleClick();
                onOpenRewards();
              }}
              className="mt-5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#002045] px-6 py-3.5 rounded-2xl font-extrabold text-[17px] w-full min-h-[54px] focus:outline-none focus:ring-4 focus:ring-amber-300 cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5 text-[#002045]" />
              <span>Redeem Rewards</span>
            </button>
          </div>

          {/* Caregiver & Safe Zone Status Widget */}
          <div
            id="card-caregiver-anchor-status"
            className="bg-[#0b1d3a] p-6 rounded-3xl border border-blue-900/60 shadow-lg space-y-4 text-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Caregiver Anchor
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Standby
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  Primary Contact:
                </span>
                <span className="font-extrabold text-white">
                  {config?.caregiverName || 'Rohan Sharma (Son)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-blue-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  Base Location:
                </span>
                <span className="font-bold text-white">
                  {config?.anchorName || 'Home Sweet Home'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-blue-200">Safe Zone Radius:</span>
                <span className="font-bold text-emerald-400">100m • Inside Safe Area</span>
              </div>
            </div>

            {onOpenCareCompass && (
              <button
                id="btn-open-carecompass-shortcut"
                onClick={() => {
                  playGentleClick();
                  onOpenCareCompass();
                }}
                className="w-full py-3 bg-[#132c52] hover:bg-[#1b3d73] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-700/60 transition-all cursor-pointer shadow-xs"
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Open CareCompass Radar</span>
              </button>
            )}
          </div>

          {/* Family Memory Spotlight */}
          {spotlightMember && (
            <div
              id="card-family-spotlight"
              onClick={() => {
                playGentleClick();
                onPlayGame('facebond');
              }}
              className="bg-[#0c2438] p-5 rounded-3xl border border-emerald-500/40 space-y-3 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Family Memory Spotlight
                </span>
                <span className="text-xs font-bold text-emerald-300 group-hover:underline flex items-center gap-0.5">
                  Reminisce <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={spotlightMember.photoUrl}
                  alt={spotlightMember.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-xs"
                />
                <div>
                  <h4 className="font-extrabold text-base text-white group-hover:text-emerald-300 transition-colors">
                    {spotlightMember.name}
                  </h4>
                  <p className="text-xs text-emerald-300 font-semibold">{spotlightMember.relation}</p>
                  {spotlightMember.keyMemories?.[0] && (
                    <p className="text-[11px] text-blue-200 line-clamp-1 mt-0.5">
                      "{spotlightMember.keyMemories[0]}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity List */}
          <div
            id="card-recent-activity"
            className="bg-[#0b1d3a] p-6 rounded-3xl border border-blue-900/60 shadow-lg flex flex-col justify-between text-white"
          >
            <div>
              <h3 className="font-bold text-[20px] text-white mb-4 flex items-center">
                <History className="w-5 h-5 mr-2.5 text-sky-400" />
                Recent Cognitive Activities
              </h3>

              <ul className="space-y-3">
                {recentActivities.map((act) => (
                  <li
                    key={act.id}
                    className="flex justify-between items-center p-3 bg-[#07152b] rounded-2xl hover:bg-[#0d213f] transition-colors border border-blue-950"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-900/70 text-sky-300 p-2 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">{act.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white leading-snug">{act.title}</p>
                        <p className="font-normal text-xs text-blue-300">{act.timestamp}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-400 whitespace-nowrap">
                      +{act.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              id="btn-view-all-history"
              onClick={() => {
                playGentleClick();
                onViewHistory();
              }}
              className="w-full mt-4 py-3 text-sky-300 hover:text-white font-bold text-sm text-center hover:bg-blue-950/70 rounded-xl transition-colors min-h-[48px] focus:outline-none focus:ring-4 focus:ring-sky-500 cursor-pointer flex items-center justify-center gap-1 border border-blue-800/60"
            >
              <span>View All Training Logs</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
