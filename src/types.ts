export type Category = 'Memory' | 'Attention' | 'Planning' | 'Visual' | 'Spatial' | 'Executive';

export type GameId =
  | 'wayback'
  | 'lifethread'
  | 'facebond'
  | 'realityquest'
  | 'dailyroutine'
  | 'clock-planner'
  | 'name-that-face'
  | 'shape-sorter'
  | 'word-pair-recall'
  | 'live-camera-spotter';

export interface HomeLocation {
  label: string;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  safeRadiusMeters?: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  age: number;
  stage?: string;
  dailyStreak?: number;
  totalMindPoints?: number;
  mindPoints?: number; // legacy alias
  currentStreak?: number; // legacy alias
  avatarUrl: string;
  homeLocation?: HomeLocation;
  caregiverName: string;
  caregiverPhone: string;
  preferences: {
    largeText?: boolean;
    voiceAssistance?: boolean;
    voiceGuidance?: boolean; // legacy alias
    fontSize?: 'standard' | 'large' | 'extralarge';
    highContrast?: boolean;
    soundEffects?: boolean;
    reminders?: boolean;
  };
  totalSessions?: number;
  longestStreak?: number;
  dailyGoalCompleted?: boolean;
  email?: string;
  isGoogleLinked?: boolean;
}

export interface FamilyFaceItem {
  id: string;
  name: string;
  relation: string;
  imageUrl?: string;
  audioGreetingUrl?: string;
  notes?: string;
  hint?: string;
  funFact?: string;
}

export type ActivityLogItem = ActivityItem;

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  relationCategory: 'immediate' | 'extended' | 'friend';
  photoUrl: string;
  keyMemories: string[];
  voiceNote: string;
  phone?: string;
}

export interface ActiveBridgeConfig {
  status: 'idle' | 'active';
  difficulty: 'easy' | 'standard';
  visualCluesEnabled: boolean;
  extraTimeEnabled: boolean;
  reductionFactor: number;
  reason?: string;
}

export interface GameProgress {
  gameId: string;
  currentLevel: number; // 1 to 5
  highestScore: number;
  totalPlayed: number;
  totalTimeSeconds: number;
  consecutiveFails: number;
  consecutiveSuccesses: number;
  activeBridge: ActiveBridgeConfig;
  lastPlayed?: string;
  stars?: number;
  xp?: number;
}

export interface LocationCheckRecord {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName: string;
  accuracy: number; // in meters (±m)
  distanceToHomeKm: number;
  bearingToHomeText: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  isInsideSafeZone: boolean;
  notes?: string;
}

export interface CognitiveDomainScores {
  memoryRecall: number; // 0 - 100 (LifeThread + FaceBond)
  spatialOrientation: number; // 0 - 100 (WayBack + Real-time GPS)
  sensoryReality: number; // 0 - 100 (RealityQuest)
  executiveFunction: number; // 0 - 100 (DailyRoutine)
  overallStabilityIndex: number; // 0 - 100
  trend: 'improving' | 'stable' | 'needs-attention';
}

export interface CognitiveProgress {
  memory: number; // 0 - 100
  attention: number; // 0 - 100
  planning: number; // 0 - 100
  spatial?: number;
  lastUpdated: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: Category;
  points: number;
  timestamp: string;
  icon: string;
  durationMinutes: number;
  accuracy?: number;
  notes?: string;
  gameId?: string;
}

export interface GameInfo {
  id: string;
  title: string;
  category: Category;
  durationText: string;
  description: string;
  isFavorite: boolean;
  icon: string;
  color: string;
  highScore: number;
  timesPlayed: number;
  level: number;
  maxLevel: number;
  xp: number;
  xpToNextLevel: number;
  stars: number;
  badge?: string;
  isCoreGame?: boolean;
}

export interface RealityQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
}

export interface RewardItem {
  id: string;
  title: string;
  category: string;
  cost: number;
  description: string;
  imageUrl: string;
  isClaimed?: boolean;
  claimedAt?: string;
  claimCode?: string;
}

export interface CameraIdentifyResult {
  identifiedObject: string;
  isTargetMatch: boolean;
  confidenceScore: number;
  friendlyDescription: string;
  memoryPrompt: string;
  funCognitiveFact?: string;
  source: 'gemini' | 'heuristic';
}

export type GeofenceZoneStatus = 'SAFE_ZONE' | 'WARNING_BORDER' | 'CRITICAL_BREACH';

export type MovementState = 'Stationary' | 'Walking' | 'Wandering' | 'Fall_Detected';

export interface AlertLogEntry {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  cause:
    | 'Geofence Breach'
    | 'Fall Detected'
    | 'Battery Low'
    | 'Manual SOS Pressed'
    | 'Sundowning Warning'
    | 'Routine Check-In'
    | 'Border Warning'
    | 'Direct Emergency Call';
  distanceMeters: number;
  latitude: number;
  longitude: number;
  notes: string;
  acknowledged?: boolean;
  whatsappDispatched?: boolean;
  automatedSmsDispatched?: boolean;
  directCallDialed?: boolean;
  dispatchId?: string;
  deliveryStatus?: 'DELIVERED' | 'TRANSMITTING' | 'CONNECTED';
  channel?: 'AUTOMATED_SMS_GATEWAY' | 'DIRECT_PHONE_DIAL' | 'WHATSAPP_RELAY';
}

export interface AutomatedSOSDispatchResult {
  success: boolean;
  dispatchId: string;
  timestamp: string;
  deliveryStatus: 'DELIVERED' | 'TRANSMITTING' | 'CONNECTED' | 'FAILED' | 'PENDING_CONFIGURATION';
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  carrierAck: string;
  services?: {
    whatsapp?: EmergencyServiceStatus;
    voiceCall?: EmergencyServiceStatus;
  };
}

export type EmergencyTriggerType = 'MANUAL_SOS' | 'GEOFENCE_EXIT';

export type EmergencyDeliveryStatus = 'DELIVERED' | 'QUEUED' | 'PENDING_CONFIGURATION' | 'FAILED';

export interface EmergencyServiceStatus {
  service: 'whatsapp' | 'voice_call';
  status: EmergencyDeliveryStatus;
  provider: 'twilio' | 'meta' | 'simulation_fallback';
  id?: string;
  error?: string;
  details?: string;
}

export interface EmergencySOSRequest {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  triggerType: EmergencyTriggerType;
  timestamp?: string;
  patientName?: string;
  caregiverPhone?: string;
  caregiverName?: string;
  distanceMeters?: number;
  batteryLevel?: number;
  homeLabel?: string;
  notes?: string;
}

export interface EmergencySOSResponse {
  success: boolean;
  dispatchId: string;
  timestamp: string;
  triggerType: EmergencyTriggerType;
  patientName: string;
  caregiverPhone: string;
  caregiverName: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    mapsUrl: string;
    hasAccurateGPS: boolean;
  };
  services: {
    whatsapp: EmergencyServiceStatus;
    voiceCall: EmergencyServiceStatus;
  };
  messageText: string;
  voicePromptText?: string;
  warning?: string;
}

export interface DirectCallSession {
  id: string;
  targetName: string;
  targetPhone: string;
  callType: 'caregiver' | 'helpline_112' | 'ambulance_108' | 'police_100';
  startedAt: string;
  status: 'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED';
}

export interface BreadcrumbPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  distanceMeters: number;
  status: GeofenceZoneStatus;
}

export interface CareCompassTelemetry {
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  bearingDegrees: number;
  bearingText: string;
  geofenceStatus: GeofenceZoneStatus;
  batteryLevel: number;
  isCharging: boolean;
  heartRateBpm: number;
  heartRateStatus: 'normal' | 'elevated' | 'distress';
  movementState: MovementState;
  isSundowningHours: boolean;
  sundowningRisk: 'low' | 'moderate' | 'high';
  lastUpdated: string;
  breadcrumbs: BreadcrumbPoint[];
  isRealtimeGps?: boolean;
  speedKmh?: number;
  detectedCity?: string;
}

export interface CareCompassConfig {
  patientName: string;
  patientHonorific: string;
  patientAge: number;
  caregiverName: string;
  caregiverPhone: string;
  homeLocation: {
    label: string;
    city: string;
    area: string;
    latitude: number;
    longitude: number;
  };
  safeRadiusMeters: number; // default 300
  alertRadiusMeters: number; // default 600
  preferredLanguage: string; // 'en-IN' | 'as-IN' | 'hi-IN' | 'bn-IN' | 'ta-IN' | 'te-IN' | 'mr-IN' | 'gu-IN' | 'kn-IN' | 'ml-IN' | 'pa-IN'
  autoSirenOnBreach: boolean;
  autoWhatsAppOnBreach: boolean;
  googleMapsApiKey?: string;
}

export interface MemoryCard {
  id: string;
  title: string;
  name: string;
  relation: string;
  imageUrl: string;
  description: string;
  audioVoiceNote: string;
  emotionalTag: string;
  year?: string;
  location?: string;
}

export interface AppDatabase {
  user: UserProfile;
  familyMembers?: FamilyMember[];
  familyFaces?: FamilyFaceItem[];
  gameProgresses?: Record<string, GameProgress>;
  locationChecks?: LocationCheckRecord[];
  domainScores?: CognitiveDomainScores;
  progress: CognitiveProgress;
  activities: ActivityItem[];
  games: GameInfo[];
  rewards: RewardItem[];
  realityQuests: {
    todayCompleted: boolean;
    completedDate: string | null;
    questions: RealityQuestion[];
  };
  careCompass?: {
    config: CareCompassConfig;
    telemetry: CareCompassTelemetry;
    alertLogs: AlertLogEntry[];
    memories: MemoryCard[];
  };
}
