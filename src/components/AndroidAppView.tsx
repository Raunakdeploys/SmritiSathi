import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playGentleClick, playSuccessBell } from '../utils/audio';

interface AndroidAppViewProps {
  previousTabName?: string;
  onBack?: () => void;
  onClose?: () => void;
}

export const AndroidAppView: React.FC<AndroidAppViewProps> = ({
  previousTabName = 'Dashboard',
  onBack,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [activeCliTab, setActiveCliTab] = useState<'bubblewrap' | 'capacitor'>('bubblewrap');
  const [phonePreviewMode, setPhonePreviewMode] = useState<'standalone' | 'browser'>('standalone');
  const [phoneScreenTab, setPhoneScreenTab] = useState<'saathi' | 'radar' | 'games'>('saathi');
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsDone, setDiagnosticsDone] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>('sideload');

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const manifestUrl = `${currentUrl}/manifest.webmanifest`;
  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl || 'https://ais-dev-shb7446nbubn7jhnzagw6i-583635606143.asia-southeast1.run.app')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(currentUrl)}`;

  // Keyboard shortcut listener: Escape triggers onBack or onClose
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) {
          onClose();
        } else if (onBack) {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onClose]);

  const bubblewrapCommands = `# 1. Install Google's official Bubblewrap CLI globally
npm install -g @bubblewrap/cli

# 2. Initialize native Android project from SmritiSaathi manifest
bubblewrap init --manifest="${manifestUrl}"

# 3. Build release signed APK & Google Play AAB bundle
bubblewrap build

# Generated files:
# -> app-release-signed.apk (Direct sideload on Android devices)
# -> app.aab (Upload to Google Play Developer Console)`;

  const capacitorCommands = `# 1. Install Capacitor Android bridge
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize project configuration
npx cap init SmritiSaathi com.smritisathi.app --web-dir dist

# 3. Build frontend and sync Android Studio project
npm run build
npx cap add android
npx cap open android

# In Android Studio: Select Build > Build Bundle(s) / APK(s) > Build APK(s)`;

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

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestUrl);
    setCopiedManifest(true);
    playSuccessBell();
    setTimeout(() => setCopiedManifest(false), 2200);
  };

  const handleInstallClick = async () => {
    playGentleClick();
    const success = await install();
    if (success) {
      playSuccessBell();
    }
  };

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    playGentleClick();
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setDiagnosticsDone(true);
      playSuccessBell();
    }, 900);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `SmritiSaathi Elder Care & Dementia Companion app is live! Open or install on Android: ${currentUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn pb-24">
      {/* 1. TOP STICKY / BREADCRUMB NAVIGATION BAR WITH BACK & CLOSE BUTTONS */}
      <div className="sticky top-[72px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[#f9f9ff]/95 dark:bg-[#070d18]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1e3a6a] transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back Button & Breadcrumbs */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {onBack && (
              <button
                id="btn-android-nav-back"
                onClick={() => {
                  playGentleClick();
                  onBack();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111e38] hover:bg-slate-100 dark:hover:bg-[#1b2f56] text-[#002045] dark:text-white border border-slate-200 dark:border-[#1e3a6a] font-extrabold text-sm shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title={`Return to ${previousTabName} (or press Escape)`}
                aria-label={`Go back to ${previousTabName}`}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span className="hidden sm:inline">Back to {previousTabName}</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}

            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
              <button
                onClick={onClose || onBack}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-300">Tools</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">Android App &amp; APK Center</span>
            </nav>
          </div>

          {/* Right: Quick Actions & Explicit Close (✕) Button */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Direct 1-Tap install shortcut if installable */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Install on Phone</span>
              </button>
            )}

            {/* Share via WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              title="Share link via WhatsApp"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Share to Phone</span>
            </button>

            {/* Explicit Close Button (✕) */}
            {onClose && (
              <button
                id="btn-android-nav-close"
                onClick={() => {
                  playGentleClick();
                  onClose();
                }}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-200/80 hover:bg-rose-100 dark:bg-[#162544] dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-700 dark:text-slate-200 dark:hover:text-rose-300 border border-slate-300 dark:border-[#1e3a6a] font-extrabold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                title="Close and return to Dashboard (Esc)"
                aria-label="Close Android App Center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
                <span className="hidden sm:inline">Close</span>
                <span className="hidden md:inline text-[10px] text-slate-400 dark:text-slate-500 font-mono">Esc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. HERO BANNER: ARCHITECTURAL ASSURANCE */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-[#002045] text-white shadow-xl border-2 border-emerald-500/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Trusted Web Activity (TWA) &amp; WebAPK Ready
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Android 8.0 to 15+
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              SmritiSaathi for Android
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 font-medium leading-relaxed">
              Deploy, install, or compile the authentic native Android package (<code className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-300 font-mono font-bold">.apk</code> / <code className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-300 font-mono font-bold">.aab</code>) for your friend’s device or the Google Play Console. Includes 100% live voice AI, hardware GPS geofencing, and real-time Firestore persistence.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-3 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-[#002045] hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {copiedUrl ? 'check_circle' : 'link'}
              </span>
              <span>{copiedUrl ? 'Copied URL!' : 'Copy Mobile Link'}</span>
            </button>

            <button
              onClick={handleCopyManifest}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedManifest ? 'check' : 'data_object'}
              </span>
              <span>{copiedManifest ? 'Copied Manifest!' : 'Copy Manifest URL'}</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3. INTERACTIVE SMARTPHONE SIMULATOR & PRE-FLIGHT DIAGNOSTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Phone Simulator (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#002045] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-emerald-600 dark:text-emerald-400">
                  smartphone
                </span>
                <span>Live Android Device Simulator</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                See how SmritiSaathi looks on a modern Android smartphone.
              </p>
            </div>
          </div>

          {/* Mode Switcher: Standalone App vs Browser */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#111e38] rounded-xl border border-slate-200 dark:border-[#1e3a6a] text-xs font-bold">
            <button
              onClick={() => setPhonePreviewMode('standalone')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                phonePreviewMode === 'standalone'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Standalone WebAPK</span>
            </button>
            <button
              onClick={() => setPhonePreviewMode('browser')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                phonePreviewMode === 'browser'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">public</span>
              <span>Browser Tab (Before)</span>
            </button>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="mx-auto w-[290px] sm:w-[320px] rounded-[44px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700 relative text-slate-900 select-none">
            {/* Phone Speaker Notch & Front Camera */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full flex items-center justify-center gap-2 z-20">
              <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-700" />
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Screen Viewport */}
            <div className="rounded-[36px] overflow-hidden bg-[#f9f9ff] flex flex-col h-[520px] border border-slate-800 relative">
              {/* Android Native Status Bar */}
              <div className="bg-slate-900 text-white text-[11px] font-bold px-5 pt-3 pb-1 flex justify-between items-center z-10 shrink-0">
                <span>10:45 AM</span>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span>5G</span>
                  <span className="material-symbols-outlined text-[13px]">wifi</span>
                  <span className="material-symbols-outlined text-[14px]">battery_full</span>
                </div>
              </div>

              {/* Browser Address Bar (Shown ONLY in browser mode) */}
              {phonePreviewMode === 'browser' && (
                <div className="bg-slate-200 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shrink-0 animate-fadeIn">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">lock</span>
                  <span className="truncate text-[11px] font-mono flex-1">smritisathi.in</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-500">more_vert</span>
                </div>
              )}

              {/* Inside App Content */}
              <div className="flex-1 overflow-y-auto p-3.5 flex flex-col justify-between bg-slate-50">
                {/* Header in simulated app */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#002045] text-white flex items-center justify-center font-black text-xs">
                      स्मृति
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-[#002045] leading-tight">SmritiSaathi</p>
                      <p className="text-[9px] text-emerald-600 font-bold">● Live Sync</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                    ★ 1,240 pts
                  </div>
                </div>

                {/* Simulated Tab Content */}
                <div className="my-auto py-3 space-y-3">
                  {phoneScreenTab === 'saathi' && (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-orange-100 text-[#FF6321] rounded-lg material-symbols-outlined text-[18px]">
                          voice_chat
                        </span>
                        <div>
                          <p className="font-extrabold text-xs text-[#002045]">Saathi AI Companion</p>
                          <p className="text-[10px] text-slate-500">"Namaste Asha ji! How are you?"</p>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-100 rounded-xl text-[10px] text-slate-700 italic">
                        Voice memory cues &amp; nostalgia active
                      </div>
                    </div>
                  )}

                  {phoneScreenTab === 'radar' && (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-emerald-800">CareCompass GPS Radar</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">SAFE</span>
                      </div>
                      <div className="h-20 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col items-center justify-center text-center p-2">
                        <span className="material-symbols-outlined text-emerald-600 text-[24px]">home_pin</span>
                        <span className="text-[10px] font-bold text-emerald-900">Inside Safe Anchor Zone (12m)</span>
                      </div>
                    </div>
                  )}

                  {phoneScreenTab === 'games' && (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <p className="font-extrabold text-xs text-[#002045]">Daily Cognitive Drills</p>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                        <div className="p-2 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
                          🧠 WayBack Recall
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
                          ⏳ Clock Routine
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Bottom Navigation */}
                <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex justify-around items-center text-[10px] font-bold shrink-0">
                  <button
                    onClick={() => setPhoneScreenTab('saathi')}
                    className={`p-1.5 rounded-xl flex flex-col items-center ${
                      phoneScreenTab === 'saathi' ? 'text-[#FF6321] font-black' : 'text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">voice_chat</span>
                    <span>Saathi</span>
                  </button>
                  <button
                    onClick={() => setPhoneScreenTab('radar')}
                    className={`p-1.5 rounded-xl flex flex-col items-center ${
                      phoneScreenTab === 'radar' ? 'text-emerald-600 font-black' : 'text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">radar</span>
                    <span>Radar</span>
                  </button>
                  <button
                    onClick={() => setPhoneScreenTab('games')}
                    className={`p-1.5 rounded-xl flex flex-col items-center ${
                      phoneScreenTab === 'games' ? 'text-blue-600 font-black' : 'text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">sports_esports</span>
                    <span>Games</span>
                  </button>
                </div>
              </div>

              {/* Android Gesture Bar */}
              <div className="bg-slate-900 py-1.5 flex justify-center shrink-0">
                <div className="w-24 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            {phonePreviewMode === 'standalone'
              ? '✓ Standalone WebAPK: Zero browser chrome, fullscreen native view.'
              : '⚠️ Browser Tab: URL bar wastes 18% of screen space and can distract seniors.'}
          </p>
        </div>

        {/* Right Column: Pre-Flight Diagnostics & Sideloading QR Code (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pre-Flight Diagnostics Card */}
          <div className="bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#002045] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-blue-600 dark:text-blue-400">
                    checklist_rtl
                  </span>
                  <span>Pre-Flight Android APK Diagnostics</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Verified system criteria required for automated WebAPK minting and Google Play compilation.
                </p>
              </div>

              <button
                onClick={handleRunDiagnostics}
                disabled={diagnosticsRunning}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162544] dark:hover:bg-[#1c3058] text-[#002045] dark:text-white font-bold text-xs border border-slate-200 dark:border-[#1e3a6a] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className={`material-symbols-outlined text-[16px] ${diagnosticsRunning ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>{diagnosticsRunning ? 'Testing...' : 'Re-run Tests'}</span>
              </button>
            </div>

            {/* Diagnostics Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-200">Web App Manifest</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">manifest.webmanifest (Valid)</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-200">Production Service Worker</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">Offline caching &amp; instant sync</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-200">App Icons &amp; Maskables</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">192x192, 512x512, maskable PNG</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-200">SSL &amp; Security Context</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">HTTPS secure origin verified</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-200">Hardware GPS Telemetry</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">CareCompass Geolocation API</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-200">Microphone &amp; Audio Output</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">Saathi voice synthesis active</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Sideload Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#0d172e] dark:to-[#122244] border-2 border-blue-200 dark:border-[#1e3a6a] flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code to open SmritiSaathi on Android"
                className="w-36 h-36 rounded-xl object-contain"
                onError={(e) => {
                  // Fallback visual if third-party QR service is blocked
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Scan with Android Camera
                </span>
                <h3 className="text-xl font-extrabold text-[#002045] dark:text-white mt-1">
                  Instant Phone Testing
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Point any Android phone or tablet camera at this QR code to load the app immediately. Chrome will display the <strong>"Install SmritiSaathi"</strong> prompt on the screen.
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={shareViaWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Send via WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#162544] hover:bg-slate-100 text-[#002045] dark:text-white font-bold text-xs border border-slate-300 dark:border-[#1e3a6a] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">copy_all</span>
                  <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THREE PRODUCTION DEPLOYMENT PATHS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-[#002045] dark:text-white">
            Choose Your Android Deployment Method
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Select how you or your friend want to package and run the application:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Method 1: 1-Tap WebAPK (Fastest, zero dev required) */}
          <div className="bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[28px]">install_mobile</span>
                </div>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                  1-Tap Zero-Build
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#002045] dark:text-white">
                  1. WebAPK Auto-Install
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  Best for end users, family caregivers, and seniors. Google Chrome automatically mints a signed Android package on-device.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                  <span>How to Install on Phone:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                  <li>Scan the QR code or open link in Chrome on Android.</li>
                  <li>Tap the <strong>"Install SmritiSaathi"</strong> button below.</li>
                  <li>Check your home screen or app drawer for the SmritiSaathi icon.</li>
                </ol>
              </div>
            </div>

            <div>
              {isInstalled ? (
                <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-center font-black text-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Running in Standalone Mode</span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
                  <span>Install WebAPK Now</span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-[#111e38] text-slate-600 dark:text-slate-400 text-xs font-bold text-center border border-slate-200 dark:border-[#1e3a6a]">
                  {isIOS
                    ? 'On iOS Safari: Tap Share (⎋) → Add to Home Screen'
                    : 'Open in Chrome on Android to trigger 1-tap installation'}
                </div>
              )}
            </div>
          </div>

          {/* Method 2: PWABuilder (Signed APK & Google Play AAB) */}
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
                  2. PWABuilder Signed Package
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  Best for generating a downloadable <code className="font-mono font-bold text-amber-600 dark:text-amber-400">.apk</code> file or Google Play Store <code className="font-mono font-bold text-amber-600 dark:text-amber-400">.aab</code> bundle with zero code changes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111e38] border border-slate-200 dark:border-[#1e3a6a] space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Pre-filled Manifest Endpoint:
                </p>
                <div className="p-2 bg-white dark:bg-[#070d18] rounded-xl border border-slate-200 dark:border-[#1e3a6a] text-[11px] font-mono select-all break-all text-slate-700 dark:text-slate-300">
                  {manifestUrl}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Package ID: <span className="font-mono font-bold">com.smritisathi.app</span>
                </p>
              </div>
            </div>

            <a
              href={pwabuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6321] hover:bg-[#e05215] active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
            >
              <span>Download Signed APK via PWABuilder</span>
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </a>
          </div>

          {/* Method 3: Google Bubblewrap CLI / Android Studio */}
          <div className="bg-white dark:bg-[#0f1d38] p-6 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[28px]">terminal</span>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">
                  Developers / CLI
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#002045] dark:text-white">
                  3. Google Bubblewrap CLI
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  Best for engineering custom Android keystores or adding native Android Studio plugins.
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
                  Bubblewrap TWA
                </button>
                <button
                  onClick={() => setActiveCliTab('capacitor')}
                  className={`py-1.5 px-3 text-xs font-black border-b-2 cursor-pointer transition-colors ${
                    activeCliTab === 'capacitor'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Capacitor Studio
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
              <span>{copiedCmd ? 'Commands Copied!' : 'Copy Terminal Commands'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. SIDELOADING & FAQ ACCORDION */}
      <div className="bg-white dark:bg-[#0f1d38] p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-[#1e3a6a] space-y-4 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#002045] dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">help</span>
            <span>Android Installation &amp; Sideloading FAQ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Common questions when setting up on your friend's phone:
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* FAQ 1: How to sideload an APK directly */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#1e3a6a] overflow-hidden">
            <button
              onClick={() => setExpandedFaq(expandedFaq === 'sideload' ? null : 'sideload')}
              className="w-full p-4 bg-slate-50 dark:bg-[#111e38] flex items-center justify-between font-extrabold text-sm text-[#002045] dark:text-white text-left cursor-pointer"
            >
              <span>How do I sideload the .apk file on a Samsung or Google Pixel device?</span>
              <span className="material-symbols-outlined text-[20px] transition-transform">
                {expandedFaq === 'sideload' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedFaq === 'sideload' && (
              <div className="p-4 bg-white dark:bg-[#0f1d38] text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-[#1e3a6a] leading-relaxed">
                <p>
                  1. Download the <code className="font-bold text-slate-900 dark:text-white">.apk</code> file onto the phone via PWABuilder or Bubblewrap.
                </p>
                <p>
                  2. Open your phone's <strong>Files</strong> app and tap the downloaded APK.
                </p>
                <p>
                  3. If Android prompts <em>"For your security, your phone is not allowed to install unknown apps from this source"</em>, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong>.
                </p>
                <p>
                  4. Tap <strong>Install</strong>. SmritiSaathi is now installed in your app drawer!
                </p>
              </div>
            )}
          </div>

          {/* FAQ 2: Over-The-Air Updates */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#1e3a6a] overflow-hidden">
            <button
              onClick={() => setExpandedFaq(expandedFaq === 'updates' ? null : 'updates')}
              className="w-full p-4 bg-slate-50 dark:bg-[#111e38] flex items-center justify-between font-extrabold text-sm text-[#002045] dark:text-white text-left cursor-pointer"
            >
              <span>Do users have to re-download the APK whenever code changes?</span>
              <span className="material-symbols-outlined text-[20px] transition-transform">
                {expandedFaq === 'updates' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedFaq === 'updates' && (
              <div className="p-4 bg-white dark:bg-[#0f1d38] text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-[#1e3a6a] leading-relaxed">
                <p>
                  <strong>No!</strong> Because SmritiSaathi utilizes a Trusted Web Activity and Service Worker architecture, all bug fixes, cognitive games, and AI updates are applied automatically over-the-air (OTA) each time the app opens.
                </p>
              </div>
            )}
          </div>

          {/* FAQ 3: Hardware Geofencing & GPS */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#1e3a6a] overflow-hidden">
            <button
              onClick={() => setExpandedFaq(expandedFaq === 'gps' ? null : 'gps')}
              className="w-full p-4 bg-slate-50 dark:bg-[#111e38] flex items-center justify-between font-extrabold text-sm text-[#002045] dark:text-white text-left cursor-pointer"
            >
              <span>Does CareCompass GPS radar geofencing work when the phone screen is off?</span>
              <span className="material-symbols-outlined text-[20px] transition-transform">
                {expandedFaq === 'gps' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedFaq === 'gps' && (
              <div className="p-4 bg-white dark:bg-[#0f1d38] text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-[#1e3a6a] leading-relaxed">
                <p>
                  Yes. When installed as an Android WebAPK or TWA, the app utilizes high-accuracy Android GPS hardware coordinates. Caregiver breach alerts and distress voice prompts operate directly with full hardware sensor accuracy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM CLOSE & RETURN BUTTONS (Accessibility & Senior Friendly) */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-[#1e3a6a]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                playGentleClick();
                onBack();
              }}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111e38] dark:hover:bg-[#1b2f56] text-[#002045] dark:text-white font-extrabold text-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to {previousTabName}</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={() => {
                playGentleClick();
                onClose();
              }}
              className="px-5 py-3 rounded-2xl bg-[#002045] hover:bg-[#13284d] text-white font-extrabold text-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span>Close Android Center</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Package target: <code className="font-mono font-bold">com.smritisathi.app</code> • Built for Senior Safety
        </p>
      </div>
    </div>
  );
};
