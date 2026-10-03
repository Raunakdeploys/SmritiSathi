import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Download,
  ExternalLink,
  X,
  Sparkles,
  HelpCircle,
  FileDown,
} from 'lucide-react';
import { playGentleClick, playSuccessBell } from '../utils/audio';
import { downloadAndroidAPK } from '../utils/apkDownloader';

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
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        return;
      }
    }
    setShowManualSteps(true);
  };

  const handleDirectApkDownload = () => {
    playGentleClick();
    downloadAndroidAPK('SmritiSaathi_v2.4_Release.apk');
    setDownloadSuccess(true);
    playSuccessBell();
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download and Install SmritiSaathi App"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0d182e] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-[#1e3a6a] text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002045] via-[#092954] to-[#002045] text-white p-5 flex items-center justify-between border-b-2 border-emerald-500">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-white">Get SmritiSaathi Android App</h2>
              <p className="text-xs text-emerald-200">Official Standalone Package &amp; 1-Tap Installer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Features Assurance */}
        <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 border-b border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
            <p className="font-extrabold text-sm mb-0.5">Includes full cognitive safety suite:</p>
            <ul className="list-disc list-inside space-y-0.5 font-medium">
              <li>Saathi AI bilingual voice reminiscence &amp; orientation</li>
              <li>Real-time CareCompass GPS geofencing &amp; SOS dispatcher</li>
              <li>13 Clinical CST cognitive training drills with offline support</li>
            </ul>
          </div>
        </div>

        {/* Download Feedback Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-600 text-white p-3 px-5 flex items-center gap-2 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Downloading <strong>SmritiSaathi_v2.4_Release.apk</strong> to your device now!</span>
          </div>
        )}

        {/* Options */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Method 1: Instant APK File Download (Direct) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <FileDown className="w-4 h-4" />
                <span>Primary • Direct APK Download</span>
              </span>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Instant .APK File
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#002045] dark:text-white">
                Download Release .APK File
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Directly download the signed <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">SmritiSaathi_v2.4_Release.apk</code> installation file onto your device or computer.
              </p>
            </div>

            <button
              onClick={handleDirectApkDownload}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download SmritiSaathi.apk (Direct)</span>
            </button>
          </div>

          {/* Method 2: WebAPK Phone Install */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111f3d] border-2 border-slate-200 dark:border-[#1e3a6a] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Method 2 • 1-Tap Screen Install</span>
              </span>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                Zero Sideloading
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#002045] dark:text-white">
                Add Directly to Phone Home Screen
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Chrome creates an app icon in your app drawer with fullscreen native capability and offline support.
              </p>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-700 active:scale-98 text-white font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install to Home Screen</span>
            </button>

            {showManualSteps && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200 space-y-1.5 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How to install in browser:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  {isIOS ? (
                    <>
                      <li>Tap the <strong>Share</strong> icon in Safari.</li>
                      <li>Select <strong>"Add to Home Screen"</strong>.</li>
                    </>
                  ) : (
                    <>
                      <li>Tap the Chrome menu (<strong>⋮</strong>) in the top right.</li>
                      <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    </>
                  )}
                </ol>
              </div>
            )}
          </div>

          {/* Method 3: Cloud PWABuilder Store Package */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111f3d] border border-slate-200 dark:border-[#1e3a6a] flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs text-[#002045] dark:text-white">Google Play Store .AAB Bundle</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Generate APK/AAB for Play Store Console submission</p>
            </div>
            <a
              href={pwabuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[#002045] dark:text-white font-bold text-xs flex items-center gap-1.5 no-underline shrink-0"
            >
              <span>PWABuilder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-[#070d18] px-6 py-3.5 border-t border-slate-200 dark:border-[#1e3a6a] flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            SmritiSaathi Android Release Engine v2.4
          </span>
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
