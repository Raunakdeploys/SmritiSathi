import React, { useState } from 'react';
import {
  X,
  Settings,
  MapPin,
  Shield,
  Bell,
  Smartphone,
  CheckCircle2,
  Globe,
  Radio,
  Sliders,
  Send,
  Sparkles,
  Locate,
} from 'lucide-react';
import type { CareCompassConfig } from '../types';
import {
  PAN_INDIA_PRESETS,
  INDIAN_LANGUAGES,
  LocationPreset,
  generateWhatsAppSOSUrl,
} from '../utils/geoUtils';
import { deviceLocationService } from '../services/deviceLocationService';
import { sosDispatchService } from '../services/sosDispatchService';

interface CareCompassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CareCompassConfig;
  onSaveConfig: (updated: Partial<CareCompassConfig>) => void;
}

export const CareCompassSettingsModal: React.FC<CareCompassSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<CareCompassConfig>({ ...config });
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPresets = PAN_INDIA_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPreset = (preset: LocationPreset) => {
    setFormData((prev) => ({
      ...prev,
      homeLocation: {
        label: preset.name,
        city: preset.city,
        area: preset.landmark,
        latitude: preset.latitude,
        longitude: preset.longitude,
      },
    }));
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestAutomatedSOS = () => {
    const sosData = generateWhatsAppSOSUrl({
      caregiverPhone: formData.caregiverPhone,
      patientName: formData.patientName,
      latitude: formData.homeLocation.latitude,
      longitude: formData.homeLocation.longitude,
      distanceMeters: 45,
      homeLabel: formData.homeLocation.label,
      batteryLevel: 92,
      cause: 'Manual Test Trigger from Settings',
    });

    try {
      window.open(sosData.url, '_blank');
    } catch (e) {
      console.warn('Auto WhatsApp window open error:', e);
    }

    try {
      window.location.href = sosData.telUrl;
    } catch (e) {
      console.warn('Auto phone dialer trigger error:', e);
    }

    sosDispatchService
      .dispatchAutomatedSOSMessage({
        caregiverPhone: formData.caregiverPhone,
        caregiverName: formData.caregiverName,
        patientName: formData.patientName,
        latitude: formData.homeLocation.latitude,
        longitude: formData.homeLocation.longitude,
        distanceMeters: 45,
        homeLabel: formData.homeLocation.label,
        batteryLevel: 92,
        cause: 'Manual Test Trigger from Settings',
      })
      .then((res) => {
        setTestResult(`Automated Test Dispatched to ${formData.caregiverPhone}! Ref: ${res.dispatchId}`);
        setTimeout(() => setTestResult(null), 6000);
      })
      .catch((e) => {
        console.warn('Test dispatch error:', e);
      });
  };

  return (
    <div
      id="carecompass-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-white shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#002045] border border-blue-400/40 rounded-2xl text-blue-300">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                CareCompass Safety & Geofence Settings
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Configure patient profile, home base coordinates, dual geofence radii, and emergency dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Patient & Caregiver Profiles */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>Profiles & Emergency Contacts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Patient / Elder Name
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) =>
                  setFormData({ ...formData, patientName: e.target.value })
                }
                placeholder="Dadaji"
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Honorific / Title
              </label>
              <input
                type="text"
                value={formData.patientHonorific}
                onChange={(e) =>
                  setFormData({ ...formData, patientHonorific: e.target.value })
                }
                placeholder="Elder / Grandfather"
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Primary Caregiver Name
              </label>
              <input
                type="text"
                value={formData.caregiverName}
                onChange={(e) =>
                  setFormData({ ...formData, caregiverName: e.target.value })
                }
                placeholder="Raunak"
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Caregiver Emergency Phone / WhatsApp
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.caregiverPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, caregiverPhone: e.target.value })
                  }
                  placeholder="+91 9073719787"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-sm text-white font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestAutomatedSOS}
                  title="Test Automated SOS Dispatch (0 Manual Taps Required)"
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Test Automated SOS</span>
                </button>
              </div>
              {testResult && (
                <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{testResult}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Dual Geofence Perimeter Sliders */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Dual Geofencing Perimeter Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Safe Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-400">Green Safe Radius Zone</span>
                <span className="font-mono text-white">
                  {formData.safeRadiusMeters} meters
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={formData.safeRadiusMeters}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    safeRadiusMeters: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Elder moves freely inside this perimeter without any alarms.
              </p>
            </div>

            {/* Alert Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-400">Critical Alert Perimeter</span>
                <span className="font-mono text-white">
                  {formData.alertRadiusMeters} meters
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={formData.alertRadiusMeters}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    alertRadiusMeters: Number(e.target.value),
                  })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Breach beyond this radius triggers two-tone siren and WhatsApp SOS.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Pan-India Home Base Location Database */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Home Base Coordinates (Pan-India Presets)</span>
            </h3>

            <button
              type="button"
              onClick={async () => {
                await deviceLocationService.startTracking();
                const st = deviceLocationService.getState();
                if (st.latitude && st.longitude) {
                  setFormData((prev) => ({
                    ...prev,
                    homeLocation: {
                      label: 'Current Device Physical Location',
                      city: 'Local Area',
                      area: 'Calibrated Device Base',
                      latitude: st.latitude!,
                      longitude: st.longitude!,
                    },
                  }));
                }
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold self-start cursor-pointer flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition-all"
            >
              <Locate className="w-3.5 h-3.5" />
              <span>Calibrate to Live Device GPS</span>
            </button>
          </div>

          {/* Current Selected Home */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-sky-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-sky-300 font-bold">
                Current Active Base
              </span>
              <h4 className="text-sm font-black text-white">
                {formData.homeLocation.label} ({formData.homeLocation.city})
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Lat: {formData.homeLocation.latitude.toFixed(4)}, Lon:{' '}
                {formData.homeLocation.longitude.toFixed(4)}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold">
              Active Anchor
            </span>
          </div>

          {/* Presets Search */}
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city or address (e.g. Delhi, Mumbai, Bengaluru, Kolkata, London, New York...)"
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const isSelected =
                  formData.homeLocation.latitude === preset.latitude &&
                  formData.homeLocation.longitude === preset.longitude;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-900/90 border-sky-400 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-750 border-slate-750 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate">
                          {preset.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {preset.region}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {preset.landmark}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-sky-300 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: 11 Indian Languages Voice Support */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Voice & Reassurance Language (11 Indian Languages)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {INDIAN_LANGUAGES.map((lang) => {
              const isSelected = formData.preferredLanguage === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, preferredLanguage: lang.code })
                  }
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex flex-col ${
                    isSelected
                      ? 'bg-indigo-900/90 border-indigo-400 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-750 border-slate-750 text-slate-300'
                  }`}
                >
                  <span className="text-white">{lang.name}</span>
                  <span className="text-[11px] text-indigo-300 font-normal">
                    {lang.nativeName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Automation Toggles */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
          <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Emergency Automations</span>
          </h3>

          <div className="space-y-2.5 text-xs text-slate-200">
            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-slate-750">
              <input
                type="checkbox"
                checked={formData.autoSirenOnBreach}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoSirenOnBreach: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
              <div>
                <span className="font-bold text-white block">
                  Automatic Two-Tone Emergency Siren
                </span>
                <span className="text-slate-400">
                  Plays high-pitch 880-1200Hz alert when patient breaches {formData.alertRadiusMeters}m perimeter
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-slate-750">
              <input
                type="checkbox"
                checked={formData.autoWhatsAppOnBreach}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoWhatsAppOnBreach: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <div>
                <span className="font-bold text-white block">
                  Automated SOS Message Dispatch (0 Manual Taps Required)
                </span>
                <span className="text-slate-400">
                  Transmits live coordinates, battery level, and emergency alert straight to {formData.caregiverPhone} without requiring any manual typing or sending
                </span>
              </div>
            </label>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-900/90 border border-emerald-500 rounded-xl text-xs font-bold text-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved and telemetry synchronized!</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all cursor-pointer"
          >
            Save All Settings
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
