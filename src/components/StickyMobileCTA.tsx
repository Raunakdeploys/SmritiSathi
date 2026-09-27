import React from 'react';
import { Bot, PhoneCall, Compass, ShieldAlert, Sparkles } from 'lucide-react';

interface StickyMobileCTAProps {
  onNavigateTab: (tab: string) => void;
  onOpenSOS: () => void;
  currentTab: string;
}

export function StickyMobileCTA({ onNavigateTab, onOpenSOS, currentTab }: StickyMobileCTAProps) {
  // Hide on full screen chat or game modals to maximize screen space
  if (currentTab === 'companion') return null;

  return (
    <div
      role="navigation"
      aria-label="Mobile Quick Action Anchor"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom-3 duration-300"
    >
      <div className="bg-[#002045]/95 backdrop-blur-md text-white px-3 py-2.5 rounded-2xl shadow-xl border border-slate-700/70 flex items-center justify-between gap-2">
        {/* Left: Saathi AI Voice Companion */}
        <button
          type="button"
          onClick={() => onNavigateTab('companion')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF6321] to-[#e04f11] hover:brightness-110 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Bot className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="truncate">Talk to Saathi AI</span>
        </button>

        {/* Middle: Care Compass / GPS */}
        <button
          type="button"
          onClick={() => onNavigateTab('caregiver')}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-slate-700"
          title="Caregiver Compass"
        >
          <Compass className="w-4 h-4 shrink-0 text-sky-400" />
          <span className="hidden xs:inline">Safety</span>
        </button>

        {/* Right: Emergency SOS */}
        <button
          type="button"
          onClick={onOpenSOS}
          className="py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-black text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs active:scale-95 ring-1 ring-rose-400"
          title="Emergency Elder Assistance (14567 / 112)"
        >
          <PhoneCall className="w-4 h-4 shrink-0 text-white" />
          <span>SOS</span>
        </button>
      </div>
    </div>
  );
}
