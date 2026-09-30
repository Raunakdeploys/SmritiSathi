import React, { useState } from 'react';
import type { ActivityItem, UserProfile } from '../types';
import { playGentleClick } from '../utils/audio';

interface HistoryViewProps {
  activities: ActivityItem[];
  user: UserProfile | null;
  onBackToDashboard: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  activities,
  user,
  onBackToDashboard,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Memory', 'Attention', 'Planning'];

  const filtered =
    filterCategory === 'All'
      ? activities
      : activities.filter((a) => a.category === filterCategory);

  const totalPointsEarned = activities.reduce((sum, a) => sum + (a.points || 0), 0);
  const avgAccuracy = Math.round(
    activities.reduce((sum, a) => sum + (a.accuracy || 95), 0) / (activities.length || 1)
  );

  return (
    <main id="history-view-main" className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center text-[#002045] dark:text-sky-300 font-bold text-base hover:underline mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] dark:text-white">
            Training Activity History
          </h1>
          <p className="font-normal text-[18px] text-slate-600 dark:text-slate-300">
            Comprehensive timeline of your cognitive sessions and brain stimulation milestones.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-sky-50 dark:bg-[#111e38] p-5 rounded-2xl border border-sky-100 dark:border-[#1e3a6a] shadow-xs">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total Sessions Completed</span>
          <p className="font-extrabold text-[32px] text-[#002045] dark:text-white mt-1">{user?.totalSessions || activities.length}</p>
        </div>
        <div className="bg-amber-50 dark:bg-[#2a1e0b] p-5 rounded-2xl border border-amber-200 dark:border-[#78510c] shadow-xs">
          <span className="text-sm font-bold text-amber-900 dark:text-amber-200">Total Points Earned</span>
          <p className="font-extrabold text-[32px] text-amber-950 dark:text-amber-300 mt-1">{totalPointsEarned.toLocaleString()} pts</p>
        </div>
        <div className="bg-emerald-50 dark:bg-[#0e291e] p-5 rounded-2xl border border-emerald-200 dark:border-[#1b5e3f] shadow-xs">
          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Average Accuracy</span>
          <p className="font-extrabold text-[32px] text-emerald-900 dark:text-emerald-300 mt-1">{avgAccuracy}%</p>
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
            className={`px-5 py-2.5 rounded-full text-[16px] font-bold cursor-pointer transition-all ${
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
          <div className="text-center py-12 bg-white dark:bg-[#111e38] rounded-2xl border border-slate-200 dark:border-[#1e3a6a]">
            <p className="text-[18px] text-slate-500 dark:text-slate-400">No activities found in this category yet.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-[#111e38] rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] hover:border-[#002045] dark:hover:border-blue-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-xs"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-blue-900/50 text-[#002045] dark:text-blue-200 border border-sky-100 dark:border-blue-800 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[30px]">{item.icon}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-[20px] text-[#002045] dark:text-white">{item.title}</h3>
                    <span className="bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    {item.timestamp} • Duration: {item.durationMinutes} mins • Accuracy: {item.accuracy || 100}%
                  </p>
                  {item.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">"{item.notes}"</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className="font-extrabold text-[20px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl">
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
