import React from 'react';
import type { UserProfile } from '../types';
import { speakText } from '../utils/audio';

interface HeaderProps {
  user: UserProfile | null;
  currentTab: string;
  onOpenProfile: () => void;
  onOpenMobileMenu: () => void;
  onOpenRewards: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onOpenProfile,
  onOpenMobileMenu,
  onOpenRewards,
}) => {
  const mindPointsFormatted = user?.mindPoints?.toLocaleString() || '1,240';

  const handleReadAloud = () => {
    const speechMessage = `Smriti Saathi. Welcome back ${user?.name || 'Asha Devi'}. You currently have ${user?.mindPoints || 1240} Mind Points and your memory training progress is active.`;
    speakText(speechMessage, true);
  };

  return (
    <header
      id="top-app-bar"
      className="bg-[#f9f9ff] fixed top-0 w-full md:w-[calc(100%-16rem)] md:left-64 border-b-2 border-[#c4c6cf] flex justify-between items-center px-4 sm:px-6 md:px-12 h-[72px] z-30 shadow-xs"
    >
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 text-[#002045] hover:bg-[#d9e3f9] rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#002045]"
        >
          <span className="material-symbols-outlined text-[30px]">menu</span>
        </button>

        <h1
          id="app-main-title"
          className="font-extrabold text-[26px] md:text-[32px] tracking-tight text-[#002045] select-none"
        >
          SmritiSaathi
        </h1>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Audio narration button for accessible low-vision reading */}
        <button
          id="btn-read-aloud"
          onClick={handleReadAloud}
          title="Read screen aloud with voice guidance"
          aria-label="Read screen aloud"
          className="p-2 text-[#002045] hover:bg-[#d9e3f9] rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-[#002045] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[26px]">volume_up</span>
        </button>

        {/* Mind Points Display (Clickable to redeem rewards) */}
        <button
          id="header-mind-points-chip"
          onClick={onOpenRewards}
          title="Click to view and redeem Mind Points"
          className="flex items-center bg-[#ffdeaa] hover:bg-[#f8bc4b] text-[#271900] px-4 py-2 rounded-full transition-all border border-[#f8bc4b] min-h-[44px] cursor-pointer shadow-xs active:scale-95"
        >
          <span className="material-symbols-outlined mr-1.5 filled-icon text-[#2d1d00] text-[22px]">stars</span>
          <span className="font-extrabold text-[17px]">{mindPointsFormatted}</span>
          <span className="hidden sm:inline text-xs ml-1 text-[#5f4100] font-semibold">pts</span>
        </button>

        {/* Account Profile button */}
        <button
          id="btn-user-account"
          onClick={onOpenProfile}
          aria-label={`Account profile for ${user?.name || 'Asha Devi'}`}
          className="text-[#002045] hover:bg-[#dee8ff] transition-colors p-1.5 rounded-full min-h-[52px] min-w-[52px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#002045] focus:ring-offset-2 cursor-pointer"
        >
          <span className="material-symbols-outlined filled-icon text-[34px]">account_circle</span>
        </button>
      </div>
    </header>
  );
};
