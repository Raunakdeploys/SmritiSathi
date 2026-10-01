import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playGentleClick, playSuccessBell } from '../utils/audio';

interface AndroidAppViewProps {
  onBackToDashboard?: () => void;
}

export const AndroidAppView: React.FC<AndroidAppViewProps> = ({ onBackToDashboard }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeCliTab, setActiveCliTab] = useState<'bubblewrap' | 'capacitor'>('bubblewrap');

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl || 'https://ais-dev-shb7446nbubn7jhnzagw6i-583635606143.asia-southeast1.run.app')}`;

  const bubblewrapCommands = `# Step 1: Install Google's official Bubblewrap CLI
npm install -g @bubblewrap/cli

# Step 2: Initialize Android project from SmritiSaathi manifest
bubblewrap init --manifest="${currentUrl}/manifest.webmanifest"

# Step 3: Build release Android APK & AAB package
bubblewrap build

# Output: app-release-signed.apk (Sideload) and app.aab (Google Play Console)`;

  const capacitorCommands = `# Option B: Alternative Native Android Studio Wrap
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init SmritiSaathi com.smritisathi.app --web-dir dist
npm run build
npx cap add android
npx cap open android

# In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)`;

  const activeCommands = activeCliTab === 'bubblewrap' ? bubblewrapCommands : capacitorCommands;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(activeCommands);
    setCopiedCmd(true);
    playSuccessBell();
    setTimeout(() => setCopiedCmd(false), 2200);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    playSuccessBell();
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const handleInstallClick = async () => {
    playGentleClick();
    const success = await install();
    if (success) {
      playSuccessBell();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Breadcrumb / Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1e3a6a]">
        <div className="flex items-center space-x-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111e38] dark:hover:bg-[#192b4f] text-[#002045] dark:text-white transition-colors cursor-pointer flex items-center gap-1 font-bold text-sm"
              title="Return to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#002045] dark:text-white tracking-tight">
                Android App &amp; APK Center
              </h1>
              <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Live &amp; Verified
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
              Download, package, or install SmritiSaathi as a standalone Android app with 100% feature parity.
            </p>
          </div>
        </div>

        {/* Quick URL Copy for testing on phone */}
        <button
          onClick={handleCopyUrl}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-[#111e38] dark:hover:bg-[#192b4f] text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-[#1e3a6a] text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            {copiedUrl ? 'check_circle' : 'phonelink_setup'}
          </span>
          <span>{copiedUrl ? 'Link Copied for Android Phone!' : 'Copy Mobile Link'}</span>
        </button>
      </div>

      {/* Feature Parity Guarantee Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-[#002045] text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <span className="material-symbols-outlined text-[30px] text-emerald-300">verified</span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <span>Full-Stack Android Architecture Guarantee</span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Zero Fallback Mocks</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 leading-relaxed max-w-3xl">
              The packaged Android application runs inside a native Chromium Trusted Web Activity (TWA). This means your live <strong>Gemini 2.5 Flash Saathi AI multi-turn voice chat</strong>, <strong>Firebase Firestore persistence</strong>, <strong>AI Game Level solver &amp; retry engine</strong>, and <strong>CareCompass GPS hardware geofencing</strong> run identically to the web application.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-emerald-200 uppercase font-black tracking-wider">Device Runtime</p>
            <p className="text-sm font-black">Android 8.0 to 15+</p>
          </div>
          <div className="h-9 w-px bg-white/20 hidden sm:block" />
          <div className="text-right">
            <p className="text-[11px] text-emerald-200 uppercase font-black tracking-wider">Target Package</p>
            <p className="text-sm font-black font-mono">com.smritisathi.app</p>
          </div>
        </div>
      </div>

      {/* 3 Deployment Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Option 1: 1-Tap Direct WebAPK Installation */}
        <div className="bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[28px]">install_mobile</span>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                Direct on Phone
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#002045] dark:text-white">
                1-Tap Install (WebAPK)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                When opened on an Android phone, Google Chrome invokes the official <strong>Android WebAPK Minting Service</strong> to build and install an authentic <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">.apk</code> directly into your phone’s app drawer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">info</span>
                <span>Installation Instructions:</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside font-medium">
                <li>Open this site in Chrome on Android.</li>
                <li>Tap <strong>"Install SmritiSaathi"</strong> below or Chrome menu (⋮) &gt; <em>Install app</em>.</li>
                <li>Launches edge-to-edge with its own home screen icon.</li>
              </ul>
            </div>
          </div>

          <div>
            {isInstalled ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-center font-black text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Currently Running as Installed App</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
                <span>Install SmritiSaathi App Now</span>
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-[#111e38] text-slate-600 dark:text-slate-400 text-xs font-bold text-center border border-slate-200 dark:border-[#1e3a6a]">
                {isIOS
                  ? 'On iOS: Tap Safari Share → Add to Home Screen'
                  : 'Open on Android Chrome to trigger 1-tap WebAPK install'}
              </div>
            )}
          </div>
        </div>

        {/* Option 2: PWABuilder (Google Play & Signed APK) */}
        <div className="bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[28px]">cloud_download</span>
              </div>
              <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                Google Play / Sideload
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#002045] dark:text-white">
                Download APK / AAB (PWABuilder)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                PWABuilder (engineered by Microsoft &amp; Google) takes your pre-configured Web Manifest and packages it into a signed <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">.apk</code> (to install directly on any Android phone) or <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">.aab</code> (for publishing to Google Play).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Validated Manifest Endpoint:
              </p>
              <div className="p-2 bg-white dark:bg-[#070d18] rounded-xl border border-slate-200 dark:border-[#1e3a6a] text-[11px] font-mono select-all break-all text-slate-700 dark:text-slate-300">
                {currentUrl}/manifest.webmanifest
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Includes 192x192, 512x512, and maskable PNG icons with standalone viewport configuration.
              </p>
            </div>
          </div>

          <a
            href={pwabuilderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6321] hover:bg-[#e05215] active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
          >
            <span>Open PWABuilder to Download APK</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        </div>

        {/* Option 3: Bubblewrap CLI & Android Studio */}
        <div className="bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[28px]">terminal</span>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                CLI / Android Studio
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#002045] dark:text-white">
                Build Release APK via CLI
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                Compile the Android package locally using Google’s official Bubblewrap CLI. The project already includes a verified <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">twa-manifest.json</code> in the root directory.
              </p>
            </div>

            {/* CLI Tab Selector */}
            <div className="flex border-b border-slate-200 dark:border-[#1e3a6a]">
              <button
                onClick={() => setActiveCliTab('bubblewrap')}
                className={`py-1.5 px-3 text-xs font-black border-b-2 cursor-pointer transition-colors ${
                  activeCliTab === 'bubblewrap'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Google Bubblewrap (TWA)
              </button>
              <button
                onClick={() => setActiveCliTab('capacitor')}
                className={`py-1.5 px-3 text-xs font-black border-b-2 cursor-pointer transition-colors ${
                  activeCliTab === 'capacitor'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Capacitor / Android Studio
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-36">
                {activeCommands}
              </pre>
            </div>
          </div>

          <button
            onClick={handleCopyCmd}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copiedCmd ? 'check' : 'content_copy'}
            </span>
            <span>{copiedCmd ? 'Commands Copied to Clipboard!' : 'Copy Build Commands'}</span>
          </button>
        </div>
      </div>

      {/* Feature Parity & Live Capabilities Matrix */}
      <div className="bg-white dark:bg-[#0f1d38] p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] space-y-6 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#002045] dark:text-white">
            Feature Parity in the Android App
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
            Every engine and subsystem runs in full production mode inside the installed Android APK:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-[#FF6321] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">voice_chat</span>
            </div>
            <h3 className="text-sm font-extrabold text-[#002045] dark:text-white">Saathi AI Multi-turn</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Real-time voice recognition and Google GenAI streaming conversations with personalized reminiscence memory cues.
            </p>
            <span className="inline-block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
              ✓ Active via Gemini 2.5
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
            </div>
            <h3 className="text-sm font-extrabold text-[#002045] dark:text-white">Firebase Firestore</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Real-time synchronization of cognitive assessments, Mind Points, family photos, and clinical audit records.
            </p>
            <span className="inline-block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
              ✓ Real-time cloud sync
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </div>
            <h3 className="text-sm font-extrabold text-[#002045] dark:text-white">AI Game Forge</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Dynamic level generation with algorithmic solver self-verification and automatic fallback generation for seniors.
            </p>
            <span className="inline-block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
              ✓ Adaptive difficulty
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">radar</span>
            </div>
            <h3 className="text-sm font-extrabold text-[#002045] dark:text-white">CareCompass GPS</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Hardware GPS telemetry with safe geofencing rings, live wandering breach alerts, and automatic WhatsApp dispatch.
            </p>
            <span className="inline-block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
              ✓ Native Location API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
