import React, { useState } from "react";
import { UserProfile } from "../types";
import { Cloud, CheckCircle2, LogIn, LogOut, Loader2, Sparkles, Sliders, Shield, Volume2, Bell, Type, Brain } from "lucide-react";
import { playGentleClick } from "../utils/audio";
import { signInWithGoogle, signOutUser } from "../firebase";

export interface FamilyFaceItemSetting {
  id: string;
  name: string;
  relation: string;
  imageUrl?: string;
  audioGreetingUrl?: string;
  notes?: string;
  hint?: string;
}

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  familyFaces: FamilyFaceItemSetting[];
  onAddFamilyFace: (face: { name: string; relation: string; imageUrl?: string; hint?: string }) => void;
  onDeleteFamilyFace: (id: string) => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  familyFaces,
  onAddFamilyFace,
  onDeleteFamilyFace,
  onResetDemo,
}) => {
  const [largeText, setLargeText] = useState(user.preferences?.largeText || false);
  const [soundEffects, setSoundEffects] = useState(user.preferences?.soundEffects ?? true);
  const [voiceGuidance, setVoiceGuidance] = useState(user.preferences?.voiceGuidance ?? user.preferences?.voiceAssistance ?? true);
  const [caregiverEmail, setCaregiverEmail] = useState(user.preferences?.caregiverEmail || "");
  const [isSaved, setIsSaved] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Add Family Face Form State
  const [showAddFaceModal, setShowAddFaceModal] = useState(false);
  const [newFaceName, setNewFaceName] = useState("");
  const [newFaceRelation, setNewFaceRelation] = useState("");
  const [newFaceImageUrl, setNewFaceImageUrl] = useState("");
  const [newFaceHint, setNewFaceHint] = useState("");

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    playGentleClick();
    onUpdateUser({
      ...user,
      preferences: {
        ...user.preferences,
        largeText,
        soundEffects,
        voiceGuidance,
        voiceAssistance: voiceGuidance,
        caregiverEmail,
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCreateFace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaceName.trim()) return;
    playGentleClick();
    onAddFamilyFace({
      name: newFaceName.trim(),
      relation: newFaceRelation.trim() || "Family",
      imageUrl:
        newFaceImageUrl.trim() ||
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      hint: newFaceHint.trim() || "A cherished family member always supporting you.",
    });
    setShowAddFaceModal(false);
    setNewFaceName("");
    setNewFaceRelation("");
    setNewFaceImageUrl("");
    setNewFaceHint("");
  };

  return (
    <main
      id="settings-view-main"
      className="flex-1 p-4 sm:p-6 md:p-10 bg-[#020d1c] text-white w-full min-w-0 max-w-full overflow-x-hidden box-border"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-white mb-2 flex items-center gap-3">
            <Sliders className="w-8 h-8 text-sky-400" />
            Settings & Preferences
          </h1>
          <p className="font-normal text-[16px] md:text-[18px] text-blue-200">
            Manage accessibility, caregiver connection, and personalized family memory album.
          </p>
        </div>

        {/* Google Cloud Account & Cloud Sync Section */}
        <div className="bg-[#0b1d3a] p-6 sm:p-8 rounded-2xl border-2 border-blue-900/70 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="p-3 bg-[#00142b] rounded-xl border border-blue-800 text-sky-400 shadow-md">
                <Cloud className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-[20px] sm:text-[22px] text-white">
                    Google Cloud Account
                  </h2>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      (user as any)?.isGoogleLinked ? "bg-emerald-950/80 border border-emerald-500 text-emerald-300" : "bg-blue-950 border border-blue-800 text-blue-300"
                    }`}
                  >
                    {(user as any)?.isGoogleLinked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Connected & Synced
                      </>
                    ) : (
                      "Local Guest Profile"
                    )}
                  </span>
                </div>
                <p className="text-sm text-blue-200 mt-1">
                  {(user as any)?.isGoogleLinked
                    ? `Authenticated as ${(user as any).email || "User"}. Data is secured and synced to Firestore Cloud database.`
                    : "Sign in with Google to backup cognitive training scores, family faces, and CareCompass alerts across all devices."}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {(user as any)?.isGoogleLinked ? (
                <button
                  id="btn-settings-google-signout"
                  disabled={loadingGoogle}
                  onClick={async () => {
                    playGentleClick();
                    setLoadingGoogle(true);
                    setGoogleError(null);
                    try {
                      await signOutUser();
                      onUpdateUser({
                        ...user,
                        name: "Ashok Sharma",
                        isGoogleLinked: false,
                        googlePhotoUrl: undefined,
                      } as any);
                    } catch (err: any) {
                      setGoogleError(err?.message || "Failed to sign out");
                    } finally {
                      setLoadingGoogle(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border-2 border-red-500/50 bg-red-950/40 text-red-300 hover:bg-red-900/60 font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {loadingGoogle ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  id="btn-settings-google-signin"
                  disabled={loadingGoogle}
                  onClick={async () => {
                    playGentleClick();
                    setLoadingGoogle(true);
                    setGoogleError(null);
                    try {
                      const res = await signInWithGoogle();
                      const fbUser = res.user;
                      onUpdateUser({
                        ...user,
                        name: fbUser?.displayName || user.name,
                        isGoogleLinked: true,
                        googlePhotoUrl: fbUser?.photoURL || undefined,
                      } as any);
                    } catch (err: any) {
                      setGoogleError(err?.message || "Google sign-in was cancelled");
                    } finally {
                      setLoadingGoogle(false);
                    }
                  }}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#00142b] font-black text-sm flex items-center space-x-2.5 shadow-md transition-all cursor-pointer"
                >
                  {loadingGoogle ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>

          {googleError && (
            <div className="mt-3 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200">
              {googleError}
            </div>
          )}
        </div>

        {/* Accessibility & Audio Controls Form */}
        <div className="bg-[#0b1d3a] p-6 sm:p-8 rounded-2xl border-2 border-blue-900/70 shadow-lg">
          <h2 className="font-extrabold text-[22px] text-white mb-6 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-sky-400" />
            Display & Accessibility
          </h2>
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-sm text-blue-200 mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-400" />
                  Caregiver Notification Email
                </label>
                <input
                  type="email"
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  placeholder="caregiver@family.com"
                  className="w-full p-3.5 bg-[#00142b] border-2 border-blue-800 rounded-xl text-white placeholder-blue-400/50 focus:border-sky-400 outline-hidden text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-sm text-blue-200 mb-2 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-sky-400" />
                  Interface Font Size
                </label>
                <select
                  value={largeText ? "large" : "standard"}
                  onChange={(e) => setLargeText(e.target.value === "large")}
                  className="w-full p-3.5 bg-[#00142b] border-2 border-blue-800 rounded-xl text-white focus:border-sky-400 outline-hidden text-base font-bold"
                >
                  <option value="standard">Standard (18px Base)</option>
                  <option value="large">Large / High Readability (22px Base)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-4 bg-[#00142b] rounded-xl border-2 border-blue-800/80 hover:border-sky-500/60 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={voiceGuidance}
                  onChange={(e) => setVoiceGuidance(e.target.checked)}
                  className="w-5 h-5 accent-sky-400 rounded-md"
                />
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-sky-400" />
                  <span className="font-bold text-base text-white">Voice Narration & Hints</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 bg-[#00142b] rounded-xl border-2 border-blue-800/80 hover:border-sky-500/60 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="w-5 h-5 accent-sky-400 rounded-md"
                />
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-sky-400" />
                  <span className="font-bold text-base text-white">Acoustic Chimes & FX</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              {isSaved && (
                <span className="text-emerald-400 font-bold flex items-center text-base">
                  <CheckCircle2 className="w-5 h-5 mr-1.5 text-emerald-400" />
                  Preferences saved to database!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto bg-white hover:bg-slate-100 text-[#00142b] px-8 py-3.5 rounded-xl font-black text-lg min-h-[52px] cursor-pointer shadow-lg transition-all"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Family Memory Album Database Manager */}
        <div className="bg-[#0b1d3a] p-6 sm:p-8 rounded-2xl border-2 border-blue-900/70 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h2 className="font-extrabold text-[22px] text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-sky-400" />
                Family Memory Album Archive
              </h2>
              <p className="text-sm text-blue-200 mt-1">
                These photos and clues power the <strong>Name That Face</strong> and <strong>FaceBond</strong> cognitive recall exercises.
              </p>
            </div>
            <button
              onClick={() => setShowAddFaceModal(true)}
              className="bg-sky-500 hover:bg-sky-400 text-[#00142b] px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
              Add Family Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {familyFaces.map((face) => (
              <div
                key={face.id}
                className="bg-[#00142b] p-4 rounded-xl border-2 border-blue-800/70 shadow-md flex flex-col justify-between"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={face.imageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"}
                    alt={face.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-blue-700"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-white">{face.name}</h3>
                    <span className="bg-blue-900/80 text-sky-300 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-700">
                      {face.relation}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-200 line-clamp-2 italic mb-3">"{face.hint || face.notes || "Family member"}"</p>
                <button
                  onClick={() => onDeleteFamilyFace(face.id)}
                  className="text-red-400 hover:bg-red-950/60 p-2 rounded-lg text-xs font-bold self-end flex items-center cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Database Demo Reset */}
        <div className="p-6 bg-red-950/40 rounded-2xl border-2 border-red-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-red-200">Reset Application State</h3>
            <p className="text-sm text-red-300/80">
              Restores initial mind points (1,240), cognitive domain baseline scores, and activities.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="bg-red-700 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold text-sm cursor-pointer whitespace-nowrap shadow-md transition-all"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Add Face Modal */}
      {showAddFaceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0b1d3a] rounded-2xl border-2 border-blue-700 p-6 max-w-lg w-full space-y-4 shadow-2xl text-white">
            <h3 className="font-extrabold text-[22px] text-white">Add Family Member to Memory Album</h3>
            <form onSubmit={handleCreateFace} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-blue-200 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={newFaceName}
                  onChange={(e) => setNewFaceName(e.target.value)}
                  className="w-full p-3 bg-[#00142b] border-2 border-blue-800 rounded-xl text-white focus:border-sky-400 outline-hidden text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-200 mb-1">Relationship</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandson / Sister"
                  value={newFaceRelation}
                  onChange={(e) => setNewFaceRelation(e.target.value)}
                  className="w-full p-3 bg-[#00142b] border-2 border-blue-800 rounded-xl text-white focus:border-sky-400 outline-hidden text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-200 mb-1">Photo URL (or Leave Default)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newFaceImageUrl}
                  onChange={(e) => setNewFaceImageUrl(e.target.value)}
                  className="w-full p-3 bg-[#00142b] border-2 border-blue-800 rounded-xl text-white focus:border-sky-400 outline-hidden text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-200 mb-1">Memory Clue / Hint</label>
                <textarea
                  placeholder="e.g. Loved visiting with fresh mangoes during summer vacations."
                  value={newFaceHint}
                  onChange={(e) => setNewFaceHint(e.target.value)}
                  className="w-full p-3 bg-[#00142b] border-2 border-blue-800 rounded-xl text-white focus:border-sky-400 outline-hidden text-base h-20"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFaceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-blue-700 font-bold text-blue-300 hover:bg-blue-900/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#00142b] font-black cursor-pointer shadow-md"
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
