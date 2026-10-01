import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidAPKModal } from './AndroidAPKModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside standalone installed app, don't show the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3 py-1.5 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border border-emerald-400/40"
        title="Install Android App / Download APK"
      >
        <span className="material-symbols-outlined text-[18px]">android</span>
        <span>Get Android App</span>
      </button>

      <AndroidAPKModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        onDirectInstall={install}
      />
    </>
  );
};
