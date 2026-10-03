import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Shield,
  PhoneCall,
  Brain,
  Sparkles,
  Sliders,
  HelpCircle,
  Palette,
  Printer,
  Compass,
  Heart,
  Calendar,
  Activity,
  Award,
  Smartphone,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { playGentleClick } from '../utils/audio';

export interface SearchItem {
  id: string;
  title: string;
  category: 'Game' | 'Navigation' | 'Emergency' | 'Tool';
  description: string;
  action: () => void;
  icon: typeof Search;
}

interface CommandPaletteSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onPlayGame: (gameId: string) => void;
  onStartDailyTraining: () => void;
  onOpenDirectCall: () => void;
  onOpenWhereAmI: () => void;
  onOpenRewards: () => void;
  onOpenPrintReport: () => void;
}

export const CommandPaletteSearch: React.FC<CommandPaletteSearchProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onPlayGame,
  onStartDailyTraining,
  onOpenDirectCall,
  onOpenWhereAmI,
  onOpenRewards,
  onOpenPrintReport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchableItems: SearchItem[] = [
    // Emergency & Safety
    {
      id: 'emergency-call',
      title: 'Call Primary Caregiver (Direct Telephone)',
      category: 'Emergency',
      description: 'Instant outbound audio call to primary caregiver or family emergency contact',
      action: () => {
        playGentleClick();
        onOpenDirectCall();
        onClose();
      },
      icon: PhoneCall,
    },
    {
      id: 'emergency-where-am-i',
      title: 'Where Am I? (GPS Grounding & Safe Home Distance)',
      category: 'Emergency',
      description: 'Audible and visual location reassurance for seniors',
      action: () => {
        playGentleClick();
        onOpenWhereAmI();
        onClose();
      },
      icon: Compass,
    },
    {
      id: 'nav-carecompass',
      title: 'CareCompass AI (Live GPS Radar & Geofencing)',
      category: 'Navigation',
      description: 'Caregiver real-time tracking, breach alerts, and wandering protection',
      action: () => {
        playGentleClick();
        onSelectTab('carecompass');
        onClose();
      },
      icon: Navigation,
    },
    {
      id: 'nav-patient-mode',
      title: 'Patient Mode (Simplified Senior Experience)',
      category: 'Navigation',
      description: 'Large high-contrast buttons, time orientation, and one-touch SOS',
      action: () => {
        playGentleClick();
        onSelectTab('patient-mode');
        onClose();
      },
      icon: Shield,
    },
    // Daily Training & Companionship
    {
      id: 'action-daily-workout',
      title: 'Start Daily 3-Pillar Mind Workout',
      category: 'Tool',
      description: 'Stimulate memory, attention, and executive reasoning with bonus Mind Points',
      action: () => {
        playGentleClick();
        onStartDailyTraining();
        onClose();
      },
      icon: Sparkles,
    },
    {
      id: 'nav-saathi-chat',
      title: 'Saathi AI Memory Chat (Search Grounded)',
      category: 'Navigation',
      description: 'Multi-turn voice companion with Google Search grounding for nostalgia & health',
      action: () => {
        playGentleClick();
        onSelectTab('saathi-chat');
        onClose();
      },
      icon: Heart,
    },
    {
      id: 'nav-android-app',
      title: 'Android App & APK Center (Download / Install)',
      category: 'Tool',
      description: 'Package, download APK/AAB for Google Play, or 1-tap install on Android',
      action: () => {
        playGentleClick();
        onSelectTab('android-app');
        onClose();
      },
      icon: Smartphone,
    },
    // Cognitive Games
    {
      id: 'game-wayback',
      title: 'WayBack Route Navigation (Spatial Memory)',
      category: 'Game',
      description: 'Recall landmark sequences and turn-by-turn routes home',
      action: () => {
        playGentleClick();
        onPlayGame('wayback');
        onClose();
      },
      icon: Compass,
    },
    {
      id: 'game-lifethread',
      title: 'LifeThread Milestones (Long-term Episodic Recall)',
      category: 'Game',
      description: 'Chronological milestone ordering: Independence 1947 to Chandrayaan-3',
      action: () => {
        playGentleClick();
        onPlayGame('lifethread');
        onClose();
      },
      icon: Calendar,
    },
    {
      id: 'game-facebond',
      title: 'FaceBond Kinship Recall (Family Faces)',
      category: 'Game',
      description: 'Personalized family photo recognition with voice greetings',
      action: () => {
        playGentleClick();
        onPlayGame('facebond');
        onClose();
      },
      icon: Heart,
    },
    {
      id: 'game-dailyroutine',
      title: 'DailyRoutine Task Flow (Executive Sequencing)',
      category: 'Game',
      description: 'Reconstruct morning tea, medicine, and walking schedules in order',
      action: () => {
        playGentleClick();
        onPlayGame('dailyroutine');
        onClose();
      },
      icon: CheckCircle2,
    },
    {
      id: 'game-clockplanner',
      title: 'TimeSense Clock & Routine Planner',
      category: 'Game',
      description: 'Temporal clock setting, analog dial recognition, and daily routines',
      action: () => {
        playGentleClick();
        onPlayGame('clock-planner');
        onClose();
      },
      icon: Calendar,
    },
    {
      id: 'game-cameraspotter',
      title: 'Live Camera Object Spotter (Gemini Vision)',
      category: 'Game',
      description: 'Use device camera to identify everyday room objects',
      action: () => {
        playGentleClick();
        onPlayGame('live-camera-spotter');
        onClose();
      },
      icon: Activity,
    },
    {
      id: 'game-shapesorter',
      title: 'Shape Sorter (Visual Discrimination)',
      category: 'Game',
      description: 'Match geometric shapes and contrasting colors',
      action: () => {
        playGentleClick();
        onPlayGame('shape-sorter');
        onClose();
      },
      icon: Brain,
    },
    {
      id: 'game-wordpair',
      title: 'Word Pair Recall (Verbal Retention)',
      category: 'Game',
      description: 'Learn and retrieve paired words to exercise short-term verbal recall',
      action: () => {
        playGentleClick();
        onPlayGame('word-pair-recall');
        onClose();
      },
      icon: Brain,
    },
    // Tools & Utilities
    {
      id: 'action-rewards',
      title: 'Redeem Mind Points & Rewards Store',
      category: 'Tool',
      description: 'Exchange mind points for herbal teas, framed albums, and puzzle digests',
      action: () => {
        playGentleClick();
        onOpenRewards();
        onClose();
      },
      icon: Award,
    },
    {
      id: 'action-print-report',
      title: 'Print Clinical Cognitive Summary & Emergency Card',
      category: 'Tool',
      description: 'Generate clean paper printout for physician visits or caregiver handover',
      action: () => {
        playGentleClick();
        onOpenPrintReport();
        onClose();
      },
      icon: Printer,
    },
    {
      id: 'nav-dashboard',
      title: 'Main Dashboard (Home Sanctuary)',
      category: 'Navigation',
      description: 'Return to the calm home sanctuary with daily recommendations and family portraits',
      action: () => {
        playGentleClick();
        onSelectTab('dashboard');
        onClose();
      },
      icon: Sparkles,
    },
    {
      id: 'nav-caregiver-portal',
      title: 'Caregiver & Clinical Portal',
      category: 'Navigation',
      description: 'Clinical surveillance, cognitive domain analytics, and GPS breach alerts',
      action: () => {
        playGentleClick();
        onSelectTab('caregiver');
        onClose();
      },
      icon: Shield,
    },
    {
      id: 'nav-settings',
      title: 'Settings & Family Memory Album Database',
      category: 'Navigation',
      description: 'Manage family face photos, voice greetings, font size, and emergency contacts',
      action: () => {
        playGentleClick();
        onSelectTab('settings');
        onClose();
      },
      icon: Sliders,
    },
    {
      id: 'nav-help',
      title: 'Help & Expandable FAQ Guide',
      category: 'Navigation',
      description: 'Frequently asked questions, GitHub repo export guide, and audio tutorials',
      action: () => {
        playGentleClick();
        onSelectTab('help');
        onClose();
      },
      icon: HelpCircle,
    },
    {
      id: 'nav-design-system',
      title: 'Design System & Component Showcase (/design)',
      category: 'Tool',
      description: 'View base buttons, inputs, modals, toasts, tables, empty & error states',
      action: () => {
        playGentleClick();
        onSelectTab('design');
        onClose();
      },
      icon: Palette,
    },
  ];

  const filteredItems = searchableItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site Search and Quick Jump"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-14 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0c162c] rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-[#1e3a6a] overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            TOP HEADER BAR: Senior-Grade Back & Close Buttons with SVG Icons
           ========================================================================= */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#111e38] border-b border-slate-200 dark:border-[#1e3a6a] shrink-0">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            aria-label="Go back to previous screen"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1c3058] font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700 min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4 text-[#002045] dark:text-sky-300 shrink-0" />
            <span>Back</span>
          </button>

          {/* Centered Modal Title */}
          <div className="text-center px-2">
            <span className="text-sm sm:text-base font-extrabold text-[#002045] dark:text-white tracking-tight block">
              Search & Quick Jump
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Jump directly to games, safety radar, or tools
            </span>
          </div>

          {/* Close (✕) Button */}
          <button
            type="button"
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            aria-label="Close search window"
            title="Close this window (Esc)"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 min-h-[40px]"
          >
            <X className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>Close</span>
            <kbd className="hidden md:inline font-mono text-[10px] bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-1 py-0.5 rounded ml-1">
              ESC
            </kbd>
          </button>
        </div>

        {/* =========================================================================
            SEARCH INPUT BAR: Large, High-Contrast with Clear Button
           ========================================================================= */}
        <div className="flex items-center px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-[#1e3a6a] gap-3 bg-white dark:bg-[#0c162c] shrink-0">
          <Search className="w-6 h-6 text-slate-400 dark:text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type to search games, safety radar, memories, settings..."
            className="flex-1 text-base sm:text-lg bg-transparent text-[#002045] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-medium"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search input text"
              title="Clear search input"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">
              Press <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↵ Enter</kbd> to open
            </span>
          )}
        </div>

        {/* =========================================================================
            RESULTS LIST: Uncluttered & Senior Friendly
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px]">
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                No features or games match "{query}"
              </p>
              <p className="text-xs max-w-sm mx-auto text-slate-500 dark:text-slate-400">
                Try searching for simple words like <strong>WayBack</strong>, <strong>Radar</strong>, <strong>Family</strong>, <strong>Points</strong>, or <strong>Help</strong>.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : item.category === 'Emergency'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : item.category === 'Game'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-bold truncate">{item.title}</p>
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        isSelected ? 'text-blue-100 dark:text-sky-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-1 text-white' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* =========================================================================
            BOTTOM ACTION FOOTER: Extra Reassurance Controls
           ========================================================================= */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-50 dark:bg-[#111e38] border-t border-slate-200 dark:border-[#1e3a6a] shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => {
              playGentleClick();
              onSelectTab('dashboard');
              onClose();
            }}
            className="text-blue-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playGentleClick();
              onClose();
            }}
            className="hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Close (Esc)</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
