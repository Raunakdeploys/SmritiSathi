import React, { useState } from 'react';
import type { UserProfile, FamilyFaceItem } from '../types';
import { playSuccessChime, playGentleClick } from '../utils/audio';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  registerWithEmailPassword,
  signInAsCaregiverDemo,
  signOutUser,
  GOOGLE_CLIENT_ID,
} from '../firebase';
import {
  LogIn,
  LogOut,
  Cloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  KeyRound,
} from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile | null;
  familyFaces: FamilyFaceItem[];
  onUpdateUser: (updated: Partial<UserProfile>) => Promise<void>;
  onAddFamilyFace: (face: Omit<FamilyFaceItem, 'id'>) => Promise<void>;
  onDeleteFamilyFace: (id: string) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  familyFaces,
  onUpdateUser,
  onAddFamilyFace,
  onDeleteFamilyFace,
  onResetDemo,
}) => {
  const [userName, setUserName] = useState(user?.name || 'Asha Devi');
  const [caregiverName, setCaregiverName] = useState(user?.caregiverName || 'Rohan Sharma (Son)');
  const [caregiverPhone, setCaregiverPhone] = useState(user?.caregiverPhone || '+91 98765 43210');
  const [fontSize, setFontSize] = useState(user?.preferences?.fontSize || 'large');
  const [voiceGuidance, setVoiceGuidance] = useState(user?.preferences?.voiceGuidance ?? true);
  const [soundEffects, setSoundEffects] = useState(user?.preferences?.soundEffects ?? true);

  const [isSaved, setIsSaved] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [copiedClientId, setCopiedClientId] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddFaceModal, setShowAddFaceModal] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');
  const [newFaceRelation, setNewFaceRelation] = useState('');
  const [newFaceImageUrl, setNewFaceImageUrl] = useState('');
  const [newFaceHint, setNewFaceHint] = useState('');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://smritisathi-3.onrender.com';

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
    <main id="settings-view-main" className="flex-1 p-4 sm:p-6 md:p-12 bg-[#ffffff] overflow-y-auto">
      <div className="mb-8">
        <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] mb-2">
          Settings & Preferences
        </h1>
        <p className="font-normal text-[18px] md:text-[20px] text-[#43474e]">
          Manage accessibility, caregiver connection, and personalized family memory album.
        </p>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* Google Cloud Account & Cloud Sync Section */}
        <div className="bg-[#f0f5ff] p-6 sm:p-8 rounded-2xl border-2 border-[#adc7f7] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="p-3 bg-white rounded-xl border border-[#adc7f7] shadow-xs text-sky-600">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-[20px] sm:text-[22px] text-[#002045]">
                    Google Cloud Account
                  </h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    user?.isGoogleLinked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {user?.isGoogleLinked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Connected & Synced
                      </>
                    ) : (
                      'Local Guest Profile'
                    )}
                  </span>
                </div>
                <p className="text-sm text-[#43474e] mt-0.5">
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
                  className="px-5 py-3 rounded-xl border-2 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{loadingGoogle ? 'Disconnecting...' : 'Sign Out'}</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
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
                        } else if (res.error) {
                          setAuthError(res.error);
                          setShowOAuthHelp(true);
                        }
                      } catch (err: any) {
                        console.warn('Google sign-in caught error:', err);
                        setAuthError(err?.message || 'Failed to sign in with Google');
                        setShowOAuthHelp(true);
                      } finally {
                        setLoadingGoogle(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-[#002045] text-[#002045] font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <LogIn className="w-4 h-4 text-[#002045]" />
                    <span>{loadingGoogle ? 'Connecting...' : 'Sign In with Google'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playGentleClick();
                      setShowEmailForm(!showEmailForm);
                      setAuthError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#002045] text-white hover:bg-[#1a365d] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Login</span>
                  </button>

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
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>1-Click Demo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email Sign-In / Register Inline Form */}
          {showEmailForm && !user?.isGoogleLinked && (
            <div className="mt-4 p-4 bg-white border border-[#adc7f7] rounded-xl space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#002045]">
                  {isRegistering ? 'Register New Caregiver Account' : 'Caregiver Email Sign In'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
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
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
                className="w-full py-2 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                {loadingGoogle ? 'Processing...' : isRegistering ? 'Register & Sign In' : 'Sign In Now'}
              </button>
            </div>
          )}

          {/* Collapsible Google Cloud Console Fix Diagnostic */}
          <div className="mt-3 border border-[#c6d7ee] bg-white rounded-xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowOAuthHelp(!showOAuthHelp)}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-[#002045] text-left cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Google OAuth Setup & "Error 400: origin_mismatch" Diagnostics
              </span>
              {showOAuthHelp ? <ChevronUp className="w-4 h-4 text-[#66768a]" /> : <ChevronDown className="w-4 h-4 text-[#66768a]" />}
            </button>

            {showOAuthHelp && (
              <div className="p-3.5 space-y-2.5 border-t border-[#c6d7ee] bg-[#fbfcfe]">
                <p className="text-xs text-[#4a5568] leading-relaxed">
                  If Google displays <strong>"Error 400: origin_mismatch"</strong>, copy and paste this exact origin into your Google Cloud Console OAuth 2.0 Web Client:
                </p>

                <div className="p-2.5 bg-slate-100 rounded-lg flex items-center justify-between gap-2 border border-slate-200">
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">App Origin to Add:</span>
                    <code className="text-xs font-mono font-bold text-[#002045]">{currentOrigin}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playGentleClick();
                      navigator.clipboard.writeText(currentOrigin);
                      setCopiedOrigin(true);
                      setTimeout(() => setCopiedOrigin(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-xs text-[#002045] hover:bg-slate-50 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOrigin ? 'Copied' : 'Copy Origin'}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-slate-100 rounded-lg flex items-center justify-between gap-2 border border-slate-200">
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Client ID:</span>
                    <code className="text-xs font-mono font-bold text-[#002045] truncate block max-w-[280px]">
                      {GOOGLE_CLIENT_ID}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playGentleClick();
                      navigator.clipboard.writeText(GOOGLE_CLIENT_ID);
                      setCopiedClientId(true);
                      setTimeout(() => setCopiedClientId(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-xs text-[#002045] hover:bg-slate-50 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedClientId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedClientId ? 'Copied' : 'Copy Client ID'}</span>
                  </button>
                </div>

                <ol className="text-xs text-[#4a5568] list-decimal pl-4 space-y-1">
                  <li>In Google Cloud Console, confirm selected project is <strong>geometric-hill-h7k72</strong> (Project ID)</li>
                  <li>Navigate to <strong>APIs & Services → Credentials</strong></li>
                  <li>Open the OAuth 2.0 Web Client ending in <strong>...60iq</strong></li>
                  <li>Under <strong>Authorized JavaScript origins</strong>, ensure <strong>{currentOrigin}</strong> is listed (without any trailing slash)</li>
                  <li>Click <strong>Save</strong>. Google takes 5 minutes to propagate to all edge servers.</li>
                </ol>
              </div>
            )}
          </div>

          {authError && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm text-amber-950 flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-bold text-amber-900">Sign-in Information</p>
                <p>{authError}</p>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Profile & Caregiver Form */}
        <div className="bg-[#f9f9ff] p-6 sm:p-8 rounded-2xl border-2 border-[#c4c6cf]">
          <h2 className="font-extrabold text-[22px] text-[#002045] mb-4 flex items-center">
            <span className="material-symbols-outlined mr-2 text-[26px]">person</span>
            User & Caregiver Details
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-base text-[#121c2c] mb-1">Senior User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3.5 bg-white border-2 border-[#c4c6cf] rounded-xl text-lg font-bold text-[#002045] focus:border-[#002045] focus:ring-2 focus:ring-[#002045]"
                />
              </div>

              <div>
                <label className="block font-bold text-base text-[#121c2c] mb-1">Primary Family Caregiver</label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  className="w-full p-3.5 bg-white border-2 border-[#c4c6cf] rounded-xl text-lg text-[#002045] focus:border-[#002045] focus:ring-2 focus:ring-[#002045]"
                />
              </div>

              <div>
                <label className="block font-bold text-base text-[#121c2c] mb-1">Caregiver Phone (Emergency)</label>
                <input
                  type="text"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  className="w-full p-3.5 bg-white border-2 border-[#c4c6cf] rounded-xl text-lg text-[#002045] focus:border-[#002045] focus:ring-2 focus:ring-[#002045]"
                />
              </div>

              <div>
                <label className="block font-bold text-base text-[#121c2c] mb-1">Display Text Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full p-3.5 bg-white border-2 border-[#c4c6cf] rounded-xl text-lg text-[#002045] focus:border-[#002045]"
                >
                  <option value="standard">Standard (16px)</option>
                  <option value="large">Large - Senior Friendly (18-20px)</option>
                  <option value="extralarge">Extra Large (24px)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-[#c4c6cf] cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={voiceGuidance}
                  onChange={(e) => setVoiceGuidance(e.target.checked)}
                  className="w-6 h-6 text-[#002045] rounded-md"
                />
                <span className="font-bold text-base text-[#121c2c]">Voice Narration & Hints</span>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-[#c4c6cf] cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="w-6 h-6 text-[#002045] rounded-md"
                />
                <span className="font-bold text-base text-[#121c2c]">Acoustic Chimes & Sound FX</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              {isSaved && (
                <span className="text-emerald-700 font-bold flex items-center text-base">
                  <span className="material-symbols-outlined mr-1">check_circle</span>
                  Preferences saved to database!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto bg-[#002045] hover:bg-[#1a365d] text-white px-8 py-3.5 rounded-xl font-bold text-[18px] min-h-[52px] cursor-pointer shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Family Memory Album Database Manager */}
        <div className="bg-[#f9f9ff] p-6 sm:p-8 rounded-2xl border-2 border-[#c4c6cf]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h2 className="font-extrabold text-[22px] text-[#002045] flex items-center">
                <span className="material-symbols-outlined mr-2 text-[26px]">family_restroom</span>
                Family Memory Album Database
              </h2>
              <p className="text-sm text-[#43474e] mt-1">
                These photos and clues power the <strong>Name That Face</strong> cognitive recall exercise.
              </p>
            </div>

            <button
              onClick={() => setShowAddFaceModal(true)}
              className="bg-[#002045] hover:bg-[#1a365d] text-white px-5 py-3 rounded-xl font-bold text-[16px] flex items-center cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined mr-1.5 text-[20px]">add_photo_alternate</span>
              Add Family Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {familyFaces.map((face) => (
              <div
                key={face.id}
                className="bg-white p-4 rounded-xl border-2 border-[#d9e3f9] shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={face.imageUrl}
                    alt={face.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#c4c6cf]"
                  />
                  <div>
                    <h3 className="font-bold text-[18px] text-[#002045]">{face.name}</h3>
                    <span className="bg-[#d9e3f9] text-[#002045] text-xs font-bold px-2 py-0.5 rounded-full">
                      {face.relation}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#43474e] line-clamp-2 italic mb-3">"{face.hint}"</p>
                <button
                  onClick={() => onDeleteFamilyFace(face.id)}
                  className="text-red-700 hover:bg-red-50 p-2 rounded-lg text-xs font-bold self-end flex items-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Database Demo Reset */}
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[18px] text-red-950">Reset Database to Default State</h3>
            <p className="text-sm text-red-800">
              Restores initial mind points (1,240), progress percentages, and activities.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="bg-red-800 hover:bg-red-900 text-white px-5 py-3 rounded-xl font-bold text-sm cursor-pointer whitespace-nowrap"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Add Face Modal */}
      {showAddFaceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border-2 border-[#002045] p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-[22px] text-[#002045]">Add Family Member to Memory Album</h3>
            <form onSubmit={handleCreateFace} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-[#121c2c]">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={newFaceName}
                  onChange={(e) => setNewFaceName(e.target.value)}
                  className="w-full p-3 border border-[#c4c6cf] rounded-xl text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#121c2c]">Relationship</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandson / Sister"
                  value={newFaceRelation}
                  onChange={(e) => setNewFaceRelation(e.target.value)}
                  className="w-full p-3 border border-[#c4c6cf] rounded-xl text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#121c2c]">Photo URL (or Leave Default)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newFaceImageUrl}
                  onChange={(e) => setNewFaceImageUrl(e.target.value)}
                  className="w-full p-3 border border-[#c4c6cf] rounded-xl text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#121c2c]">Memory Clue / Hint</label>
                <textarea
                  placeholder="e.g. Loved visiting with fresh mangoes during summer vacations."
                  value={newFaceHint}
                  onChange={(e) => setNewFaceHint(e.target.value)}
                  className="w-full p-3 border border-[#c4c6cf] rounded-xl text-base h-20"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFaceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#c4c6cf] font-bold text-[#43474e] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#002045] text-white font-bold cursor-pointer"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
