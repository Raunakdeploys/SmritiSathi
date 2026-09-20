import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { speakText, playGentleClick, playSuccessChime } from '../utils/audio';
import { signInWithGoogleSafe, signOutUser } from '../firebase';
import { LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  currentTab: string;
  onOpenProfile: () => void;
  onOpenMobileMenu: () => void;
  onOpenRewards: () => void;
  onShowDomainHelper?: (domain: string, errorCode?: string, errorMessage?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onOpenProfile,
  onOpenMobileMenu,
  onOpenRewards,
  onShowDomainHelper,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const mindPointsFormatted = user?.mindPoints?.toLocaleString() || '1,240';

  const handleReadAloud = () => {
    const speechMessage = `Smriti Saathi. Welcome back ${user?.name || 'Asha Devi'}. You currently have ${user?.mindPoints || 1240} Mind Points and your memory training progress is active.`;
    speakText(speechMessage, true);
  };

  const handleGoogleSignIn = async () => {
    playGentleClick();
    setIsSigningIn(true);
    try {
      const res = await signInWithGoogleSafe();
      if (res.success) {
        playSuccessChime();
      } else {
        if (onShowDomainHelper) {
          onShowDomainHelper(res.unauthorizedDomain || window.location.hostname, res.errorCode, res.error);
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in caught exception:', err);
      if (onShowDomainHelper) {
        onShowDomainHelper(window.location.hostname, err?.code, err?.message);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playGentleClick();
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
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

      <div className="flex items-center space-x-2.5 sm:space-x-3 md:space-x-4">
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
          className="hidden xs:flex items-center bg-[#ffdeaa] hover:bg-[#f8bc4b] text-[#271900] px-3.5 py-2 rounded-full transition-all border border-[#f8bc4b] min-h-[44px] cursor-pointer shadow-xs active:scale-95"
        >
          <span className="material-symbols-outlined mr-1.5 filled-icon text-[#2d1d00] text-[22px]">stars</span>
          <span className="font-extrabold text-[17px]">{mindPointsFormatted}</span>
          <span className="hidden sm:inline text-xs ml-1 text-[#5f4100] font-semibold">pts</span>
        </button>

        {/* Google Sign In / Account Status */}
        {user?.isGoogleLinked ? (
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-[#e7eeff] pl-2 pr-1.5 py-1 rounded-full border border-[#adc7f7]">
            <button
              id="btn-user-google-profile"
              onClick={onOpenProfile}
              title={`Connected with Google: ${user.email || user.name}`}
              className="flex items-center space-x-2 cursor-pointer focus:outline-none"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-sky-400 object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[26px] text-[#002045]">account_circle</span>
              )}
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-extrabold text-[#002045] truncate max-w-[100px] leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Google Synced
                </p>
              </div>
            </button>

            <button
              id="btn-header-signout"
              onClick={handleGoogleSignOut}
              title="Sign out of Google"
              className="p-1.5 text-[#43474e] hover:text-rose-600 hover:bg-white/80 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id="btn-header-google-signin"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            title="Sign in with Google to backup your progress"
            className="flex items-center space-x-1.5 bg-white hover:bg-[#f0f3ff] text-[#002045] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-full border-2 border-[#adc7f7] shadow-xs hover:border-[#002045] transition-all cursor-pointer min-h-[44px]"
          >
            <LogIn className="w-4 h-4 text-[#002045]" />
            <span>{isSigningIn ? 'Signing In...' : 'Google Sign In'}</span>
          </button>
        )}

        {/* Account Profile button for non-Google or direct modal access */}
        {!user?.isGoogleLinked && (
          <button
            id="btn-user-account"
            onClick={onOpenProfile}
            aria-label={`Account profile for ${user?.name || 'Asha Devi'}`}
            className="text-[#002045] hover:bg-[#dee8ff] transition-colors p-1.5 rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#002045] cursor-pointer"
          >
            <span className="material-symbols-outlined filled-icon text-[32px]">account_circle</span>
          </button>
        )}
      </div>
    </header>
  );
};
