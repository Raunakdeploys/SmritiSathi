import type {
  UserProfile,
  FamilyMember,
  GameProgress,
  LocationCheckRecord,
  CognitiveDomainScores,
  CognitiveProgress,
  ActivityItem,
  GameInfo,
  RewardItem,
  RealityQuestion,
  AppDatabase,
  CareCompassConfig,
  CareCompassTelemetry,
  AlertLogEntry,
} from '../types';
import { INITIAL_FAMILY_MEMORIES } from '../data/memoriesData';
import { auth, firestoreSyncService } from '../firebase';

// Helper to determine initial home location without hardcoding Guwahati
const getInitialHomeLocation = () => {
  if (typeof window !== 'undefined') {
    const latStr = localStorage.getItem('cc_last_real_lat');
    const lngStr = localStorage.getItem('cc_last_real_lng');
    const city = localStorage.getItem('cc_last_real_city');
    const area = localStorage.getItem('cc_last_real_area');
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          label: city ? `Home Base (${city})` : 'Live Physical Home Base',
          city: city || 'My Location',
          area: area || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          latitude: lat,
          longitude: lng,
        };
      }
    }
  }
  return {
    label: 'Live Device Home Base',
    city: 'Detecting Live Location...',
    area: 'Streaming Device GPS...',
    latitude: 28.6139,
    longitude: 77.2090,
  };
};

const getInitialTelemetry = (): CareCompassTelemetry => {
  if (typeof window !== 'undefined') {
    const latStr = localStorage.getItem('cc_last_real_lat');
    const lngStr = localStorage.getItem('cc_last_real_lng');
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          accuracy: 5,
          distanceMeters: 0,
          bearingDegrees: 0,
          bearingText: 'North (N)',
          geofenceStatus: 'SAFE_ZONE',
          batteryLevel: 88,
          isCharging: false,
          heartRateBpm: 72,
          heartRateStatus: 'normal',
          movementState: 'Stationary',
          isSundowningHours: false,
          sundowningRisk: 'low',
          lastUpdated: 'Live GPS Synced',
          isRealtimeGps: true,
          breadcrumbs: [],
        };
      }
    }
  }
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 8,
    distanceMeters: 0,
    bearingDegrees: 0,
    bearingText: 'North (N)',
    geofenceStatus: 'SAFE_ZONE',
    batteryLevel: 86,
    isCharging: false,
    heartRateBpm: 74,
    heartRateStatus: 'normal',
    movementState: 'Stationary',
    isSundowningHours: false,
    sundowningRisk: 'low',
    lastUpdated: 'Waiting for device GPS...',
    breadcrumbs: [],
  };
};

export const INITIAL_CARE_COMPASS_CONFIG: CareCompassConfig = {
  patientName: 'Dadaji',
  patientHonorific: 'Elder',
  patientAge: 76,
  caregiverName: 'Raunak',
  caregiverPhone: '+91 9073719787',
  homeLocation: getInitialHomeLocation(),
  safeRadiusMeters: 300,
  alertRadiusMeters: 600,
  preferredLanguage: 'en-IN',
  autoSirenOnBreach: true,
  autoWhatsAppOnBreach: true,
};

export const INITIAL_CARE_COMPASS_TELEMETRY: CareCompassTelemetry = getInitialTelemetry();

export const INITIAL_ALERT_LOGS: AlertLogEntry[] = [
  {
    id: 'alt-1',
    timestamp: 'Today, 09:30 AM',
    severity: 'info',
    cause: 'Routine Check-In',
    distanceMeters: 25,
    latitude: 26.1445,
    longitude: 91.7362,
    notes: 'Device powered on and GPS locked to Guwahati Dispur Base',
    acknowledged: true,
  },
  {
    id: 'alt-2',
    timestamp: 'Yesterday, 05:45 PM',
    severity: 'warning',
    cause: 'Sundowning Warning',
    distanceMeters: 180,
    latitude: 26.1458,
    longitude: 91.7375,
    notes: 'Twilight wandering window active (5:00 PM - 8:00 PM)',
    acknowledged: true,
  },
];

export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fm-1',
    name: 'Rohan Sharma',
    relation: 'Son',
    age: 44,
    relationCategory: 'immediate',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    keyMemories: [
      'Visited Shimla together in summer 2019',
      'Loves when you make his favorite Gobhi Parathas',
      'Software engineer living nearby in Gurgaon',
    ],
    voiceNote: 'Namaste Ma, hope you are having a wonderful morning! Take your morning tea peacefully.',
    phone: '+91 98112 34567',
  },
  {
    id: 'fm-2',
    name: 'Ananya Sharma',
    relation: 'Granddaughter',
    age: 16,
    relationCategory: 'immediate',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    keyMemories: [
      'You taught her how to knit wool sweaters',
      'Played classical harmonium together during Diwali',
      'Scored 95% in her 10th board exams',
    ],
    voiceNote: 'Dadi ji! Can you teach me that raag again this Sunday?',
    phone: '+91 98223 45678',
  },
  {
    id: 'fm-3',
    name: 'Dr. Rajesh Verma',
    relation: 'Brother',
    age: 68,
    relationCategory: 'extended',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    keyMemories: [
      'Grew up together in Old Lucknow house',
      'Practices Ayurvedic medicine in Varanasi',
      'Sends fresh Alphonso mangoes every summer',
    ],
    voiceNote: 'Didi, take your morning medicines on time! Pranam.',
    phone: '+91 98334 56789',
  },
  {
    id: 'fm-4',
    name: 'Pooja Sharma',
    relation: 'Daughter-in-law',
    age: 41,
    relationCategory: 'immediate',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    keyMemories: [
      'Cooks evening tea with ginger and cardamom together',
      'Helps organize morning garden watering',
    ],
    voiceNote: 'Mummy ji, tea is ready whenever you want!',
    phone: '+91 98445 67890',
  },
];

export const INITIAL_GAMES: GameInfo[] = [
  {
    id: 'wayback',
    title: 'WayBack (Spatial Route & Live GPS)',
    category: 'Spatial',
    durationText: '4 mins',
    description: 'Neighborhood route sequencing & real-time live GPS orientation assessment to strengthen spatial navigation.',
    isFavorite: true,
    icon: 'navigation',
    color: '#FF6321',
    highScore: 280,
    timesPlayed: 8,
    level: 2,
    maxLevel: 5,
    xp: 60,
    xpToNextLevel: 100,
    stars: 3,
    badge: 'Spatial Core',
    isCoreGame: true,
  },
  {
    id: 'lifethread',
    title: 'LifeThread (Milestone Sequencing)',
    category: 'Memory',
    durationText: '5 mins',
    description: 'Reconstruct personal life milestones in correct chronological order with decade hints and audio memory prompts.',
    isFavorite: true,
    icon: 'timeline',
    color: '#0F172A',
    highScore: 320,
    timesPlayed: 12,
    level: 2,
    maxLevel: 5,
    xp: 80,
    xpToNextLevel: 100,
    stars: 3,
    badge: 'Reminiscence Core',
    isCoreGame: true,
  },
  {
    id: 'facebond',
    title: 'FaceBond (Family Face & Kinship)',
    category: 'Memory',
    durationText: '4 mins',
    description: 'Recognize family members, kinship relationships, and shared fond memories with voice greetings.',
    isFavorite: true,
    icon: 'face',
    color: '#FF6321',
    highScore: 300,
    timesPlayed: 14,
    level: 2,
    maxLevel: 5,
    xp: 75,
    xpToNextLevel: 100,
    stars: 3,
    badge: 'Face & Kinship',
    isCoreGame: true,
  },
  {
    id: 'realityquest',
    title: 'RealityQuest (Sensory & Temporal Anchoring)',
    category: 'Planning',
    durationText: '5 mins',
    description: 'Daily calendar verification, season/weather observation, and optional live camera household object spotting.',
    isFavorite: true,
    icon: 'explore',
    color: '#10B981',
    highScore: 340,
    timesPlayed: 18,
    level: 2,
    maxLevel: 5,
    xp: 90,
    xpToNextLevel: 100,
    stars: 3,
    badge: 'Reality Anchor',
    isCoreGame: true,
  },
  {
    id: 'dailyroutine',
    title: 'DailyRoutine (Executive Task Sequencing)',
    category: 'Executive',
    durationText: '4 mins',
    description: 'Arrange shuffled vital daily self-care tasks (morning medication, masala chai, watering plants) in step-by-step order.',
    isFavorite: true,
    icon: 'checklist',
    color: '#0284C7',
    highScore: 260,
    timesPlayed: 9,
    level: 2,
    maxLevel: 5,
    xp: 50,
    xpToNextLevel: 100,
    stars: 2,
    badge: 'Executive Flow',
    isCoreGame: true,
  },
  {
    id: 'clock-planner',
    title: 'TimeSense (Clock & Routine Dial)',
    category: 'Planning',
    durationText: '4 mins',
    description: 'Interactive clock face dialing and medicine routine time scheduling with senior-friendly high contrast dial.',
    isFavorite: false,
    icon: 'schedule',
    color: '#002045',
    highScore: 290,
    timesPlayed: 15,
    level: 2,
    maxLevel: 3,
    xp: 70,
    xpToNextLevel: 100,
    stars: 2,
    badge: 'Time Routine',
  },
  {
    id: 'shape-sorter',
    title: 'Shape Sorter (Pattern & Geometry)',
    category: 'Attention',
    durationText: '4 mins',
    description: 'Working memory sequence recall, odd-one-out matrix puzzles, and tactile color tray sorting for visual discrimination.',
    isFavorite: true,
    icon: 'category',
    color: '#002045',
    highScore: 280,
    timesPlayed: 15,
    level: 1,
    maxLevel: 3,
    xp: 60,
    xpToNextLevel: 100,
    stars: 2,
    badge: 'Shape Master',
  },
  {
    id: 'live-camera-spotter',
    title: 'Live Camera Spotter (Object Recognition)',
    category: 'Attention',
    durationText: '3 mins',
    description: 'Scan real-world physical surroundings with camera to identify daily items like books, tea cups, or glasses.',
    isFavorite: false,
    icon: 'photo_camera',
    color: '#EA580C',
    highScore: 240,
    timesPlayed: 6,
    level: 1,
    maxLevel: 3,
    xp: 40,
    xpToNextLevel: 100,
    stars: 2,
    badge: 'AI Vision',
  },
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew-1',
    title: 'Custom Family Photo Album Book',
    category: 'Reminiscence',
    cost: 300,
    description: 'A glossy 20-page printed keepsake album delivered to your doorstep featuring annotated family memories.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
    isClaimed: false,
  },
  {
    id: 'rew-2',
    title: 'Ayurvedic Herbal Tulsi & Ginger Tea Set',
    category: 'Wellness',
    cost: 180,
    description: 'Delightful soothing tin of organic Rama & Krishna Tulsi leaves with dried sun ginger for relaxing evenings.',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',
    isClaimed: false,
  },
  {
    id: 'rew-3',
    title: 'Handcrafted Wooden Mind Maze Puzzle',
    category: 'Stimulation',
    cost: 220,
    description: 'Tactile rosewood handheld labyrinth puzzle to improve fine finger dexterity and calm contemplation.',
    imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400',
    isClaimed: false,
  },
  {
    id: 'rew-4',
    title: 'Classical Indian Santoor & Flute Music Pass',
    category: 'Relaxation',
    cost: 150,
    description: 'Unlimited 3-month ad-free streaming pass to morning Bhairav and evening Yaman ragas curated for seniors.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    isClaimed: true,
    claimedAt: '2 days ago',
    claimCode: 'RAGA-SM-892',
  },
];

export const INITIAL_USER: UserProfile = {
  id: 'user_asha_devi',
  name: 'Asha Devi',
  age: 72,
  stage: 'Mild Cognitive Impairment (Early)',
  dailyStreak: 4,
  totalMindPoints: 240,
  avatarUrl: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=500&auto=format&fit=crop&q=80',
  homeLocation: {
    label: 'Home Sweet Home',
    city: 'New Delhi',
    area: 'Saket, South Delhi',
    latitude: 28.5244,
    longitude: 77.2167,
    safeRadiusMeters: 500,
  },
  caregiverName: 'Rohan Sharma (Son)',
  caregiverPhone: '+91 98112 34567',
  preferences: {
    largeText: false,
    voiceAssistance: true,
    fontSize: 'large',
    highContrast: false,
    soundEffects: true,
    reminders: true,
  },
  totalSessions: 28,
  longestStreak: 12,
  dailyGoalCompleted: false,
};

const STORAGE_KEY = 'smritisaathi_db_v2';

type Listener = (db: AppDatabase) => void;

class StoreService {
  private database: AppDatabase;
  private listeners: Set<Listener> = new Set();
  private cloudSyncTimer: any = null;

  constructor() {
    this.database = this.loadDatabase();
    this.initCloudSync();
  }

  private async initCloudSync() {
    try {
      if (!auth.currentUser) {
        return;
      }
      const cloudData = await firestoreSyncService.loadInitialData();
      let updated = false;

      if (cloudData.profile && Object.keys(cloudData.profile).length > 0) {
        this.database.user = {
          ...this.database.user,
          ...cloudData.profile,
          preferences: {
            ...this.database.user.preferences,
            ...(cloudData.profile.preferences || {}),
          },
        };
        updated = true;
      }

      if (cloudData.progress) {
        this.database.progress = {
          ...this.database.progress,
          ...cloudData.progress,
        };
        updated = true;
      }

      if (cloudData.careCompass?.config) {
        if (!this.database.careCompass) {
          this.database.careCompass = {
            config: INITIAL_CARE_COMPASS_CONFIG,
            telemetry: INITIAL_CARE_COMPASS_TELEMETRY,
            alertLogs: INITIAL_ALERT_LOGS,
            memories: INITIAL_FAMILY_MEMORIES,
          };
        }
        this.database.careCompass.config = {
          ...this.database.careCompass.config,
          ...cloudData.careCompass.config,
        };
        updated = true;
      }

      if (cloudData.activities && cloudData.activities.length > 0) {
        const existingIds = new Set(this.database.activities.map((a) => a.id));
        const newActivities = cloudData.activities.filter((a) => !existingIds.has(a.id));
        if (newActivities.length > 0) {
          this.database.activities = [...newActivities, ...this.database.activities].slice(0, 40);
          updated = true;
        }
      }

      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
        this.notifyListeners();
      }
    } catch (err) {
      console.warn('Initial cloud sync notice:', err);
    }
  }

  private loadDatabase(): AppDatabase {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist
        if (parsed.user && parsed.familyMembers && parsed.gameProgresses) {
          // Update avatar to elderly woman if previous default was present
          if (
            !parsed.user.avatarUrl ||
            parsed.user.avatarUrl.includes('photo-1544005313-94ddf0286df2') ||
            parsed.user.avatarUrl.includes('googleusercontent.com')
          ) {
            parsed.user.avatarUrl = INITIAL_USER.avatarUrl;
          }
          // Merge in any games from INITIAL_GAMES that may not be in parsed.games
          if (Array.isArray(parsed.games)) {
            INITIAL_GAMES.forEach((initG) => {
              if (!parsed.games.some((g: GameInfo) => g.id === initG.id)) {
                parsed.games.push(initG);
              }
            });
          }
          if (!parsed.gameProgresses['shape-sorter']) {
            parsed.gameProgresses['shape-sorter'] = {
              gameId: 'shape-sorter',
              currentLevel: 1,
              highestScore: 280,
              totalPlayed: 15,
              totalTimeSeconds: 1200,
              consecutiveFails: 0,
              consecutiveSuccesses: 3,
              activeBridge: {
                status: 'idle',
                difficulty: 'standard',
                visualCluesEnabled: false,
                extraTimeEnabled: false,
                reductionFactor: 1,
              },
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local database, initializing fresh seed data', e);
    }
    return this.createSeedDatabase();
  }

  private createSeedDatabase(): AppDatabase {
    const gameProgresses: Record<string, GameProgress> = {
      'shape-sorter': {
        gameId: 'shape-sorter',
        currentLevel: 1,
        highestScore: 280,
        totalPlayed: 15,
        totalTimeSeconds: 1200,
        consecutiveFails: 0,
        consecutiveSuccesses: 3,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      },
      wayback: {
        gameId: 'wayback',
        currentLevel: 2,
        highestScore: 280,
        totalPlayed: 8,
        totalTimeSeconds: 1240,
        consecutiveFails: 0,
        consecutiveSuccesses: 2,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      },
      lifethread: {
        gameId: 'lifethread',
        currentLevel: 2,
        highestScore: 320,
        totalPlayed: 12,
        totalTimeSeconds: 1680,
        consecutiveFails: 0,
        consecutiveSuccesses: 3,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      },
      facebond: {
        gameId: 'facebond',
        currentLevel: 2,
        highestScore: 300,
        totalPlayed: 14,
        totalTimeSeconds: 1520,
        consecutiveFails: 0,
        consecutiveSuccesses: 2,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      },
      realityquest: {
        gameId: 'realityquest',
        currentLevel: 2,
        highestScore: 340,
        totalPlayed: 18,
        totalTimeSeconds: 2100,
        consecutiveFails: 0,
        consecutiveSuccesses: 4,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      },
      dailyroutine: {
        gameId: 'dailyroutine',
        currentLevel: 2,
        highestScore: 260,
        totalPlayed: 9,
        totalTimeSeconds: 980,
        consecutiveFails: 0,
        consecutiveSuccesses: 2,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      },
    };

    const locationChecks: LocationCheckRecord[] = [
      {
        id: 'loc-1',
        timestamp: 'Today, 09:15 AM',
        latitude: 28.5248,
        longitude: 77.2171,
        locationName: 'Saket Community Park (Near Home)',
        accuracy: 12,
        distanceToHomeKm: 0.15,
        bearingToHomeText: 'South-West (SW)',
        score: 100,
        totalQuestions: 4,
        correctAnswers: 4,
        passed: true,
        isInsideSafeZone: true,
        notes: 'Confident return bearing identification',
      },
      {
        id: 'loc-2',
        timestamp: 'Yesterday, 05:40 PM',
        latitude: 28.5270,
        longitude: 77.2195,
        locationName: 'Saket J-Block Market',
        accuracy: 18,
        distanceToHomeKm: 0.42,
        bearingToHomeText: 'South-West (SW)',
        score: 75,
        totalQuestions: 4,
        correctAnswers: 3,
        passed: true,
        isInsideSafeZone: true,
        notes: 'Identified home direction after 1 hint',
      },
      {
        id: 'loc-3',
        timestamp: '3 days ago',
        latitude: 28.5244,
        longitude: 77.2167,
        locationName: 'Home Sweet Home',
        accuracy: 8,
        distanceToHomeKm: 0.02,
        bearingToHomeText: 'At Anchor',
        score: 100,
        totalQuestions: 4,
        correctAnswers: 4,
        passed: true,
        isInsideSafeZone: true,
        notes: 'Base anchor calibration test',
      },
    ];

    const activities: ActivityItem[] = [
      {
        id: 'act-1',
        title: 'WayBack (Neighborhood Walk)',
        category: 'Spatial',
        points: 40,
        timestamp: 'Today, 10:15 AM',
        icon: 'navigation',
        durationMinutes: 4,
        accuracy: 95,
        notes: 'Recalled temple route landmarks flawlessly',
        gameId: 'wayback',
      },
      {
        id: 'act-2',
        title: 'FaceBond (Family Kinship)',
        category: 'Memory',
        points: 45,
        timestamp: 'Today, 09:30 AM',
        icon: 'face',
        durationMinutes: 4,
        accuracy: 100,
        notes: 'Recognized Rohan, Ananya, and Dr. Rajesh with zero errors',
        gameId: 'facebond',
      },
      {
        id: 'act-3',
        title: 'DailyRoutine (Morning Medicine & Chai)',
        category: 'Executive',
        points: 35,
        timestamp: 'Yesterday, 04:20 PM',
        icon: 'checklist',
        durationMinutes: 3,
        accuracy: 100,
        notes: 'Sequenced medication check and tea boiling',
        gameId: 'dailyroutine',
      },
      {
        id: 'act-4',
        title: 'LifeThread (1970s Milestones)',
        category: 'Memory',
        points: 50,
        timestamp: 'Yesterday, 11:00 AM',
        icon: 'timeline',
        durationMinutes: 5,
        accuracy: 90,
        notes: 'Chronological life reconstruction with college graduation',
        gameId: 'lifethread',
      },
      {
        id: 'act-5',
        title: 'RealityQuest (Morning Orientation)',
        category: 'Planning',
        points: 70,
        timestamp: '2 days ago',
        icon: 'explore',
        durationMinutes: 5,
        accuracy: 100,
        notes: 'Sensory and temporal anchoring confirmed',
        gameId: 'realityquest',
      },
    ];

    const domainScores: CognitiveDomainScores = {
      memoryRecall: 86,
      spatialOrientation: 82,
      sensoryReality: 90,
      executiveFunction: 78,
      overallStabilityIndex: 84,
      trend: 'improving',
    };

    const progress: CognitiveProgress = {
      memory: 86,
      attention: 80,
      planning: 78,
      spatial: 82,
      lastUpdated: new Date().toISOString(),
    };

    return {
      user: INITIAL_USER,
      familyMembers: DEMO_FAMILY_MEMBERS,
      gameProgresses,
      locationChecks,
      domainScores,
      progress,
      activities,
      games: INITIAL_GAMES,
      rewards: INITIAL_REWARDS,
      realityQuests: {
        todayCompleted: false,
        completedDate: null,
        questions: [],
      },
      careCompass: {
        config: INITIAL_CARE_COMPASS_CONFIG,
        telemetry: INITIAL_CARE_COMPASS_TELEMETRY,
        alertLogs: INITIAL_ALERT_LOGS,
        memories: INITIAL_FAMILY_MEMORIES,
      },
    };
  }

  public getCareCompassConfig(): CareCompassConfig {
    if (!this.database.careCompass?.config) {
      this.database.careCompass = {
        config: INITIAL_CARE_COMPASS_CONFIG,
        telemetry: INITIAL_CARE_COMPASS_TELEMETRY,
        alertLogs: INITIAL_ALERT_LOGS,
        memories: INITIAL_FAMILY_MEMORIES,
      };
      this.saveDatabase();
    } else {
      // Migrate away from legacy hardcoded Guwahati if user hasn't explicitly customized home
      const cfg = this.database.careCompass.config;
      const isLegacyGuwahati =
        cfg.homeLocation &&
        Math.abs(cfg.homeLocation.latitude - 26.1445) < 0.02 &&
        Math.abs(cfg.homeLocation.longitude - 91.7362) < 0.02;
      const hasCustomFlag =
        typeof window !== 'undefined' &&
        localStorage.getItem('cc_custom_home_set') === 'true';

      if (isLegacyGuwahati && !hasCustomFlag) {
        cfg.homeLocation = getInitialHomeLocation();
        this.saveDatabase();
      }
    }
    return this.database.careCompass.config;
  }

  public updateCareCompassConfig(updates: Partial<CareCompassConfig>): CareCompassConfig {
    const current = this.getCareCompassConfig();
    this.database.careCompass!.config = { ...current, ...updates };
    this.saveDatabase();
    return this.database.careCompass!.config;
  }

  public getCareCompassTelemetry(): CareCompassTelemetry {
    if (!this.database.careCompass?.telemetry) {
      this.database.careCompass = {
        config: INITIAL_CARE_COMPASS_CONFIG,
        telemetry: INITIAL_CARE_COMPASS_TELEMETRY,
        alertLogs: INITIAL_ALERT_LOGS,
        memories: INITIAL_FAMILY_MEMORIES,
      };
      this.saveDatabase();
    }
    return this.database.careCompass.telemetry;
  }

  public updateCareCompassTelemetry(updates: Partial<CareCompassTelemetry>): CareCompassTelemetry {
    const current = this.getCareCompassTelemetry();
    this.database.careCompass!.telemetry = { ...current, ...updates };
    this.saveDatabase();
    return this.database.careCompass!.telemetry;
  }

  public getAlertLogs(): AlertLogEntry[] {
    if (!this.database.careCompass?.alertLogs) {
      return INITIAL_ALERT_LOGS;
    }
    return this.database.careCompass.alertLogs;
  }

  public addAlertLog(entry: Omit<AlertLogEntry, 'id' | 'timestamp'>): AlertLogEntry {
    const newLog: AlertLogEntry = {
      ...entry,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    if (!this.database.careCompass) {
      this.database.careCompass = {
        config: INITIAL_CARE_COMPASS_CONFIG,
        telemetry: INITIAL_CARE_COMPASS_TELEMETRY,
        alertLogs: [],
        memories: INITIAL_FAMILY_MEMORIES,
      };
    }
    if (!this.database.careCompass.alertLogs) {
      this.database.careCompass.alertLogs = [];
    }
    this.database.careCompass.alertLogs.unshift(newLog);
    if (this.database.careCompass.alertLogs.length > 50) {
      this.database.careCompass.alertLogs.pop();
    }
    if (auth.currentUser) {
      firestoreSyncService.logAlert(newLog);
    }
    this.saveDatabase();
    return newLog;
  }

  public acknowledgeAlertLog(id: string): void {
    if (this.database.careCompass?.alertLogs) {
      const target = this.database.careCompass.alertLogs.find((l) => l.id === id);
      if (target) {
        target.acknowledged = true;
        this.saveDatabase();
      }
    }
  }

  public getFamilyMemories(): any[] {
    return this.database.careCompass?.memories || INITIAL_FAMILY_MEMORIES;
  }

  private saveDatabase() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
      this.notifyListeners();

      // Debounced Cloud Sync to Firestore (active when authenticated)
      if (this.cloudSyncTimer) {
        clearTimeout(this.cloudSyncTimer);
      }
      if (auth.currentUser) {
        this.cloudSyncTimer = setTimeout(() => {
          try {
            firestoreSyncService.saveUserProfile(this.database.user);
            firestoreSyncService.saveCognitiveProgress(this.database.progress);
            if (this.database.careCompass) {
              firestoreSyncService.syncCareCompassData(
                this.database.careCompass.config,
                this.database.careCompass.telemetry
              );
            }
          } catch (syncErr) {
            console.warn('Background Firestore sync caught:', syncErr);
          }
        }, 1200);
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.database);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.database);
      } catch (e) {
        console.error('Error in store listener:', e);
      }
    });
  }

  public getDatabase(): AppDatabase {
    return this.database;
  }

  public getUser(): UserProfile {
    return this.database.user;
  }

  public updateUser(updates: Partial<UserProfile>): UserProfile {
    this.database.user = {
      ...this.database.user,
      ...updates,
      preferences: {
        ...this.database.user.preferences,
        ...(updates.preferences || {}),
      },
      homeLocation: {
        ...this.database.user.homeLocation,
        ...(updates.homeLocation || {}),
      },
    };
    this.saveDatabase();
    return this.database.user;
  }

  public updateProgress(updates: Partial<CognitiveProgress>): CognitiveProgress {
    this.database.progress = {
      ...this.database.progress,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.database.progress;
  }

  public async handleAuthChange(authUser: any) {
    if (authUser && !authUser.isAnonymous) {
      // User is authenticated with Google
      const current = this.database.user;
      this.database.user = {
        ...current,
        name: authUser.displayName || current.name || 'Google User',
        email: authUser.email || current.email,
        avatarUrl: authUser.photoURL || current.avatarUrl,
        isGoogleLinked: true,
      };
      await this.initCloudSync();
      firestoreSyncService.saveUserProfile(this.database.user);
      this.saveDatabase();
    } else {
      if (this.database.user.isGoogleLinked) {
        this.database.user.isGoogleLinked = false;
        this.saveDatabase();
      }
    }
  }

  public toggleLargeText(): boolean {
    const next = !this.database.user.preferences.largeText;
    this.database.user.preferences.largeText = next;
    this.saveDatabase();
    return next;
  }

  public toggleVoiceAssistance(): boolean {
    const next = !this.database.user.preferences.voiceAssistance;
    this.database.user.preferences.voiceAssistance = next;
    this.saveDatabase();
    return next;
  }

  public getFamilyMembers(): FamilyMember[] {
    return this.database.familyMembers;
  }

  public addFamilyMember(member: Omit<FamilyMember, 'id'>): FamilyMember {
    const newMember: FamilyMember = {
      ...member,
      id: `fm-${Date.now()}`,
    };
    this.database.familyMembers.push(newMember);
    this.saveDatabase();
    return newMember;
  }

  public updateFamilyMember(id: string, updates: Partial<FamilyMember>): FamilyMember | null {
    const idx = this.database.familyMembers.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.database.familyMembers[idx] = {
      ...this.database.familyMembers[idx],
      ...updates,
    };
    this.saveDatabase();
    return this.database.familyMembers[idx];
  }

  public deleteFamilyMember(id: string): boolean {
    const before = this.database.familyMembers.length;
    this.database.familyMembers = this.database.familyMembers.filter((m) => m.id !== id);
    if (this.database.familyMembers.length !== before) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getGameProgress(gameId: string): GameProgress {
    if (!this.database.gameProgresses[gameId]) {
      this.database.gameProgresses[gameId] = {
        gameId,
        currentLevel: 1,
        highestScore: 0,
        totalPlayed: 0,
        totalTimeSeconds: 0,
        consecutiveFails: 0,
        consecutiveSuccesses: 0,
        activeBridge: {
          status: 'idle',
          difficulty: 'standard',
          visualCluesEnabled: false,
          extraTimeEnabled: false,
          reductionFactor: 1,
        },
      };
      this.saveDatabase();
    }
    return this.database.gameProgresses[gameId];
  }

  /**
   * Cognitive Bridge Engine:
   * Analyzes the last 3 game attempts for the selected game type.
   * If average score < 60% or player fails twice consecutively:
   *  - Activate Bridge Mode (extra guidance, extended study time +50%, eliminate 1 distractor, audible hints).
   * If average score > 85%:
   *  - Deactivate Bridge, advance to next Level (up to Level 5), and award bonus +50 Mind Points.
   */
  public recordGameResult(payload: {
    gameId: string;
    score: number; // 0 - 100
    pointsEarned: number;
    accuracy: number; // 0 - 100
    durationMinutes: number;
    category: string;
    title: string;
    notes?: string;
  }): {
    success: boolean;
    leveledUp: boolean;
    newLevel: number;
    bridgeActive: boolean;
    bridgeReason?: string;
    totalMindPoints: number;
    bonusAwarded: number;
  } {
    const { gameId, score, pointsEarned, accuracy, durationMinutes, category, title, notes } = payload;
    const progress = this.getGameProgress(gameId);

    progress.totalPlayed += 1;
    progress.totalTimeSeconds += Math.round(durationMinutes * 60);
    if (score > progress.highestScore) {
      progress.highestScore = score;
    }
    progress.lastPlayed = new Date().toISOString();

    const isSuccess = score >= 60;
    let leveledUp = false;
    let bonusAwarded = 0;

    if (isSuccess) {
      progress.consecutiveSuccesses += 1;
      progress.consecutiveFails = 0;
    } else {
      progress.consecutiveFails += 1;
      progress.consecutiveSuccesses = 0;
    }

    // Check Cognitive Bridge Adaptation Rule
    let bridgeActive = progress.activeBridge.status === 'active';
    let bridgeReason: string | undefined = undefined;

    if (!isSuccess || progress.consecutiveFails >= 2 || score < 60) {
      progress.activeBridge = {
        status: 'active',
        difficulty: 'easy',
        visualCluesEnabled: true,
        extraTimeEnabled: true,
        reductionFactor: 0.75,
        reason: 'Extra guidance & visual cues enabled to ease memory recall',
      };
      bridgeActive = true;
      bridgeReason = 'Cognitive Bridge Activated: Gentle step-by-step clues & extended time enabled.';
    } else if (score >= 85) {
      // High score -> Deactivate bridge and level up if eligible
      progress.activeBridge = {
        status: 'idle',
        difficulty: 'standard',
        visualCluesEnabled: false,
        extraTimeEnabled: false,
        reductionFactor: 1,
      };
      bridgeActive = false;

      if (progress.currentLevel < 5) {
        progress.currentLevel += 1;
        leveledUp = true;
        bonusAwarded += 50; // +50 bonus Mind Points for mastering level
      }
    }

    // Award Mind Points
    const totalPointsToAdd = pointsEarned + bonusAwarded;
    this.database.user.totalMindPoints = (this.database.user.totalMindPoints || 0) + totalPointsToAdd;
    this.database.user.totalSessions = (this.database.user.totalSessions || 0) + 1;

    // Log Activity
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      category: category as any,
      points: totalPointsToAdd,
      timestamp: 'Just now',
      icon:
        gameId === 'wayback'
          ? 'navigation'
          : gameId === 'lifethread'
          ? 'timeline'
          : gameId === 'facebond'
          ? 'face'
          : gameId === 'dailyroutine'
          ? 'checklist'
          : 'psychology',
      durationMinutes,
      accuracy,
      notes: notes || (leveledUp ? `Mastered level! Advanced to Level ${progress.currentLevel}` : undefined),
      gameId,
    };
    this.database.activities.unshift(newActivity);
    if (this.database.activities.length > 40) {
      this.database.activities.pop();
    }
    firestoreSyncService.recordActivity(newActivity);

    // Update Game card info if matching
    const gameCard = this.database.games.find((g) => g.id === gameId);
    if (gameCard) {
      gameCard.level = progress.currentLevel;
      gameCard.highScore = progress.highestScore;
      gameCard.timesPlayed = progress.totalPlayed;
      gameCard.xp = Math.min(100, gameCard.xp + 25);
    }

    // Recalculate Cognitive Domain Scores
    this.recalculateDomainScores();

    this.saveDatabase();

    return {
      success: true,
      leveledUp,
      newLevel: progress.currentLevel,
      bridgeActive,
      bridgeReason,
      totalMindPoints: this.database.user.totalMindPoints,
      bonusAwarded,
    };
  }

  public addLocationCheck(record: Omit<LocationCheckRecord, 'id' | 'timestamp'>): LocationCheckRecord {
    const newRecord: LocationCheckRecord = {
      ...record,
      id: `loc-${Date.now()}`,
      timestamp: 'Just now',
    };
    this.database.locationChecks.unshift(newRecord);
    if (this.database.locationChecks.length > 25) {
      this.database.locationChecks.pop();
    }

    // Also update user mind points for GPS check
    this.database.user.totalMindPoints = (this.database.user.totalMindPoints || 0) + 30;

    // Log activity
    this.database.activities.unshift({
      id: `act-${Date.now()}`,
      title: 'Real-Time GPS & Compass Orientation',
      category: 'Spatial',
      points: 30,
      timestamp: 'Just now',
      icon: 'my_location',
      durationMinutes: 3,
      accuracy: Math.round((record.correctAnswers / record.totalQuestions) * 100),
      notes: `Location: ${record.locationName} (${record.isInsideSafeZone ? 'Inside Safe Zone' : 'Outside Safe Zone'})`,
      gameId: 'wayback',
    });

    this.recalculateDomainScores();
    this.saveDatabase();
    return newRecord;
  }

  private recalculateDomainScores() {
    const memoryActs = this.database.activities.filter((a) => a.gameId === 'lifethread' || a.gameId === 'facebond' || a.category === 'Memory');
    const spatialActs = this.database.activities.filter((a) => a.gameId === 'wayback' || a.category === 'Spatial');
    const sensoryActs = this.database.activities.filter((a) => a.gameId === 'realityquest' || a.category === 'Planning');
    const execActs = this.database.activities.filter((a) => a.gameId === 'dailyroutine' || a.category === 'Executive');

    const getAvg = (acts: ActivityItem[], fallback: number) => {
      if (acts.length === 0) return fallback;
      const sum = acts.slice(0, 5).reduce((acc, curr) => acc + (curr.accuracy ?? 85), 0);
      return Math.round(sum / Math.min(5, acts.length));
    };

    const memoryScore = getAvg(memoryActs, 86);
    const spatialScore = getAvg(spatialActs, 82);
    const sensoryScore = getAvg(sensoryActs, 90);
    const execScore = getAvg(execActs, 78);

    const overall = Math.round((memoryScore + spatialScore + sensoryScore + execScore) / 4);

    this.database.domainScores = {
      memoryRecall: memoryScore,
      spatialOrientation: spatialScore,
      sensoryReality: sensoryScore,
      executiveFunction: execScore,
      overallStabilityIndex: overall,
      trend: overall >= 80 ? 'improving' : overall >= 65 ? 'stable' : 'needs-attention',
    };

    this.database.progress = {
      memory: memoryScore,
      attention: sensoryScore,
      planning: execScore,
      spatial: spatialScore,
      lastUpdated: new Date().toISOString(),
    };
  }

  public getCognitiveDomainScores(): CognitiveDomainScores {
    return this.database.domainScores;
  }

  public getAllGameProgress(): Record<string, GameProgress> {
    return this.database.gameProgresses;
  }

  public getActivityLogs(): any[] {
    return this.database.activities;
  }

  public getLocationHistory(): LocationCheckRecord[] {
    return this.database.locationChecks || [];
  }

  public setBridgeConfig(gameId: string, updates: Partial<GameProgress['activeBridge']>) {
    const progress = this.getGameProgress(gameId);
    progress.activeBridge = {
      ...progress.activeBridge,
      ...updates,
    };
    this.saveDatabase();
  }

  public toggleBridgeStatus(gameId: string, active?: boolean) {
    const progress = this.getGameProgress(gameId);
    const targetState = active !== undefined ? active : progress.activeBridge.status !== 'active';
    progress.activeBridge.status = targetState ? 'active' : 'idle';
    if (targetState) {
      progress.activeBridge.visualCluesEnabled = true;
      progress.activeBridge.extraTimeEnabled = true;
      progress.activeBridge.difficulty = 'easy';
      progress.activeBridge.reductionFactor = 0.75;
      progress.activeBridge.reason = 'Manual caregiver activation';
    } else {
      progress.activeBridge.visualCluesEnabled = false;
      progress.activeBridge.extraTimeEnabled = false;
      progress.activeBridge.difficulty = 'standard';
      progress.activeBridge.reductionFactor = 1;
    }
    this.saveDatabase();
  }

  public toggleBridgeMode(gameId: string, active?: boolean) {
    this.toggleBridgeStatus(gameId, active);
  }

  public redeemReward(rewardId: string): { success: boolean; reward?: RewardItem; error?: string } {
    const reward = this.database.rewards.find((r) => r.id === rewardId);
    if (!reward) return { success: false, error: 'Reward not found' };
    if (reward.isClaimed) return { success: false, error: 'Already claimed' };
    if (this.database.user.totalMindPoints < reward.cost) {
      return { success: false, error: 'Insufficient Mind Points' };
    }

    this.database.user.totalMindPoints -= reward.cost;
    reward.isClaimed = true;
    reward.claimedAt = 'Just now';
    reward.claimCode = `SMRITI-${Math.floor(1000 + Math.random() * 9000)}`;

    this.saveDatabase();
    return { success: true, reward };
  }

  public resetToDefault(): AppDatabase {
    this.database = this.createSeedDatabase();
    this.saveDatabase();
    return this.database;
  }
}

export const storeService = new StoreService();
