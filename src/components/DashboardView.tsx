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
      className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 bg-[#f8faff] overflow-y-auto space-y-6 md:space-y-8"
    >
      {/* 1. Temporal Orientation & Calming Grounding Banner */}
      <section
        id="dashboard-orientation-banner"
        className="bg-gradient-to-r from-[#002045] via-[#083366] to-[#0f4c81] rounded-3xl p-6 sm:p-8 text-white shadow-md border-2 border-[#002045] relative overflow-hidden"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Training Progress & Cognitive Domains */}
        <div className="lg:col-span-2 space-y-6">
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
            className="bg-white rounded-3xl p-6 sm:p-7 border border-[#d6e3f8] shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-extrabold text-xl text-[#002045] flex items-center gap-2">
                  <Brain className="w-6 h-6 text-sky-600" />
                  Cognitive Health Breakdown
                </h2>
                <p className="text-xs sm:text-sm text-[#43474e] mt-0.5">
                  Continuous multi-domain clinical score calibrated via daily reminiscence and spatial training.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                <span className="text-xs font-bold text-sky-900">Overall Index:</span>
                <span className="text-sm font-black text-sky-700">{overallIndex} / 100</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
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
                className="bg-[#f0f5ff] hover:bg-[#e4edff] p-4.5 rounded-2xl border border-[#adc7f7] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#002045] group-hover:text-indigo-700 transition-colors">
                        Memory & Kinship
                      </h3>
                      <p className="text-xs text-[#43474e]">Face & name recognition</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-indigo-700">{memoryPct}%</span>
                </div>

                <div className="w-full bg-indigo-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${memoryPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-indigo-900 font-medium">
                  <span>Level 2 • High Recall</span>
                  <span className="flex items-center gap-1 text-indigo-700 font-bold group-hover:underline">
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
                className="bg-[#fffbeb] hover:bg-[#fef3c7] p-4.5 rounded-2xl border border-[#fde68a] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#002045] group-hover:text-amber-700 transition-colors">
                        Visual Attention
                      </h3>
                      <p className="text-xs text-[#43474e]">Shape & color focus</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-amber-700">{attentionPct}%</span>
                </div>

                <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${attentionPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-amber-900 font-medium">
                  <span>Level 2 • Steady Focus</span>
                  <span className="flex items-center gap-1 text-amber-700 font-bold group-hover:underline">
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
                className="bg-[#ecfdf5] hover:bg-[#d1fae5] p-4.5 rounded-2xl border border-[#a7f3d0] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#002045] group-hover:text-emerald-700 transition-colors">
                        Executive Planning
                      </h3>
                      <p className="text-xs text-[#43474e]">Daily routine sequencing</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-emerald-700">{planningPct}%</span>
                </div>

                <div className="w-full bg-emerald-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${planningPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-emerald-900 font-medium">
                  <span>Level 1 • Adaptive Support</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold group-hover:underline">
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
                className="bg-[#fff7ed] hover:bg-[#ffedd5] p-4.5 rounded-2xl border border-[#fed7aa] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#FF6321] text-white rounded-xl shadow-xs">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#002045] group-hover:text-[#FF6321] transition-colors">
                        Spatial Orientation
                      </h3>
                      <p className="text-xs text-[#43474e]">Landmark & route recall</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-lg text-[#FF6321]">{spatialPct}%</span>
                </div>

                <div className="w-full bg-orange-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF6321] h-full rounded-full transition-all duration-500"
                    style={{ width: `${spatialPct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 text-orange-900 font-medium">
                  <span>Level 2 • Landmarks Mastered</span>
                  <span className="flex items-center gap-1 text-[#FF6321] font-bold group-hover:underline">
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
              className="bg-[#fff7ed] p-6 rounded-2xl border-2 border-[#ffedd5] hover:border-[#FF6321] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[180px] group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="bg-[#FF6321] text-white font-black px-3 py-0.5 rounded-full text-[12px] uppercase tracking-wider inline-block mb-2 shadow-xs">
                    Spatial Core • Live GPS
                  </span>
                  <h3 className="font-extrabold text-[22px] text-[#0F172A] group-hover:text-[#FF6321] transition-colors">
                    WayBack Route Navigation
                  </h3>
                </div>
                <span className="material-symbols-outlined text-white bg-[#FF6321] p-2.5 rounded-full group-hover:scale-110 transition-all text-[24px] shadow-xs">
                  navigation
                </span>
              </div>

              <div className="relative z-10 mt-3">
                <p className="font-bold text-[16px] text-[#9A3412] flex items-center">
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
              className="bg-[#f8fafc] p-6 rounded-2xl border-2 border-[#cbd5e1] hover:border-[#0F172A] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[180px] group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="bg-[#0F172A] text-[#FFF7ED] font-black px-3 py-0.5 rounded-full text-[12px] uppercase tracking-wider inline-block mb-2 shadow-xs">
                    Reminiscence Therapy
                  </span>
                  <h3 className="font-extrabold text-[22px] text-[#0F172A] group-hover:text-[#FF6321] transition-colors">
                    LifeThread Milestones
                  </h3>
                </div>
                <span className="material-symbols-outlined text-white bg-[#0F172A] p-2.5 rounded-full group-hover:scale-110 transition-all text-[24px] shadow-xs">
                  timeline
                </span>
              </div>

              <div className="relative z-10 mt-3">
                <p className="font-bold text-[16px] text-[#475569] flex items-center">
                  <span className="material-symbols-outlined mr-2 text-[18px]">history_edu</span>
                  Chronological Life Journey • 5 mins
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mind Points, Caregiver Anchor & Family Spotlight */}
        <div className="space-y-6">
          {/* Mind Points Summary Card */}
          <div
            id="card-mind-points-summary"
            className="bg-gradient-to-br from-[#ffdeaa] to-[#fcd34d] p-6 sm:p-7 rounded-3xl border border-[#f8bc4b] text-center shadow-xs flex flex-col items-center justify-between"
          >
            <div>
              <span
                className="material-symbols-outlined filled-icon text-[#2d1d00] mb-2 inline-block animate-pulse"
                style={{ fontSize: '48px' }}
              >
                stars
              </span>
              <h3 className="font-bold text-[18px] text-[#271900] mb-1">Total Mind Points</h3>
              <p className="font-extrabold text-[44px] md:text-[48px] leading-tight text-[#2d1d00] tracking-tight my-2">
                {mindPoints}
              </p>
              <p className="text-xs text-[#593b00] font-semibold">
                Earned from daily cognitive games & orientation recall
              </p>
            </div>

            <button
              id="btn-redeem-rewards-card"
              onClick={() => {
                playGentleClick();
                onOpenRewards();
              }}
              className="mt-5 bg-[#2d1d00] hover:bg-[#493100] active:bg-[#1a1100] text-white px-6 py-3.5 rounded-2xl font-extrabold text-[17px] w-full min-h-[54px] focus:outline-none focus:ring-4 focus:ring-[#2d1d00] cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5 text-amber-300" />
              <span>Redeem Rewards</span>
            </button>
          </div>

          {/* Caregiver & Safe Zone Status Widget */}
          <div
            id="card-caregiver-anchor-status"
            className="bg-white p-6 rounded-3xl border border-[#d6e3f8] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#002045] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Caregiver Anchor
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Standby
              </span>
            </div>

            <div className="space-y-2 text-sm text-[#002045]">
              <div className="flex justify-between items-center">
                <span className="text-[#43474e] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  Primary Contact:
                </span>
                <span className="font-extrabold text-[#002045]">
                  {config?.caregiverName || 'Rohan Sharma (Son)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#43474e] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
                  Base Location:
                </span>
                <span className="font-bold text-[#002045]">
                  {config?.anchorName || 'Home Sweet Home'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#43474e]">Safe Zone Radius:</span>
                <span className="font-bold text-emerald-700">100m • Inside Safe Area</span>
              </div>
            </div>

            {onOpenCareCompass && (
              <button
                id="btn-open-carecompass-shortcut"
                onClick={() => {
                  playGentleClick();
                  onOpenCareCompass();
                }}
                className="w-full py-3 bg-[#f0f5ff] hover:bg-[#e0ecff] text-[#002045] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#adc7f7] transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-sky-600" />
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
              className="bg-[#f0fdf4] p-5 rounded-3xl border border-[#bbf7d0] space-y-3 cursor-pointer hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Family Memory Spotlight
                </span>
                <span className="text-xs font-bold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                  Reminisce <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={spotlightMember.photoUrl}
                  alt={spotlightMember.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-300 shadow-xs"
                />
                <div>
                  <h4 className="font-extrabold text-base text-[#002045] group-hover:text-emerald-700 transition-colors">
                    {spotlightMember.name}
                  </h4>
                  <p className="text-xs text-emerald-800 font-semibold">{spotlightMember.relation}</p>
                  {spotlightMember.keyMemories?.[0] && (
                    <p className="text-[11px] text-[#43474e] line-clamp-1 mt-0.5">
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
            className="bg-white p-6 rounded-3xl border border-[#d6e3f8] shadow-xs flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-[20px] text-[#002045] mb-4 flex items-center">
                <History className="w-5 h-5 mr-2.5 text-[#002045]" />
                Recent Cognitive Activities
              </h3>

              <ul className="space-y-3">
                {recentActivities.map((act) => (
                  <li
                    key={act.id}
                    className="flex justify-between items-center p-3 bg-[#f8faff] rounded-2xl hover:bg-[#eef4ff] transition-colors border border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#d6e3ff] text-[#002045] p-2 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">{act.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#121c2c] leading-snug">{act.title}</p>
                        <p className="font-normal text-xs text-[#43474e]">{act.timestamp}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-700 whitespace-nowrap">
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
              className="w-full mt-4 py-3 text-[#002045] font-bold text-sm text-center hover:bg-[#eef4ff] rounded-xl transition-colors min-h-[48px] focus:outline-none focus:ring-4 focus:ring-[#002045] cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
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
