import React, { useState } from 'react';
import type { ActivityItem, UserProfile } from '../types';
import { playGentleClick } from '../utils/audio';
import { ViewNavigationBar } from './ViewNavigationBar';
import { Brain, Play, Award, CheckCircle2, History as HistoryIcon, Calendar } from 'lucide-react';

interface HistoryViewProps {
  activities: ActivityItem[];
  user: UserProfile | null;
  onBackToDashboard: () => void;
  onStartTraining?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  activities,
  user,
  onBackToDashboard,
  onStartTraining,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Memory', 'Attention', 'Planning', 'Spatial', 'Executive'];

  const filtered =
    filterCategory === 'All'
      ? activities
      : activities.filter((a) => a.category === filterCategory);

  const totalPointsEarned = activities.reduce((sum, a) => sum + (a.points || 0), 0);
  const avgAccuracy = Math.round(
    activities.reduce((sum, a) => sum + (a.accuracy || 95), 0) / (activities.length || 1)
  );

  return (
    <main
      id="history-view-main"
      className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors pb-24"
    >
      {/* Universal Navigation Bar with Back & Close */}
      <ViewNavigationBar
        title="Training History"
        breadcrumbs={[{ label: 'Dashboard', onClick: onBackToDashboard }]}
        onBack={onBackToDashboard}
        onClose={onBackToDashboard}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] dark:text-white">
            Training Activity History
          </h1>
          <p className="font-normal text-[16px] md:text-[18px] text-slate-600 dark:text-slate-300">
            Comprehensive timeline of your cognitive sessions and brain stimulation milestones.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-sky-50 dark:bg-[#111e38] p-5 rounded-2xl border border-sky-100 dark:border-[#1e3a6a] shadow-xs">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total Sessions Completed</span>
          <p className="font-extrabold text-[32px] text-[#002045] dark:text-white mt-1 font-mono">
            {user?.totalSessions || activities.length}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-[#2a1e0b] p-5 rounded-2xl border border-amber-200 dark:border-[#78510c] shadow-xs">
          <span className="text-sm font-bold text-amber-900 dark:text-amber-200">Total Points Earned</span>
          <p className="font-extrabold text-[32px] text-amber-950 dark:text-amber-300 mt-1 font-mono">
            {totalPointsEarned.toLocaleString()} <span className="text-sm font-sans font-bold">pts</span>
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-[#0e291e] p-5 rounded-2xl border border-emerald-200 dark:border-[#1b5e3f] shadow-xs">
          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Average Accuracy</span>
          <p className="font-extrabold text-[32px] text-emerald-900 dark:text-emerald-300 mt-1 font-mono">
            {avgAccuracy}%
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playGentleClick();
              setFilterCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              filterCategory === cat
                ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#111e38] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2d52] border border-slate-200 dark:border-[#1e3a6a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white dark:bg-[#111e38] rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-[#FF6321] flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#002045] dark:text-white">
                No Exercises Logged in {filterCategory} Yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Complete your daily 3-pillar cognitive stimulation or a reminiscence exercise to record history.
              </p>
            </div>
            {onStartTraining && (
              <button
                type="button"
                onClick={() => {
                  playGentleClick();
                  onStartTraining();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF6321] hover:bg-[#EA580C] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Today's Workout</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-[#111e38] rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] hover:border-[#002045] dark:hover:border-blue-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-xs"
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-blue-900/50 text-[#002045] dark:text-blue-200 border border-sky-100 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-xs">
                  <Brain className="w-6 h-6 text-sky-600 dark:text-sky-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="font-bold text-lg text-[#002045] dark:text-white truncate">{item.title}</h3>
                    <span className="bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    {item.timestamp} • Duration: {item.durationMinutes} mins • Accuracy: {item.accuracy || 100}%
                  </p>
                  {item.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic truncate">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                <span className="font-extrabold text-base sm:text-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-xl font-mono">
                  +{item.points} pts
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};
