import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Shield, HeartHandshake, PhoneCall, Brain, Sparkles, Sliders, HelpCircle, Palette, Printer } from 'lucide-react';

export interface SearchItem {
  id: string;
  title: string;
  category: 'Game' | 'Navigation' | 'Emergency' | 'Tool';
  description: string;
  action: () => void;
  icon: string;
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
    // Emergency & Core Safety
    {
      id: 'emergency-call',
      title: 'Call Primary Caregiver (Direct Telephone)',
      category: 'Emergency',
      description: 'Instant outbound audio call to primary caregiver or family emergency contact',
      action: () => { onOpenDirectCall(); onClose(); },
      icon: 'phone_in_talk',
    },
    {
      id: 'emergency-where-am-i',
      title: 'Where Am I? (GPS Grounding & Safe Home Distance)',
      category: 'Emergency',
      description: 'Audible and visual location reassurance for seniors',
      action: () => { onOpenWhereAmI(); onClose(); },
      icon: 'my_location',
    },
    {
      id: 'nav-carecompass',
      title: 'CareCompass AI (Live GPS Radar & Geofencing)',
      category: 'Navigation',
      description: 'Caregiver real-time tracking, breach alerts, and wandering protection',
      action: () => { onSelectTab('carecompass'); onClose(); },
      icon: 'radar',
    },
    {
      id: 'nav-patient-mode',
      title: 'Patient Mode (Simplified Senior Experience)',
      category: 'Navigation',
      description: 'Large buttons, time orientation, and one-touch SOS',
      action: () => { onSelectTab('patient-mode'); onClose(); },
      icon: 'shield_person',
    },
    // Daily Training & Companionship
    {
      id: 'action-daily-workout',
      title: 'Start Daily 3-Pillar Mind Workout',
      category: 'Tool',
      description: 'Stimulate memory, attention, and executive reasoning with bonus Mind Points',
      action: () => { onStartDailyTraining(); onClose(); },
      icon: 'fitness_center',
    },
    {
      id: 'nav-saathi-chat',
      title: 'Saathi AI Memory Chat (Search Grounded)',
      category: 'Navigation',
      description: 'Multi-turn voice companion with Google Search grounding for nostalgia & health',
      action: () => { onSelectTab('saathi-chat'); onClose(); },
      icon: 'voice_chat',
    },
    {
      id: 'nav-android-app',
      title: 'Android App & APK Center (Download / Install)',
      category: 'Tool',
      description: 'Package, download APK/AAB for Google Play, or 1-tap install on Android',
      action: () => { onSelectTab('android-app'); onClose(); },
      icon: 'smartphone',
    },
    // Cognitive Games
    {
      id: 'game-wayback',
      title: 'WayBack Route Navigation (Spatial Memory)',
      category: 'Game',
      description: 'Recall landmark sequences and turn-by-turn routes home',
      action: () => { onPlayGame('wayback'); onClose(); },
      icon: 'explore',
    },
    {
      id: 'game-lifethread',
      title: 'LifeThread Milestones (Long-term Episodic Recall)',
      category: 'Game',
      description: 'Chronological milestone ordering: Independence 1947 to Chandrayaan-3',
      action: () => { onPlayGame('lifethread'); onClose(); },
      icon: 'timeline',
    },
    {
      id: 'game-facebond',
      title: 'FaceBond Kinship Recall (Family Faces)',
      category: 'Game',
      description: 'Personalized family photo recognition with voice greetings',
      action: () => { onPlayGame('facebond'); onClose(); },
      icon: 'groups',
    },
    {
      id: 'game-dailyroutine',
      title: 'DailyRoutine Task Flow (Executive Sequencing)',
      category: 'Game',
      description: 'Reconstruct morning tea, medicine, and walking schedules in order',
      action: () => { onPlayGame('dailyroutine'); onClose(); },
      icon: 'checklist',
    },
    {
      id: 'game-clockplanner',
      title: 'TimeSense Clock & Routine Planner',
      category: 'Game',
      description: 'Temporal clock setting, analog dial recognition, and daily routines',
      action: () => { onPlayGame('clock-planner'); onClose(); },
      icon: 'schedule',
    },
    {
      id: 'game-cameraspotter',
      title: 'Live Camera Object Spotter (Gemini Vision)',
      category: 'Game',
      description: 'Use device camera to identify everyday room objects',
      action: () => { onPlayGame('live-camera-spotter'); onClose(); },
      icon: 'photo_camera',
    },
    {
      id: 'game-shapesorter',
      title: 'Shape Sorter (Visual Discrimination)',
      category: 'Game',
      description: 'Match geometric shapes and contrasting colors',
      action: () => { onPlayGame('shape-sorter'); onClose(); },
      icon: 'extension',
    },
    {
      id: 'game-wordpair',
      title: 'Word Pair Recall (Verbal Retention)',
      category: 'Game',
      description: 'Learn and retrieve paired words to exercise short-term verbal recall',
      action: () => { onPlayGame('word-pair-recall'); onClose(); },
      icon: 'menu_book',
    },
    // Tools & Utilities
    {
      id: 'action-rewards',
      title: 'Redeem Mind Points & Rewards Store',
      category: 'Tool',
      description: 'Exchange mind points for herbal teas, framed albums, and puzzle digests',
      action: () => { onOpenRewards(); onClose(); },
      icon: 'stars',
    },
    {
      id: 'action-print-report',
      title: 'Print Clinical Cognitive Summary & Emergency Card',
      category: 'Tool',
      description: 'Generate clean paper printout for physician visits or caregiver handover',
      action: () => { onOpenPrintReport(); onClose(); },
      icon: 'print',
    },
    {
      id: 'nav-design-system',
      title: 'Design System & Component Showcase (/design)',
      category: 'Tool',
      description: 'View base buttons, inputs, modals, toasts, tables, empty & error states',
      action: () => { onSelectTab('design'); onClose(); },
      icon: 'palette',
    },
    {
      id: 'nav-settings',
      title: 'Settings & Family Memory Album Database',
      category: 'Navigation',
      description: 'Manage family face photos, voice greetings, font size, and emergency contacts',
      action: () => { onSelectTab('settings'); onClose(); },
      icon: 'settings',
    },
    {
      id: 'nav-help',
      title: 'Help & Expandable FAQ Guide',
      category: 'Navigation',
      description: 'Frequently asked questions, clinical dementia advice, and voice audio guides',
      action: () => { onSelectTab('help'); onClose(); },
      icon: 'help',
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
      setTimeout(() => inputRef.current?.focus(), 50);
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
      aria-label="Site Search Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search games, emergency actions, CareCompass, settings... (ESC to close)"
            className="flex-1 text-base bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-semibold">No features or games match "{query}"</p>
              <p className="text-xs mt-1">Try searching for "WayBack", "Radar", "Emergency", or "Points".</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#002045] text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/10 text-white'
                        : item.category === 'Emergency'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : item.category === 'Game'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{item.title}</p>
                      <span
                        className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md ${
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
                        isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-1 text-white' : 'text-slate-400 dark:text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="font-semibold bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">↑↓</kbd> Navigate</span>
            <span><kbd className="font-semibold bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">↵</kbd> Select</span>
          </div>
          <span className="hidden sm:inline font-medium">Quick Command Palette (REQ2 #3)</span>
        </div>
      </div>
    </div>
  );
};
