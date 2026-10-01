import React, { useState } from 'react';
import type { UserProfile, FamilyFaceItem } from '../types';
import { playSuccessChime, playGentleClick } from '../utils/audio';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  registerWithEmailPassword,
  signInAsCaregiverDemo,
  signOutUser,
} from '../firebase';
import { storeService } from '../services/storeService';
import {
  LogIn,
  LogOut,
  Cloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Mail,
  User,
  Settings,
  Image,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidAPKModal } from './AndroidAPKModal';

interface SettingsViewProps {
  user: UserProfile | null;
  familyFaces: FamilyFaceItem[];
  onUpdateUser: (updated: Partial<UserProfile>) => Promise<void>;
  onAddFamilyFace: (face: Omit<FamilyFaceItem, 'id'>) => Promise<void>;
  onDeleteFamilyFace: (id: string) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  familyFaces,
  onUpdateUser,
  onAddFamilyFace,
  onDeleteFamilyFace,
  onResetDemo,
  onNavigateToTab,
}) => {
  const [userName, setUserName] = useState(user?.name || 'Asha Devi');
  const [caregiverName, setCaregiverName] = useState(user?.caregiverName || 'Rohan Sharma (Son)');
  const [caregiverPhone, setCaregiverPhone] = useState(user?.caregiverPhone || '+91 98765 43210');
  const [fontSize, setFontSize] = useState(user?.preferences?.fontSize || 'large');
  const [voiceGuidance, setVoiceGuidance] = useState(user?.preferences?.voiceGuidance ?? true);
  const [soundEffects, setSoundEffects] = useState(user?.preferences?.soundEffects ?? true);
  const [showAPKModal, setShowAPKModal] = useState(false);
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  const [isSaved, setIsSaved] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddFaceModal, setShowAddFaceModal] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');
  const [newFaceRelation, setNewFaceRelation] = useState('');
  const [newFaceImageUrl, setNewFaceImageUrl] = useState('');
  const [newFaceHint, setNewFaceHint] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playGentleClick();
    await onUpdateUser({
      name: userName,
      caregiverName,
      caregiverPhone,
      preferences: {
        fontSize,
        highContrast: user?.preferences?.highContrast ?? false,
        voiceGuidance,
        soundEffects,
        reminders: true,
      },
    });
    playSuccessChime();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCreateFace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaceName.trim()) return;
    await onAddFamilyFace({
      name: newFaceName,
      relation: newFaceRelation || 'Family Member',
      imageUrl:
        newFaceImageUrl.trim() ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
      hint: newFaceHint || 'A beloved family relative.',
      funFact: 'Cherished family memory.',
    });
    setShowAddFaceModal(false);
    setNewFaceName('');
    setNewFaceRelation('');
    setNewFaceImageUrl('');
    setNewFaceHint('');
  };

  return (
    <main id="settings-view-main" className="flex-1 p-4 sm:p-6 md:p-10 lg:p-12 bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors">
      <div className="mb-8">
        <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] dark:text-white mb-2">
          Settings & Preferences
        </h1>
        <p className="font-normal text-[18px] md:text-[20px] text-slate-600 dark:text-slate-300">
          Manage accessibility, caregiver connection, and personalized family memory album.
        </p>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* Google Cloud Account & Cloud Sync Section */}
        <div className="bg-sky-50 dark:bg-[#111e38] p-6 sm:p-8 rounded-2xl border-2 border-sky-200 dark:border-[#1e3a6a] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="p-3 bg-white dark:bg-[#0d182e] rounded-xl border border-sky-200 dark:border-[#1e3a6a] shadow-xs text-sky-600 dark:text-sky-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-[20px] sm:text-[22px] text-[#002045] dark:text-white">
                    Google Cloud Account
                  </h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    user?.isGoogleLinked ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {user?.isGoogleLinked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Connected & Synced
                      </>
                    ) : (
                      'Local Guest Profile'
                    )}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {user?.isGoogleLinked
                    ? `Authenticated as ${user.email}. Data is secured and synced to Firestore Cloud database.`
                    : 'Sign in with Google to backup cognitive training scores, family faces, and CareCompass alerts across all devices.'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {user?.isGoogleLinked ? (
                <button
                  id="btn-settings-google-signout"
                  disabled={loadingGoogle}
                  onClick={async () => {
                    playGentleClick();
                    setLoadingGoogle(true);
                    try {
                      await signOutUser();
                    } finally {
                      setLoadingGoogle(false);
                    }
                  }}
                  className="px-5 py-3 rounded-xl border-2 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{loadingGoogle ? 'Disconnecting...' : 'Sign Out'}</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loadingGoogle}
                    onClick={async () => {
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
                      } finally {
                        setLoadingGoogle(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>1-Click Caregiver Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playGentleClick();
                      setShowEmailForm(!showEmailForm);
                      setAuthError(null);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[#002045] dark:bg-blue-600 text-white hover:bg-[#1a365d] dark:hover:bg-blue-500 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Login</span>
                  </button>

                  <button
                    id="btn-settings-google-signin"
                    disabled={loadingGoogle}
                    onClick={async () => {
                      playGentleClick();
                      setAuthError(null);
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
                        console.warn('Google sign-in caught error:', err);
                        setAuthError(err?.message || 'Failed to sign in');
                      } finally {
                        setLoadingGoogle(false);
                      }
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0d182e] hover:bg-slate-50 dark:hover:bg-[#162544] border-2 border-[#002045] dark:border-blue-400 text-[#002045] dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#002045] dark:text-blue-300" />
                    <span>{loadingGoogle ? 'Connecting...' : 'Google'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email Sign-In / Register Inline Form */}
          {showEmailForm && !user?.isGoogleLinked && (
            <div className="mt-4 p-4 bg-white dark:bg-[#0d182e] border border-sky-200 dark:border-[#1e3a6a] rounded-xl space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#002045] dark:text-white">
                  {isRegistering ? 'Register New Caregiver Account' : 'Caregiver Email Sign In'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                >
                  {isRegistering ? 'Switch to Sign In' : 'Need an account? Register'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="caregiver@example.com"
                  className="px-3 py-2 border border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#111e38] text-[#002045] dark:text-white rounded-lg text-xs"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  className="px-3 py-2 border border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#111e38] text-[#002045] dark:text-white rounded-lg text-xs"
                />
              </div>

              <button
                type="button"
                disabled={loadingGoogle || !email || !password}
                onClick={async () => {
                  playGentleClick();
                  setLoadingGoogle(true);
                  setAuthError(null);
                  try {
                    const res = isRegistering
                      ? await registerWithEmailPassword(email, password, 'Caregiver')
                      : await signInWithEmailPassword(email, password);

                    if (res.success) {
                      playSuccessChime();
                      setShowEmailForm(false);
                    } else if (res.error) {
                      setAuthError(res.error);
                    }
                  } finally {
                    setLoadingGoogle(false);
                  }
                }}
                className="w-full py-2 bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                {loadingGoogle ? 'Processing...' : isRegistering ? 'Register & Sign In' : 'Sign In Now'}
              </button>
            </div>
          )}

          {authError && (
            <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-xl text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-bold text-amber-900 dark:text-amber-300">Sign-in Information</p>
                <p>{authError}</p>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="text-amber-700 dark:text-amber-300 hover:text-amber-900 font-bold p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Profile & Caregiver Form */}
        <div className="bg-white dark:bg-[#111e38] p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-xs">
          <h2 className="font-extrabold text-[22px] text-[#002045] dark:text-white mb-4 flex items-center">
            <User className="w-6 h-6 mr-2 text-[#FF6321]" />
            User & Caregiver Details
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-base text-slate-700 dark:text-slate-300 mb-1">Senior User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-[#0d182e] border-2 border-slate-200 dark:border-[#1e3a6a] rounded-xl text-lg font-bold text-[#002045] dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-base text-slate-700 dark:text-slate-300 mb-1">Primary Family Caregiver</label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-[#0d182e] border-2 border-slate-200 dark:border-[#1e3a6a] rounded-xl text-lg text-[#002045] dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-base text-slate-700 dark:text-slate-300 mb-1">Caregiver Phone (Emergency)</label>
                <input
                  type="text"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  className="w-full p-3.5 bg-white dark:bg-[#0d182e] border-2 border-slate-200 dark:border-[#1e3a6a] rounded-xl text-lg text-[#002045] dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-base text-slate-700 dark:text-slate-300 mb-1">Display Text Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full p-3.5 bg-white dark:bg-[#0d182e] border-2 border-slate-200 dark:border-[#1e3a6a] rounded-xl text-lg text-[#002045] dark:text-white focus:border-blue-500"
                >
                  <option value="standard">Standard (16px)</option>
                  <option value="large">Large - Senior Friendly (18-20px)</option>
                  <option value="extralarge">Extra Large (24px)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-[#0d182e] rounded-xl border border-slate-200 dark:border-[#1e3a6a] cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={voiceGuidance}
                  onChange={(e) => setVoiceGuidance(e.target.checked)}
                  className="w-6 h-6 text-[#002045] dark:text-blue-600 rounded-md"
                />
                <span className="font-bold text-base text-slate-800 dark:text-slate-200">Voice Narration & Hints</span>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-[#0d182e] rounded-xl border border-slate-200 dark:border-[#1e3a6a] cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="w-6 h-6 text-[#002045] dark:text-blue-600 rounded-md"
                />
                <span className="font-bold text-base text-slate-800 dark:text-slate-200">Acoustic Chimes & Sound FX</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              {isSaved && (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center text-base">
                  <CheckCircle2 className="w-5 h-5 mr-1" />
                  Preferences saved to database!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold text-[18px] min-h-[52px] cursor-pointer shadow-sm transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Family Memory Album Database Manager */}
        <div className="bg-white dark:bg-[#111e38] p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h2 className="font-extrabold text-[22px] text-[#002045] dark:text-white flex items-center">
                <Image className="w-6 h-6 mr-2 text-[#FF6321]" />
                Family Memory Album Database
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                These photos and clues power the <strong>Name That Face</strong> cognitive recall exercise.
              </p>
            </div>

            <button
              onClick={() => setShowAddFaceModal(true)}
              className="bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-[16px] flex items-center cursor-pointer shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined mr-1.5 text-[20px]">add_photo_alternate</span>
              Add Family Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {familyFaces.map((face) => (
              <div
                key={face.id}
                className="bg-slate-50 dark:bg-[#0d182e] p-4 rounded-xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={face.imageUrl}
                    alt={face.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-[#1e3a6a]"
                  />
                  <div>
                    <h3 className="font-bold text-[18px] text-[#002045] dark:text-white">{face.name}</h3>
                    <span className="bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 text-xs font-bold px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                      {face.relation}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic mb-3">"{face.hint}"</p>
                <button
                  onClick={() => onDeleteFamilyFace(face.id)}
                  className="text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-2 rounded-lg text-xs font-bold self-end flex items-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Android Mobile App (APK / PWA) */}
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#081a17] dark:to-[#091e23] rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[18px] text-emerald-950 dark:text-emerald-100">
                  SmritiSaathi for Android (APK / WebAPK)
                </h3>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Native Experience
                </span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-300 font-medium mt-0.5">
                Download the APK package or install directly onto your Android device with live Gemini 2.5 voice chat, AI Game Forge, and Firebase Firestore persistence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('android-app');
              } else {
                setShowAPKModal(true);
              }
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl font-bold text-sm cursor-pointer whitespace-nowrap shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Open Android App Center</span>
          </button>
        </div>

        {/* Database Demo Reset */}
        <div className="p-6 bg-rose-50 dark:bg-[#201115] rounded-2xl border border-rose-200 dark:border-[#6b2131] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[18px] text-rose-950 dark:text-rose-200">Reset Database to Default State</h3>
            <p className="text-sm text-rose-800 dark:text-rose-300/80">
              Restores initial mind points (1,240), progress percentages, and activities.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="bg-rose-800 hover:bg-rose-900 text-white px-5 py-3 rounded-xl font-bold text-sm cursor-pointer whitespace-nowrap shadow-sm transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Add Face Modal */}
      {showAddFaceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111e38] rounded-2xl border-2 border-[#002045] dark:border-[#1e3a6a] p-6 max-w-lg w-full space-y-4 shadow-2xl text-[#002045] dark:text-white">
            <h3 className="font-extrabold text-[22px] text-[#002045] dark:text-white">Add Family Member to Memory Album</h3>
            <form onSubmit={handleCreateFace} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={newFaceName}
                  onChange={(e) => setNewFaceName(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#0d182e] text-[#002045] dark:text-white rounded-xl text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Relationship</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandson / Sister"
                  value={newFaceRelation}
                  onChange={(e) => setNewFaceRelation(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#0d182e] text-[#002045] dark:text-white rounded-xl text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Photo URL (or Leave Default)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newFaceImageUrl}
                  onChange={(e) => setNewFaceImageUrl(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#0d182e] text-[#002045] dark:text-white rounded-xl text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Memory Clue / Hint</label>
                <textarea
                  placeholder="e.g. Loved visiting with fresh mangoes during summer vacations."
                  value={newFaceHint}
                  onChange={(e) => setNewFaceHint(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-[#1e3a6a] bg-white dark:bg-[#0d182e] text-[#002045] dark:text-white rounded-xl text-base h-20"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFaceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1e3a6a] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#002045] dark:bg-blue-600 text-white font-bold cursor-pointer hover:bg-[#1a365d] dark:hover:bg-blue-500"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Android APK Modal */}
      <AndroidAPKModal
        isOpen={showAPKModal}
        onClose={() => setShowAPKModal(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        onDirectInstall={install}
      />
    </main>
  );
};
