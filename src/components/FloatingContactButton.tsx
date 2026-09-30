import React, { useState } from 'react';
import { Phone, MessageSquare, MapPin, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface FloatingContactButtonProps {
  onOpenDirectCall: () => void;
  onOpenWhereAmI: () => void;
  onOpenChat: () => void;
  caregiverName?: string;
  caregiverPhone?: string;
}

export const FloatingContactButton: React.FC<FloatingContactButtonProps> = ({
  onOpenDirectCall,
  onOpenWhereAmI,
  onOpenChat,
  caregiverName = 'Rohan Sharma',
  caregiverPhone = '+91 98765 43210',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-40 no-print">
      {/* Expanded Quick Contact Menu */}
      {isOpen && (
        <div
          className="mb-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 w-64 space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="menu"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
            <span className="text-xs font-extrabold text-[#002045] dark:text-blue-400 uppercase tracking-wider">
              Emergency &amp; Contact
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. Call Caregiver */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenDirectCall();
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF6321] text-white flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Call Caregiver</p>
              <p className="text-[10px] text-slate-500 truncate">{caregiverName}</p>
            </div>
          </button>

          {/* 2. Where Am I Grounding */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenWhereAmI();
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Where Am I?</p>
              <p className="text-[10px] text-slate-500 truncate">GPS Safe Distance</p>
            </div>
          </button>

          {/* 3. National Elder Helpline */}
          <a
            href="tel:14567"
            className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Elder Helpline: 14567</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold truncate">Toll-Free National Care</p>
            </div>
          </a>

          {/* 4. Chat with Saathi */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenChat();
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#002045] text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-[#FF6321]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Saathi AI Companion</p>
              <p className="text-[10px] text-slate-500 truncate">Nostalgia &amp; Voice Chat</p>
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Emergency &amp; Caregiver Contact Hub"
        aria-label="Contact options"
        className="w-13 h-13 rounded-full bg-[#FF6321] hover:bg-[#EA580C] text-white shadow-2xl border-2 border-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative"
      >
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? 'close' : 'contact_phone'}
        </span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
      </button>
    </div>
  );
};
