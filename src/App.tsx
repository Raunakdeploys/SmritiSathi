import React, { useState, useEffect } from 'react';
import type {
  AppDatabase,
  UserProfile,
  CognitiveProgress,
  ActivityItem,
  GameInfo,
  FamilyMember,
  RewardItem,
} from './types';
import { storeService } from './services/storeService';
import { subscribeToAuth, printAuthDiagnostics } from './firebase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { GamesView } from './components/GamesView';
import { RealityQuestView } from './components/RealityQuestView';
import { CaregiverPortal } from './components/CaregiverPortal';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import { DailyTrainingModal } from './components/DailyTrainingModal';
import { RewardsModal } from './components/RewardsModal';
import { ProfileModal } from './components/ProfileModal';
import { WhereAmIModal } from './components/WhereAmIModal';
import { DirectCallModal } from './components/DirectCallModal';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { PatientMode } from './components/PatientMode';
import { GeminiChatView } from './components/GeminiChatView';
import { usePageSEO } from './utils/usePageSEO';
import { analytics } from './utils/analytics';
import { NotFoundView } from './components/NotFoundView';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { LegalModals } from './components/LegalModals';
import { ThankYouModal } from './components/ThankYouModal';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { BackToTopButton } from './components/BackToTopButton';
import { FloatingContactButton } from './components/FloatingContactButton';
import { CommandPaletteSearch } from './components/CommandPaletteSearch';
import { PrintReportModal } from './components/PrintReportModal';
import { DesignSystemView } from './components/DesignSystemView';
import { AndroidAppView } from './components/AndroidAppView';
import { OfflineIndicator } from './components/OfflineIndicator';

// SmritiSaathi Core Cognitive & Reminiscence Games
import { WayBackGame } from './components/games/WayBackGame';
import { LifeThreadGame } from './components/games/LifeThreadGame';
import { FaceBondGame } from './components/games/FaceBondGame';
import { DailyRoutineGame } from './components/games/DailyRoutineGame';
import { ClockPlannerGame } from './components/games/ClockPlannerGame';
import { LiveCameraSpotterGame } from './components/games/LiveCameraSpotterGame';
import { NameThatFaceGame } from './components/games/NameThatFaceGame';
import { ShapeSorterGame } from './components/games/ShapeSorterGame';
import { WordPairGame } from './components/games/WordPairGame';
import { DualNBackGame } from './components/games/DualNBackGame';
import { StroopGame } from './components/games/StroopGame';
import { SpatialGridGame } from './components/games/SpatialGridGame';

export default function App() {

  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [previousTab, setPreviousTab] = useState<string>('dashboard');

  const navigateToTab = (newTab: string) => {
    if (newTab !== currentTab) {
      setPreviousTab(currentTab);
      setCurrentTab(newTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const TAB_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    carecompass: 'CareCompass Radar',
    'patient-mode': 'Patient Mode',
    'saathi-chat': 'Saathi AI Chat',
    games: 'Games',
    'reality-quest': 'Reality Quest',
    caregiver: 'Caregiver Portal',
    settings: 'Settings',
    help: 'Help & Guide',
    design: 'Design System',
    'android-app': 'Android App & APK',
  };

  // Dynamic SEO Page Title & Meta Tags
  usePageSEO(currentTab);

  // Reactive state synced with storeService
  const [database, setDatabase] = useState<AppDatabase>(() => storeService.getDatabase());
  const user = database.user;
  const progress = database.progress;
  const activities = database.activities;
  const games = database.games;
  const familyMembers = database.familyMembers;
  const rewards = database.rewards;

  // Active game modal ID & level state
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGameLevel, setActiveGameLevel] = useState<number | undefined>(undefined);
  const [activeCustomLevelData, setActiveCustomLevelData] = useState<any>(undefined);
  const [isDailyTrainingOpen, setIsDailyTrainingOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWhereAmIOpen, setIsWhereAmIOpen] = useState(false);
  const [isDirectCallOpen, setIsDirectCallOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('smritisathi_theme');
      if (stored) return stored === 'dark';
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Dark Mode Sync with DOM html class (REQ2 #1)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('smritisathi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('smritisathi_theme', 'light');
    }
  }, [isDarkMode]);


  // Global Keyboard Shortcut: Cmd+K / Ctrl+K for Site Search (REQ2 #3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [thankYouState, setThankYouState] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    points?: number;
  }>({ isOpen: false });


  // Subscribe to storeService updates & Google auth state
  useEffect(() => {
    printAuthDiagnostics();

    const unsubscribeStore = storeService.subscribe((updatedDb) => {
      setDatabase({ ...updatedDb });
    });

    // onAuthStateChanged is the single source of truth for session persistence
    const unsubscribeAuth = subscribeToAuth(async (authUser) => {
      try {
        await storeService.handleAuthChange(authUser);
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => {
      unsubscribeStore();
      unsubscribeAuth();
    };
  }, []);

  // Handle Game Completion via StoreService Cognitive Bridge Engine
  const handleGameComplete = (
    gameId: string,
    score: number,
    pointsEarned: number,
    accuracy: number,
    category: string,
    title: string,
    levelPlayed?: number
  ) => {
    storeService.recordGameResult({
      gameId,
      score,
      pointsEarned,
      accuracy,
      durationMinutes: 4,
      category,
      title,
      notes: `Completed Level ${levelPlayed || 1} with ${accuracy}% accuracy.`,
    });
    analytics.logEvent(`game_completed_${gameId}`, 'cognitive_game', { score, pointsEarned, accuracy });
    setActiveGameId(null);
    setThankYouState({
      isOpen: true,
      title: `${title} Completed!`,
      subtitle: `Brilliant effort! You achieved ${accuracy}% accuracy on Level ${levelPlayed || 1}.`,
      points: pointsEarned,
    });
  };

  // Handle Daily Workout Complete
  const handleDailyTrainingComplete = (bonusPoints: number) => {
    const currentMem = progress?.memory ?? 85;
    const currentAtt = progress?.attention ?? 80;
    const currentPlan = progress?.planning ?? 78;

    const newMem = Math.min(100, currentMem + 5);
    const newAtt = Math.min(100, currentAtt + 5);
    const newPlan = Math.min(100, currentPlan + 5);

    storeService.updateProgress({
      memory: newMem,
      attention: newAtt,
      planning: newPlan,
    });

    storeService.updateUser({
      totalMindPoints: (user.totalMindPoints || 0) + bonusPoints,
      dailyGoalCompleted: true,
      totalSessions: (user.totalSessions || 0) + 1,
    });

    storeService.recordGameResult({
      gameId: 'realityquest',
      score: 100,
      pointsEarned: bonusPoints,
      accuracy: 100,
      durationMinutes: 8,
      category: 'Memory',
      title: 'Daily 3-Pillar Mind Workout',
      notes: 'Completed comprehensive memory, attention, and executive reasoning drills',
    });

    analytics.logEvent('daily_training_completed', 'cognitive_game', { bonusPoints });
    setIsDailyTrainingOpen(false);
    setThankYouState({
      isOpen: true,
      title: 'Daily Mind Workout Complete!',
      subtitle: 'You completed your 3-pillar cognitive drills today. Your brain is stimulated and resilient!',
      points: bonusPoints,
    });
  };

  // Handle Reality Quest Complete
  const handleRealityQuestComplete = () => {
    storeService.recordGameResult({
      gameId: 'realityquest',
      score: 100,
      pointsEarned: 60,
      accuracy: 100,
      durationMinutes: 10,
      category: 'Orientation',
      title: 'Sensory & Temporal Reality Quest',
      notes: 'Completed comprehensive sensory anchoring and temporal orientation',
    });
    analytics.logEvent('reality_quest_completed', 'cognitive_game', { points: 60 });
    setThankYouState({
      isOpen: true,
      title: 'Reality Quest Completed!',
      subtitle: 'You successfully grounded your temporal and spatial awareness. Superb focus!',
      points: 60,
    });
  };

  // Handle Reward Redemption
  const handleRedeemReward = (rewardId: string) => {
    storeService.redeemReward(rewardId);
  };

  // Handle Favorite Game Toggle
  const handleToggleFavorite = (gameId: string, isFavorite: boolean) => {
    const game = database.games.find((g) => g.id === gameId);
    if (game) {
      game.isFavorite = isFavorite;
      setDatabase({ ...database });
    }
  };

  // Handle Settings User Profile Update
  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    storeService.updateUser(updated);
  };

  // Handle Add / Delete Family Member
  const handleAddFamilyMember = (member: Omit<FamilyMember, 'id'>) => {
    storeService.addFamilyMember(member);
  };

  const handleDeleteFamilyMember = (id: string) => {
    storeService.deleteFamilyMember(id);
  };

  // Reset Demo Database
  const handleResetDemo = () => {
    storeService.resetToDefault();
  };

  // Large text mode class
  const isLargeText = user?.preferences?.largeText || user?.preferences?.fontSize === 'extralarge';
  const fontSizeClass = isLargeText ? 'text-[20px] large-text-mode' : 'text-[17px]';

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#002045] flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <span className="material-symbols-outlined text-white text-[36px]">psychology</span>
        </div>
        <h1 className="font-extrabold text-[24px] text-[#002045] tracking-tight mb-2">SmritiSaathi</h1>
        <p className="text-sm font-semibold text-[#43474e]">Restoring your secure cognitive session...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 ${fontSizeClass} w-full max-w-full overflow-x-hidden relative transition-colors`}>
      {/* Accessible Skip-to-Content Link (REQ2 #12) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Reading Scroll Progress Bar (REQ2 #8) */}
      <ScrollProgressBar />

      {/* Desktop Side Navigation Bar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={navigateToTab}
        onStartDailyTraining={() => setIsDailyTrainingOpen(true)}
        user={user}
      />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden flex animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-white dark:bg-[#0f1b38] h-full p-6 flex flex-col justify-between shadow-2xl border-r border-slate-200 dark:border-[#1e3a6a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-[22px] text-[#002045] dark:text-white">SmritiSaathi</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-[#1e293b]"
                >
                  <span className="material-symbols-outlined text-[26px]">close</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 mb-6 p-3 bg-slate-50 dark:bg-[#111e38] rounded-xl border border-slate-200 dark:border-[#1e3a6a]">
                <img
                  src={user?.avatarUrl}
                  alt={user?.name || 'Asha Devi'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-[#1e3a6a]"
                />
                <div>
                  <p className="font-bold text-base text-[#002045] dark:text-white">{user?.name || 'Asha Devi'}</p>
                  <p className="text-xs text-[#FF6321] font-extrabold">
                    {user?.totalMindPoints || user?.mindPoints || 240} Mind Points
                  </p>
                </div>
              </div>


              <ul className="space-y-2">
                {[
                  { id: 'carecompass', label: 'CareCompass AI (Radar)', icon: 'radar' },
                  { id: 'patient-mode', label: 'Patient Mode (Dadaji)', icon: 'shield_person' },
                  { id: 'saathi-chat', label: 'Saathi AI Chat', icon: 'voice_chat' },
                  { id: 'games', label: 'Games & Exercises', icon: 'videogame_asset' },
                  { id: 'reality-quest', label: 'Reality Quest', icon: 'explore' },
                  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                  { id: 'caregiver', label: 'Caregiver Portal', icon: 'supervised_user_circle' },
                  { id: 'android-app', label: 'Android App & APK', icon: 'smartphone' },
                  { id: 'settings', label: 'Settings', icon: 'settings' },
                  { id: 'help', label: 'Help & Guide', icon: 'help' },
                  { id: 'design', label: 'Design System', icon: 'palette' },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        navigateToTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl font-bold text-base flex items-center ${
                        currentTab === item.id
                          ? 'bg-[#002045] dark:bg-blue-600 text-white'
                          : 'text-[#43474e] dark:text-slate-300 hover:bg-[#d9e3f9] dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="material-symbols-outlined mr-3 text-[22px]">{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsDailyTrainingOpen(true);
              }}
              className="bg-[#FF6321] hover:bg-[#EA580C] text-white py-3.5 rounded-xl font-bold text-base w-full shadow-sm cursor-pointer transition-colors"
            >
              Start Daily Training
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container: exact fit for mobile and desktop without overflow */}
      <div className="flex flex-col min-h-screen w-full md:pl-64 min-w-0 max-w-full overflow-x-hidden box-border">
        {/* Top App Bar Header */}
        <Header
          user={user}
          currentTab={currentTab}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenRewards={() => setIsRewardsModalOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          onOpenPrintReport={() => setIsPrintReportOpen(true)}
        />

        {/* View Switcher Container */}
        <div id="main-content" className="flex-1 mt-[72px] flex flex-col w-full min-w-0 max-w-full overflow-x-hidden box-border">

          {currentTab === 'carecompass' && (
            <CaregiverDashboard
              telemetry={database.careCompass?.telemetry}
              config={database.careCompass?.config}
              alertLogs={database.careCompass?.alertLogs}
              onUpdateTelemetry={(updated) => storeService.updateCareCompassTelemetry(updated)}
              onUpdateConfig={(updated) => storeService.updateCareCompassConfig(updated)}
              onAddAlertLog={(entry) => storeService.addAlertLog(entry)}
              onAcknowledgeAlert={(id) => storeService.acknowledgeAlertLog(id)}
              onSwitchToPatientMode={() => setCurrentTab('patient-mode')}
            />
          )}

          {currentTab === 'patient-mode' && (
            <PatientMode
              telemetry={database.careCompass?.telemetry}
              config={database.careCompass?.config}
              onTriggerSOS={(cause) => {
                const tel = database.careCompass?.telemetry || {
                  distanceMeters: 0,
                  latitude: 26.1445,
                  longitude: 91.7362,
                };
                storeService.addAlertLog({
                  severity: 'critical',
                  cause: 'Manual SOS Pressed',
                  notes: `${database.careCompass?.config?.patientName || 'Patient'} pressed the emergency SOS button. Immediate caregiver intervention dispatched.`,
                  distanceMeters: tel.distanceMeters,
                  latitude: tel.latitude,
                  longitude: tel.longitude,
                  acknowledged: false,
                  whatsappDispatched: true,
                });
              }}
              onSwitchToCaregiver={() => setCurrentTab('carecompass')}
              onExitToCaregiver={() => setCurrentTab('carecompass')}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              user={user}
              progress={progress}
              activities={activities}
              familyMembers={familyMembers}
              telemetry={database.careCompass?.telemetry}
              config={database.careCompass?.config}
              onPlayGame={(gameId) => setActiveGameId(gameId)}
              onStartDailyTraining={() => setIsDailyTrainingOpen(true)}
              onOpenRewards={() => setIsRewardsModalOpen(true)}
              onViewHistory={() => setCurrentTab('history')}
              onOpenWhereAmI={() => setIsWhereAmIOpen(true)}
              onOpenDirectCall={() => setIsDirectCallOpen(true)}
              onOpenCareCompass={() => setCurrentTab('carecompass')}
            />
          )}

          {currentTab === 'saathi-chat' && (
            <GeminiChatView
              user={user}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'games' && (
            <GamesView
              games={games}
              onPlayGame={(gameId, levelOverride, customLevelData) => {
                setActiveGameId(gameId);
                setActiveGameLevel(levelOverride);
                setActiveCustomLevelData(customLevelData);
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentTab === 'reality-quest' && (
            <RealityQuestView
              user={user}
              onCompleteQuest={handleRealityQuestComplete}
              voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
            />
          )}

          {currentTab === 'caregiver' && (
            <CaregiverPortal
              onBackToApp={() => setCurrentTab('dashboard')}
              voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              activities={activities}
              user={user}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              familyFaces={familyMembers.map((m) => ({
                id: m.id,
                name: m.name,
                relation: m.relation,
                imageUrl: m.photoUrl,
                audioGreetingUrl: m.voiceNote,
                notes: m.keyMemories?.join(', '),
              }))}
              onUpdateUser={handleUpdateUser}
              onAddFamilyFace={(face) =>
                handleAddFamilyMember({
                  name: face.name,
                  relation: face.relation,
                  age: 40,
                  relationCategory: 'immediate',
                  photoUrl: face.imageUrl,
                  keyMemories: face.notes ? [face.notes] : ['Cherished family member'],
                  voiceNote: face.audioGreetingUrl,
                })
              }
              onDeleteFamilyFace={handleDeleteFamilyMember}
              onResetDemo={handleResetDemo}
              onNavigateToTab={(tab) => {
                setCurrentTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentTab === 'help' && <HelpView user={user} />}

          {/* Design System & Component States (Layer 6 Standard) */}
          {currentTab === 'design' && (
            <DesignSystemView
              onBackToApp={() => setCurrentTab('dashboard')}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            />
          )}

          {/* Android App & APK Center Section */}
          {currentTab === 'android-app' && (
            <AndroidAppView
              previousTabName={TAB_LABELS[previousTab] || 'Dashboard'}
              onBack={() => navigateToTab(previousTab || 'dashboard')}
              onClose={() => navigateToTab('dashboard')}
            />
          )}

          {/* 404 Page Safe Anchor for unknown routes (REQ1 #1) */}
          {![
            'carecompass',
            'patient-mode',
            'dashboard',
            'saathi-chat',
            'games',
            'reality-quest',
            'caregiver',
            'history',
            'settings',
            'help',
            'design',
            'android-app',
          ].includes(currentTab) && (
            <NotFoundView
              onNavigateHome={() => setCurrentTab('dashboard')}
              onOpenSOS={() => setIsDirectCallOpen(true)}
            />
          )}

          {/* Real Production-Grade Footer with Legal, Helplines & Address */}
          {currentTab !== 'patient-mode' && currentTab !== 'saathi-chat' && currentTab !== 'design' && (
            <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs py-8 px-4 sm:px-8 text-xs text-slate-600 dark:text-slate-400 no-print transition-colors">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Brand & Address */}
                <div className="text-center md:text-left space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#002045] dark:bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      स
                    </div>
                    <span className="font-extrabold text-[#002045] dark:text-white text-sm tracking-tight">SmritiSaathi</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      DPDP Safe · AI Grounded
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Cognitive Wellness &amp; Assistive Tech Labs · Bengaluru, Karnataka 560038, India
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px]">
                    © 2026 SmritiSaathi. Designed with dignity for seniors and family caregivers.
                  </p>
                </div>


                {/* Emergency Hotline Badge */}
                <div className="flex items-center gap-3 bg-orange-50/80 border border-orange-200 px-4 py-2.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-[#FF6321] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-[#002045] text-xs">National Elder Helpline</p>
                    <p className="text-orange-900 font-bold text-xs">
                      Toll-Free: <a href="tel:14567" className="underline hover:text-orange-700">14567</a> · Emergency: <a href="tel:112" className="underline hover:text-orange-700">112</a>
                    </p>
                  </div>
                </div>

                {/* Legal & Policy Modals Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setLegalModalType('privacy')}
                    className="hover:text-[#002045] hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setLegalModalType('terms')}
                    className="hover:text-[#002045] hover:underline cursor-pointer"
                  >
                    Terms &amp; Clinical Use
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setLegalModalType('contact')}
                    className="hover:text-[#002045] hover:underline cursor-pointer"
                  >
                    Contact &amp; Support
                  </button>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>

      {/* SmritiSaathi Core Game Modals */}

      {/* 1. WayBack Spatial Route Navigation & GPS Test */}
      {activeGameId === 'wayback' && (
        <WayBackGame
          user={user}
          currentLevel={storeService.getGameProgress('wayback').currentLevel || 2}
          maxLevel={5}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('wayback', score, pts, acc, 'Spatial', 'WayBack Route Navigation', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 2. LifeThread Milestone Sequencing Game */}
      {activeGameId === 'lifethread' && (
        <LifeThreadGame
          currentLevel={storeService.getGameProgress('lifethread').currentLevel || 2}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('lifethread', score, pts, acc, 'Memory', 'LifeThread Milestones', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 3. FaceBond Kinship Recognition Game */}
      {activeGameId === 'facebond' && (
        <FaceBondGame
          currentLevel={storeService.getGameProgress('facebond').currentLevel || 2}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('facebond', score, pts, acc, 'Memory', 'FaceBond Kinship Recall', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 4. DailyRoutine Executive Sequencing Game */}
      {activeGameId === 'dailyroutine' && (
        <DailyRoutineGame
          currentLevel={storeService.getGameProgress('dailyroutine').currentLevel || 2}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('dailyroutine', score, pts, acc, 'Executive', 'DailyRoutine Task Flow', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 5. RealityQuest Sensory & Temporal Anchoring Modal */}
      {activeGameId === 'realityquest' && (
        <div className="fixed inset-0 z-50 bg-[#001026]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative">
            <button
              onClick={() => setActiveGameId(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full z-10 font-bold"
            >
              ✕
            </button>
            <div className="flex-1 overflow-y-auto">
              <RealityQuestView
                user={user}
                onCompleteQuest={() => {
                  handleRealityQuestComplete();
                  setActiveGameId(null);
                }}
                voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. TimeSense Clock & Routine Planner Game */}
      {activeGameId === 'clock-planner' && (
        <ClockPlannerGame
          currentLevel={games.find((g) => g.id === 'clock-planner')?.level || 2}
          maxLevel={10}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('clock-planner', score, pts, acc, 'Planning', 'TimeSense Clock & Routine', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 7. Live Camera Spotter Game (Gemini Vision) */}
      {activeGameId === 'live-camera-spotter' && (
        <LiveCameraSpotterGame
          currentLevel={games.find((g) => g.id === 'live-camera-spotter')?.level || 1}
          maxLevel={3}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('live-camera-spotter', score, pts, acc, 'Attention', 'Live Camera Object Spotter', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* Legacy / Additional Games */}
      {activeGameId === 'name-that-face' && (
        <NameThatFaceGame
          faces={familyMembers.map((m) => ({
            id: m.id,
            name: m.name,
            relation: m.relation,
            imageUrl: m.photoUrl,
            audioGreetingUrl: m.voiceNote,
          }))}
          currentLevel={games.find((g) => g.id === 'name-that-face')?.level || 1}
          maxLevel={3}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('facebond', score, pts, acc, 'Memory', 'Name That Face', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {activeGameId === 'shape-sorter' && (
        <ShapeSorterGame
          currentLevel={games.find((g) => g.id === 'shape-sorter')?.level || 1}
          maxLevel={3}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('shape-sorter', score, pts, acc, 'Attention', 'Shape Sorter', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {activeGameId === 'word-pair-recall' && (
        <WordPairGame
          currentLevel={activeGameLevel || games.find((g) => g.id === 'word-pair-recall')?.level || 2}
          maxLevel={10}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('word-pair-recall', score, pts, acc, 'Memory', 'Word Pair & Reminiscence Memory', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 8. Dual N-Back Working Memory Trainer */}
      {activeGameId === 'dual-nback' && (
        <DualNBackGame
          currentLevel={activeGameLevel || games.find((g) => g.id === 'dual-nback')?.level || 2}
          maxLevel={10}
          customLevelData={activeCustomLevelData}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('dual-nback', score, pts, acc, 'Attention', 'Dual N-Back Working Memory', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 9. Stroop Executive Inhibitory Challenge */}
      {activeGameId === 'stroop-executive' && (
        <StroopGame
          currentLevel={activeGameLevel || games.find((g) => g.id === 'stroop-executive')?.level || 2}
          maxLevel={10}
          customLevelData={activeCustomLevelData}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('stroop-executive', score, pts, acc, 'Executive', 'Stroop Executive Inhibition', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* 10. Spatial Pattern Memory Grid */}
      {activeGameId === 'spatial-grid' && (
        <SpatialGridGame
          currentLevel={activeGameLevel || games.find((g) => g.id === 'spatial-grid')?.level || 2}
          maxLevel={10}
          customLevelData={activeCustomLevelData}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('spatial-grid', score, pts, acc, 'Spatial', 'Spatial Pattern Memory Grid', lvl)
          }
          onClose={() => setActiveGameId(null)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* Daily Training Multi-Step Workout Modal */}
      {isDailyTrainingOpen && (
        <DailyTrainingModal
          onCompleteAll={handleDailyTrainingComplete}
          onClose={() => setIsDailyTrainingOpen(false)}
          voiceGuidanceEnabled={user?.preferences?.voiceAssistance ?? true}
        />
      )}

      {/* Rewards Store Redemption Modal */}
      {isRewardsModalOpen && (
        <RewardsModal
          rewards={rewards}
          mindPoints={user?.totalMindPoints || user?.mindPoints || 0}
          onRedeem={handleRedeemReward}
          onClose={() => setIsRewardsModalOpen(false)}
        />
      )}

      {/* Senior Profile Quick View Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          user={user}
          progress={progress}
          onClose={() => setIsProfileModalOpen(false)}
          onOpenSettings={() => {
            setIsProfileModalOpen(false);
            setCurrentTab('settings');
          }}
        />
      )}

      {/* Senior Reality Grounding WhereAmI Modal */}
      {isWhereAmIOpen && (
        <WhereAmIModal
          isOpen={isWhereAmIOpen}
          onClose={() => setIsWhereAmIOpen(false)}
          telemetry={
            database.careCompass?.telemetry || {
              distanceMeters: 12,
              latitude: 28.5244,
              longitude: 77.2167,
              batteryLevel: 88,
              status: 'INSIDE_SAFE_ZONE',
              lastSeenSecondsAgo: 4,
              heartRateBpm: 72,
              bearingDegrees: 45,
            }
          }
          config={
            database.careCompass?.config || {
              patientName: user?.name || 'Asha Devi',
              anchorName: 'Home Sweet Home',
              anchorRadiusMeters: 100,
              emergencyPhone: '+91 98765 43210',
              caregiverName: 'Rohan Sharma',
              preferredLanguage: 'hi-IN',
            }
          }
        />
      )}

      {/* Immediate Caregiver Direct Telephone/Radio Call Modal */}
      {isDirectCallOpen && (
        <DirectCallModal
          isOpen={isDirectCallOpen}
          onClose={() => setIsDirectCallOpen(false)}
          targetName={database.careCompass?.config?.caregiverName || 'Rohan Sharma'}
          targetPhone={database.careCompass?.config?.emergencyPhone || '+91 98765 43210'}
          targetRole="Son & Primary Caregiver"
          patientName={user?.name || 'Asha Devi'}
        />
      )}

      {/* Floating Saathi AI Chat Launcher (Visible on all tabs except saathi-chat or full-screen games) */}
      {currentTab !== 'saathi-chat' && !activeGameId && (
        <button
          id="btn-floating-saathi-chat"
          onClick={() => {
            setCurrentTab('saathi-chat');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-40 bg-[#002045] hover:bg-[#1a365d] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Chat with Saathi AI"
        >
          <span className="material-symbols-outlined text-[24px] text-[#FF6321] group-hover:rotate-12 transition-transform">
            voice_chat
          </span>
          <span className="hidden sm:inline font-bold text-sm tracking-wide">
            Saathi AI Chat
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* GDPR / DPDP Cookie Consent Banner */}
      <CookieConsentBanner />

      {/* Legal, Privacy & Contact Helplines Modals */}
      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Celebratory Thank You & Milestone Achievement Modal (REQ1 #14) */}
      <ThankYouModal
        isOpen={thankYouState.isOpen}
        title={thankYouState.title}
        subtitle={thankYouState.subtitle}
        pointsEarned={thankYouState.points}
        onClose={() => setThankYouState({ isOpen: false })}
        onNextAction={() => {
          setCurrentTab('games');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        nextActionLabel="Play Another Exercise"
      />

      {/* Back to Top Floating Button (REQ2 #4) */}
      <BackToTopButton />

      {/* Floating Emergency & Direct Contact Hub (REQ2 #20) */}
      {currentTab !== 'patient-mode' && (
        <FloatingContactButton
          onOpenDirectCall={() => setIsDirectCallOpen(true)}
          onOpenWhereAmI={() => setIsWhereAmIOpen(true)}
          onOpenChat={() => {
            setCurrentTab('saathi-chat');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          caregiverName={database.careCompass?.config?.caregiverName || 'Rohan Sharma'}
          caregiverPhone={database.careCompass?.config?.emergencyPhone || '+91 98765 43210'}
        />
      )}

      {/* Command Palette Site Search Modal (REQ2 #3) */}
      <CommandPaletteSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onPlayGame={(gameId) => setActiveGameId(gameId)}
        onStartDailyTraining={() => setIsDailyTrainingOpen(true)}
        onOpenDirectCall={() => setIsDirectCallOpen(true)}
        onOpenWhereAmI={() => setIsWhereAmIOpen(true)}
        onOpenRewards={() => setIsRewardsModalOpen(true)}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
      />

      {/* Clinical Cognitive Summary & Handover Print Modal (REQ2 #10) */}
      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        user={user}
        progress={progress}
        activities={activities}
        caregiverPhone={database.careCompass?.config?.emergencyPhone || '+91 98765 43210'}
        anchorName={database.careCompass?.config?.anchorName || 'Home Sweet Home'}
        safeRadius={database.careCompass?.config?.anchorRadiusMeters || 100}
      />

      {/* Connectivity & Offline Status Banner */}
      <OfflineIndicator />
    </div>
  );
}

