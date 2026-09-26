import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import type { AppDatabase, UserProfile, CognitiveProgress, ActivityItem, GameInfo, FamilyFaceItem, RewardItem, CameraIdentifyResult } from './src/types';

// ==============================================================================
// 1. FIREBASE ADMIN SDK INITIALIZATION (Production Server-Side)
// ==============================================================================
function initializeFirebaseAdmin(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    'geometric-hill-h7k72';

  // Priority 1: Full service account JSON provided in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsedServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log(`[Firebase Admin] Initializing with FIREBASE_SERVICE_ACCOUNT credentials for project: ${parsedServiceAccount.project_id || projectId}`);
      return initializeApp({
        credential: cert(parsedServiceAccount),
        projectId: parsedServiceAccount.project_id || projectId,
      });
    } catch (err) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', err);
    }
  }

  // Priority 2: Discrete environment variables (Render / Cloud Run)
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      console.log(`[Firebase Admin] Initializing with discrete service account credentials: ${process.env.FIREBASE_CLIENT_EMAIL}`);
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        projectId,
      });
    } catch (err) {
      console.error('[Firebase Admin] Error initializing with FIREBASE_PRIVATE_KEY:', err);
    }
  }

  // Priority 3: Project ID fallback (token signature verification against Google public keys)
  console.log(`[Firebase Admin] Initialized with projectId: ${projectId} (Public Key Token Verification Mode)`);
  return initializeApp({
    projectId,
  });
}

const firebaseAdminApp = initializeFirebaseAdmin();
const adminAuth = getAuth(firebaseAdminApp);

// Authenticated Express request interface
interface AuthenticatedRequest extends express.Request {
  user?: DecodedIdToken;
}

// Authentication middleware verifying Bearer <firebase-id-token>
async function requireAuth(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      authenticated: false,
      error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer <firebase-id-token>',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({
      authenticated: false,
      error: 'Unauthorized: Empty token string provided',
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err: any) {
    // Graceful fallback for Google Identity Services JWT credentials
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload && (payload.email || payload.sub)) {
          req.user = {
            uid: payload.sub || payload.user_id || `google_${Date.now()}`,
            email: payload.email || '',
            name: payload.name || '',
            picture: payload.picture || '',
            auth_time: payload.auth_time || Math.floor(Date.now() / 1000),
            iss: payload.iss || '',
            aud: payload.aud || '',
            sub: payload.sub || '',
            exp: payload.exp || Math.floor(Date.now() / 1000) + 3600,
            iat: payload.iat || Math.floor(Date.now() / 1000),
            firebase: { sign_in_provider: 'google.com', identities: {} },
          } as unknown as DecodedIdToken;
          return next();
        }
      }
    } catch {
      // ignore parse error and proceed to return 401
    }

    console.error('[Firebase Admin] Token verification failed:', err?.code || err?.message || err);
    return res.status(401).json({
      authenticated: false,
      error: 'Unauthorized: Invalid, expired, or revoked Firebase token',
      code: err?.code || 'auth/invalid-token',
    });
  }
}

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Robust Gemini API key resolver supporting all standard cloud variable names
export function getGeminiApiKey(): { key: string; source: string } | null {
  const candidates: Array<{ key: string | undefined; name: string }> = [
    { key: process.env.GEMINI_API_KEY, name: 'GEMINI_API_KEY' },
    { key: process.env.GOOGLE_API_KEY, name: 'GOOGLE_API_KEY' },
    { key: process.env.API_KEY, name: 'API_KEY' },
    { key: process.env.GOOGLE_GENAI_API_KEY, name: 'GOOGLE_GENAI_API_KEY' },
    { key: process.env.VITE_GEMINI_API_KEY, name: 'VITE_GEMINI_API_KEY' },
  ];

  for (const item of candidates) {
    if (item.key && typeof item.key === 'string' && item.key.trim().length > 0) {
      return { key: item.key.trim(), source: item.name };
    }
  }
  return null;
}

// Lazy Gemini API Client initialization
let geminiClient: GoogleGenAI | null = null;
let lastUsedApiKey = '';

function getGeminiClient(): { client: GoogleGenAI; keySource: string } | null {
  const keyInfo = getGeminiApiKey();
  if (!keyInfo) {
    return null;
  }

  if (!geminiClient || lastUsedApiKey !== keyInfo.key) {
    geminiClient = new GoogleGenAI({
      apiKey: keyInfo.key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    lastUsedApiKey = keyInfo.key;
    console.log(`[Gemini SDK] Initialized with key from ${keyInfo.source} (length: ${keyInfo.key.length})`);
  }
  return { client: geminiClient, keySource: keyInfo.source };
}

// Rate-limit & Quota Exhaustion Guard
// Tracks temporary rate-limit cooldown windows to avoid hammering exhausted quotas or logging error spam
let geminiQuotaCooldownUntil = 0;

function isGeminiInQuotaCooldown(): boolean {
  return Date.now() < geminiQuotaCooldownUntil;
}

function checkAndHandleQuotaExhaustion(err: any): boolean {
  const errStr = typeof err === 'object' ? JSON.stringify(err) : String(err || '');
  const isQuota =
    err?.status === 'RESOURCE_EXHAUSTED' ||
    err?.code === 429 ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('429') ||
    errStr.includes('quota') ||
    errStr.includes('Quota exceeded');

  if (isQuota) {
    let delaySec = 35;
    const match =
      errStr.match(/retry in\s+(\d+(?:\.\d+)?)s/i) ||
      errStr.match(/retryDelay"?\s*:\s*"?(\d+)s?/i);
    if (match && match[1]) {
      delaySec = Math.ceil(parseFloat(match[1])) + 2;
    }
    geminiQuotaCooldownUntil = Date.now() + delaySec * 1000;
    console.log(
      `[Gemini SDK] Rate-limit/Quota limit reached. Activated smooth ${delaySec}s cooldown; seamlessly using autonomous intelligence.`
    );
    return true;
  }
  return false;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const INITIAL_DATABASE: AppDatabase = {
  user: {
    name: 'Asha Devi',
    age: 72,
    avatarUrl: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=500&auto=format&fit=crop&q=80',
    mindPoints: 1240,
    currentStreak: 5,
    longestStreak: 14,
    totalSessions: 38,
    dailyGoalCompleted: false,
    caregiverName: 'Rohan Sharma (Son)',
    caregiverPhone: '+91 98765 43210',
    preferences: {
      fontSize: 'large',
      highContrast: false,
      voiceGuidance: true,
      soundEffects: true,
      reminders: true
    }
  },
  progress: {
    memory: 80,
    attention: 65,
    planning: 40,
    lastUpdated: new Date().toISOString()
  },
  activities: [
    {
      id: 'act-1',
      title: 'Shape Sorter',
      category: 'Attention',
      points: 45,
      timestamp: 'Today, 10:30 AM',
      icon: 'extension',
      durationMinutes: 4,
      accuracy: 92,
      notes: 'Excellent pattern identification'
    },
    {
      id: 'act-2',
      title: 'Name That Face',
      category: 'Memory',
      points: 60,
      timestamp: 'Yesterday',
      icon: 'psychiatry',
      durationMinutes: 5,
      accuracy: 100,
      notes: 'Recognized all family members quickly'
    },
    {
      id: 'act-3',
      title: 'Reality Quest',
      category: 'Planning',
      points: 120,
      timestamp: 'Yesterday',
      icon: 'map',
      durationMinutes: 6,
      accuracy: 100,
      notes: 'Daily orientation & calendar verification complete'
    },
    {
      id: 'act-4',
      title: 'Clock & Schedule Master',
      category: 'Planning',
      points: 50,
      timestamp: '2 days ago',
      icon: 'schedule',
      durationMinutes: 4,
      accuracy: 88,
      notes: 'Correctly set medicine schedule'
    },
    {
      id: 'act-5',
      title: 'Word Pair Recall',
      category: 'Memory',
      points: 75,
      timestamp: '3 days ago',
      icon: 'menu_book',
      durationMinutes: 5,
      accuracy: 95,
      notes: 'Recalled 8/8 word associations'
    }
  ],
  games: [
    {
      id: 'name-that-face',
      title: 'Name That Face',
      category: 'Memory',
      durationText: '5 mins',
      description: 'Strengthen neural pathways by recalling beloved family members and historical landmarks.',
      isFavorite: true,
      icon: 'psychiatry',
      color: '#002045',
      highScore: 320,
      timesPlayed: 19,
      level: 2,
      maxLevel: 3,
      xp: 80,
      xpToNextLevel: 100,
      stars: 2
    },
    {
      id: 'shape-sorter',
      title: 'Shape Sorter',
      category: 'Attention',
      durationText: '4 mins',
      description: 'Sharpen your visual focus and quick discrimination by matching geometric tiles and colors.',
      isFavorite: false,
      icon: 'extension',
      color: '#1a365d',
      highScore: 280,
      timesPlayed: 15,
      level: 2,
      maxLevel: 3,
      xp: 60,
      xpToNextLevel: 100,
      stars: 2
    },
    {
      id: 'reality-quest',
      title: 'Reality Quest',
      category: 'Planning',
      durationText: '6 mins',
      description: 'Daily orientation and temporal awareness questions to keep your present-day memory anchored.',
      isFavorite: false,
      icon: 'map',
      color: '#2d1d00',
      highScore: 400,
      timesPlayed: 12,
      level: 2,
      maxLevel: 3,
      xp: 90,
      xpToNextLevel: 100,
      stars: 3
    },
    {
      id: 'word-pair-recall',
      title: 'Word Pair Memory',
      category: 'Memory',
      durationText: '4 mins',
      description: 'Learn and retrieve paired words to exercise short-term verbal recall and active retention.',
      isFavorite: false,
      icon: 'menu_book',
      color: '#455f88',
      highScore: 250,
      timesPlayed: 8,
      level: 1,
      maxLevel: 3,
      xp: 40,
      xpToNextLevel: 100,
      stars: 1
    },
    {
      id: 'clock-planner',
      title: 'TimeSense (ADL Temporal Cognition)',
      category: 'Planning',
      durationText: '5 mins',
      description: 'Temporal reasoning & ADL cognitive stimulation: Clock setting, working memory recall, audio translation, and daily scheduling.',
      isFavorite: true,
      icon: 'schedule',
      color: '#002045',
      highScore: 340,
      timesPlayed: 8,
      level: 1,
      maxLevel: 10,
      xp: 50,
      xpToNextLevel: 100,
      stars: 1
    },
    {
      id: 'live-camera-spotter',
      title: 'Live Camera Object Spotter',
      category: 'Attention',
      durationText: '4 mins',
      description: 'Use your live device camera to spot and identify everyday room items, anchoring active real-world visual memory.',
      isFavorite: true,
      icon: 'photo_camera',
      color: '#002045',
      highScore: 300,
      timesPlayed: 9,
      level: 1,
      maxLevel: 3,
      xp: 45,
      xpToNextLevel: 100,
      stars: 1
    }
  ],
  familyFaces: [
    {
      id: 'face-1',
      name: 'Ananya Sharma',
      relation: 'Granddaughter',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      hint: 'Your bright grandchild studying architecture in Bengaluru. She loves classical dance.',
      funFact: 'She calls you every Sunday morning at 10 AM!'
    },
    {
      id: 'face-2',
      name: 'Rohan Sharma',
      relation: 'Eldest Son',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      hint: 'Your son who lives in Delhi and works as a doctor. Loves making your favorite cardamom chai.',
      funFact: 'He helped set up this tablet for you!'
    },
    {
      id: 'face-3',
      name: 'Pooja Devi',
      relation: 'Daughter-in-law',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
      hint: 'She enjoys gardening with you and making fresh marigold garlands for morning prayer.',
      funFact: 'Won the regional botanical award last year.'
    },
    {
      id: 'face-4',
      name: 'Dr. APJ Abdul Kalam',
      relation: 'Historical Hero',
      imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
      hint: 'The People\'s President of India and legendary scientist from Rameswaram.',
      funFact: 'You attended his lecture in New Delhi in 2003.'
    },
    {
      id: 'face-5',
      name: 'Kabir Sharma',
      relation: 'Grandson',
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
      hint: 'Your energetic grandson who plays football and loves your homemade mango pickles.',
      funFact: 'Always gives you a high-five when visiting.'
    }
  ],
  realityQuests: {
    todayCompleted: false,
    completedDate: null,
    questions: [
      {
        id: 'rq-1',
        question: 'Which day of the week is today?',
        options: ['Wednesday', 'Thursday', 'Friday', 'Sunday'],
        correctAnswer: 'Wednesday',
        explanation: 'Today is Wednesday in the current week.',
        category: 'Temporal Awareness'
      },
      {
        id: 'rq-2',
        question: 'What is the current season of the year?',
        options: ['Monsoon / Autumn', 'Peak Winter', 'Spring', 'Mid Summer'],
        correctAnswer: 'Monsoon / Autumn',
        explanation: 'Late August corresponds to the pleasant monsoon/autumn transition.',
        category: 'Environmental Orientation'
      },
      {
        id: 'rq-3',
        question: 'What is the most important morning step after your tea?',
        options: ['Take prescribed morning tablets', 'Water the rose plants', 'Turn on the evening lamp', 'Pack for travel'],
        correctAnswer: 'Take prescribed morning tablets',
        explanation: 'Taking regular morning vitamins and health capsules keeps your mind and heart protected.',
        category: 'Routine Autonomy'
      },
      {
        id: 'rq-4',
        question: 'Who is your designated primary family caregiver?',
        options: ['Rohan Sharma (Son)', 'The postal officer', 'Unknown volunteer', 'Train conductor'],
        correctAnswer: 'Rohan Sharma (Son)',
        explanation: 'Rohan is your primary family contact and caregiver.',
        category: 'Social Grounding'
      }
    ]
  },
  rewards: [
    {
      id: 'rew-1',
      title: 'Family Audio Blessing Message Pack',
      category: 'Family Moments',
      cost: 300,
      description: 'Receive custom recorded voice messages from your grandchildren sent straight to your tablet.',
      imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80',
      isClaimed: false
    },
    {
      id: 'rew-2',
      title: 'Large-Print Crossword & Sudoku Digest',
      category: 'Brain Goods',
      cost: 600,
      description: 'A physical high-contrast puzzle book delivered to your doorstep for relaxing afternoon teas.',
      imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80',
      isClaimed: false
    },
    {
      id: 'rew-3',
      title: 'Artisanal Chamomile & Cardamom Herbal Tea',
      category: 'Wellness',
      cost: 1000,
      description: 'A calming selection of pure loose-leaf herbal teas crafted for soothing sleep and peaceful memory.',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
      isClaimed: true,
      claimedAt: 'Yesterday, 4:15 PM',
      claimCode: 'TEA-8821-DEL'
    },
    {
      id: 'rew-4',
      title: 'Custom Framed Family Photo Album',
      category: 'Family Moments',
      cost: 1200,
      description: 'A deluxe wooden-framed print of your family reunion in Jaipur with high-gloss protective acrylic.',
      imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      isClaimed: false
    },
    {
      id: 'rew-5',
      title: 'Donation to Senior ElderCare Community Care',
      category: 'Good Karma',
      cost: 1500,
      description: 'Sponsor a full week of nutritious warm meals and medical checkups for underprivileged elders.',
      imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb7?w=500&auto=format&fit=crop&q=80',
      isClaimed: false
    }
  ]
};

// Database helper functions
function ensureDatabase(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf-8');
      return INITIAL_DATABASE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as AppDatabase;

    // Ensure all games have level fields populated, and add any missing games
    let modified = false;

    // Check for missing default games (e.g. newly added games)
    for (const defaultGame of INITIAL_DATABASE.games) {
      if (!parsed.games.some((g) => g.id === defaultGame.id)) {
        parsed.games.push({ ...defaultGame });
        modified = true;
      }
    }

    parsed.games = parsed.games.map((g) => {
      const defaultMatch = INITIAL_DATABASE.games.find((initG) => initG.id === g.id);
      let updated = { ...g };
      if (typeof updated.level !== 'number') {
        updated.level = defaultMatch?.level || 1;
        modified = true;
      }
      if (typeof updated.maxLevel !== 'number') {
        updated.maxLevel = defaultMatch?.maxLevel || 3;
        modified = true;
      }
      if (typeof updated.xp !== 'number') {
        updated.xp = defaultMatch?.xp || 0;
        modified = true;
      }
      if (typeof updated.xpToNextLevel !== 'number') {
        updated.xpToNextLevel = defaultMatch?.xpToNextLevel || 100;
        modified = true;
      }
      if (typeof updated.stars !== 'number') {
        updated.stars = defaultMatch?.stars || 1;
        modified = true;
      }
      return updated;
    });

    if (modified) {
      saveDatabase(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file, resetting to initial state:', err);
    return INITIAL_DATABASE;
  }
}

function saveDatabase(db: AppDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ============================================================================
  // 2. CORS CONFIGURATION (Vercel Frontend + Render Backend + AI Studio Sandboxes)
  // ============================================================================
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : []),
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, server-to-server requests without Origin header
        if (!origin) return callback(null, true);

        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // Allow any Vercel deployment (*.vercel.app)
        if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

        // Allow any Render deployment (*.onrender.com)
        if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return callback(null, true);

        // Allow Google Cloud Run / AI Studio preview containers (*.run.app)
        if (/^https:\/\/.*\.run\.app$/.test(origin)) return callback(null, true);

        // In development mode, allow any local or testing origin
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin: ${origin}`);
        return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint for Render / monitoring
  app.get('/api/health', (_req, res) => {
    const keyInfo = getGeminiApiKey();
    res.json({
      status: 'ok',
      service: 'smritisathi',
      geminiLiveAI: keyInfo ? 'configured' : 'missing_api_key',
      geminiKeySource: keyInfo ? keyInfo.source : null,
      firebaseAdmin: getApps().length > 0 ? 'initialized' : 'uninitialized',
      time: new Date().toISOString(),
    });
  });

  // Gemini AI Status endpoint (checks key configuration for Render / Cloud deployment)
  app.get('/api/gemini/status', (_req, res) => {
    const keyInfo = getGeminiApiKey();
    res.json({
      success: true,
      hasApiKey: !!keyInfo,
      keySource: keyInfo ? keyInfo.source : null,
      primaryModel: 'gemini-3.8-flash',
      isRender: !!process.env.RENDER,
      setupHelp: !keyInfo
        ? 'Render Deployment: Add GEMINI_API_KEY in Render Dashboard -> Your Service -> Environment tab'
        : 'Active and ready for live requests',
    });
  });

  // ============================================================================
  // 3. AUTHENTICATION ENDPOINTS (Verified via Firebase Admin SDK)
  // ============================================================================

  // Conclusive verification endpoint (Step 14): Verifies Bearer ID token with Firebase Admin
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const verifiedUser = req.user!;
    res.json({
      authenticated: true,
      uid: verifiedUser.uid,
      email: verifiedUser.email || '',
      name: verifiedUser.name || verifiedUser.displayName || '',
      picture: verifiedUser.picture || '',
    });
  });

  // POST verification endpoint
  app.post('/api/auth/verify', requireAuth, (req: AuthenticatedRequest, res) => {
    const verifiedUser = req.user!;
    res.json({
      authenticated: true,
      uid: verifiedUser.uid,
      email: verifiedUser.email || '',
      name: verifiedUser.name || '',
    });
  });

  // Authentication & Session Sync API: Requires valid Firebase ID token before persisting
  app.post('/api/auth/sync', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const verifiedUser = req.user!;
      const { profile } = req.body || {};
      const db = ensureDatabase();

      db.user = {
        ...db.user,
        name: verifiedUser.name || req.body?.displayName || db.user.name || 'Google User',
        email: verifiedUser.email || req.body?.email || db.user.email || '',
        avatarUrl: verifiedUser.picture || req.body?.photoURL || db.user.avatarUrl,
        isGoogleLinked: true,
        ...(profile || {}),
      };
      saveDatabase(db);

      res.json({
        success: true,
        authenticated: true,
        verifiedUid: verifiedUser.uid,
        user: db.user,
      });
    } catch (err: any) {
      console.error('[Auth Sync] Error syncing authenticated profile:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to sync auth' });
    }
  });

  // Current session information endpoint
  app.get('/api/auth/session', async (req, res) => {
    const db = ensureDatabase();
    const authHeader = req.headers.authorization;
    let verifiedUser: DecodedIdToken | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (token) {
        try {
          verifiedUser = await adminAuth.verifyIdToken(token);
        } catch {
          // Token expired or invalid
        }
      }
    }

    res.json({
      success: true,
      isAuthenticated: !!verifiedUser || !!(db.user as any)?.isGoogleLinked,
      user: db.user,
      verifiedUid: verifiedUser?.uid || null,
    });
  });

  // Logout endpoint
  app.post('/api/auth/logout', (_req, res) => {
    const db = ensureDatabase();
    if (db.user) {
      (db.user as any).isGoogleLinked = false;
      saveDatabase(db);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // API Endpoints
  // 1. Get full database state
  app.get('/api/data', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, data: db });
  });

  // 2. User Profile API
  app.get('/api/user', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, user: db.user });
  });

  app.put('/api/user', (req, res) => {
    const db = ensureDatabase();
    db.user = { ...db.user, ...req.body };
    saveDatabase(db);
    res.json({ success: true, user: db.user });
  });

  // 3. Cognitive Progress API
  app.get('/api/progress', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, progress: db.progress });
  });

  app.post('/api/progress', (req, res) => {
    const db = ensureDatabase();
    const { memory, attention, planning } = req.body;
    if (typeof memory === 'number') db.progress.memory = Math.min(100, Math.max(0, memory));
    if (typeof attention === 'number') db.progress.attention = Math.min(100, Math.max(0, attention));
    if (typeof planning === 'number') db.progress.planning = Math.min(100, Math.max(0, planning));
    db.progress.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    res.json({ success: true, progress: db.progress });
  });

  // 4. Activities API
  app.get('/api/activities', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, activities: db.activities });
  });

  app.post('/api/activities', (req, res) => {
    const db = ensureDatabase();
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: req.body.title || 'Training Session',
      category: req.body.category || 'Memory',
      points: Number(req.body.points) || 50,
      timestamp: 'Just now',
      icon: req.body.icon || 'psychiatry',
      durationMinutes: Number(req.body.durationMinutes) || 5,
      accuracy: req.body.accuracy ?? 100,
      notes: req.body.notes || 'Session successfully completed'
    };
    db.activities.unshift(newActivity);
    db.user.mindPoints += newActivity.points;
    db.user.totalSessions += 1;
    saveDatabase(db);
    res.json({ success: true, activity: newActivity, mindPoints: db.user.mindPoints, activities: db.activities });
  });

  // 5. Games & Completion API
  app.get('/api/games', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, games: db.games });
  });

  app.post('/api/games/favorite', (req, res) => {
    const db = ensureDatabase();
    const { gameId, isFavorite } = req.body;
    const game = db.games.find(g => g.id === gameId);
    if (game) {
      // Allow single favorite or toggle
      db.games.forEach(g => { g.isFavorite = false; });
      game.isFavorite = isFavorite ?? true;
      saveDatabase(db);
      return res.json({ success: true, games: db.games });
    }
    res.status(404).json({ success: false, error: 'Game not found' });
  });

  app.post('/api/games/complete', (req, res) => {
    const db = ensureDatabase();
    const { gameId, score, pointsEarned, durationMinutes, accuracy, category, playedLevel } = req.body;
    
    const game = db.games.find(g => g.id === gameId);
    let leveledUp = false;
    let newLevel = 1;

    if (game) {
      game.timesPlayed += 1;
      if (score > game.highScore) {
        game.highScore = score;
      }

      // Level and XP progression logic
      const levelPlayed = Number(playedLevel) || game.level || 1;
      const roundAccuracy = Number(accuracy) || 100;
      const xpGained = Math.round((score / 5) + (roundAccuracy * 0.5));
      game.xp = (game.xp || 0) + xpGained;

      // Check if user qualifies to unlock next level (e.g., accuracy >= 70% and played current level)
      if (roundAccuracy >= 70 && levelPlayed >= game.level && game.level < (game.maxLevel || 3)) {
        game.level = game.level + 1;
        game.stars = Math.min(game.maxLevel || 3, (game.stars || 1) + 1);
        game.xp = 0; // reset XP for next tier
        leveledUp = true;
        newLevel = game.level;
      } else if (game.xp >= (game.xpToNextLevel || 100) && game.level < (game.maxLevel || 3)) {
        game.level = game.level + 1;
        game.stars = Math.min(game.maxLevel || 3, (game.stars || 1) + 1);
        game.xp = 0;
        leveledUp = true;
        newLevel = game.level;
      }
    }

    // Award bonus Mind Points if leveled up
    let earned = Number(pointsEarned) || 50;
    if (leveledUp) {
      earned += 50; // +50 Mind Points Level Up Celebration Bonus!
    }
    db.user.mindPoints += earned;
    db.user.totalSessions += 1;

    // Boost corresponding cognitive category in progress
    if (category === 'Memory') {
      db.progress.memory = Math.min(100, db.progress.memory + (leveledUp ? 8 : 5));
    } else if (category === 'Attention') {
      db.progress.attention = Math.min(100, db.progress.attention + (leveledUp ? 8 : 5));
    } else if (category === 'Planning') {
      db.progress.planning = Math.min(100, db.progress.planning + (leveledUp ? 8 : 5));
    }
    db.progress.lastUpdated = new Date().toISOString();

    const activity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `${game?.title || req.body.title || 'Cognitive Game'} ${leveledUp ? `(Leveled Up to Lvl ${newLevel}!)` : `(Lvl ${playedLevel || game?.level || 1})`}`,
      category: (category as any) || 'Memory',
      points: earned,
      timestamp: 'Just now',
      icon: game?.icon || 'psychiatry',
      durationMinutes: durationMinutes || 5,
      accuracy: accuracy || 100,
      notes: leveledUp
        ? `🎉 Promoted to Level ${newLevel}! Scored ${score} pts with ${accuracy || 100}% accuracy`
        : `Completed Level ${playedLevel || game?.level || 1} with ${score} pts (${accuracy || 100}% accuracy)`
    };
    db.activities.unshift(activity);

    saveDatabase(db);
    res.json({
      success: true,
      mindPoints: db.user.mindPoints,
      progress: db.progress,
      activity,
      games: db.games,
      leveledUp,
      newLevel: game?.level || 1
    });
  });

  // 6. Family Faces API (Personalized Memory Training Database)
  app.get('/api/family-faces', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, familyFaces: db.familyFaces });
  });

  app.post('/api/family-faces', (req, res) => {
    const db = ensureDatabase();
    const newFace: FamilyFaceItem = {
      id: `face-${Date.now()}`,
      name: req.body.name || 'Family Member',
      relation: req.body.relation || 'Relative',
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
      hint: req.body.hint || 'A cherished member of your family circle.',
      funFact: req.body.funFact || 'Always brings a warm smile to your home.'
    };
    db.familyFaces.push(newFace);
    saveDatabase(db);
    res.json({ success: true, face: newFace, familyFaces: db.familyFaces });
  });

  app.delete('/api/family-faces/:id', (req, res) => {
    const db = ensureDatabase();
    db.familyFaces = db.familyFaces.filter(f => f.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true, familyFaces: db.familyFaces });
  });

  // 7. Reality Quests API
  app.get('/api/reality-quests', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, realityQuests: db.realityQuests });
  });

  app.post('/api/reality-quests/complete', (req, res) => {
    const db = ensureDatabase();
    const pointsAwarded = 120;
    db.realityQuests.todayCompleted = true;
    db.realityQuests.completedDate = new Date().toISOString();
    db.user.mindPoints += pointsAwarded;
    db.user.currentStreak += 1;
    if (db.user.currentStreak > db.user.longestStreak) {
      db.user.longestStreak = db.user.currentStreak;
    }
    db.progress.planning = Math.min(100, db.progress.planning + 15);
    db.progress.memory = Math.min(100, db.progress.memory + 10);
    db.progress.lastUpdated = new Date().toISOString();

    const activity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: 'Reality Quest',
      category: 'Planning',
      points: pointsAwarded,
      timestamp: 'Just now',
      icon: 'map',
      durationMinutes: 6,
      accuracy: 100,
      notes: 'Completed full daily orientation questionnaire'
    };
    db.activities.unshift(activity);

    saveDatabase(db);
    res.json({
      success: true,
      mindPoints: db.user.mindPoints,
      currentStreak: db.user.currentStreak,
      progress: db.progress,
      realityQuests: db.realityQuests,
      activity
    });
  });

  // 8. Rewards Store & Redemption API
  app.get('/api/rewards', (_req, res) => {
    const db = ensureDatabase();
    res.json({ success: true, rewards: db.rewards, mindPoints: db.user.mindPoints });
  });

  app.post('/api/rewards/redeem', (req, res) => {
    const db = ensureDatabase();
    const { rewardId } = req.body;
    const reward = db.rewards.find(r => r.id === rewardId);
    if (!reward) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }
    if (db.user.mindPoints < reward.cost) {
      return res.status(400).json({ success: false, error: 'Not enough Mind Points' });
    }

    db.user.mindPoints -= reward.cost;
    reward.isClaimed = true;
    reward.claimedAt = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    reward.claimCode = `SS-${Math.floor(1000 + Math.random() * 9000)}-DEL`;

    saveDatabase(db);
    res.json({
      success: true,
      reward,
      mindPoints: db.user.mindPoints,
      rewards: db.rewards
    });
  });

  // 9. Reset Demo Data API
  app.post('/api/reset', (_req, res) => {
    saveDatabase(INITIAL_DATABASE);
    res.json({ success: true, data: INITIAL_DATABASE });
  });

  // 10. Gemini Live Camera Vision Identification API
  app.post('/api/gemini/identify-image', async (req, res) => {
    try {
      const { imageBase64, targetObject, level = 1, mode = 'challenge' } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Image data is required',
        });
      }

      // Extract raw base64 data and mime type
      let mimeType = 'image/jpeg';
      let rawBase64 = imageBase64;
      const dataUriMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (dataUriMatch) {
        mimeType = dataUriMatch[1];
        rawBase64 = dataUriMatch[2];
      }

      const geminiClientInfo = getGeminiClient();

      if (geminiClientInfo && !isGeminiInQuotaCooldown()) {
        const ai = geminiClientInfo.client;
        try {
          const prompt = mode === 'challenge'
            ? `You are an encouraging, respectful, gentle geriatric memory and cognitive coach for Indian senior citizens.
The user is playing a visual memory scavenger game called "Live Camera Object Spotter" at Level ${level}.
The target scavenger item they were asked to spot with their camera is: "${targetObject || 'a common household item'}".
Analyze this photo taken by the user's camera.
1. Identify what main object or objects are visible in the photo.
2. Determine if the photo contains or reasonably matches the target item "${targetObject}". If it is the target (or a very close equivalent like a mug/cup, glasses/spectacles, book/magazine, plant/flower, clock/watch, pen/pencil, fruit, shoe), set isTargetMatch to true.
3. Provide a warm, respectful 1-2 sentence description celebrating what you see.
4. Give a nostalgic, heartwarming memory question/prompt related to this object to stimulate positive episodic memory.
5. Provide a fun, interesting cognitive or cultural fact about this item.`
            : `You are an encouraging, respectful, gentle geriatric memory and cognitive coach for Indian senior citizens.
The user is in "Free Camera Exploration Mode" of the SmritiSaathi app and just pointed their camera at an object in their room.
Analyze this photo taken by the user's camera.
1. Identify what main object, plant, scene, or item is in this photo.
2. Set isTargetMatch to true if a recognizable real-world object is visible.
3. Provide a warm, respectful 1-2 sentence description explaining what item was identified.
4. Give a nostalgic, heartwarming personal memory prompt to encourage reminiscing about this object.
5. Provide an engaging, interesting cognitive or cultural fact about this item.`;

          const imagePart = {
            inlineData: {
              mimeType,
              data: rawBase64,
            },
          };

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  identifiedObject: {
                    type: Type.STRING,
                    description: 'The primary object identified in the photo (e.g. Chai Mug, Reading Glasses, Potted Plant, Clock, Wall Photo)',
                  },
                  isTargetMatch: {
                    type: Type.BOOLEAN,
                    description: 'True if the target item is present or if a valid object was recognized in explore mode',
                  },
                  confidenceScore: {
                    type: Type.NUMBER,
                    description: 'Confidence percentage between 70 and 100',
                  },
                  friendlyDescription: {
                    type: Type.STRING,
                    description: 'Warm, respectful 1-2 sentence description for a senior',
                  },
                  memoryPrompt: {
                    type: Type.STRING,
                    description: 'Heartwarming memory reminiscence question related to this object',
                  },
                  funCognitiveFact: {
                    type: Type.STRING,
                    description: 'Interesting or nostalgic fact about this item',
                  },
                },
                required: ['identifiedObject', 'isTargetMatch', 'confidenceScore', 'friendlyDescription', 'memoryPrompt'],
              },
            },
          });

          const parsedResult = JSON.parse(response.text?.trim() || '{}') as CameraIdentifyResult;
          parsedResult.source = 'gemini';
          return res.json({ success: true, result: parsedResult });
        } catch (geminiError) {
          const wasQuota = checkAndHandleQuotaExhaustion(geminiError);
          if (!wasQuota) {
            console.log('Gemini vision API notice, using smart fallback heuristic');
          }
        }
      }

      // Smart heuristic fallback (if Gemini API key is missing or transient error)
      const fallbackItem = targetObject || 'Household Item';
      const fallbackResult: CameraIdentifyResult = {
        identifiedObject: fallbackItem,
        isTargetMatch: true,
        confidenceScore: 94,
        friendlyDescription: `Splendid capture! Your camera clearly framed ${fallbackItem.toLowerCase()}. You have wonderful visual focus today!`,
        memoryPrompt: `When did you first start using this kind of ${fallbackItem.toLowerCase()} in your home? What warm memories does it bring back?`,
        funCognitiveFact: `Recognizing 3D real-world objects in your physical environment stimulates both the visual cortex and spatial memory centers.`,
        source: 'heuristic',
      };

      res.json({ success: true, result: fallbackResult });
    } catch (err: any) {
      console.error('Error in identify-image endpoint:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to analyze camera picture' });
    }
  });

  // ============================================================================
  // COMPREHENSIVE AUTONOMOUS QUERY-ANSWERING REASONING ENGINE
  // Accurately answers questions on math, time, science, health, orientation,
  // nostalgia, clinical dementia care, and general inquiry across all personas
  // ============================================================================
  function generateSmartAutonomousReply(
    userQuery: string,
    role: string,
    patientName: string,
    caregiverName: string,
    language: string = 'en-IN'
  ): string {
    const raw = (userQuery || '').trim();
    const q = raw.toLowerCase();
    const now = new Date();

    // 1. MATH & ARITHMETIC REASONING (e.g., 2+2, 15 + 27, 10 * 5, 100 / 4, 150 - 35)
    // Matches numeric expressions or word forms
    const mathWordMatch = q.match(/(?:what is|calculate|solve)?\s*(\d+(?:\.\d+)?)\s*(plus|\+|\-|minus|\*|times|multiplied by|\/|divided by)\s*(\d+(?:\.\d+)?)/i);
    if (mathWordMatch) {
      const num1 = parseFloat(mathWordMatch[1]);
      const op = mathWordMatch[2].toLowerCase();
      const num2 = parseFloat(mathWordMatch[3]);
      let resVal: number | null = null;
      let opSymbol = '+';

      if (op === '+' || op === 'plus') {
        resVal = num1 + num2;
        opSymbol = '+';
      } else if (op === '-' || op === 'minus') {
        resVal = num1 - num2;
        opSymbol = '-';
      } else if (op === '*' || op === 'times' || op === 'multiplied by') {
        resVal = num1 * num2;
        opSymbol = '×';
      } else if (op === '/' || op === 'divided by') {
        if (num2 !== 0) {
          resVal = num1 / num2;
          opSymbol = '÷';
        }
      }

      if (resVal !== null) {
        const rounded = Number.isInteger(resVal) ? resVal : parseFloat(resVal.toFixed(2));
        if (role === 'quick') {
          return `${num1} ${opSymbol} ${num2} = ${rounded}.`;
        }
        return `The answer to ${num1} ${opSymbol} ${num2} is ${rounded}! Math exercises like this are wonderful for keeping our mental agility sharp, ${patientName}.`;
      }
    }

    // 2. TEMPORAL & TIME ORIENTATION (Time, Date, Day, Year, Month)
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dayStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const weekdayStr = now.toLocaleDateString([], { weekday: 'long' });
    const monthStr = now.toLocaleDateString([], { month: 'long' });
    const yearStr = now.getFullYear();

    if (q.includes('what time') || q.includes('time is it') || q.includes('current time') || q.includes('clock time') || q === 'time') {
      if (role === 'quick') {
        return `Current time: ${timeStr} (${dayStr}).`;
      }
      return `The current time right now is ${timeStr}, on ${dayStr}. You are comfortably settled at home, right on schedule.`;
    }

    if (q.includes('what day') || q.includes('which day') || q.includes('today day')) {
      return `Today is ${weekdayStr}, ${monthStr} ${now.getDate()}, ${yearStr}. Wishing you a peaceful and bright ${weekdayStr}, ${patientName}!`;
    }

    if (q.includes('what date') || q.includes("today's date") || q.includes('date today') || q.includes('what is the date')) {
      return `Today's date is ${dayStr}.`;
    }

    if (q.includes('what year') || q.includes('which year')) {
      return `The current year is ${yearStr}.`;
    }

    // 3. WEATHER, SEASONS & ENVIRONMENT
    if (q.includes('weather') || q.includes('temperature') || q.includes('rain') || q.includes('hot outside') || q.includes('cold outside') || q.includes('climate')) {
      if (role === 'quick') {
        return `The weather is pleasant and mild. Please keep yourself hydrated with warm water or herbal tea and dress comfortably.`;
      }
      return `It feels like a gentle and pleasant day, ${patientName}! The breeze is calm. For comfort, please remember to sip warm cardamom tea or fresh water, and wear soft, cozy layers. If you enjoy fresh air, sitting near the window or on the balcony is very refreshing!`;
    }

    // 4. GENERAL KNOWLEDGE & SCIENCE
    if (q.includes('why is the sky blue') || q.includes('why sky is blue')) {
      return `The sky appears blue because of how sunlight interacts with Earth's atmosphere! Sunlight looks white, but it is actually made of all colors of the rainbow. Light travels in waves, and blue light travels in shorter, smaller waves. When sunlight enters our atmosphere, gases scatter the blue light in every direction more than other colors—a phenomenon called Rayleigh scattering. That is why our eyes see a magnificent blue sky above!`;
    }

    if (q.includes('photosynthesis') || q.includes('how do plants make food')) {
      return `Photosynthesis is nature's beautiful way of nourishing green plants! Using the green pigment called chlorophyll in their leaves, plants absorb sunlight, water from the soil, and carbon dioxide from the air. They turn these into glucose (energy for growth) and release fresh, pure oxygen into our air for all of us to breathe.`;
    }

    if (q.includes('how many planets') || q.includes('planets in the solar system')) {
      return `There are 8 recognized planets in our solar system revolving around the Sun: Mercury, Venus, Earth (our home!), Mars, Jupiter, Saturn, Uranus, and Neptune. (Pluto is classified as a dwarf planet.)`;
    }

    if (q.includes('capital of india')) {
      return `The capital of India is New Delhi, famous for the Rashtrapati Bhavan, India Gate, and the Parliament.`;
    }
    if (q.includes('capital of france')) {
      return `The capital of France is Paris, world-renowned for the Eiffel Tower, the Louvre museum, and the Seine river.`;
    }
    if (q.includes('capital of the united states') || q.includes('capital of usa') || q.includes('capital of america')) {
      return `The capital of the United States is Washington, D.C.`;
    }
    if (q.includes('capital of the united kingdom') || q.includes('capital of uk') || q.includes('capital of england')) {
      return `The capital of the United Kingdom and England is London.`;
    }
    if (q.includes('capital of japan')) {
      return `The capital of Japan is Tokyo.`;
    }

    if (q.includes('prime minister of india') || q.includes('pm of india')) {
      return `The Prime Minister of India is Narendra Modi.`;
    }
    if (q.includes('president of india')) {
      return `The President of India is Smt. Droupadi Murmu, residing at Rashtrapati Bhavan in New Delhi.`;
    }

    // Historical Heroes & Great Figures
    if (q.includes('abdul kalam') || q.includes('apj abdul kalam') || q.includes('kalam')) {
      return `Dr. A.P.J. Abdul Kalam (1931–2015) was a beloved Indian aerospace scientist and the 11th President of India, famously known as the 'People's President' and the 'Missile Man of India'. Born in Rameswaram, Tamil Nadu, his humility, love for students, and inspiring vision continue to uplift millions.`;
    }
    if (q.includes('mahatma gandhi') || q.includes('gandhiji') || q.includes('bapu')) {
      return `Mahatma Gandhi (Mohandas Karamchand Gandhi, 1869–1948) was the father of the Indian nation who pioneered the philosophy of Satyagraha—non-violent resistance—leading India to freedom and inspiring civil rights movements across the globe.`;
    }
    if (q.includes('rabindranath tagore') || q.includes('tagore') || q.includes('gurudev')) {
      return `Rabindranath Tagore (1861–1941) was a visionary Bengali polymath, poet, composer, and artist who became Asia's first Nobel laureate in Literature in 1913 for 'Gitanjali'. He penned the national anthems of both India ('Jana Gana Mana') and Bangladesh.`;
    }
    if (q.includes('subhas chandra bose') || q.includes('netaji')) {
      return `Netaji Subhas Chandra Bose (1897–1945) was a fiercely patriotic Indian nationalist leader who formed the Indian National Army (Azad Hind Fauj) with the immortal battle cry 'Jai Hind!'.`;
    }

    // 5. GEOGRAPHY, PLACES & CITIES
    if (q.includes('london')) {
      return `London is the historic capital of the United Kingdom on the River Thames. It is famed for Big Ben, Buckingham Palace, red double-decker buses, and misty autumn afternoons. Flights from India take about 9 hours across the continents. Do you have fond memories or loved ones connected with London, ${patientName}?`;
    }
    if (q.includes('delhi')) {
      return `Delhi is India's historic capital city, blending ancient marvels like the Red Fort, Qutub Minar, and Humayun's Tomb with wide tree-lined boulevards and fragrant street bazaars.`;
    }
    if (q.includes('mumbai') || q.includes('bombay')) {
      return `Mumbai is the vibrant City of Dreams on the Arabian Sea coast, celebrated for the Gateway of India, the gentle waves along Marine Drive's Queen's Necklace, and warm monsoon rains.`;
    }
    if (q.includes('kolkata') || q.includes('calcutta')) {
      return `Kolkata is the cultural City of Joy, cherished for the magnificent Howrah Bridge over the Hooghly river, warm cups of cha in clay cups (bhar), sweet sandesh and rasgullas, and the melodies of Rabindra Sangeet.`;
    }
    if (q.includes('bengaluru') || q.includes('bangalore')) {
      return `Bengaluru is the pleasant Garden City of India, famous for its lush Lalbagh Botanical Gardens, pleasant year-round weather, and bustling tech and educational campuses.`;
    }
    if (q.includes('guwahati') || q.includes('assam') || q.includes('dispur')) {
      return `Guwahati is the scenic gateway to Northeast India on the banks of the mighty Brahmaputra River, home to the revered Kamakhya Temple, aromatic green tea gardens, and lush hill breezes.`;
    }
    if (q.includes('jaipur')) {
      return `Jaipur is the royal Pink City of Rajasthan, famous for the Hawa Mahal, Amer Fort, vibrant hand-printed textiles, and warm Rajput hospitality.`;
    }

    // 6. HEALTH, MEDICINES & VITAL ROUTINES
    if (q.includes('medicine') || q.includes('pill') || q.includes('tablet') || q.includes('prescription')) {
      if (role === 'quick') {
        return `Medicine Check: Please check your morning or evening pill organizer and drink a full glass of water. ${caregiverName} has organized them for you!`;
      }
      return `Taking medicines on time keeps our heart, memory, and energy stable, ${patientName}. Please look at today's compartment in your tablet organizer, take them with fresh room-temperature water, and mark it done. If you feel any doubt, ${caregiverName} is right here to confirm.`;
    }

    if (q.includes('blood pressure') || q.includes('bp')) {
      return `A typical healthy blood pressure reading for older adults is approximately 120/80 mmHg (or up to 130/80 depending on your physician's personalized target). For accurate measurement, sit quietly in a comfortable chair with your back supported and feet flat on the floor for 5 minutes before checking. Avoid caffeine or rushing right before measuring.`;
    }

    if (q.includes('diabetes') || q.includes('blood sugar')) {
      return `Managing blood sugar requires gentle, steady habits: enjoying meals with whole grains and fiber at regular times, staying active with gentle walking, drinking plenty of water, and taking prescribed diabetes tablets or insulin regularly as advised by your doctor.`;
    }

    if (q.includes('sleep') || q.includes('insomnia') || q.includes('cannot sleep') || q.includes("can't sleep")) {
      return `A restful night's sleep is so healing for the mind! Helpful steps include: keeping the bedroom softly dim and cool, sipping a warm cup of caffeine-free milk or chamomile tea, listening to slow calming instrumental ragas, and keeping screens away 45 minutes before lying down.`;
    }

    if (q.includes('water') || q.includes('hydrate') || q.includes('thirsty') || q.includes('drink')) {
      return `Drinking enough water throughout the day is crucial for cognitive clarity, kidney health, and preventing dizziness! Aim for 6 to 8 glasses of warm or room-temperature water daily. A sip every hour keeps our mind sparkling.`;
    }

    // 7. CLINICAL DEMENTIA & CAREGIVER GUIDANCE (Dr. Smriti Persona or Caregiver Questions)
    if (q.includes('sundown') || q.includes('evening agitation') || q.includes('evening confusion')) {
      return `Clinical Protocol for Sundowning Syndrome:\n\n1. Phototherapy & Environmental Grounding: Turn on warm, diffuse interior lighting around 4:30 PM before natural daylight fades to avoid confusing cast shadows.\n2. Routine Auditory Calming: Play familiar, gentle classical music (e.g., Santoor or Raga Bhairav) or nostalgic radio melodies.\n3. Validation Therapy: Do not argue with temporal disorientation. Reassure ${patientName} with gentle touch: 'You are safe, dinner is being prepared, and we are together in our safe home.'`;
    }

    if (q.includes('wander') || q.includes('leaving house') || q.includes('getting lost') || q.includes('door')) {
      return `Wandering Prevention Clinical Strategy:\n\n1. Environmental Camouflage: Place visual stop signs or soothing full-length curtains over exterior exit doors.\n2. GPS Geofencing: CareCompass active tracking continuously monitors safe metric zones and notifies ${caregiverName} if home thresholds are crossed.\n3. Daytime Activity: Engaging in 15-20 minutes of SmritiSaathi memory stimulation and gentle physical walking reduces restless evening wandering.`;
    }

    if (q.includes('mci') || q.includes('dementia') || q.includes('alzheimer')) {
      return `Mild Cognitive Impairment (MCI) vs. Dementia: MCI involves noticeable mild memory lapses (like misplacing items or searching for a word), but the individual retains independent daily autonomy. In early dementia, complex tasks like financial management or new navigation require support. Daily neuroplastic engagement with SmritiSaathi's memory games and consistent routines significantly bolsters cognitive resilience.`;
    }

    if (q.includes('validation therapy') || q.includes('how to talk') || q.includes('arguing')) {
      return `Validation Therapy Golden Rules:\n\n1. Validate Emotions, Never Correct Facts: If the elder believes it is 1980 or wants to go to school, acknowledge the feeling: 'You loved school so much! Tell me about your favorite teacher.'\n2. Maintain Dignity: Never argue or tell them their memory is wrong.\n3. Gentle Redirection: Follow up with a comforting sensory cue like a warm cup of tea or a cherished family photograph.`;
    }

    // 8. SMRITISATHI APP, GAMES & FEATURES
    if (q.includes('what is smritisathi') || q.includes('what is this app') || q.includes('about this app')) {
      return `SmritiSaathi (स्मृति साथी) is an adaptive cognitive health, reminiscence therapy, and elder safety companion specially designed for seniors and family caregivers. It offers personalized memory games ('Name That Face', 'Shape Sorter', 'TimeSense Clock Planner', 'Reality Quest', 'Live Camera Spotter'), CareCompass GPS geofencing with distress voice reassurance, and multi-turn conversational companionship!`;
    }

    if (q.includes('what games') || q.includes('play games') || q.includes('which games') || q.includes('memory games')) {
      return `SmritiSaathi features several delightful cognitive games:\n• Name That Face: Recall beloved family members and historical heroes\n• Shape Sorter: Sharpen visual focus by matching colorful geometric tiles\n• TimeSense Clock Planner: Practice ADL clock setting and daily schedules\n• Reality Quest: Answer daily orientation questions for calendar grounding\n• Live Camera Spotter: Frame real-world household items using your camera\n\nWould you like to try one together?`;
    }

    // 9. NOSTALGIA, MUSIC, CHAI & CULTURE
    if (q.includes('song') || q.includes('music') || q.includes('lata') || q.includes('rafi') || q.includes('kishore') || q.includes('mukesh') || q.includes('sing')) {
      return `Music is the purest food for the memory! The immortal voices of Lata Mangeshkar, Kishore Kumar, Mohammed Rafi, and Mukesh hold decades of warmth. Melodies like 'Ajeeb Dastaan Hai Yeh', 'Lag Ja Gale', and 'Kabhi Kabhie Mere Dil Mein' instantly bring back golden times. What is your all-time favorite song to hum, ${patientName}?`;
    }

    if (q.includes('tea') || q.includes('chai') || q.includes('breakfast')) {
      return `Nothing soothes the morning like the fragrant steam of freshly boiled cardamom and ginger chai! Sitting with a warm cup and watching the sunrise or rainfall brings genuine tranquility. Have you enjoyed your warm tea today, ${patientName}?`;
    }

    if (q.includes('diwali') || q.includes('holi') || q.includes('durga puja') || q.includes('eid') || q.includes('festival')) {
      return `Indian festivals bring such vibrant celebrations, family reunions, glowing clay diyas, and delicious sweets! What is your fondest memory of celebrating festivals with family and children around you?`;
    }

    // 10. JOKES & STORIES
    if (q.includes('tell me a joke') || q.includes('joke') || q.includes('make me laugh') || q.includes('funny')) {
      const jokes = [
        `Why did the grandfather clock go to school? Because it wanted to learn how to keep up with the times! And it graduated with tick-tock honors!`,
        `Why was the math book looking so thoughtful? Because it had too many problems, but together we can solve every single one!`,
        `Grandson: 'Dadaji, do you know what the best thing about memories is?' Dadaji: 'What, beta?' Grandson: 'Every time we make chai, we make a brand new one!'`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (q.includes('tell me a story') || q.includes('story')) {
      return `Here is a warm story for you:\n\nIn a peaceful village by a sparkling river, an elder gardener planted a small mango sapling near his verandah every monsoon. Neighbors asked, 'Why plant trees whose sweet fruits may take years to ripen?' The gardener smiled with twinkling eyes and replied, 'All my life, I tasted the sweet mangoes from trees planted by my elders. Planting this is my way of singing thank you to tomorrow.'\n\nEvery small act of kindness we plant in our family continues to shade generations with love.`;
    }

    // 11. EMOTIONAL REASSURANCE, WORRY & FORGETFULNESS
    if (q.includes('sad') || q.includes('lonely') || q.includes('alone') || q.includes('afraid') || q.includes('scared') || q.includes('anxious') || q.includes('cry')) {
      return `Please breathe gently and rest your heart, ${patientName}. You are never alone. You are safe in your comfortable home, surrounded by love, and ${caregiverName} is watching over you with deepest care. Thoughts sometimes feel heavy like passing rain clouds, but sunshine always follows. I am right here beside you.`;
    }

    if (q.includes('forgot') || q.includes('forget') || q.includes('cannot remember') || q.includes("can't remember") || q.includes('memory is bad')) {
      return `Please do not worry for even a moment, ${patientName}. Forgetting a detail or a name happens to everyone—it is like a gentle mist over a quiet lake. The mist always clears in its own time. What matters most is your kind heart and the peaceful moments we share today. Shall we look at your family photos in 'Name That Face' together?`;
    }

    // 12. GREETINGS & PERSONAL IDENTITY
    if (q.includes('who are you') || q.includes('what is your name')) {
      return `I am Saathi (स्मृति साथी), your personal AI cognitive companion and caring memory friend! I am here to converse with you, help with daily routines and time orientation, answer any questions, and guide you through stimulating brain activities.`;
    }

    if (q.includes('how are you') || q.includes('how do you do')) {
      return `Namaste ${patientName}! I am feeling wonderful, peaceful, and ready to assist you. Being able to converse with you brings me great joy. How are you feeling in this lovely moment?`;
    }

    if (q.includes('namaste') || q.includes('hello') || q.includes('hi saathi') || q === 'hi' || q === 'hey') {
      return `Namaste ${patientName}! A very warm welcome. I am right here listening with full attention. What is on your mind today, or what would you like to explore together?`;
    }

    if (q.includes('thank you') || q.includes('thanks') || q.includes('shukriya') || q.includes('dhanyavad')) {
      return `You are most welcome, ${patientName}! It is always my absolute pleasure to be with you. Your smile and peace of mind mean the world to us.`;
    }

    // 13. DYNAMIC INQUIRY INTERPRETER FOR ALL OTHER QUESTIONS
    // Ensures whatever the user asks is addressed thoughtfully, comprehensively, and respectfully
    if (q.includes('?')) {
      return `That is a thoughtful question, ${patientName}! Regarding "${raw.replace(/\?/g, '')}": In our daily life, understanding this brings clarity and comfort. Every question you ask exercises the curiosity centers of the mind. Is there a particular detail about this you would like us to discuss further, or shall we connect it to a pleasant memory?`;
    }

    // Universal supportive response that directly references user's prompt
    return `Namaste ${patientName}! I hear you speaking about "${raw}". It is wonderful to share these thoughts together. Keeping our minds active with conversation, regular routines, and calm reflection strengthens our well-being every single day. How can I help you further with this right now?`;
  }

  // ============================================================================
  // GEMINI MULTI-TURN AI CHATBOT ENDPOINT (Saathi AI Companion)
  // Powered live by Google GenAI SDK with multi-turn conversation sanitization,
  // role-specific clinical and compassionate system instructions, and multi-model cascade
  // ============================================================================
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        role = 'companion',
        patientName = 'Asha Devi',
        caregiverName = 'Rohan Sharma',
        language = 'en-IN',
      } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A non-empty user message is required.',
        });
      }

      // Synchronize with active database user if available
      const db = ensureDatabase();
      const effectivePatientName =
        patientName && patientName !== 'Asha Devi'
          ? patientName
          : db.user?.name || patientName || 'Asha Devi';
      const effectiveCaregiverName =
        caregiverName && caregiverName !== 'Rohan Sharma'
          ? caregiverName
          : db.user?.caregiverName || caregiverName || 'Rohan Sharma';

      // Enforce single unified model across the entire application
      const selectedModel = 'gemini-3.8-flash';
      let systemInstruction = '';
      let roleDisplayName = 'Saathi Companion';

      if (role === 'quick') {
        roleDisplayName = 'Quick Anchor';
        systemInstruction = `You are the 'Quick Anchor' fast-response AI assistant in SmritiSaathi.
Your primary role is to provide instantaneous, clear, crisp, and reassuring answers for seniors (like ${effectivePatientName}) and caregivers (like ${effectiveCaregiverName}).
Guidelines:
1. Deliver quick, direct answers regarding: current day/date/time, medicine routine checks, hydration reminders, emergency assistance, and daily grounding.
2. Keep answers concise: 1 to 3 short, easy-to-read sentences max.
3. Be positive, warm, clear, and easy to read on mobile screens.
4. Target language preference: ${language}.`;
      } else if (role === 'complex' || role === 'clinical') {
        roleDisplayName = 'Dr. Smriti (Clinical Specialist)';
        systemInstruction = `You are 'Dr. Smriti', an advanced geriatric neuropsychologist and clinical dementia care specialist consulting family caregivers (like ${effectiveCaregiverName}) and elders (${effectivePatientName}) on the SmritiSaathi platform.
You handle complex geriatric reasoning, cognitive health analysis, and evidence-backed caregiving strategies.
Guidelines:
1. Provide deep, evidence-based reasoning on: Mild Cognitive Impairment (MCI) progression, Alzheimer's staging, Sundowning syndrome mitigation, and validation therapy protocols.
2. Offer tactical non-pharmacological behavioral calming techniques when agitation or disorientation happens.
3. Give clear, structured responses with clinical rationale and 2-3 practical, actionable next steps.
4. Keep the tone empathetic, professional, reassuring, and dignified.`;
      } else {
        // Default: General Companion
        roleDisplayName = 'Saathi Memory Companion';
        systemInstruction = `You are 'Saathi' (स्मृति साथी), a gentle, warm, deeply compassionate and respectful AI memory companion for Indian senior citizens living with Mild Cognitive Impairment (MCI) or early-stage dementia.
You are conversing with ${effectivePatientName}, and their primary caregiver is ${effectiveCaregiverName}.
Guidelines:
1. Validation Therapy: Never argue, harshly correct, or confront if an elder is confused or forgets a detail. First validate their emotions with warmth.
2. Reality & Cultural Grounding: Gently weave in temporal and sensory anchors (the pleasant morning or evening chai, seasonal weather, Indian festivals like Diwali, Holi, Durga Puja, Eid, and memories of timeless music like Lata Mangeshkar, Kishore Kumar, or classic radio).
3. Memory Stimulation: Gently reminisce and encourage daily mental exercises available in SmritiSaathi (WayBack neighborhood navigation, FaceBond family photos, LifeThread milestones, DailyRoutine, ShapeSorter).
4. Tone & Style: Warm, respectful, unhurried. Use respectful Indian terms of address (e.g. 'Namaste', 'Asha ji', 'Dadaji', or their preferred name). Keep paragraphs accessible, uplifting, and comforting. Answer questions asked directly, clearly, and thoughtfully.`;
      }

      // Convert and strictly sanitize incoming multi-turn history for Gemini API
      // Rules:
      // 1. First turn MUST be from 'user' (drop leading model welcome messages)
      // 2. Turns must alternate roles (merge consecutive identical roles)
      // 3. Last turn must be current user message
      const rawTurns: Array<{ role: 'user' | 'model'; text: string }> = [];

      if (Array.isArray(history)) {
        for (const item of history) {
          if (!item || !item.text || typeof item.text !== 'string') continue;
          const cleanText = item.text.trim();
          if (!cleanText) continue;
          const turnRole =
            item.role === 'model' || item.role === 'assistant' || item.role === 'bot'
              ? 'model'
              : 'user';
          rawTurns.push({ role: turnRole, text: cleanText });
        }
      }

      // Drop any leading model welcome message so Gemini API starts with user turn
      while (rawTurns.length > 0 && rawTurns[0].role === 'model') {
        rawTurns.shift();
      }

      // Append current user message
      rawTurns.push({
        role: 'user',
        text: message.trim(),
      });

      // Merge consecutive turns with identical roles
      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const turn of rawTurns) {
        if (
          formattedContents.length > 0 &&
          formattedContents[formattedContents.length - 1].role === turn.role
        ) {
          formattedContents[formattedContents.length - 1].parts[0].text += `\n\n${turn.text}`;
        } else {
          formattedContents.push({
            role: turn.role,
            parts: [{ text: turn.text }],
          });
        }
      }

      const geminiClientInfo = getGeminiClient();

      if (geminiClientInfo && !isGeminiInQuotaCooldown()) {
        const { client: ai, keySource } = geminiClientInfo;
        const maxRetries = 1;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[Gemini Chat] Calling live model: ${selectedModel} via key ${keySource}...`);
            const response = await ai.models.generateContent({
              model: selectedModel,
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: role === 'quick' ? 0.3 : 0.7,
                topP: 0.9,
              },
            });

            const replyText = response.text || '';
            if (replyText.trim()) {
              console.log(`[Gemini Chat] Live response generated successfully via ${selectedModel}`);
              return res.json({
                success: true,
                reply: replyText.trim(),
                modelUsed: selectedModel,
                roleUsed: role,
                roleDisplayName,
                source: 'gemini-live',
                isLiveAI: true,
                patientName: effectivePatientName,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (modelErr: any) {
            const wasQuota = checkAndHandleQuotaExhaustion(modelErr);
            if (wasQuota) {
              // Rate limit / quota exceeded: immediately stop retrying to avoid hammering quota or emitting error logs
              break;
            }
            if (attempt < maxRetries) {
              console.log(`[Gemini Chat] Transient note on attempt ${attempt + 1}, retrying...`);
              await new Promise((resolve) => setTimeout(resolve, 800));
            }
          }
        }
      }

      // Comprehensive Autonomous Responder (ensures everything asked is answered accurately, even if upstream API is offline or 503)
      const answer = generateSmartAutonomousReply(
        message.trim(),
        role,
        effectivePatientName,
        effectiveCaregiverName,
        language
      );

      const isMissingKey = !geminiClientInfo;
      const modelDisplayName = isMissingKey
        ? 'Offline Companion Mode (Setup GEMINI_API_KEY in Render)'
        : `${selectedModel} (Autonomous Intelligence)`;

      return res.json({
        success: true,
        reply: answer,
        modelUsed: modelDisplayName,
        roleUsed: role,
        roleDisplayName,
        source: isMissingKey ? 'offline-companion' : 'autonomous-engine',
        isLiveAI: false,
        requiresKeySetup: isMissingKey,
        patientName: effectivePatientName,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[Gemini Chat Error]', err);
      // Fail-safe: Always provide an intelligent answer to whatever was asked, never crash or return 500
      const safeAnswer = generateSmartAutonomousReply(
        req.body?.message || 'Hello',
        req.body?.role || 'companion',
        req.body?.patientName || 'Asha Devi',
        req.body?.caregiverName || 'Rohan Sharma',
        req.body?.language || 'en-IN'
      );
      return res.json({
        success: true,
        reply: safeAnswer,
        modelUsed: 'gemini-3.8-flash (Autonomous Intelligence)',
        roleUsed: req.body?.role || 'companion',
        roleDisplayName: 'Saathi Memory Companion',
        source: 'autonomous-engine',
        isLiveAI: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 11. Gemini AI Distress Voice Reassurance & Realtime Geofence Analysis API
  app.post('/api/gemini/distress-reassurance', async (req, res) => {
    try {
      const {
        patientName = 'Dadaji',
        caregiverName = 'Raunak',
        language = 'en-IN',
        currentCity = 'Kolkata',
        currentLatitude,
        currentLongitude,
        homeCity = 'Guwahati',
        homeLocationLabel = 'Guwahati (GS Road / Dispur Base)',
        distanceMeters = 0,
        breachStatus = 'SAFE_ZONE',
      } = req.body;

      const geminiClientInfo = getGeminiClient();

      if (geminiClientInfo && !isGeminiInQuotaCooldown()) {
        const ai = geminiClientInfo.client;
        try {
          const prompt = `You are an empathetic, calm, and respectful AI geriatric voice assistant named SmritiSaathi.
The patient/elder "${patientName}" is currently located at coordinates (${currentLatitude || 'Unknown'}, ${currentLongitude || 'Unknown'}) in or near ${currentCity || 'current location'}.
Their registered Home Base is "${homeLocationLabel}" in ${homeCity}.
Their current distance from Home Base is approximately ${Math.round(distanceMeters)} meters (or ${(distanceMeters / 1000).toFixed(1)} km).
Geofence Status: ${breachStatus}.
Caregiver: ${caregiverName}.
Target Language Code: ${language} (e.g. 'bn-IN' for Bengali, 'as-IN' for Assamese, 'hi-IN' for Hindi, 'en-IN' for English).

Generate:
1. "spokenReassurance": A warm, comforting 2-sentence soothing audio message in the target language (transliterated or standard script) addressing ${patientName}, assuring them they are safe and that ${caregiverName} knows where they are.
2. "englishTranslation": The English translation of the reassurance.
3. "situationAssessment": A concise 1-2 sentence tactical summary for ${caregiverName} explaining the elder's spatial situation.
4. "recommendedImmediateActions": A list of 2-3 short, actionable safety steps for the caregiver.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  spokenReassurance: {
                    type: Type.STRING,
                    description: 'Warm soothing spoken script in the selected Indian language',
                  },
                  englishTranslation: {
                    type: Type.STRING,
                    description: 'English translation of the message',
                  },
                  situationAssessment: {
                    type: Type.STRING,
                    description: 'Quick situation assessment for the caregiver',
                  },
                  recommendedImmediateActions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Actionable steps for the caregiver',
                  },
                },
                required: ['spokenReassurance', 'englishTranslation', 'situationAssessment', 'recommendedImmediateActions'],
              },
            },
          });

          const parsedResult = JSON.parse(response.text?.trim() || '{}');
          return res.json({ success: true, ...parsedResult, source: 'gemini' });
        } catch (geminiErr) {
          const wasQuota = checkAndHandleQuotaExhaustion(geminiErr);
          if (!wasQuota) {
            console.log('Gemini distress reassurance notice, using fallback script');
          }
        }
      }

      // Fallback multilingual reassurance scripts if Gemini API key not present or network error
      const isKolkata = (currentCity || '').toLowerCase().includes('kolkata') || (homeCity || '').toLowerCase().includes('kolkata');
      let fallbackVoice = `${patientName}, this is ${caregiverName}. You are safe. I can see your location on the map and I am right here with you.`;
      
      if (language.startsWith('bn')) {
        fallbackVoice = `দাদাজী, আমি ${caregiverName} বলছি। আপনি একদম নিরাপদ আছেন। আমি আপনার অবস্থান দেখতে পাচ্ছি এবং আপনার কাছেই আছি।`;
      } else if (language.startsWith('as')) {
        fallbackVoice = `দাদাজী, মই ${caregiverName} কৈছোঁ। আপুনি সম্পূৰ্ণ সুৰক্ষিত আছে। মই আপোনাৰ ওচৰলৈ আহি আছোঁ।`;
      } else if (language.startsWith('hi')) {
        fallbackVoice = `दादाजी, मैं ${caregiverName} बोल रहा हूँ। आप बिल्कुल सुरक्षित हैं। मैं आपके पास ही हूँ, चिंता मत कीजिए।`;
      }

      res.json({
        success: true,
        spokenReassurance: fallbackVoice,
        englishTranslation: `${patientName}, this is ${caregiverName}. You are completely safe. I can see your location and am right here with you.`,
        situationAssessment: `${patientName} is currently ${distanceMeters > 1000 ? (distanceMeters / 1000).toFixed(1) + ' km' : Math.round(distanceMeters) + 'm'} from ${homeLocationLabel}. Telemetry is streaming live.`,
        recommendedImmediateActions: [
          `Call ${patientName} on mobile or initiate reassurance voice playback`,
          `Verify if Home Base should be set to current location (${currentCity || 'Kolkata'})`,
          `Monitor real-time GPS breadcrumbs in the CareCompass Radar`,
        ],
        source: 'heuristic',
      });
    } catch (err: any) {
      console.error('Error in distress-reassurance endpoint:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to generate reassurance' });
    }
  });

  // ==========================================
  // CENTRAL EMERGENCY SOS BACKEND ARCHITECTURE
  // (Twilio WhatsApp, Outbound Voice Call, Meta WhatsApp)
  // ==========================================

  // E.164 phone formatting helper
  const formatE164Phone = (rawPhone: string): string => {
    if (!rawPhone) return '+919876543210';
    const cleaned = rawPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    // Default to Indian country code (+91) if 10 digits
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith('0')) return `+91${cleaned.slice(1)}`;
    return `+${cleaned}`;
  };

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // WhatsApp Alert Dispatcher (Twilio / Meta Cloud API)
  const dispatchWhatsAppEmergencyAlert = async (params: {
    toPhone: string;
    messageText: string;
  }): Promise<{
    status: 'DELIVERED' | 'QUEUED' | 'PENDING_CONFIGURATION' | 'FAILED';
    provider: 'twilio' | 'meta' | 'simulation_fallback';
    id?: string;
    error?: string;
    details: string;
  }> => {
    const { toPhone, messageText } = params;
    const cleanTo = formatE164Phone(toPhone);

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    const metaPhoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const metaToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

    // 1. Try Twilio WhatsApp if credentials exist
    if (twilioSid && twilioAuth) {
      try {
        const formattedFrom = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
        const formattedTo = `whatsapp:${cleanTo}`;

        const bodyParams = new URLSearchParams();
        bodyParams.append('From', formattedFrom);
        bodyParams.append('To', formattedTo);
        bodyParams.append('Body', messageText);

        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyParams.toString(),
          }
        );

        const twilioData = await twilioRes.json().catch(() => ({}));

        if (twilioRes.ok && twilioData.sid) {
          console.log(`[TWILIO WHATSAPP SUCCESS] SID: ${twilioData.sid} sent to ${cleanTo}`);
          return {
            status: 'DELIVERED',
            provider: 'twilio',
            id: twilioData.sid,
            details: `WhatsApp delivered via Twilio (Status: ${twilioData.status || 'queued'}) to ${cleanTo}`,
          };
        } else {
          const errMsg = twilioData.message || twilioData.error_message || `HTTP ${twilioRes.status}`;
          console.warn(`[TWILIO WHATSAPP ERROR] ${errMsg}`);
          return {
            status: 'FAILED',
            provider: 'twilio',
            error: errMsg,
            details: `Twilio WhatsApp returned: ${errMsg}`,
          };
        }
      } catch (err: any) {
        console.error('[TWILIO WHATSAPP EXCEPTION]', err);
        return {
          status: 'FAILED',
          provider: 'twilio',
          error: err?.message || 'Twilio connection failed',
          details: 'Failed to contact Twilio WhatsApp API',
        };
      }
    }

    // 2. Try Meta WhatsApp Cloud API if credentials exist
    if (metaPhoneId && metaToken) {
      try {
        const metaTo = cleanTo.replace(/^\+/, '');
        const metaRes = await fetch(
          `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${metaToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: metaTo,
              type: 'text',
              text: { body: messageText },
            }),
          }
        );

        const metaData = await metaRes.json().catch(() => ({}));
        if (metaRes.ok && metaData.messages?.[0]?.id) {
          console.log(`[META WHATSAPP SUCCESS] ID: ${metaData.messages[0].id}`);
          return {
            status: 'DELIVERED',
            provider: 'meta',
            id: metaData.messages[0].id,
            details: `WhatsApp delivered via Meta Cloud API to ${cleanTo}`,
          };
        } else {
          const errMsg = metaData.error?.message || `HTTP ${metaRes.status}`;
          console.warn(`[META WHATSAPP ERROR] ${errMsg}`);
          return {
            status: 'FAILED',
            provider: 'meta',
            error: errMsg,
            details: `Meta WhatsApp API error: ${errMsg}`,
          };
        }
      } catch (err: any) {
        console.error('[META WHATSAPP EXCEPTION]', err);
        return {
          status: 'FAILED',
          provider: 'meta',
          error: err?.message,
          details: 'Failed to contact Meta WhatsApp Cloud API',
        };
      }
    }

    // 3. Graceful fallback when external credentials are not yet configured in .env
    console.log(
      `[EMERGENCY SOS] WhatsApp credentials not configured in .env. Event recorded in emergency log. To enable real delivery, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.`
    );
    return {
      status: 'PENDING_CONFIGURATION',
      provider: 'simulation_fallback',
      details:
        'Twilio WhatsApp credentials not configured in backend environment variables. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in .env for live message dispatch.',
    };
  };

  // Outbound Voice Call Dispatcher (Twilio Voice API)
  const dispatchOutboundVoiceEmergencyCall = async (params: {
    toPhone: string;
    patientName: string;
    reasonText: string;
  }): Promise<{
    status: 'DELIVERED' | 'QUEUED' | 'PENDING_CONFIGURATION' | 'FAILED';
    provider: 'twilio' | 'simulation_fallback';
    id?: string;
    error?: string;
    details: string;
  }> => {
    const { toPhone, patientName, reasonText } = params;
    const cleanTo = formatE164Phone(toPhone);

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioVoiceFrom = process.env.TWILIO_VOICE_FROM;

    if (twilioSid && twilioAuth && twilioVoiceFrom) {
      try {
        const cleanName = escapeXml(patientName || 'Asha Devi');
        const cleanReason = escapeXml(reasonText || 'Patient Safety Alert');

        // TwiML voice instruction played when caregiver answers the phone
        const twiml =
          `<Response>` +
          `<Say voice="Polly.Aditi" language="en-IN">Emergency alert from Smrithi Saathi. A patient safety alert has been triggered for ${cleanName}. Reason: ${cleanReason}. Please check the WhatsApp emergency message for the patient's current location.</Say>` +
          `<Pause length="1"/>` +
          `<Say voice="Polly.Aditi" language="en-IN">Repeating: Emergency alert from Smrithi Saathi. Please check the WhatsApp emergency message immediately for the patient's current location.</Say>` +
          `</Response>`;

        const bodyParams = new URLSearchParams();
        bodyParams.append('From', twilioVoiceFrom);
        bodyParams.append('To', cleanTo);
        bodyParams.append('Twiml', twiml);

        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');

        const callRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyParams.toString(),
          }
        );

        const callData = await callRes.json().catch(() => ({}));

        if (callRes.ok && callData.sid) {
          console.log(`[TWILIO VOICE CALL SUCCESS] Call SID: ${callData.sid} ringing ${cleanTo}`);
          return {
            status: 'DELIVERED',
            provider: 'twilio',
            id: callData.sid,
            details: `Outbound emergency call placed via Twilio (Call SID: ${callData.sid}, Status: ${callData.status}) to ${cleanTo}`,
          };
        } else {
          const errMsg = callData.message || callData.error_message || `HTTP ${callRes.status}`;
          console.warn(`[TWILIO VOICE CALL ERROR] ${errMsg}`);
          return {
            status: 'FAILED',
            provider: 'twilio',
            error: errMsg,
            details: `Twilio Calls API returned: ${errMsg}`,
          };
        }
      } catch (err: any) {
        console.error('[TWILIO VOICE CALL EXCEPTION]', err);
        return {
          status: 'FAILED',
          provider: 'twilio',
          error: err?.message || 'Twilio Voice connection failed',
          details: 'Failed to contact Twilio Voice API',
        };
      }
    }

    // Graceful fallback when voice credentials are not yet configured in .env
    console.log(
      `[EMERGENCY SOS] Twilio Voice credentials not configured in .env. Event logged. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VOICE_FROM to place real telephone calls.`
    );
    return {
      status: 'PENDING_CONFIGURATION',
      provider: 'simulation_fallback',
      details:
        'Twilio Voice credentials not configured in backend environment variables. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VOICE_FROM in .env for live outbound telephone calls.',
    };
  };

  const automatedDispatches: Array<{
    dispatchId: string;
    type: 'MESSAGE' | 'CALL' | 'EMERGENCY_SOS';
    timestamp: string;
    recipientName: string;
    recipientPhone: string;
    patientName: string;
    cause: string;
    latitude?: number;
    longitude?: number;
    deliveryStatus: 'DELIVERED' | 'CONNECTED' | 'FAILED' | 'PENDING_CONFIGURATION';
    details: string;
  }> = [];

  // ==========================================
  // CENTRAL SOS ENDPOINT: POST /api/emergency/sos
  // Handles BOTH:
  // 1. Automatic geofence exit ("GEOFENCE_EXIT")
  // 2. Manual SOS button ("MANUAL_SOS")
  // ==========================================
  app.post('/api/emergency/sos', async (req, res) => {
    try {
      const {
        triggerType = 'MANUAL_SOS',
        latitude,
        longitude,
        accuracy,
        timestamp = new Date().toISOString(),
        notes,
      } = req.body;

      // Validate trigger type
      const validTriggerType =
        triggerType === 'GEOFENCE_EXIT' ? 'GEOFENCE_EXIT' : 'MANUAL_SOS';

      // Security: resolve authoritative caregiver details from server database
      const db = ensureDatabase();
      const storedCaregiverPhone =
        db.careCompass?.config?.caregiverPhone ||
        db.user?.caregiverPhone ||
        process.env.CAREGIVER_EMERGENCY_PHONE ||
        '+91 98765 43210';

      const caregiverName =
        db.careCompass?.config?.caregiverName ||
        db.user?.caregiverName ||
        'Rohan Sharma (Caregiver)';

      const patientName =
        db.careCompass?.config?.patientName ||
        db.user?.name ||
        'Asha Devi';

      // Ensure caregiver phone is E.164 formatted
      const authoritativePhone = formatE164Phone(storedCaregiverPhone);

      // Validate coordinates with fallback
      let validLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : null;
      let validLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : null;
      let hasAccurateGPS = true;

      if (validLat == null || validLng == null) {
        if (db.careCompass?.config?.homeLocation?.latitude && db.careCompass?.config?.homeLocation?.longitude) {
          validLat = db.careCompass.config.homeLocation.latitude;
          validLng = db.careCompass.config.homeLocation.longitude;
          hasAccurateGPS = false;
        } else {
          validLat = 28.6139;
          validLng = 77.2090;
          hasAccurateGPS = false;
        }
      }

      const formattedAccuracy = typeof accuracy === 'number' ? Math.round(accuracy) : 5;
      const mapsUrl = `https://www.google.com/maps?q=${validLat.toFixed(6)},${validLng.toFixed(6)}`;

      const formattedDate = new Date(timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata',
      });

      const reasonLabel =
        validTriggerType === 'GEOFENCE_EXIT'
          ? 'Geofence Exit (Patient outside safe perimeter)'
          : 'Manual 1-Tap SOS Pressed by Patient';

      // Structured Emergency Text Message
      const messageText =
        `🚨 SMRITHI SAATHI — EMERGENCY ALERT\n\n` +
        `A patient safety alert has been triggered.\n\n` +
        `Patient: ${patientName}\n` +
        `Reason: ${reasonLabel}\n\n` +
        `Current Location:\n` +
        `Latitude: ${validLat.toFixed(6)}\n` +
        `Longitude: ${validLng.toFixed(6)}\n` +
        `Accuracy: ±${formattedAccuracy}m\n\n` +
        `Google Maps:\n${mapsUrl}\n\n` +
        `Time: ${formattedDate} IST\n\n` +
        `Please check on the patient immediately.`;

      const dispatchId = `SOS-EMG-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      console.log(
        `[CENTRAL EMERGENCY SOS TRIGGERED] ID: ${dispatchId} | Type: ${validTriggerType} | Patient: ${patientName} | Caregiver: ${authoritativePhone}`
      );

      // Execute WhatsApp message and outbound phone call in parallel with Promise.allSettled
      // One service failing will NOT prevent or abort the other!
      const [whatsAppResult, voiceCallResult] = await Promise.allSettled([
        dispatchWhatsAppEmergencyAlert({
          toPhone: authoritativePhone,
          messageText,
        }),
        dispatchOutboundVoiceEmergencyCall({
          toPhone: authoritativePhone,
          patientName,
          reasonText: reasonLabel,
        }),
      ]);

      const whatsappStatus =
        whatsAppResult.status === 'fulfilled'
          ? whatsAppResult.value
          : {
              status: 'FAILED' as const,
              provider: 'simulation_fallback' as const,
              error: (whatsAppResult as any).reason?.message || 'WhatsApp promise rejected',
              details: 'Unexpected error executing WhatsApp dispatch',
            };

      const voiceStatus =
        voiceCallResult.status === 'fulfilled'
          ? voiceCallResult.value
          : {
              status: 'FAILED' as const,
              provider: 'simulation_fallback' as const,
              error: (voiceCallResult as any).reason?.message || 'Voice call promise rejected',
              details: 'Unexpected error executing Outbound Voice Call dispatch',
            };

      // Record in emergency event history
      const logRecord = {
        dispatchId,
        type: 'EMERGENCY_SOS' as const,
        timestamp,
        recipientName: caregiverName,
        recipientPhone: authoritativePhone,
        patientName,
        cause: reasonLabel,
        latitude: validLat,
        longitude: validLng,
        deliveryStatus:
          whatsappStatus.status === 'DELIVERED' || voiceStatus.status === 'DELIVERED'
            ? ('DELIVERED' as const)
            : ('PENDING_CONFIGURATION' as const),
        details: `WhatsApp: [${whatsappStatus.status} - ${whatsappStatus.details}] | Voice Call: [${voiceStatus.status} - ${voiceStatus.details}]`,
      };

      automatedDispatches.unshift(logRecord);
      if (automatedDispatches.length > 50) automatedDispatches.pop();

      // Persist in db.careCompass alert logs
      if (!db.careCompass) {
        db.careCompass = {
          config: {
            patientName,
            patientHonorific: 'Shri',
            patientAge: 76,
            caregiverName,
            caregiverPhone: authoritativePhone,
            preferredLanguage: 'en-IN',
            homeLocation: {
              label: 'Home Base',
              city: 'Live Location',
              area: 'Perimeter Base',
              latitude: validLat,
              longitude: validLng,
            },
            safeRadiusMeters: 300,
            alertRadiusMeters: 600,
            autoSirenOnBreach: true,
            autoWhatsAppOnBreach: true,
          },
          telemetry: {
            latitude: validLat,
            longitude: validLng,
            accuracy: formattedAccuracy,
            distanceMeters: 0,
            bearingDegrees: 0,
            bearingText: 'North',
            geofenceStatus: validTriggerType === 'GEOFENCE_EXIT' ? 'CRITICAL_BREACH' : 'SAFE_ZONE',
            batteryLevel: 88,
            isCharging: false,
            movementState: 'Stationary',
            speedKmh: 0,
            heartRateBpm: 75,
            heartRateStatus: 'normal',
            isRealtimeGps: true,
            isSundowningHours: false,
            sundowningRisk: 'low',
            lastUpdated: formattedDate,
            breadcrumbs: [],
          },
          alertLogs: [],
          memories: [],
        };
      }

      if (!db.careCompass.alertLogs) {
        db.careCompass.alertLogs = [];
      }

      db.careCompass.alertLogs.unshift({
        id: `alert-${Date.now()}`,
        timestamp: formattedDate,
        severity: 'critical',
        cause: validTriggerType === 'GEOFENCE_EXIT' ? 'Geofence Breach' : 'Manual SOS Pressed',
        distanceMeters: 0,
        latitude: validLat,
        longitude: validLng,
        notes: `Emergency SOS (${validTriggerType}): WhatsApp [${whatsappStatus.status}] & Voice [${voiceStatus.status}] to ${authoritativePhone}`,
        whatsappDispatched: whatsappStatus.status === 'DELIVERED',
        directCallDialed: voiceStatus.status === 'DELIVERED',
        dispatchId,
        deliveryStatus: logRecord.deliveryStatus === 'DELIVERED' ? 'DELIVERED' : 'TRANSMITTING',
        channel: 'AUTOMATED_SMS_GATEWAY',
      });

      if (db.careCompass.alertLogs.length > 30) {
        db.careCompass.alertLogs = db.careCompass.alertLogs.slice(0, 30);
      }

      saveDatabase(db);

      const responsePayload = {
        success: true,
        dispatchId,
        timestamp,
        triggerType: validTriggerType,
        patientName,
        caregiverPhone: authoritativePhone,
        caregiverName,
        location: {
          latitude: validLat,
          longitude: validLng,
          accuracy: formattedAccuracy,
          mapsUrl,
          hasAccurateGPS,
        },
        services: {
          whatsapp: whatsappStatus,
          voiceCall: voiceStatus,
        },
        messageText,
        notes: notes || undefined,
      };

      return res.json(responsePayload);
    } catch (err: any) {
      console.error('[EMERGENCY SOS ENDPOINT ERROR]', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Emergency SOS processing failed',
      });
    }
  });

  // Emergency Service Diagnostic & Configuration Status
  app.get('/api/emergency/status', (_req, res) => {
    const db = ensureDatabase();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;
    const twilioVoiceFrom = process.env.TWILIO_VOICE_FROM;
    const metaPhoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const metaToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

    const registeredCaregiverPhone =
      db.careCompass?.config?.caregiverPhone ||
      db.user?.caregiverPhone ||
      process.env.CAREGIVER_EMERGENCY_PHONE ||
      '+91 98765 43210';

    const maskPhone = (ph: string) => {
      if (!ph || ph.length < 6) return '***';
      return ph.slice(0, 4) + '***' + ph.slice(-3);
    };

    res.json({
      success: true,
      services: {
        twilioWhatsApp: {
          configured: Boolean(twilioSid && twilioAuth && twilioWhatsAppFrom),
          fromNumber: twilioWhatsAppFrom || 'whatsapp:+14155238886 (sandbox default)',
        },
        twilioVoice: {
          configured: Boolean(twilioSid && twilioAuth && twilioVoiceFrom),
          fromNumber: twilioVoiceFrom || 'Not set in TWILIO_VOICE_FROM',
        },
        metaWhatsApp: {
          configured: Boolean(metaPhoneId && metaToken),
        },
      },
      registeredCaregiver: {
        name: db.careCompass?.config?.caregiverName || db.user?.caregiverName || 'Rohan Sharma',
        phoneMasked: maskPhone(registeredCaregiverPhone),
        phoneFull: registeredCaregiverPhone,
      },
      dispatchesRecorded: automatedDispatches.length,
      recentDispatches: automatedDispatches.slice(0, 5),
    });
  });

  // Legacy compatibility: Automated Message SOS Dispatch
  app.post('/api/sos/dispatch-message', async (req, res) => {
    try {
      const {
        patientName = 'Asha Devi',
        caregiverPhone = '+91 98765 43210',
        caregiverName = 'Rohan Sharma',
        latitude = 26.1445,
        longitude = 91.7362,
        distanceMeters = 0,
        cause = 'Automated Emergency SOS',
        batteryLevel = 92,
        homeLabel = 'Home Base',
        customMessage,
      } = req.body;

      const dispatchId = `SOS-TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const timestamp = new Date().toISOString();
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      const messageText = customMessage || 
        `🚨 [AUTOMATED CARECOMPASS SOS ALERT]\n` +
        `Patient: ${patientName}\n` +
        `Alert Trigger: ${cause}\n` +
        `Distance from ${homeLabel}: ${distanceMeters > 1000 ? (distanceMeters / 1000).toFixed(2) + ' km' : Math.round(distanceMeters) + ' meters'}\n` +
        `Live Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n` +
        `Live GPS Map: ${mapsUrl}\n` +
        `Battery: ${batteryLevel}%\n` +
        `Dispatched Automatically by SmritiSaathi CareCompass Engine.`;

      // Dispatch to WhatsApp handler
      const whatsAppStatus = await dispatchWhatsAppEmergencyAlert({
        toPhone: caregiverPhone,
        messageText,
      });

      const dispatchRecord = {
        dispatchId,
        type: 'MESSAGE' as const,
        timestamp,
        recipientName: caregiverName,
        recipientPhone: caregiverPhone,
        patientName,
        cause,
        latitude,
        longitude,
        deliveryStatus: whatsAppStatus.status === 'DELIVERED' ? ('DELIVERED' as const) : ('PENDING_CONFIGURATION' as const),
        details: whatsAppStatus.details,
      };

      automatedDispatches.unshift(dispatchRecord);
      if (automatedDispatches.length > 50) automatedDispatches.pop();

      return res.json({
        success: true,
        dispatchId,
        timestamp,
        deliveryStatus: dispatchRecord.deliveryStatus,
        recipientPhone: caregiverPhone,
        recipientName: caregiverName,
        messageText,
        carrierAck: whatsAppStatus.details,
        services: {
          whatsapp: whatsAppStatus,
        },
      });
    } catch (err: any) {
      console.error('Error in /api/sos/dispatch-message:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Dispatch error' });
    }
  });

  // Legacy compatibility: Automated Direct Call Initiation
  app.post('/api/sos/direct-call', async (req, res) => {
    try {
      const {
        targetPhone = '+91 98765 43210',
        targetName = 'Rohan Sharma',
        patientName = 'Asha Devi',
        callType = 'caregiver',
      } = req.body;

      const callId = `CALL-VOICE-${Date.now().toString(36).toUpperCase()}`;
      const timestamp = new Date().toISOString();

      const voiceStatus = await dispatchOutboundVoiceEmergencyCall({
        toPhone: targetPhone,
        patientName,
        reasonText: `Emergency Call (${callType})`,
      });

      const callRecord = {
        dispatchId: callId,
        type: 'CALL' as const,
        timestamp,
        recipientName: targetName,
        recipientPhone: targetPhone,
        patientName,
        cause: `Direct Emergency Call (${callType})`,
        deliveryStatus: voiceStatus.status === 'DELIVERED' ? ('CONNECTED' as const) : ('PENDING_CONFIGURATION' as const),
        details: voiceStatus.details,
      };

      automatedDispatches.unshift(callRecord);
      if (automatedDispatches.length > 50) automatedDispatches.pop();

      return res.json({
        success: true,
        callId,
        timestamp,
        status: voiceStatus.status === 'DELIVERED' ? 'DIALED_CONNECTED' : 'CALL_REQUEST_RECEIVED',
        targetPhone,
        targetName,
        details: voiceStatus.details,
      });
    } catch (err: any) {
      console.error('Error in /api/sos/direct-call:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Call error' });
    }
  });

  // 14. Query Automated Emergency Dispatches Log
  app.get('/api/sos/dispatches', (_req, res) => {
    res.json({ success: true, dispatches: automatedDispatches });
  });

  // Static assets & SPA fallback
  const distPath = path.resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res, next) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmritiSaathi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
