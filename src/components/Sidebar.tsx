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

  const navItems = [
    {
      id: 'carecompass',
      label: 'CareCompass AI',
      icon: 'radar',
      badge: 'Live',
      badgeColor: 'bg-emerald-600 text-white',
      accentColor: 'border-emerald-400',
      iconActiveColor: 'text-emerald-400',
      iconDefaultColor: 'text-emerald-600',
    },
    {
      id: 'patient-mode',
      label: 'Patient Mode (Dadaji)',
      icon: 'shield_person',
      badge: null,
      accentColor: 'border-white',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-emerald-700',
    },
    {
      id: 'saathi-chat',
      label: 'Saathi AI Chat',
      icon: 'voice_chat',
      badge: 'AI',
      badgeColor: 'bg-[#FF6321] text-white',
      accentColor: 'border-[#FF6321]',
      iconActiveColor: 'text-[#FF6321]',
      iconDefaultColor: 'text-[#FF6321]',
    },
    {
      id: 'games',
      label: 'Games & Exercises',
      icon: 'videogame_asset',
      badge: null,
      accentColor: 'border-[#002045]',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-[#43474e]',
    },
    {
      id: 'reality-quest',
      label: 'Reality Quest',
      icon: 'explore',
      badge: null,
      accentColor: 'border-[#002045]',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-[#43474e]',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      badge: null,
      accentColor: 'border-[#002045]',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-[#43474e]',
    },
    {
      id: 'caregiver',
      label: 'Caregiver Portal',
      icon: 'supervised_user_circle',
      badge: null,
      accentColor: 'border-[#FF6321]',
      iconActiveColor: 'text-[#FF6321]',
      iconDefaultColor: 'text-[#43474e]',
    },
  ];

  const secondaryNavItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
    },
    {
      id: 'help',
      label: 'Help & Guide',
      icon: 'help',
    },
  ];

  return (
    <nav
      id="side-navigation-bar"
      aria-label="Main Navigation"
      className="hidden md:flex flex-col h-screen py-4 px-3 bg-[#f0f3ff] text-[#002045] font-bold fixed left-0 top-0 w-64 border-r-2 border-[#c4c6cf] z-40 select-none overflow-y-auto overflow-x-hidden box-border"
    >
      {/* Profile & Action Header */}
      <div className="px-3 mb-4 flex flex-col items-center text-center shrink-0">
        <div className="relative mb-2">
          <img
            id="user-avatar-image"
            alt={user?.name || 'Elderly user profile'}
            className="w-16 h-16 rounded-full border-3 border-[#d9e3f9] object-cover shadow-xs transition-transform hover:scale-105"
            src={avatarUrl}
          />
          <div
            title="Daily Activity Active"
            className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px]"
          >
            ✓
          </div>
        </div>

        <h2 id="sidebar-welcome-title" className="font-extrabold text-[18px] leading-tight text-[#002045]">
          Welcome Back
        </h2>
        <p id="sidebar-welcome-subtitle" className="font-normal text-[13px] text-[#43474e] mt-0.5">
          Ready to train?
        </p>

        <button
          id="btn-start-daily-training-sidebar"
          onClick={onStartDailyTraining}
          className="mt-2.5 bg-[#002045] hover:bg-[#1a365d] active:bg-[#00142b] text-white w-full py-2.5 px-3 rounded-xl flex items-center justify-center min-h-[44px] text-[15px] font-bold shadow-xs transition-all focus:outline-none focus:ring-4 focus:ring-[#002045] focus:ring-offset-2 cursor-pointer hover:shadow-sm"
        >
          <span className="material-symbols-outlined mr-2 filled-icon text-[20px]">play_circle</span>
          <span>Start Daily Training</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all min-h-[42px] cursor-pointer text-left ${
                isActive
                  ? item.id === 'patient-mode'
                    ? 'bg-emerald-800 text-white font-extrabold shadow-xs'
                    : `bg-[#002045] text-white font-extrabold shadow-xs ${item.accentColor ? `border-l-4 ${item.accentColor}` : ''}`
                  : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
              }`}
            >
              <div className="flex items-center min-w-0">
                <span
                  className={`material-symbols-outlined mr-2.5 text-[22px] shrink-0 ${
                    isActive ? `filled-icon ${item.iconActiveColor}` : item.iconDefaultColor
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[15px] truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded shrink-0 ml-1 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Links Section (Settings & Help) */}
      <div className="pt-2 mt-2 border-t border-[#c4c6cf]/60 space-y-1">
        {secondaryNavItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center px-3 py-2 rounded-xl transition-all min-h-[42px] cursor-pointer text-left ${
                isActive
                  ? 'bg-[#002045] text-white font-extrabold shadow-xs'
                  : 'text-[#43474e] hover:bg-[#d9e3f9] hover:text-[#002045]'
              }`}
            >
              <span
                className={`material-symbols-outlined mr-2.5 text-[22px] shrink-0 ${
                  isActive ? 'filled-icon text-white' : 'text-[#43474e]'
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[15px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
