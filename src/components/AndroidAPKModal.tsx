import React, { useState } from 'react';
import { playGentleClick, playSuccessBell } from '../utils/audio';

interface AndroidAPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  onDirectInstall: () => Promise<boolean>;
}

export const AndroidAPKModal: React.FC<AndroidAPKModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isIOS,
  isAndroid,
  onDirectInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'pwabuilder' | 'cli'>('direct');
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl || 'https://ais-dev-shb7446nbubn7jhnzagw6i-583635606143.asia-southeast1.run.app')}`;

  const cliCommands = `# Step 1: Install Google's official Bubblewrap CLI
npm install -g @bubblewrap/cli

# Step 2: Initialize Android project from SmritiSaathi manifest
bubblewrap init --manifest="${currentUrl}/manifest.webmanifest"

# Step 3: Build release Android APK & AAB package
bubblewrap build

# Result: Ready-to-install app-release-signed.apk and app.aab for Google Play!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCmd(true);
    playSuccessBell();
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handle1TapInstall = async () => {
    playGentleClick();
    const success = await onDirectInstall();
    if (success) {
      playSuccessBell();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#001026]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f1d38] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border-2 border-slate-300 dark:border-[#1e3a6a] text-[#002045] dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002045] text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px]">android</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-[22px] sm:text-[24px]">SmritiSaathi for Android</h2>
                <span className="bg-[#FF6321] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  APK / TWA Ready
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Install as a native Android app with live AI Chat, Game Generator, and Firebase intact
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[26px]">close</span>
          </button>
        </div>

        {/* Feature Fidelity Assurance Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px] shrink-0">
            verified
          </span>
          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-bold leading-relaxed">
            <strong>100% Live Feature Guarantee:</strong> The Android app runs the full modern Chromium runtime (Trusted Web Activity). Gemini 2.5 Flash AI chat, speech synthesis, Firebase Firestore live sync, and GPS geofencing will function identically without any loss of capabilities.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0a1128] px-6">
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-[#FF6321] text-[#FF6321] bg-white dark:bg-[#0f1d38]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">install_mobile</span>
            <span>1-Tap Install (WebAPK)</span>
          </button>

          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pwabuilder'
                ? 'border-[#FF6321] text-[#FF6321] bg-white dark:bg-[#0f1d38]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">cloud_download</span>
            <span>Download APK (PWABuilder)</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'border-[#FF6321] text-[#FF6321] bg-white dark:bg-[#0f1d38]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span>Build CLI / Play Store</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-[#111e38] border border-blue-200 dark:border-[#1e3a6a] space-y-2">
                <h3 className="font-extrabold text-sm text-[#002045] dark:text-blue-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">phone_android</span>
                  Direct Android WebAPK Installation
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  Android Chrome uses the <strong>WebAPK Minting Service</strong> to package this application into a true native Android APK file on your device. Once installed, it lives in your Android app drawer, has its own standalone icon, and works without any browser address bar.
                </p>
              </div>

              {isInstallable ? (
                <button
                  onClick={handle1TapInstall}
                  className="w-full py-4 rounded-2xl bg-[#002045] hover:bg-[#1a365d] active:scale-98 text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">download_for_offline</span>
                  <span>Install SmritiSaathi App Now</span>
                </button>
              ) : isIOS ? (
                <div className="p-4 bg-slate-50 dark:bg-[#111e38] rounded-2xl border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    To install on an Apple device (iPhone/iPad):
                  </p>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside font-medium">
                    <li>Tap the <strong>Share</strong> button in Safari's toolbar.</li>
                    <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> to place the standalone app on your home screen.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-[#111e38] rounded-2xl border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Installing via Chrome on Android:
                  </p>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside font-medium">
                    <li>Open this URL in Google Chrome on your Android phone.</li>
                    <li>Tap the <strong>three dots (⋮)</strong> menu at the top right.</li>
                    <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>Android will automatically build and install the native WebAPK package.</li>
                  </ol>
                </div>
              )}

              {/* Live Capabilities Matrix */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-100 dark:bg-[#111e38] rounded-xl border border-slate-200 dark:border-[#1e3a6a]">
                  <p className="text-xs font-extrabold text-[#002045] dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Saathi AI Multi-turn Chat
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Live speech recognition &amp; audio synthesis
                  </p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-[#111e38] rounded-xl border border-slate-200 dark:border-[#1e3a6a]">
                  <p className="text-xs font-extrabold text-[#002045] dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Firebase Database Sync
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Real-time cloud backup &amp; caregiver records
                  </p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-[#111e38] rounded-xl border border-slate-200 dark:border-[#1e3a6a]">
                  <p className="text-xs font-extrabold text-[#002045] dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    AI Game Level Forge
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Self-correcting solver test &amp; retry engine
                  </p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-[#111e38] rounded-xl border border-slate-200 dark:border-[#1e3a6a]">
                  <p className="text-xs font-extrabold text-[#002045] dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    CareCompass GPS Rings
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Live telemetry &amp; WhatsApp wander alerts
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2">
                <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  Download Signed APK / AAB for Google Play Store
                </h3>
                <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-semibold">
                  PWABuilder (developed by Microsoft &amp; Google) packages your verified PWA directly into a signed Android <strong>.apk</strong> (for direct sideloading onto phones) or <strong>.aab</strong> (for submission to the Google Play Store).
                </p>
              </div>

              <div className="p-4 bg-slate-100 dark:bg-[#111e38] rounded-2xl border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                  Your Web App Manifest URL:
                </p>
                <div className="p-2.5 bg-white dark:bg-[#0a1128] rounded-xl border border-slate-300 dark:border-[#2a457a] text-xs font-mono select-all break-all">
                  {currentUrl}/manifest.webmanifest
                </div>
              </div>

              <a
                href={pwabuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-[#FF6321] hover:bg-[#e05215] text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
              >
                <span>Open PWABuilder to Download APK / AAB</span>
                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              </a>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                PWABuilder will automatically read your `manifest.webmanifest`, validate all 192x192 &amp; 512x512 icons, and generate the Android Studio package.
              </p>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
                <h3 className="font-extrabold text-sm text-[#002045] dark:text-blue-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">build</span>
                  Build APK with Google's Bubblewrap CLI (TWA)
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  We have added a pre-configured <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono">twa-manifest.json</code> to your project. You can run the following commands on any machine with Node.js and Java/Android SDK installed to generate a signed APK in 2 minutes:
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {cliCommands}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedCmd ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedCmd ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-[#0a1128] px-6 py-4 border-t border-slate-300 dark:border-[#1e3a6a] flex justify-between items-center text-xs text-slate-700 dark:text-slate-300 font-extrabold">
          <span>Target Platform: Android 8.0+ (Chrome / WebAPK / TWA)</span>
          <button
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-[#002045] text-white hover:bg-[#1a365d] rounded-xl cursor-pointer font-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
