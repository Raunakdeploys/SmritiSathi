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
  onOpenSearch?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenPrintReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTab,
  onOpenProfile,
  onOpenMobileMenu,
  onOpenRewards,
  onOpenSearch,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenPrintReport,
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
      className="bg-white dark:bg-[#070d18] fixed top-0 left-0 md:left-64 right-0 border-b-2 border-slate-200 dark:border-[#1e3a6a] flex justify-between items-center px-3 sm:px-6 md:px-8 h-[72px] z-30 shadow-xs box-border overflow-hidden transition-colors"
    >
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        {/* Mobile menu trigger */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#111f3d] rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-500 shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[26px]">menu</span>
        </button>

        <h1
          id="app-main-title"
          className="font-extrabold text-[18px] sm:text-[24px] md:text-[28px] tracking-tight text-slate-900 dark:text-white select-none truncate"
        >
          SmritiSaathi
        </h1>

        {/* Site Search Bar / Trigger */}
        {onOpenSearch && (
          <button
            id="btn-header-site-search"
            type="button"
            onClick={onOpenSearch}
            title="Search features, games & emergency actions (Cmd+K)"
            aria-label="Site Search (Cmd+K)"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#1e3a6a] bg-slate-50 dark:bg-[#0f1b36] text-slate-600 dark:text-slate-300 hover:border-blue-500 dark:hover:border-sky-400 text-xs transition-all cursor-pointer shadow-xs ml-4"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">search</span>
            <span>Search features...</span>
            <kbd className="ml-2 font-mono text-[10px] bg-slate-200 dark:bg-[#1a2d52] text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-[#233d6d]">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
        {/* Mobile Search Button */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            title="Search features"
            aria-label="Search features"
            className="md:hidden p-1.5 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#111f3d] rounded-full min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
        )}

        {/* Print Cognitive Handover Report */}
        {onOpenPrintReport && (
          <button
            id="btn-header-print-report"
            type="button"
            onClick={onOpenPrintReport}
            title="Print Clinical Summary & Emergency Handover Card"
            aria-label="Print Clinical Summary"
            className="p-1.5 sm:p-2 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#111f3d] rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">print</span>
          </button>
        )}

        {/* Dark Mode Toggle */}
        {onToggleDarkMode && (
          <button
            id="btn-header-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 sm:p-2 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-[#111f3d] rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        )}

        {/* Audio narration button for accessible low-vision reading */}
        <button
          id="btn-read-aloud"
          onClick={handleReadAloud}
          title="Read screen aloud with voice guidance"
          aria-label="Read screen aloud"
          className="p-1.5 sm:p-2 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#111f3d] rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[22px] sm:text-[26px]">volume_up</span>
        </button>

        {/* Mind Points Display (Clickable to redeem rewards) */}
        <button
          id="header-mind-points-chip"
          onClick={onOpenRewards}
          title="Click to view and redeem Mind Points"
          className="hidden sm:flex items-center bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/90 text-amber-950 dark:text-amber-200 px-2.5 sm:px-3 py-1.5 rounded-full transition-all border border-amber-300 dark:border-amber-700 min-h-[38px] cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined mr-1 filled-icon text-amber-600 dark:text-amber-300 text-[18px] sm:text-[20px]">stars</span>
          <span className="font-extrabold text-[14px] sm:text-[16px]">{mindPointsFormatted}</span>
          <span className="hidden md:inline text-xs ml-1 text-amber-800 dark:text-amber-300/80 font-semibold">pts</span>
        </button>

        {/* Google Sign In / Account Status */}
        {user?.isGoogleLinked ? (
          <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 dark:bg-[#111f3d] pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-1 rounded-full border border-blue-200 dark:border-[#1e3a6a]">
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
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-blue-400 object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[24px] sm:text-[26px] text-slate-800 dark:text-slate-200">account_circle</span>
              )}
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[100px] leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Google Synced
                </p>
              </div>
            </button>

            <button
              id="btn-header-signout"
              onClick={handleGoogleSignOut}
              title="Sign out of Google"
              className="p-1 sm:p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/80 dark:hover:bg-[#1a2d52] rounded-full transition-colors cursor-pointer"
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
              className="flex items-center space-x-1 bg-white hover:bg-blue-50 dark:bg-[#111f3d] dark:hover:bg-[#1a2d52] text-slate-800 dark:text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-full border-2 border-slate-300 dark:border-[#1e3a6a] shadow-xs hover:border-blue-600 dark:hover:border-sky-400 transition-all cursor-pointer min-h-[38px] shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span className="hidden xs:inline sm:inline">Sign In</span>
            </button>

            <button
              id="btn-user-account"
              onClick={onOpenProfile}
              aria-label={`Account profile for ${user?.name || 'Asha Devi'}`}
              className="text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#111f3d] transition-colors p-1 rounded-full min-h-[38px] min-w-[38px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-500 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined filled-icon text-[26px] sm:text-[28px]">account_circle</span>
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
