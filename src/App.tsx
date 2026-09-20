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
import { subscribeToAuth, initializeFirebaseAuth } from './firebase';
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
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { PatientMode } from './components/PatientMode';
import { AuthDomainHelperModal } from './components/AuthDomainHelperModal';

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

export default function App() {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Reactive state synced with storeService
  const [database, setDatabase] = useState<AppDatabase>(() => storeService.getDatabase());
  const user = database.user;
  const progress = database.progress;
  const activities = database.activities;
  const games = database.games;
  const familyMembers = database.familyMembers;
  const rewards = database.rewards;

  // Active game modal ID
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isDailyTrainingOpen, setIsDailyTrainingOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authHelperState, setAuthHelperState] = useState<{
    isOpen: boolean;
    domain: string;
    errorCode?: string;
    errorMessage?: string;
  }>({
    isOpen: false,
    domain: '',
  });

  const handleShowAuthTroubleshooter = (domain?: string, errorCode?: string, errorMessage?: string) => {
    setAuthHelperState({
      isOpen: true,
      domain: domain || (typeof window !== 'undefined' ? window.location.hostname : ''),
      errorCode,
      errorMessage,
    });
  };

  // Subscribe to storeService updates & Google auth state
  useEffect(() => {
    // Check for redirect result on startup (crucial for mobile browsers & Render)
    initializeFirebaseAuth().catch((err) => {
      console.warn('Firebase initial auth check:', err);
    });

    const unsubscribeStore = storeService.subscribe((updatedDb) => {
      setDatabase({ ...updatedDb });
    });
    const unsubscribeAuth = subscribeToAuth((authUser) => {
      storeService.handleAuthChange(authUser);
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
    setActiveGameId(null);
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

    setIsDailyTrainingOpen(false);
  };

  // Handle Reality Quest Complete
  const handleRealityQuestComplete = () => {
    storeService.recordGameResult({
      gameId: 'realityquest',
      score: 100,
      pointsEarned: 60,
      accuracy: 100,
      durationMinutes: 5,
      category: 'Planning',
      title: 'RealityQuest Sensory & Temporal Anchoring',
      notes: 'Verified calendar, season, and physical household anchors',
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

  return (
    <div className={`min-h-screen flex bg-[#F8F9FA] text-[#0F172A] ${fontSizeClass}`}>
      {/* Desktop Side Navigation Bar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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
            className="w-72 bg-[#f0f3ff] h-full p-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-[22px] text-[#002045]">SmritiSaathi</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-[#43474e] rounded-full hover:bg-[#d9e3f9]"
                >
                  <span className="material-symbols-outlined text-[26px]">close</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 mb-6 p-3 bg-white rounded-xl border border-[#d9e3f9]">
                <img
                  src={user?.avatarUrl}
                  alt={user?.name || 'Asha Devi'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#d9e3f9]"
                />
                <div>
                  <p className="font-bold text-base text-[#002045]">{user?.name || 'Asha Devi'}</p>
                  <p className="text-xs text-[#FF6321] font-extrabold">
                    {user?.totalMindPoints || user?.mindPoints || 240} Mind Points
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {[
                  { id: 'carecompass', label: 'CareCompass AI (Radar)', icon: 'radar' },
                  { id: 'patient-mode', label: 'Patient Mode (Dadaji)', icon: 'shield_person' },
                  { id: 'games', label: 'Games & Exercises', icon: 'videogame_asset' },
                  { id: 'reality-quest', label: 'Reality Quest', icon: 'explore' },
                  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                  { id: 'caregiver', label: 'Caregiver Portal', icon: 'supervised_user_circle' },
                  { id: 'settings', label: 'Settings', icon: 'settings' },
                  { id: 'help', label: 'Help & Guide', icon: 'help' },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl font-bold text-base flex items-center ${
                        currentTab === item.id
                          ? 'bg-[#002045] text-white'
                          : 'text-[#43474e] hover:bg-[#d9e3f9]'
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

      {/* Main Content Container */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top App Bar Header */}
        <Header
          user={user}
          currentTab={currentTab}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenRewards={() => setIsRewardsModalOpen(true)}
          onShowDomainHelper={(domain, code, msg) => handleShowAuthTroubleshooter(domain, code, msg)}
        />

        {/* View Switcher Container */}
        <div className="flex-1 mt-[72px] flex flex-col">
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
              onPlayGame={(gameId) => setActiveGameId(gameId)}
              onStartDailyTraining={() => setIsDailyTrainingOpen(true)}
              onOpenRewards={() => setIsRewardsModalOpen(true)}
              onViewHistory={() => setCurrentTab('history')}
            />
          )}

          {currentTab === 'games' && (
            <GamesView
              games={games}
              onPlayGame={(gameId) => setActiveGameId(gameId)}
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
              onShowDomainHelper={(domain, code, msg) => handleShowAuthTroubleshooter(domain, code, msg)}
            />
          )}

          {currentTab === 'help' && <HelpView user={user} />}
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
          currentLevel={games.find((g) => g.id === 'word-pair-recall')?.level || 1}
          maxLevel={3}
          onComplete={(score, pts, acc, lvl) =>
            handleGameComplete('word-pair-recall', score, pts, acc, 'Memory', 'Word Pair Memory', lvl)
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
          onShowDomainHelper={(domain, code, msg) => handleShowAuthTroubleshooter(domain, code, msg)}
        />
      )}

      {/* Domain Authorization Helper Modal for Vercel / Custom Hosting */}
      <AuthDomainHelperModal
        isOpen={authHelperState.isOpen}
        domain={authHelperState.domain}
        errorCode={authHelperState.errorCode}
        errorMessage={authHelperState.errorMessage}
        onClose={() => setAuthHelperState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
