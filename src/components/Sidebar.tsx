import React from 'react';
import type { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onStartDailyTraining: () => void;
  user: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onStartDailyTraining,
  user,
}) => {
  const avatarUrl =
    user?.avatarUrl ||
    'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=500&auto=format&fit=crop&q=80';

  return (
    <nav
      id="side-navigation-bar"
      aria-label="Main Navigation"
      className="hidden md:flex flex-col h-full py-6 bg-[#f0f3ff] text-[#002045] font-bold text-[18px] fixed left-0 top-0 w-64 border-r-2 border-[#c4c6cf] z-40 select-none"
    >
      {/* Profile & Action Header */}
      <div className="px-6 mb-6 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <img
            id="user-avatar-image"
            alt={user?.name || 'Elderly user profile'}
            className="w-24 h-24 rounded-full border-4 border-[#d9e3f9] object-cover shadow-sm transition-transform hover:scale-105"
            src={avatarUrl}
          />
          <div
            title="Daily Activity Active"
            className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs"
          >
            ✓
          </div>
        </div>

        <h2 id="sidebar-welcome-title" className="font-extrabold text-[24px] leading-8 text-[#002045]">
          Welcome Back
        </h2>
        <p id="sidebar-welcome-subtitle" className="font-normal text-[17px] text-[#43474e] mt-0.5">
          Ready to train?
        </p>

        <button
          id="btn-start-daily-training-sidebar"
          onClick={onStartDailyTraining}
          className="mt-4 bg-[#002045] hover:bg-[#1a365d] active:bg-[#00142b] text-white w-full py-3.5 px-4 rounded-xl flex items-center justify-center min-h-[56px] text-[18px] font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#002045] focus:ring-offset-2 cursor-pointer hover:shadow-md"
        >
          <span className="material-symbols-outlined mr-2 filled-icon text-[22px]">play_circle</span>
          Start Daily Training
        </button>
      </div>

      {/* Main Navigation Links */}
      <ul className="flex-1 space-y-2 px-4 overflow-y-auto">
        <li>
          <button
            id="nav-btn-carecompass"
            onClick={() => onSelectTab('carecompass')}
            aria-current={currentTab === 'carecompass' ? 'page' : undefined}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl mx-0 my-1 transition-all min-h-[52px] cursor-pointer text-left ${
              currentTab === 'carecompass'
                ? 'bg-[#002045] text-white font-extrabold border-l-4 border-emerald-400 shadow-md'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <div className="flex items-center">
              <span
                className={`material-symbols-outlined mr-3 text-[24px] ${
                  currentTab === 'carecompass' ? 'filled-icon text-emerald-400' : 'text-emerald-700'
                }`}
              >
                radar
              </span>
              <span className="text-[17px]">CareCompass AI</span>
            </div>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
              Live
            </span>
          </button>
        </li>

        <li>
          <button
            id="nav-btn-patient-mode"
            onClick={() => onSelectTab('patient-mode')}
            aria-current={currentTab === 'patient-mode' ? 'page' : undefined}
            className={`w-full flex items-center p-3.5 rounded-xl mx-0 my-1 transition-all min-h-[52px] cursor-pointer text-left ${
              currentTab === 'patient-mode'
                ? 'bg-emerald-800 text-white font-extrabold border-l-4 border-white shadow-md'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-3 text-[24px] ${
                currentTab === 'patient-mode' ? 'filled-icon text-white' : 'text-emerald-700'
              }`}
            >
              shield_person
            </span>
            <span className="text-[17px]">Patient Mode (Dadaji)</span>
          </button>
        </li>

        <li>
          <button
            id="nav-btn-games"
            onClick={() => onSelectTab('games')}
            className={`w-full flex items-center p-3.5 rounded-xl mx-0 my-1 transition-all min-h-[52px] cursor-pointer text-left ${
              currentTab === 'games'
                ? 'bg-[#002045] text-white font-extrabold border-l-4 border-[#002045] shadow-sm'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-3 text-[24px] ${
                currentTab === 'games' ? 'filled-icon text-white' : 'text-[#43474e]'
              }`}
            >
              videogame_asset
            </span>
            <span className="text-[17px]">Games</span>
          </button>
        </li>

        <li>
          <button
            id="nav-btn-reality-quest"
            onClick={() => onSelectTab('reality-quest')}
            className={`w-full flex items-center p-3.5 rounded-xl mx-0 my-1 transition-all min-h-[52px] cursor-pointer text-left ${
              currentTab === 'reality-quest'
                ? 'bg-[#002045] text-white font-extrabold border-l-4 border-[#002045] shadow-sm'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-3 text-[24px] ${
                currentTab === 'reality-quest' ? 'filled-icon text-white' : 'text-[#43474e]'
              }`}
            >
              explore
            </span>
            <span className="text-[17px]">Reality Quest</span>
          </button>
        </li>

        <li>
          <button
            id="nav-btn-dashboard"
            onClick={() => onSelectTab('dashboard')}
            aria-current={currentTab === 'dashboard' ? 'page' : undefined}
            className={`w-full flex items-center p-3.5 rounded-xl mx-0 my-1 transition-all min-h-[52px] cursor-pointer text-left ${
              currentTab === 'dashboard'
                ? 'bg-[#002045] text-white font-extrabold border-l-4 border-[#002045] shadow-sm'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-3 text-[24px] ${
                currentTab === 'dashboard' ? 'filled-icon text-white' : 'text-[#43474e]'
              }`}
            >
              dashboard
            </span>
            <span className="text-[17px]">Dashboard</span>
          </button>
        </li>

        <li>
          <button
            id="nav-btn-caregiver"
            onClick={() => onSelectTab('caregiver')}
            aria-current={currentTab === 'caregiver' ? 'page' : undefined}
            className={`w-full flex items-center p-3.5 rounded-xl mx-0 my-1 transition-all min-h-[52px] cursor-pointer text-left ${
              currentTab === 'caregiver'
                ? 'bg-[#002045] text-white font-extrabold border-l-4 border-[#FF6321] shadow-sm'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-3 text-[24px] ${
                currentTab === 'caregiver' ? 'filled-icon text-[#FF6321]' : 'text-[#43474e]'
              }`}
            >
              supervised_user_circle
            </span>
            <span className="text-[17px]">Caregiver Portal</span>
          </button>
        </li>
      </ul>

      {/* Bottom Secondary Links */}
      <ul className="mt-auto px-4 space-y-2 border-t border-[#c4c6cf]/60 pt-4">
        <li>
          <button
            id="nav-btn-settings"
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center p-4 rounded-xl mx-0 my-1 transition-all min-h-[56px] cursor-pointer text-left ${
              currentTab === 'settings'
                ? 'bg-[#002045] text-white font-extrabold'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-4 text-[26px] ${
                currentTab === 'settings' ? 'filled-icon text-white' : 'text-[#43474e]'
              }`}
            >
              settings
            </span>
            <span className="text-[18px]">Settings</span>
          </button>
        </li>

        <li>
          <button
            id="nav-btn-help"
            onClick={() => onSelectTab('help')}
            className={`w-full flex items-center p-4 rounded-xl mx-0 my-1 transition-all min-h-[56px] cursor-pointer text-left ${
              currentTab === 'help'
                ? 'bg-[#002045] text-white font-extrabold'
                : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
            }`}
          >
            <span
              className={`material-symbols-outlined mr-4 text-[26px] ${
                currentTab === 'help' ? 'filled-icon text-white' : 'text-[#43474e]'
              }`}
            >
              help
            </span>
            <span className="text-[18px]">Help</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
