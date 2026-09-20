import React from 'react';
import type { UserProfile, CognitiveProgress, ActivityItem } from '../types';
import { playGentleClick } from '../utils/audio';
import { InteractiveDailyTrainingProgress } from './InteractiveDailyTrainingProgress';

interface DashboardViewProps {
  user: UserProfile | null;
  progress: CognitiveProgress | null;
  activities: ActivityItem[];
  onPlayGame: (gameId: string) => void;
  onStartDailyTraining: () => void;
  onOpenRewards: () => void;
  onViewHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  progress,
  activities,
  onPlayGame,
  onStartDailyTraining,
  onOpenRewards,
  onViewHistory,
}) => {
  const memoryPct = progress?.memory ?? 80;
  const attentionPct = progress?.attention ?? 65;
  const planningPct = progress?.planning ?? 40;
  const mindPoints = user?.mindPoints?.toLocaleString() ?? '1,240';
  const userName = user?.name ?? 'Asha Devi';

  // Display top 3 recent activities
  const recentActivities = activities.slice(0, 3);

  return (
    <main
      id="dashboard-canvas-main"
      className="flex-1 p-4 sm:p-6 md:p-12 bg-[#ffffff] overflow-y-auto"
    >
      {/* Welcome Section */}
      <section id="welcome-section" className="mb-8 md:mb-10">
        <h1
          id="dashboard-welcome-heading"
          className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] mb-2"
        >
          Welcome back, {userName}
        </h1>
        <p
          id="dashboard-welcome-subheading"
          className="font-normal text-[18px] md:text-[20px] text-[#43474e]"
        >
          Here is your daily cognitive summary.
        </p>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Wider on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Daily Training Progress Center */}
          <InteractiveDailyTrainingProgress
            user={user}
            progress={progress}
            onPlayGame={onPlayGame}
            onStartDailyTraining={onStartDailyTraining}
          />

          {/* Quick Game Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WayBack Spatial Navigation Shortcut */}
            <div
              id="card-wayback-training"
              onClick={() => {
                playGentleClick();
                onPlayGame('wayback');
              }}
              className="bg-[#fff7ed] p-6 rounded-2xl border-2 border-[#ffedd5] hover:border-[#FF6321] shadow-xs card-focus relative overflow-hidden flex flex-col justify-between min-h-[180px] group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
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
                  Landmarks & GPS Bearing • 4 mins
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
              className="bg-[#f8fafc] p-6 rounded-2xl border-2 border-[#cbd5e1] hover:border-[#0F172A] shadow-xs card-focus relative overflow-hidden flex flex-col justify-between min-h-[180px] group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Mind Points Summary Card */}
          <div
            id="card-mind-points-summary"
            className="bg-[#ffdeaa] p-6 sm:p-7 rounded-xl border border-[#f8bc4b] card-focus text-center shadow-xs flex flex-col items-center justify-between"
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
            </div>

            <button
              id="btn-redeem-rewards-card"
              onClick={() => {
                playGentleClick();
                onOpenRewards();
              }}
              className="mt-4 bg-[#2d1d00] hover:bg-[#493100] active:bg-[#1a1100] text-white px-6 py-3.5 rounded-xl font-bold text-[18px] w-full min-h-[56px] focus:outline-none focus:ring-4 focus:ring-[#2d1d00] focus:ring-offset-2 focus:ring-offset-[#ffdeaa] cursor-pointer shadow-sm transition-all"
            >
              Redeem Rewards
            </button>
          </div>

          {/* Recent Activity List */}
          <div
            id="card-recent-activity"
            className="bg-[#f9f9ff] p-6 rounded-xl border border-[#c4c6cf] shadow-xs card-focus flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-[22px] text-[#002045] mb-4 flex items-center">
                <span className="material-symbols-outlined mr-3 text-[26px] text-[#002045]">history</span>
                Recent Activity
              </h3>

              <ul className="space-y-3.5">
                {recentActivities.map((act) => (
                  <li
                    key={act.id}
                    className="flex justify-between items-center p-3.5 sm:p-4 bg-[#f0f3ff] rounded-xl hover:bg-[#e7eeff] transition-colors border border-[#d9e3f9]/60"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="bg-[#d6e3ff] text-[#002045] p-2.5 rounded-full flex-shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">{act.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-[17px] text-[#121c2c] leading-snug">{act.title}</p>
                        <p className="font-normal text-[15px] text-[#43474e]">{act.timestamp}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[18px] text-[#002045] whitespace-nowrap">
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
              className="w-full mt-4 py-3 text-[#002045] font-bold text-[18px] text-center hover:bg-[#d9e3f9] rounded-xl transition-colors min-h-[56px] focus:outline-none focus:ring-4 focus:ring-[#002045] focus:ring-offset-2 cursor-pointer flex items-center justify-center"
            >
              <span>View All History</span>
              <span className="material-symbols-outlined ml-1.5 text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
