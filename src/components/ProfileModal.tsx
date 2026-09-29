import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile, CognitiveProgress } from '../types';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  registerWithEmailPassword,
  signInAsCaregiverDemo,
  signOutUser,
  clearGsiCooldownCookie,
  renderGoogleSignInButton,
} from '../firebase';
import { storeService } from '../services/storeService';
import { playGentleClick, playSuccessChime } from '../utils/audio';
import {
  LogIn,
  LogOut,
  CheckCircle2,
  Cloud,
  AlertCircle,
  Mail,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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
  const [authMode, setAuthMode] = useState<'instant' | 'email' | 'google'>('instant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Render official Google Sign-In button whenever Google tab is active
  useEffect(() => {
    if (authMode !== 'google') return;
    let isCancelled = false;

    // Short delay to ensure container DOM element is mounted
    const timeout = setTimeout(() => {
      if (isCancelled || !googleBtnContainerRef.current) return;
      renderGoogleSignInButton(
        googleBtnContainerRef.current,
        (res) => {
          playSuccessChime();
          setAuthError(null);
          setLoadingGoogle(false);
          if (res?.googleUser) {
            storeService.setAuthenticatedSession(res.googleUser);
          }
        },
        (err) => {
          setLoadingGoogle(false);
          setAuthError(err);
        },
        () => setLoadingGoogle(true)
      )
        .then(() => {
          if (!isCancelled) {
            setGoogleButtonReady(true);
            setLoadingGoogle(false);
          }
        })
        .catch(() => {
          if (!isCancelled) setLoadingGoogle(false);
        });
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [authMode]);

  const handleGoogleSignIn = async () => {
    playGentleClick();
    setAuthError(null);
    clearGsiCooldownCookie();
    setLoadingGoogle(true);
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
      setAuthError(err?.message || 'Failed to connect');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    playGentleClick();
    setAuthError(null);
    setLoadingGoogle(true);
    try {
      const res = isRegistering
        ? await registerWithEmailPassword(email, password, 'Caregiver')
        : await signInWithEmailPassword(email, password);

      if (res.success) {
        playSuccessChime();
      } else if (res.error) {
        setAuthError(res.error);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoSignIn = async () => {
    playGentleClick();
    setAuthError(null);
    setLoadingGoogle(true);
    try {
      const res = await signInAsCaregiverDemo('Verified Caregiver');
      if (res.success) {
        playSuccessChime();
      } else if (res.error) {
        setAuthError(res.error);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Guest sign-in failed');
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
      onClose();
    } catch (err) {
      console.error('Google sign-out failed:', err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-[#ffffff] rounded-2xl border-2 border-[#002045] p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3.5">
            <img
              src={user?.avatarUrl}
              alt={user?.name || 'Asha Devi'}
              className="w-14 h-14 rounded-full border-2 border-[#d9e3f9] object-cover shrink-0"
            />
            <div>
              <h2 className="font-extrabold text-[20px] text-[#002045]">{user?.name || 'Asha Devi'}</h2>
              <p className="text-xs text-[#43474e]">Age {user?.age || 72} • Cognitive Companion</p>
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

        {/* Authentication Card */}
        <div className="p-4 rounded-xl border border-[#adc7f7] bg-[#f0f5ff] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#002045] flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-600" />
              Cloud Sync & Authentication
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                user?.isGoogleLinked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {user?.isGoogleLinked ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Synced
                </>
              ) : (
                'Offline Mode'
              )}
            </span>
          </div>

          {user?.isGoogleLinked ? (
            <div className="space-y-2">
              <p className="text-xs text-[#43474e]">
                Connected as <strong>{user.email || user.name}</strong>. Cognitive progress and CareCompass safety alerts are syncing with Firestore.
              </p>
              <button
                id="btn-google-signout-modal"
                disabled={loadingGoogle}
                onClick={handleGoogleSignOut}
                className="w-full py-2.5 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loadingGoogle ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Method Selector Tabs */}
              <div className="flex bg-[#e2eaf8] p-1 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    setAuthMode('instant');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    authMode === 'instant' ? 'bg-white text-[#002045] shadow-xs' : 'text-[#5b687a] hover:text-[#002045]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-Click Access</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    setAuthMode('email');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    authMode === 'email' ? 'bg-white text-[#002045] shadow-xs' : 'text-[#5b687a] hover:text-[#002045]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playGentleClick();
                    setAuthMode('google');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    authMode === 'google' ? 'bg-white text-[#002045] shadow-xs' : 'text-[#5b687a] hover:text-[#002045]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Google</span>
                </button>
              </div>

              {/* Tab 1: 1-Click Access (Recommended Default) */}
              {authMode === 'instant' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-[#43474e]">
                    Instant cloud sync for caregivers and family. No passwords, client IDs, or external accounts needed.
                  </p>
                  <button
                    type="button"
                    disabled={loadingGoogle}
                    onClick={handleDemoSignIn}
                    className="w-full py-3 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>{loadingGoogle ? 'Connecting Cloud...' : 'Continue as Verified Caregiver'}</span>
                  </button>
                </div>
              )}

              {/* Tab 2: Email & Password */}
              {authMode === 'email' && (
                <form onSubmit={handleEmailAuth} className="space-y-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#002045] flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#002045]" />
                      Caregiver Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="caregiver@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-[#b8c8dd] rounded-lg text-xs font-medium text-[#002045] focus:outline-none focus:ring-2 focus:ring-[#002045]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#002045] flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#002045]" />
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-[#b8c8dd] rounded-lg text-xs font-medium text-[#002045] focus:outline-none focus:ring-2 focus:ring-[#002045]"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={loadingGoogle}
                      className="flex-1 py-2 rounded-lg bg-[#002045] hover:bg-[#1a365d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {loadingGoogle ? 'Verifying...' : isRegistering ? 'Create Account' : 'Sign In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setAuthError(null);
                      }}
                      className="px-3 py-2 rounded-lg border border-[#adc7f7] bg-white text-[#002045] text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      {isRegistering ? 'Have an account?' : 'Register'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Google Account */}
              {authMode === 'google' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#43474e]">
                    One-tap sign-in with your Google account. Automatically activates cloud synchronization.
                  </p>

                  {/* Official Google Sign-In Button Container */}
                  <div
                    ref={googleBtnContainerRef}
                    className="flex justify-center min-h-[44px] w-full"
                    id="official-google-button-container"
                  />

                  {/* Manual Fallback Button (only shown while official Google button initializes) */}
                  {!googleButtonReady && (
                    <button
                      id="btn-google-signin-modal"
                      type="button"
                      disabled={loadingGoogle}
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border-2 border-[#002045] text-[#002045] font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <LogIn className="w-4 h-4 text-[#002045]" />
                      <span>{loadingGoogle ? 'Connecting...' : 'Sign In with Google'}</span>
                    </button>
                  )}
                </div>
              )}

              {authError && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start space-x-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold text-amber-900">Sign-in Notice</p>
                    <p>{authError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthError(null)}
                    className="text-amber-800 hover:text-amber-950 font-bold p-1 text-xs cursor-pointer"
                    aria-label="Dismiss notice"
                  >
                    ✕
                  </button>
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
