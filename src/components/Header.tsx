import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { speakText, playGentleClick, playSuccessChime } from '../utils/audio';
import { signInWithGoogle, signOutUser } from '../firebase';
import { storeService } from '../services/storeService';
import { LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const mindPointsFormatted = user?.mindPoints?.toLocaleString() || '1,240';

  const handleReadAloud = () => {
    const speechMessage = `Smriti Saathi. Welcome back ${user?.name || 'Asha Devi'}. You currently have ${user?.mindPoints || 1240} Mind Points and your memory training progress is active.`;
    speakText(speechMessage, true);
  };

  const handleGoogleSignIn = async () => {
    playGentleClick();
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        playSuccessChime();
        if (res.googleUser) {
          storeService.setAuthenticatedSession(res.googleUser);
        }
      } else if (res.error) {
        setAuthError(res.error);
      }
    } catch (err: any) {
      console.warn('Google sign-in caught exception:', err);
      setAuthError(err?.message || 'Unable to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playGentleClick();
    setAuthError(null);
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header
      id="top-app-bar"
      className="bg-[#001838]/95 backdrop-blur-md fixed top-0 left-0 md:left-64 right-0 border-b-2 border-blue-900/60 flex justify-between items-center px-3 sm:px-6 md:px-8 h-[72px] z-30 shadow-md box-border overflow-hidden text-white"
    >
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        {/* Mobile menu trigger */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-sky-400 shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[26px]">menu</span>
        </button>

        <h1
          id="app-main-title"
          className="font-extrabold text-[18px] sm:text-[24px] md:text-[28px] tracking-tight text-white select-none truncate"
        >
          SmritiSaathi
        </h1>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Audio narration button for accessible low-vision reading */}
        <button
          id="btn-read-aloud"
          onClick={handleReadAloud}
          title="Read screen aloud with voice guidance"
          aria-label="Read screen aloud"
          className="p-1.5 sm:p-2 text-white hover:bg-white/10 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-sky-400 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[22px] sm:text-[26px]">volume_up</span>
        </button>

        {/* Mind Points Display (Clickable to redeem rewards) */}
        <button
          id="header-mind-points-chip"
          onClick={onOpenRewards}
          title="Click to view and redeem Mind Points"
          className="hidden sm:flex items-center bg-[#ffdeaa] hover:bg-[#f8bc4b] text-[#271900] px-2.5 sm:px-3 py-1.5 rounded-full transition-all border border-[#f8bc4b] min-h-[38px] cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined mr-1 filled-icon text-[#2d1d00] text-[18px] sm:text-[20px]">stars</span>
          <span className="font-extrabold text-[14px] sm:text-[16px]">{mindPointsFormatted}</span>
          <span className="hidden md:inline text-xs ml-1 text-[#5f4100] font-semibold">pts</span>
        </button>

        {/* Google Sign In / Account Status */}
        {user?.isGoogleLinked ? (
          <div className="flex items-center space-x-1 sm:space-x-2 bg-[#002855] pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-1 rounded-full border border-blue-700">
            <button
              id="btn-user-google-profile"
              onClick={onOpenProfile}
              title={`Connected with Google: ${user.email || user.name}`}
              className="flex items-center space-x-1.5 cursor-pointer focus:outline-none"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-sky-400 object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[24px] sm:text-[26px] text-sky-300">account_circle</span>
              )}
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-extrabold text-white truncate max-w-[100px] leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Google Synced
                </p>
              </div>
            </button>

            <button
              id="btn-header-signout"
              onClick={handleGoogleSignOut}
              title="Sign out of Google"
              className="p-1 sm:p-1.5 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              id="btn-header-google-signin"
              onClick={onOpenProfile}
              title="Sign in to backup your progress across devices"
              className="flex items-center space-x-1 bg-white hover:bg-slate-100 text-[#002045] font-black text-xs px-2.5 sm:px-3 py-1.5 rounded-full border-2 border-white shadow-xs transition-all cursor-pointer min-h-[38px] shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-[#002045]" />
              <span className="hidden xs:inline sm:inline">Sign In</span>
            </button>

            <button
              id="btn-user-account"
              onClick={onOpenProfile}
              aria-label={`Account profile for ${user?.name || 'Asha Devi'}`}
              className="text-white hover:bg-white/10 transition-colors p-1 rounded-full min-h-[38px] min-w-[38px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-sky-400 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined filled-icon text-[26px] sm:text-[28px] text-white">account_circle</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Auth Error Notification Banner */}
      {authError && (
        <div
          role="alert"
          className="absolute top-[76px] right-4 sm:right-6 md:right-12 max-w-md bg-amber-50 border-2 border-amber-400 text-amber-950 p-3.5 rounded-xl shadow-xl flex items-start space-x-2.5 z-50 animate-fadeIn"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold text-amber-900">Sign-In Information</p>
            <p className="mt-0.5 leading-relaxed">{authError}</p>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-amber-700 hover:text-amber-950 font-bold text-xs p-1"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
