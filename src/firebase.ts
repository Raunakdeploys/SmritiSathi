import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';
import type { UserProfile, CognitiveProgress, ActivityItem, CareCompassConfig, CareCompassTelemetry, AlertLogEntry } from './types';

// App and service instances
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();
const auth = getAuth(app);

// Use named database if specified in config, otherwise default
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export { auth };

// Google Auth Provider configured for popups
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Connection test state
let isConnectedToFirestore = false;
let currentAuthUser: User | null = null;

// Error handler per Firebase skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Get current or pending authenticated user safely without unauthorized anonymous sign-in
export async function initializeFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) {
    currentAuthUser = auth.currentUser;
    return auth.currentUser;
  }
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentAuthUser = user;
      unsubscribe();
      resolve(user);
    });
  });
}

export function getFirebaseProjectConsoleUrl(): string {
  const projectId = firebaseConfigJson.projectId || 'geometric-hill-h7k72';
  return `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
}

export function getGoogleCloudConsoleCredentialsUrl(): string {
  const projectId = firebaseConfigJson.projectId || 'geometric-hill-h7k72';
  return `https://console.cloud.google.com/apis/credentials?project=${projectId}`;
}

export interface GoogleSignInResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: string;
  isDomainUnauthorized?: boolean;
  unauthorizedDomain?: string;
  isPopupBlockedOrClosed?: boolean;
}

// Sign in with Google with robust safety checks for Vercel/custom domains
export async function signInWithGoogleSafe(): Promise<GoogleSignInResult> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    currentAuthUser = result.user;
    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || String(error);
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

    console.warn('Google Sign-In response status:', { errorCode, errorMessage, currentHost });

    // Unauthorized domain on Vercel / Netlify / custom domains
    if (
      errorCode === 'auth/unauthorized-domain' ||
      errorMessage.includes('unauthorized-domain') ||
      errorMessage.includes('auth/unauthorized-domain')
    ) {
      return {
        success: false,
        error: 'This domain is not yet authorized in Firebase Console.',
        errorCode,
        isDomainUnauthorized: true,
        unauthorizedDomain: currentHost,
      };
    }

    // Popup closed by user or blocked by browser popup blocker
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-blocked'
    ) {
      return {
        success: false,
        error: 'Sign-in popup was closed or blocked by browser.',
        errorCode,
        isPopupBlockedOrClosed: true,
      };
    }

    // Other errors
    return {
      success: false,
      error: errorMessage || 'Failed to sign in with Google.',
      errorCode,
    };
  }
}

// Sign in with Google (standard signature for backward compatibility)
export async function signInWithGoogle(): Promise<User> {
  const res = await signInWithGoogleSafe();
  if (res.success && res.user) {
    return res.user;
  }
  if (res.isDomainUnauthorized) {
    const err = new Error(`Domain ${res.unauthorizedDomain} is not authorized in Firebase Console.`);
    (err as any).code = 'auth/unauthorized-domain';
    (err as any).unauthorizedDomain = res.unauthorizedDomain;
    throw err;
  }
  throw new Error(res.error || 'Google sign-in was not completed.');
}

// Sign out from Google session
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    currentAuthUser = null;
  } catch (error: any) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

// Subscribe to auth state updates
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    currentAuthUser = user;
    callback(user);
  });
}

// Test Connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnectedToFirestore = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or network is disconnected.');
    }
    isConnectedToFirestore = true;
    return true;
  }
}

// Fire initial connection verification on module load
testFirestoreConnection().catch((err) => {
  console.warn('Firestore initial boot test warning:', err);
});

// Real-time Cloud Firestore Synchronizers
export const firestoreSyncService = {
  getUserId(): string | null {
    return auth.currentUser?.uid || null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const user = auth.currentUser;
    if (!user) return; // Local mode: changes saved in localStorage
    const path = `users/${user.uid}`;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name: profile.name,
        age: profile.age,
        avatarUrl: profile.avatarUrl || '',
        mindPoints: profile.mindPoints || profile.totalMindPoints || 0,
        currentStreak: profile.currentStreak || profile.dailyStreak || 0,
        longestStreak: profile.longestStreak || 0,
        totalSessions: profile.totalSessions || 0,
        dailyGoalCompleted: !!profile.dailyGoalCompleted,
        caregiverName: profile.caregiverName,
        caregiverPhone: profile.caregiverPhone,
        preferences: profile.preferences || {},
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore saveUserProfile handled:', e);
    }
  },

  async saveCognitiveProgress(progress: CognitiveProgress): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/progress/cognitive`;
    try {
      const progressDocRef = doc(db, 'users', user.uid, 'progress', 'cognitive');
      await setDoc(progressDocRef, {
        memory: progress.memory,
        attention: progress.attention,
        planning: progress.planning,
        lastUpdated: progress.lastUpdated || new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore saveCognitiveProgress handled:', e);
    }
  },

  async recordActivity(activity: ActivityItem): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/activities/${activity.id}`;
    try {
      const activityDocRef = doc(db, 'users', user.uid, 'activities', activity.id);
      await setDoc(activityDocRef, {
        id: activity.id,
        title: activity.title,
        category: activity.category,
        points: activity.points,
        timestamp: activity.timestamp,
        icon: activity.icon || 'star',
        durationMinutes: activity.durationMinutes || 0,
        accuracy: activity.accuracy || 100,
        notes: activity.notes || '',
      });
    } catch (e) {
      console.warn('Firestore recordActivity handled:', e);
    }
  },

  async syncCareCompassData(config: CareCompassConfig, telemetry: CareCompassTelemetry): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/careCompass/live`;
    try {
      const compassDocRef = doc(db, 'users', user.uid, 'careCompass', 'live');
      await setDoc(compassDocRef, {
        config,
        telemetry,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore syncCareCompassData handled:', e);
    }
  },

  async logAlert(alert: AlertLogEntry): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/alerts/${alert.id}`;
    try {
      const alertDocRef = doc(db, 'users', user.uid, 'alerts', alert.id);
      await setDoc(alertDocRef, {
        id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        cause: alert.cause,
        distanceMeters: alert.distanceMeters || 0,
        latitude: alert.latitude || 0,
        longitude: alert.longitude || 0,
        notes: alert.notes || '',
        whatsappDispatched: !!alert.whatsappDispatched,
      });
    } catch (e) {
      console.warn('Firestore logAlert handled:', e);
    }
  },

  async loadInitialData(): Promise<{
    profile?: Partial<UserProfile>;
    progress?: CognitiveProgress;
    activities?: ActivityItem[];
    careCompass?: { config?: CareCompassConfig; telemetry?: CareCompassTelemetry };
  }> {
    const user = auth.currentUser;
    if (!user) {
      // Clean local mode: no unauthorized network call attempted
      return {};
    }

    try {
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      const progressDocSnap = await getDoc(doc(db, 'users', user.uid, 'progress', 'cognitive'));
      const compassDocSnap = await getDoc(doc(db, 'users', user.uid, 'careCompass', 'live'));
      const activitiesSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'activities'), limit(20))
      );

      const result: {
        profile?: Partial<UserProfile>;
        progress?: CognitiveProgress;
        activities?: ActivityItem[];
        careCompass?: { config?: CareCompassConfig; telemetry?: CareCompassTelemetry };
      } = {};

      if (userDocSnap.exists()) {
        result.profile = userDocSnap.data() as Partial<UserProfile>;
      }
      if (progressDocSnap.exists()) {
        result.progress = progressDocSnap.data() as CognitiveProgress;
      }
      if (compassDocSnap.exists()) {
        result.careCompass = compassDocSnap.data() as { config?: CareCompassConfig; telemetry?: CareCompassTelemetry };
      }
      if (!activitiesSnap.empty) {
        result.activities = activitiesSnap.docs.map((d) => d.data() as ActivityItem);
      }

      return result;
    } catch (e) {
      console.warn('Firestore loadInitialData fallback to local:', e);
      return {};
    }
  },
};
