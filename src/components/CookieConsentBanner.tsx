import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Check, X, Settings2 } from 'lucide-react';
import { analytics } from '../utils/analytics';

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    performance: true,
    reminiscenceCache: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem('smritisathi_cookie_consent');
    if (!consent) {
      // Short delay for non-intrusive appearance
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('smritisathi_cookie_consent', JSON.stringify({ ...preferences, all: true, date: new Date().toISOString() }));
    analytics.logEvent('cookie_consent_accepted_all', 'consent');
    setIsOpen(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('smritisathi_cookie_consent', JSON.stringify({ ...preferences, date: new Date().toISOString() }));
    analytics.logEvent('cookie_consent_custom', 'consent', preferences);
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleRejectNonEssential = () => {
    const minimal = { essential: true, performance: false, reminiscenceCache: false };
    localStorage.setItem('smritisathi_cookie_consent', JSON.stringify({ ...minimal, date: new Date().toISOString() }));
    analytics.logEvent('cookie_consent_rejected_non_essential', 'consent');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie & Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#002045] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#FF6321] flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Privacy &amp; Data Dignity</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              SmritiSaathi uses secure on-device storage to preserve your reminiscence photos, game scores, and GPS safe zones without selling personal medical data.
            </p>

            {showPreferences && (
              <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2 text-xs">
                <label className="flex items-center justify-between text-slate-300">
                  <span>Essential System Security (Always On)</span>
                  <input type="checkbox" checked disabled className="rounded text-[#FF6321]" />
                </label>
                <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                  <span>Cognitive Progress Analytics</span>
                  <input
                    type="checkbox"
                    checked={preferences.performance}
                    onChange={(e) => setPreferences((p) => ({ ...p, performance: e.target.checked }))}
                    className="rounded text-[#FF6321]"
                  />
                </label>
                <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                  <span>Reminiscence Offline Cache</span>
                  <input
                    type="checkbox"
                    checked={preferences.reminiscenceCache}
                    onChange={(e) => setPreferences((p) => ({ ...p, reminiscenceCache: e.target.checked }))}
                    className="rounded text-[#FF6321]"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-1.5 rounded-xl bg-[#FF6321] hover:bg-[#e04f11] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept All</span>
              </button>

              {showPreferences ? (
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-600"
                >
                  Save Choices
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-slate-700"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
