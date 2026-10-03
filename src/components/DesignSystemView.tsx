import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  RotateCw,
  Eye,
  EyeOff,
  Copy,
  Search,
  ArrowRight,
  Shield,
  Heart,
} from 'lucide-react';
import { PasswordVisibilityInput } from './PasswordVisibilityInput';
import { CopyButton } from './CopyButton';
import { ConfirmationModal } from './ConfirmationModal';

interface DesignSystemViewProps {
  onBackToApp: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const DesignSystemView: React.FC<DesignSystemViewProps> = ({
  onBackToApp,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('SecretPin9921');
  const [selectValue, setSelectValue] = useState('bengaluru');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const triggerToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setActiveToast({ type, message });
    setTimeout(() => setActiveToast(null), 3000);
  };

  return (
    <main
      id="main-content"
      className="flex-1 p-4 sm:p-8 md:p-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen overflow-y-auto"
    >
      {/* Toast Notification Container */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold ${
              activeToast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                : activeToast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                : activeToast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                : 'bg-blue-50 dark:bg-blue-950/90 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700'
            }`}
          >
            {activeToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            {activeToast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            {activeToast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            {activeToast.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            <span>{activeToast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal Preview */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm Reset Demo Records?"
        message="This action will restore all sample memory photos and clinical test metrics to factory defaults. This operation is reversible."
        confirmLabel="Reset Records"
        isDestructive={true}
        onConfirm={() => {
          setIsModalOpen(false);
          triggerToast('success', 'Records confirmed and refreshed!');
        }}
        onCancel={() => setIsModalOpen(false)}
      />

      {/* Page Header */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#002045] text-white dark:bg-blue-600">
                Layer 6 Architecture
              </span>
              <span className="text-xs text-slate-500 font-semibold">WCAG 2.1 AA Compliant</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#002045] dark:text-white mt-2 tracking-tight">
              Design System &amp; Component States
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Production design tokens, high-contrast accessible typography, and interactive components in all 4 data states (Loading, Empty, Error, Success).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleDarkMode}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={onBackToApp}
              className="bg-[#002045] hover:bg-[#1a365d] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back</span>
            </button>

            <button
              onClick={onBackToApp}
              title="Close Design System (Esc)"
              aria-label="Close Design System"
              className="bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-700 dark:text-slate-200 dark:hover:text-rose-300 p-2 rounded-xl text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* 1. Color Palette Tokens */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6321]" />
            <span>1. Color Tokens &amp; Radii</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[
              { name: 'Navy Brand', hex: '#002045', bg: 'bg-[#002045]', text: 'text-white' },
              { name: 'Safety Orange', hex: '#FF6321', bg: 'bg-[#FF6321]', text: 'text-white' },
              { name: 'Mind Gold', hex: '#F8BC4B', bg: 'bg-[#F8BC4B]', text: 'text-[#271900]' },
              { name: 'Clinical Safe', hex: '#059669', bg: 'bg-emerald-600', text: 'text-white' },
              { name: 'Breach Danger', hex: '#E11D48', bg: 'bg-rose-600', text: 'text-white' },
              { name: 'Surface Canvas', hex: '#F8F9FA', bg: 'bg-[#F8F9FA] border border-slate-300', text: 'text-slate-800' },
            ].map((token) => (
              <div
                key={token.name}
                className={`${token.bg} ${token.text} p-3.5 rounded-2xl shadow-xs flex flex-col justify-between h-24`}
              >
                <p className="text-xs font-bold">{token.name}</p>
                <p className="text-[11px] font-mono opacity-90">{token.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Button Variations & States */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Button System (Default, Hover, Active, Disabled, Loading)
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary */}
            <button className="bg-[#002045] hover:bg-[#1a365d] active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer">
              Primary Button
            </button>

            {/* Accent Orange */}
            <button className="bg-[#FF6321] hover:bg-[#EA580C] active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer">
              Accent Action
            </button>

            {/* Secondary / Outline */}
            <button className="border-2 border-slate-300 dark:border-slate-700 hover:border-[#002045] text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer">
              Secondary Outline
            </button>

            {/* Destructive */}
            <button className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer">
              Destructive Danger
            </button>

            {/* Disabled */}
            <button
              disabled
              className="bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed opacity-60"
            >
              Disabled State
            </button>

            {/* Loading Spinner Toggle */}
            <button
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 2000);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              {buttonLoading && <RotateCw className="w-4 h-4 animate-spin" />}
              <span>{buttonLoading ? 'Synchronizing...' : 'Click for Loading State'}</span>
            </button>
          </div>
        </section>

        {/* 3. Inputs & Forms with Error & Success States */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Form Inputs &amp; Field Validation States (REQ2 #13, #15, #16)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Standard Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Standard Text Input
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. Caregiver Full Name"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/20 outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Accepts alphanumeric patient contact labels.</p>
            </div>

            {/* Password Visibility Toggle */}
            <div>
              <PasswordVisibilityInput
                label="Caregiver PIN / Password (REQ2 #13)"
                value={passwordValue}
                onChange={setPasswordValue}
                placeholder="Enter 6-digit PIN"
                helpText="Click eye icon to reveal or conceal security code."
              />
            </div>

            {/* Input with Form Error State (REQ2 #16) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Input Error State
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="invalid-geofence-radius"
                  aria-invalid="true"
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
                <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 top-3" />
              </div>
              <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                Radius must be a positive integer between 20m and 1000m.
              </p>
            </div>

            {/* Input with Success State (REQ2 #15) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Input Success State
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="+91 98765 43210"
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                Verified Indian mobile carrier number.
              </p>
            </div>

            {/* Select Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Dropdown
              </label>
              <select
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/20 outline-none cursor-pointer"
              >
                <option value="bengaluru">Bengaluru Safe Zone (Karnataka)</option>
                <option value="delhi">New Delhi Safe Zone</option>
                <option value="mumbai">Mumbai Bandra Zone</option>
                <option value="guwahati">Guwahati Riverfront Zone</option>
              </select>
            </div>

            {/* Copy Button Component (REQ2 #9) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Copy Utility Button (REQ2 #9)
              </label>
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex-1 truncate">
                  28.5244° N, 77.2167° E
                </code>
                <CopyButton textToCopy="28.5244, 77.2167" label="Copy GPS" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Feedback & Modal Triggers */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Toast Feedback &amp; Confirmation Modals (REQ2 #17)
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => triggerToast('success', 'Data synchronized with Firestore cloud!')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-pointer"
            >
              Trigger Success Toast
            </button>
            <button
              onClick={() => triggerToast('error', 'Connection to GPS beacon timed out.')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 cursor-pointer"
            >
              Trigger Error Toast
            </button>
            <button
              onClick={() => triggerToast('warning', 'Patient battery level below 15%.')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 cursor-pointer"
            >
              Trigger Warning Toast
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#002045] hover:bg-[#1a365d] text-white cursor-pointer"
            >
              Open Confirmation Modal (REQ2 #17)
            </button>
          </div>
        </section>

        {/* 5. The 4 Data States: Loading, Empty, Error, Success */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              5. The 4 Essential Data States (Layer 6 Standard)
            </h2>
            <span className="text-xs text-slate-500">Every view must handle all 4</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Loading State (Skeletons) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                State 1: Loading (Skeletons)
              </span>
              <div className="space-y-2.5 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
              </div>
            </div>

            {/* 2. Empty State */}
            <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
                State 2: Empty State
              </span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Geofence Alerts Recorded</p>
              <p className="text-xs text-slate-500">
                Dadaji is comfortably relaxing inside the safe home zone.
              </p>
              <button className="bg-[#002045] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                View Safe Coordinates
              </button>
            </div>

            {/* 3. Error State with Retry */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
              <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>State 3: Error with Retry</span>
              </span>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Failed to fetch live GPS satellite lock. Signal obscured by high-rise building.
              </p>
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer flex items-center gap-1.5">
                <RotateCw className="w-3 h-3" />
                <span>Retry Connection</span>
              </button>
            </div>

            {/* 4. Success State */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>State 4: Success State</span>
              </span>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Daily Routine Completed: 100% accuracy. +60 Mind Points awarded!
              </p>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                Next workout opens tomorrow at 8:00 AM.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
