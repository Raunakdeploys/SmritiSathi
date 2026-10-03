import React from 'react';
import type { UserProfile } from '../types';
import {
  LayoutDashboard,
  Heart,
  Gamepad2,
  Compass,
  Radar,
  Shield,
  UserCheck,
  Smartphone,
  Settings,
  HelpCircle,
  Palette,
  Sparkles,
  Flame,
} from 'lucide-react';
import { playGentleClick } from '../utils/audio';

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

  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard (Home)',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'saathi-chat',
      label: 'Saathi AI Chat',
      icon: Heart,
      badge: 'AI',
      badgeColor: 'bg-[#FF6321] text-white',
    },
    {
      id: 'games',
      label: 'Games & Exercises',
      icon: Gamepad2,
      badge: null,
    },
    {
      id: 'reality-quest',
      label: 'Reality Quest',
      icon: Compass,
      badge: null,
    },
  ];

  const safetyNavItems = [
    {
      id: 'carecompass',
      label: 'CareCompass Radar',
      icon: Radar,
      badge: 'Live',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'patient-mode',
      label: 'Patient Mode (Dadaji)',
      icon: Shield,
      badge: null,
    },
    {
      id: 'caregiver',
      label: 'Caregiver Portal',
      icon: UserCheck,
      badge: null,
    },
  ];

  const systemNavItems = [
    {
      id: 'android-app',
      label: 'Android App & APK',
      icon: Smartphone,
      badge: 'APK',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
    {
      id: 'help',
      label: 'Help & Guide',
      icon: HelpCircle,
      badge: null,
    },
    {
      id: 'design',
      label: 'Design System',
      icon: Palette,
      badge: null,
    },
  ];

  const handleNavClick = (tabId: string) => {
    playGentleClick();
    onSelectTab(tabId);
  };

  return (
    <nav
      id="side-navigation-bar"
      aria-label="Main Navigation"
      className="hidden md:flex flex-col h-screen py-5 px-3.5 bg-white dark:bg-[#070d18] text-slate-900 dark:text-slate-100 font-bold fixed left-0 top-0 w-64 border-r-2 border-slate-200 dark:border-[#1e3a6a] z-40 select-none overflow-y-auto overflow-x-hidden box-border transition-colors shadow-xs"
    >
      {/* Profile & Action Header */}
      <div className="px-2 mb-4 flex flex-col items-center text-center shrink-0">
        <div className="relative mb-2">
          <img
            id="user-avatar-image"
            alt={user?.name || 'Elderly user profile'}
            className="w-16 h-16 rounded-full border-3 border-blue-200 dark:border-blue-800 object-cover shadow-sm transition-transform hover:scale-105"
            src={avatarUrl}
          />
          <div
            title="Daily Activity Active"
            className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 border-2 border-white dark:border-[#070d18] rounded-full flex items-center justify-center text-white text-[10px]"
          >
            ✓
          </div>
        </div>

        <h2 id="sidebar-welcome-title" className="font-extrabold text-[17px] leading-tight text-slate-900 dark:text-white">
          {user?.name || 'Asha Devi'}
        </h2>
        <p id="sidebar-welcome-subtitle" className="font-medium text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Home Sanctuary Active
        </p>

        {/* Start Daily Workout Action Button */}
        <button
          id="btn-sidebar-daily-workout"
          type="button"
          onClick={() => {
            playGentleClick();
            onStartDailyTraining();
          }}
          aria-label="Start Daily Brain Training"
          className="mt-3 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#002045] to-[#0c3160] hover:from-[#092954] hover:to-[#113e77] active:scale-98 text-white font-extrabold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-400 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Start Daily Workout</span>
        </button>
      </div>

      {/* Primary Navigation Section: Home & Brain */}
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
          Mind & Stimulation
        </span>
        {primaryNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[44px] cursor-pointer text-left ${
                isActive
                  ? 'bg-[#002045] dark:bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#111f3d] hover:text-[#002045] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center min-w-0 gap-2.5">
                <IconComp
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span className="text-sm truncate">{item.label}</span>
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

      {/* Safety & Caregiver Section */}
      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-[#1e3a6a] space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
          Safety & Care
        </span>
        {safetyNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[44px] cursor-pointer text-left ${
                isActive
                  ? 'bg-[#002045] dark:bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#111f3d] hover:text-[#002045] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center min-w-0 gap-2.5">
                <IconComp
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span className="text-sm truncate">{item.label}</span>
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

      {/* System & Tools Section */}
      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-[#1e3a6a] space-y-1 flex-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
          Tools & Settings
        </span>
        {systemNavItems.map((item) => {
          const isActive = currentTab === item.id;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all min-h-[40px] cursor-pointer text-left ${
                isActive
                  ? 'bg-[#002045] dark:bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111f3d] hover:text-[#002045] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center min-w-0 gap-2.5">
                <IconComp
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span className="text-xs truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
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
    </nav>
  );
};
