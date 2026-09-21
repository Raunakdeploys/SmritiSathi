import React, { useState } from 'react';
import type { UserProfile, CognitiveProgress } from '../types';
import { signInWithGoogle, signOutUser } from '../firebase';
import { playGentleClick, playSuccessChime } from '../utils/audio';
import { LogIn, LogOut, CheckCircle2, Cloud, AlertCircle } from 'lucide-react';

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
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    playGentleClick();
    setAuthError(null);
    setLoadingGoogle(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        playSuccessChime();
      } else if (res.error) {
        setAuthError(res.error);
      }
    } catch (err: any) {
      console.warn('Google sign-in caught exception:', err);
      setAuthError(err?.message || 'Failed to connect Google account');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    playGentleClick();
    setAuthError(null);
    setLoadingGoogle(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error('Google sign-out failed:', err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#ffffff] rounded-2xl border-2 border-[#002045] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
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
              {user?.email && (
                <p className="text-xs text-[#0284C7] font-semibold truncate max-w-[220px]">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            onClick={onClose}
            className="p-1.5 text-[#43474e] hover:bg-[#f0f3ff] rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Google Account & Cloud Sync Status */}
        <div className="p-4 rounded-xl border border-[#adc7f7] bg-[#f0f5ff] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#002045] flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-600" />
              Google Cloud Account
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              user?.isGoogleLinked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {user?.isGoogleLinked ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Synced
                </>
              ) : (
                'Guest / Offline'
              )}
            </span>
          </div>

          {user?.isGoogleLinked ? (
            <div className="space-y-2">
              <p className="text-xs text-[#43474e]">
                Connected with Google as <strong>{user.email}</strong>. Cognitive progress and CareCompass safety alerts are actively syncing with Firestore.
              </p>
              <button
                id="btn-google-signout-modal"
                disabled={loadingGoogle}
                onClick={handleGoogleSignOut}
                className="w-full py-2.5 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loadingGoogle ? 'Signing out...' : 'Sign Out of Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-[#43474e]">
                Sign in with Google to persist your daily training progress, emergency contacts, and family memories across all devices.
              </p>
              <button
                id="btn-google-signin-modal"
                disabled={loadingGoogle}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border-2 border-[#002045] text-[#002045] font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4 text-[#002045]" />
                <span>{loadingGoogle ? 'Connecting Google...' : 'Sign In with Google'}</span>
              </button>

              {authError && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start space-x-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold text-amber-900">Sign-in Notice</p>
                    <p>{authError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Stats Overview */}
        <div className="bg-[#f9f9ff] p-4 rounded-xl border border-[#d5e2e9] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#43474e]">Mind Points Balance:</span>
            <span className="font-extrabold text-[#2d1d00]">{(user?.mindPoints || user?.totalMindPoints || 1240).toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#43474e]">Daily Training Streak:</span>
            <span className="font-bold text-[#002045]">🔥 {user?.currentStreak || user?.dailyStreak || 5} Days</span>
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

        <div className="pt-1 flex gap-3">
          <button
            id="btn-profile-open-settings"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex-1 bg-[#002045] hover:bg-[#1a365d] text-white py-3 rounded-xl font-bold text-base cursor-pointer shadow-xs"
          >
            Open Settings
          </button>
          <button
            id="btn-profile-close-action"
            onClick={onClose}
            className="px-5 py-3 border border-[#c4c6cf] text-[#43474e] hover:bg-slate-50 rounded-xl font-bold text-base cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
