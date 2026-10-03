import React, { useEffect } from 'react';
import { playGentleClick } from '../utils/audio';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface ViewNavigationBarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backLabel?: string;
  onBack: () => void;
  onClose?: () => void;
  extraActions?: React.ReactNode;
}

export const ViewNavigationBar: React.FC<ViewNavigationBarProps> = ({
  title,
  subtitle,
  breadcrumbs = [{ label: 'Dashboard' } as BreadcrumbItem],
  backLabel = 'Back to Dashboard',
  onBack,
  onClose,
  extraActions,
}) => {
  // Listen for Escape key to trigger onBack or onClose
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape') {
        if (onClose) {
          onClose();
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onClose]);

  return (
    <div className="sticky top-[72px] z-20 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12 py-3 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1e3a6a] transition-all mb-6">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Back Button & Breadcrumbs */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              playGentleClick();
              onBack();
            }}
            aria-label={backLabel}
            title={`${backLabel} (or press Esc)`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111e38] dark:hover:bg-[#1b2f56] text-[#002045] dark:text-white border border-slate-200 dark:border-[#1e3a6a] font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Breadcrumb Trail */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate"
          >
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                {crumb.onClick ? (
                  <button
                    onClick={() => {
                      playGentleClick();
                      crumb.onClick!();
                    }}
                    className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-[#002045] dark:text-white font-bold truncate max-w-[220px]">
              {title}
            </span>
          </nav>
        </div>

        {/* Right: Custom Actions & Close (✕) Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {extraActions}

          {onClose && (
            <button
              type="button"
              onClick={() => {
                playGentleClick();
                onClose();
              }}
              title="Close and return to Dashboard (Esc)"
              aria-label="Close and return to Dashboard"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-[#142342] dark:hover:bg-rose-950/60 text-slate-700 hover:text-rose-700 dark:text-slate-200 dark:hover:text-rose-300 border border-slate-200 dark:border-[#1e3a6a] font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span className="hidden sm:inline">Close</span>
              <span className="hidden md:inline font-mono text-[10px] text-slate-400 dark:text-slate-500">
                Esc
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
