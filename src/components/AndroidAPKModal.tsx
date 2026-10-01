import React from 'react';
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
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(
    currentUrl || 'https://ais-dev-shb7446nbubn7jhnzagw6i-583635606143.asia-southeast1.run.app'
  )}`;

  const handleInstallClick = async () => {
    playGentleClick();
    if (isInstallable) {
      const ok = await onDirectInstall();
      if (ok) {
        playSuccessBell();
        onClose();
      }
    } else {
      // If browser doesn't support the programmatic prompt, alert friendly instructions
      alert(
        'To install on your phone:\n1. Open this website in Chrome on Android\n2. Tap the three dots (⋮) in the top-right\n3. Tap "Install app" (or "Add to Home screen")'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0d182e] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-blue-900 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002045] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shadow-xs">
              📱
            </div>
            <div>
              <h2 className="font-extrabold text-xl">Get SmritiSaathi App</h2>
              <p className="text-xs text-blue-200">For Android &amp; Mobile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-full cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Live Features Assurance */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 border-b border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px] mt-0.5 shrink-0">
            check_circle
          </span>
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-semibold">
            <p className="font-extrabold text-sm mb-0.5">Everything stays 100% live:</p>
            <ul className="list-disc list-inside space-y-0.5 font-medium">
              <li>Saathi AI voice chat &amp; conversations work live</li>
              <li>AI Game Level generator creates levels in real-time</li>
              <li>Firebase saves all your progress and patient data</li>
            </ul>
          </div>
        </div>

        {/* 2 Simple Choices */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Method 1: Instant Install on Phone */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111f3d] border-2 border-emerald-500/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Method 1 • Fastest (10 seconds)
              </span>
              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>

            <h3 className="font-extrabold text-base text-[#002045] dark:text-white">
              Install Directly on Your Phone
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Installs like a normal app from the Play Store onto your home screen with its own app icon and no browser bar.
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
              <span>Install App on My Phone</span>
            </button>
          </div>

          {/* Method 2: Download .APK file for submission */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111f3d] border-2 border-slate-200 dark:border-[#1e3a6a] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Method 2 • For Submission
              </span>
              <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                Download .APK File
              </span>
            </div>

            <h3 className="font-extrabold text-base text-[#002045] dark:text-white">
              Need the actual .APK file to submit?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              If your professor or college needs you to upload an <strong>.apk</strong> file, click below. Your project is already set up and ready to download.
            </p>

            <a
              href={pwabuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#002045] hover:bg-[#1a365d] active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
            >
              <span>Download .APK Package</span>
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-[#070d18] px-6 py-3 border-t border-slate-200 dark:border-[#1e3a6a] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-extrabold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
