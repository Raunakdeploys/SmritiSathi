import React from 'react';
import type { UserProfile, CognitiveProgress } from '../types';

interface ProfileModalProps {
  user: UserProfile | null;
  progress: CognitiveProgress | null;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  progress,
  onClose,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#ffffff] rounded-2xl border-2 border-[#002045] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <img
              src={user?.avatarUrl}
              alt={user?.name || 'Asha Devi'}
              className="w-16 h-16 rounded-full border-2 border-[#d9e3f9] object-cover"
            />
            <div>
              <h2 className="font-extrabold text-[22px] text-[#002045]">{user?.name || 'Asha Devi'}</h2>
              <p className="text-sm text-[#43474e]">Age {user?.age || 72} • Cognitive Companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#43474e] hover:bg-[#f0f3ff] rounded-full"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div className="bg-[#f0f3ff] p-4 rounded-xl border border-[#d9e3f9] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#43474e]">Mind Points Balance:</span>
            <span className="font-extrabold text-[#2d1d00]">{user?.mindPoints?.toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#43474e]">Daily Training Streak:</span>
            <span className="font-bold text-[#002045]">🔥 {user?.currentStreak || 5} Days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#43474e]">Total Completed Sessions:</span>
            <span className="font-bold text-[#002045]">{user?.totalSessions || 38}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#43474e]">Family Caregiver:</span>
            <span className="font-bold text-[#002045]">{user?.caregiverName || 'Rohan Sharma'}</span>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex-1 bg-[#002045] hover:bg-[#1a365d] text-white py-3 rounded-xl font-bold text-base cursor-pointer"
          >
            Open Settings
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-[#c4c6cf] text-[#43474e] rounded-xl font-bold text-base cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
