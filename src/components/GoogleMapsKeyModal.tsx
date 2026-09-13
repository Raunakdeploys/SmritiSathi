import React, { useState, useEffect } from 'react';
import {
  Key,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface GoogleMapsKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey?: string;
  onSaveKey: (key: string) => void;
}

export const GoogleMapsKeyModal: React.FC<GoogleMapsKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey = '',
  onSaveKey,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem('cc_google_maps_api_key') || ''
          : '';
      setKeyInput(currentKey || stored);
      setSaveSuccess(false);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('cc_google_maps_api_key', trimmed);
      } else {
        localStorage.removeItem('cc_google_maps_api_key');
      }
      window.dispatchEvent(new Event('cc_maps_key_updated'));
    }
    onSaveKey(trimmed);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setKeyInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cc_google_maps_api_key');
      window.dispatchEvent(new Event('cc_maps_key_updated'));
    }
    onSaveKey('');
  };

  return (
    <div
      id="google-maps-key-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-600 rounded-2xl text-white">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Google Maps Platform Key
            </h3>
            <p className="text-xs text-slate-300">
              Enables high-resolution Satellite, Hybrid & 3D Terrain layers
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Google Maps API Key (or Demo Key)
          </label>
          <div className="relative">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-sky-400 rounded-xl py-3 px-4 text-sm text-white font-mono placeholder-slate-500 focus:outline-none transition-all"
            />
            {keyInput && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-rose-400"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Keys starting with <code className="text-sky-300 font-mono">AIza...</code> are stored securely in your local browser sandbox and synced to the CareCompass live radar.
          </p>
        </div>

        {/* Free zero-cost hint */}
        <div className="bg-sky-950/60 border border-sky-500/40 p-3.5 rounded-xl text-xs text-sky-200 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-sky-300">
            <Sparkles className="w-4 h-4" />
            <span>Built-in Fallback Vector Radar Active</span>
          </div>
          <p className="text-slate-300">
            If left blank, CareCompass seamlessly uses high-precision Vector Radar canvas telemetry with exact metric geofencing.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-900/80 border border-emerald-500 rounded-xl text-xs font-bold text-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Google Maps API Key configured successfully!</span>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Save & Activate Key
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
