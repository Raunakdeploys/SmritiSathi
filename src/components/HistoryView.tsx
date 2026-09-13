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
    <main id="history-view-main" className="flex-1 p-4 sm:p-6 md:p-12 bg-[#ffffff] overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center text-[#002045] font-bold text-base hover:underline mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045]">
            Training Activity History
          </h1>
          <p className="font-normal text-[18px] text-[#43474e]">
            Comprehensive timeline of your cognitive sessions and brain stimulation milestones.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#f0f3ff] p-5 rounded-2xl border border-[#d9e3f9]">
          <span className="text-sm font-bold text-[#43474e]">Total Sessions Completed</span>
          <p className="font-extrabold text-[32px] text-[#002045] mt-1">{user?.totalSessions || activities.length}</p>
        </div>
        <div className="bg-[#ffdeaa] p-5 rounded-2xl border border-[#f8bc4b]">
          <span className="text-sm font-bold text-[#271900]">Total Points Earned</span>
          <p className="font-extrabold text-[32px] text-[#2d1d00] mt-1">{totalPointsEarned.toLocaleString()} pts</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
          <span className="text-sm font-bold text-emerald-800">Average Accuracy</span>
          <p className="font-extrabold text-[32px] text-emerald-900 mt-1">{avgAccuracy}%</p>
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
                ? 'bg-[#002045] text-white shadow-xs'
                : 'bg-[#f0f3ff] text-[#43474e] hover:bg-[#d9e3f9] border border-[#c4c6cf]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-[#f9f9ff] rounded-2xl border border-[#c4c6cf]">
            <p className="text-[18px] text-[#43474e]">No activities found in this category yet.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-[#f9f9ff] rounded-2xl border-2 border-[#c4c6cf] hover:border-[#002045] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-[#d6e3ff] text-[#002045] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[30px]">{item.icon}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-[20px] text-[#002045]">{item.title}</h3>
                    <span className="bg-[#d9e3f9] text-[#002045] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-[#43474e] mt-0.5">
                    {item.timestamp} • Duration: {item.durationMinutes} mins • Accuracy: {item.accuracy || 100}%
                  </p>
                  {item.notes && <p className="text-sm text-[#58646a] mt-1 italic">"{item.notes}"</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className="font-extrabold text-[22px] text-[#002045] bg-[#d6e3ff] px-4 py-2 rounded-xl">
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
