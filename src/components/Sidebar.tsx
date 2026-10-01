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
      iconActiveColor: 'text-emerald-300',
      iconDefaultColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'patient-mode',
      label: 'Patient Mode (Dadaji)',
      icon: 'shield_person',
      badge: null,
      accentColor: 'border-emerald-400',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'saathi-chat',
      label: 'Saathi AI Chat',
      icon: 'voice_chat',
      badge: 'AI',
      badgeColor: 'bg-[#FF6321] text-white',
      accentColor: 'border-[#FF6321]',
      iconActiveColor: 'text-[#FF6321]',
      iconDefaultColor: 'text-amber-600 dark:text-[#FF844B]',
    },
    {
      id: 'games',
      label: 'Games & Exercises',
      icon: 'videogame_asset',
      badge: null,
      accentColor: 'border-blue-500',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-blue-700 dark:text-sky-400',
    },
    {
      id: 'reality-quest',
      label: 'Reality Quest',
      icon: 'explore',
      badge: null,
      accentColor: 'border-indigo-500',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-indigo-700 dark:text-indigo-400',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      badge: null,
      accentColor: 'border-blue-600',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-slate-700 dark:text-slate-300',
    },
    {
      id: 'caregiver',
      label: 'Caregiver Portal',
      icon: 'supervised_user_circle',
      badge: null,
      accentColor: 'border-rose-500',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      id: 'android-app',
      label: 'Android App & APK',
      icon: 'smartphone',
      badge: 'APK',
      badgeColor: 'bg-emerald-600 text-white',
      accentColor: 'border-emerald-500',
      iconActiveColor: 'text-white',
      iconDefaultColor: 'text-emerald-700 dark:text-emerald-400',
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
    {
      id: 'design',
      label: 'Design System',
      icon: 'palette',
    },
  ];

  return (
    <nav
      id="side-navigation-bar"
      aria-label="Main Navigation"
      className="hidden md:flex flex-col h-screen py-4 px-3 bg-white dark:bg-[#070d18] text-slate-900 dark:text-slate-100 font-bold fixed left-0 top-0 w-64 border-r-2 border-slate-200 dark:border-[#1e3a6a] z-40 select-none overflow-y-auto overflow-x-hidden box-border transition-colors"
    >
      {/* Profile & Action Header */}
      <div className="px-3 mb-4 flex flex-col items-center text-center shrink-0">
        <div className="relative mb-2">
          <img
            id="user-avatar-image"
            alt={user?.name || 'Elderly user profile'}
            className="w-16 h-16 rounded-full border-3 border-blue-200 dark:border-blue-800 object-cover shadow-xs transition-transform hover:scale-105"
            src={avatarUrl}
          />

          <div
            title="Daily Activity Active"
            className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 border-2 border-white dark:border-[#070d18] rounded-full flex items-center justify-center text-white text-[10px]"
          >
            ✓
          </div>
        </div>

        <h2 id="sidebar-welcome-title" className="font-extrabold text-[18px] leading-tight text-slate-900 dark:text-white">
          Welcome Back
        </h2>
        <p id="sidebar-welcome-subtitle" className="font-medium text-[13px] text-slate-600 dark:text-slate-300 mt-0.5">
          Ready to train?
        </p>

        {/* Start Daily Workout Action Button */}
        <button
          id="btn-sidebar-daily-workout"
          onClick={onStartDailyTraining}
          aria-label="Start Daily Brain Training"
          className="mt-3.5 w-full py-2.5 px-3 rounded-xl bg-[#002045] hover:bg-[#1a365d] active:scale-98 text-white font-extrabold text-[13px] tracking-wide transition-all shadow-sm flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-4 focus:ring-blue-400 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">psychology</span>
          <span>Daily Training</span>
        </button>
      </div>

      {/* Primary Navigation Links */}
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[44px] cursor-pointer text-left ${
                isActive
                  ? 'bg-[#002045] dark:bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#111f3d] hover:text-[#002045] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center min-w-0">
                <span
                  className={`material-symbols-outlined mr-2.5 text-[22px] shrink-0 ${
                    isActive ? item.iconActiveColor : item.iconDefaultColor
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[15px] truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
                    isActive ? 'bg-white text-[#002045]' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Links Section (Settings, Help, Design System) */}
      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-[#1e3a6a] space-y-1">
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
                  ? 'bg-blue-700 dark:bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#111f3d] hover:text-blue-900 dark:hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined mr-2.5 text-[22px] shrink-0 ${
                  isActive ? 'filled-icon text-white' : 'text-slate-500 dark:text-slate-400'
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
