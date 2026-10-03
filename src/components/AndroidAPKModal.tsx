import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Download,
  ExternalLink,
  X,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Share2,
} from 'lucide-react';
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
  const [showManualSteps, setShowManualSteps] = useState(false);

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
              <h2 className="font-extrabold text-xl text-white">Get SmritiSaathi App</h2>
              <p className="text-xs text-emerald-200">Native Android WebAPK &amp; Direct Package</p>
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
            <p className="font-extrabold text-sm mb-0.5">Everything stays 100% live:</p>
            <ul className="list-disc list-inside space-y-0.5 font-medium">
              <li>Saathi AI voice companionship &amp; live conversations</li>
              <li>Real-time GPS geofencing &amp; distress SOS WhatsApp dispatcher</li>
              <li>Continuous Firestore cloud persistence</li>
            </ul>
          </div>
        </div>

        {/* 2 Simple Choices */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Method 1: Instant Install on Phone */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111f3d] border-2 border-emerald-500/50 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Method 1 • Fastest</span>
              </span>
              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                Recommended
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#002045] dark:text-white">
                Install Directly on Your Phone
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Installs onto your home screen with its own full-screen app icon, offline support, and zero browser bars.
              </p>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Install App on My Phone</span>
            </button>

            {showManualSteps && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200 space-y-1.5 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>To add to your phone in 2 steps:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  {isIOS ? (
                    <>
                      <li>Tap the <strong>Share</strong> button (box with upward arrow) in Safari.</li>
                      <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                    </>
                  ) : (
                    <>
                      <li>Open this URL in <strong>Google Chrome</strong> on Android.</li>
                      <li>Tap the three dots (<strong>⋮</strong>) in the top-right corner.</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    </>
                  )}
                </ol>
              </div>
            )}
          </div>

          {/* Method 2: Download .APK file for submission / sideloading */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111f3d] border-2 border-slate-200 dark:border-[#1e3a6a] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Method 2 • Download Package
              </span>
              <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                Signed .APK
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#002045] dark:text-white">
                Download .APK File for Sideloading
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                If you need the raw <strong>.apk</strong> file to transfer to another device or submit for college evaluation:
              </p>
            </div>

            <a
              href={pwabuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#002045] hover:bg-[#1a365d] active:scale-98 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
            >
              <Download className="w-5 h-5 text-amber-400" />
              <span>Generate &amp; Download Signed .APK</span>
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-[#070d18] px-6 py-3.5 border-t border-slate-200 dark:border-[#1e3a6a] flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            SmritiSaathi Android Release Engine
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
