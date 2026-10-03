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
  isDarkTheme?: boolean;
}

export const ViewNavigationBar: React.FC<ViewNavigationBarProps> = ({
  title,
  subtitle,
  breadcrumbs = [{ label: 'Dashboard' } as BreadcrumbItem],
  backLabel = 'Back to Dashboard',
  onBack,
  onClose,
  extraActions,
  isDarkTheme = false,
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

  const navContainerClass = isDarkTheme
    ? 'bg-slate-900/95 border-slate-800 text-white'
    : 'bg-slate-50/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-[#002045] dark:text-white';

  const btnClass = isDarkTheme
    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
    : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#002045] dark:text-white border-slate-200 dark:border-slate-700';

  const closeBtnClass = isDarkTheme
    ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-rose-300 border-slate-700'
    : 'bg-white hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-700 hover:text-rose-700 dark:text-slate-200 dark:hover:text-rose-300 border-slate-200 dark:border-slate-700';

  return (
    <div
      className={`w-full py-2.5 px-4 sm:px-6 rounded-2xl border transition-all mb-6 flex items-center justify-between shadow-xs ${navContainerClass}`}
    >
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 ${btnClass}`}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="hidden sm:inline">{backLabel}</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Breadcrumb Trail */}
        <nav
          aria-label="Breadcrumb"
          className={`hidden md:flex items-center space-x-1.5 text-xs font-medium truncate ${
            isDarkTheme ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <span className={isDarkTheme ? 'text-slate-600' : 'text-slate-300 dark:text-slate-600'}>/</span>}
              {crumb.onClick ? (
                <button
                  onClick={() => {
                    playGentleClick();
                    crumb.onClick!();
                  }}
                  className={isDarkTheme ? 'hover:text-sky-400 transition-colors cursor-pointer' : 'hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer'}
                >
                  {crumb.label}
                </button>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
          <span className={isDarkTheme ? 'text-slate-600' : 'text-slate-300 dark:text-slate-600'}>/</span>
          <span className={`font-bold truncate max-w-[220px] ${isDarkTheme ? 'text-white' : 'text-[#002045] dark:text-white'}`}>
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
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border font-bold text-xs transition-all active:scale-95 cursor-pointer ${closeBtnClass}`}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span className="hidden sm:inline">Close</span>
            <span className={`hidden md:inline font-mono text-[10px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
              Esc
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
