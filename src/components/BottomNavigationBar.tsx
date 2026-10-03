import React from 'react';
import {
  LayoutDashboard,
  Heart,
  Gamepad2,
  Radar,
  Shield,
  UserCheck,
} from 'lucide-react';
import { playGentleClick } from '../utils/audio';

interface BottomNavigationBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSOS?: () => void;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'saathi-chat',
      label: 'Saathi AI',
      icon: Heart,
      badge: 'AI',
    },
    {
      id: 'games',
      label: 'Exercises',
      icon: Gamepad2,
    },
    {
      id: 'carecompass',
      label: 'Safety',
      icon: Radar,
      badge: 'Live',
    },
    {
      id: 'caregiver',
      label: 'Caregiver',
      icon: UserCheck,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav-bar"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#1e3a6a] px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-inset-bottom no-print transition-colors"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              playGentleClick();
              onSelectTab(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
              isActive
                ? 'text-[#002045] dark:text-sky-300 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-100/80 dark:bg-sky-950/80 text-[#002045] dark:text-sky-300 scale-110 shadow-xs'
                  : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight font-extrabold">{item.label}</span>
            {item.badge && !isActive && (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-[#FF6321] animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
