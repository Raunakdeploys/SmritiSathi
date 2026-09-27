import React from 'react';
import { Compass, Home, PhoneCall, ArrowLeft, Bot, ShieldAlert } from 'lucide-react';

interface NotFoundViewProps {
  onNavigateHome: () => void;
  onOpenSOS?: () => void;
}

export function NotFoundView({ onNavigateHome, onOpenSOS }: NotFoundViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[60vh]">
      <div className="max-w-md w-full text-center bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
          <Compass className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            404 · Page Safe Anchor
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002045] mt-3">
            Let's Guide You Back Home
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            The page you are looking for has moved or is resting. Don't worry, your safe cognitive space is just one tap away.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#002045] hover:bg-[#003366] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          {onOpenSOS && (
            <button
              type="button"
              onClick={onOpenSOS}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Elder Helpline (14567)</span>
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          SmritiSaathi Cognitive Protection · Safe Navigation Engine
        </div>
      </div>
    </div>
  );
}
