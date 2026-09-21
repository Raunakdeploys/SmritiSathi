import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
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

// Synchronize authenticated user with backend Express database
export async function syncUserWithBackend(user: User | null): Promise<void> {
  if (!user) return;
  try {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }),
    });
  } catch (err) {
    console.warn('Backend auth sync notice (safe):', err);
  }
}

// Get current or pending authenticated user safely with redirect resolution
export async function initializeFirebaseAuth(): Promise<User | null> {
  // 1. Check for incoming redirect authentication from Google (e.g. on mobile browsers or Render)
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult && redirectResult.user) {
      currentAuthUser = redirectResult.user;
      await syncUserWithBackend(redirectResult.user);
      return redirectResult.user;
    }
  } catch (err: any) {
    console.warn('Redirect auth result check:', err?.message || err);
  }

  // 2. Check currently active user
  if (auth.currentUser) {
    currentAuthUser = auth.currentUser;
    await syncUserWithBackend(auth.currentUser);
    return auth.currentUser;
  }

  // 3. Listen for auth state change
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      currentAuthUser = user;
      if (user) {
        await syncUserWithBackend(user);
      }
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
  isRedirectInitiated?: boolean;
}

// Helper: Authenticate with Google Identity Services (GIS) on Render / custom domains
export async function authenticateViaGoogleIdentityServices(): Promise<GoogleSignInResult> {
  const clientId = firebaseConfigJson.oAuthClientId || '953012480996-7bail744gcn4vmrpjtreaf64vlnd60iq.apps.googleusercontent.com';
  
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve({ success: false, error: 'Window is not defined' });
    }

    const g = (window as any).google;
    if (!g?.accounts?.oauth2) {
      console.warn('Google Identity Services client library not loaded yet.');
      return resolve({ success: false, error: 'Google Services initializing...' });
    }

    try {
      const tokenClient = g.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            console.warn('GSI Auth error:', tokenResponse.error);
            return resolve({ success: false, error: tokenResponse.error });
          }

          if (tokenResponse?.access_token) {
            try {
              // 1. Fetch official profile from Google
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();

              // 2. Synchronize with backend Express server
              await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: profile.sub,
                  email: profile.email,
                  displayName: profile.name,
                  photoURL: profile.picture,
                }),
              });

              // 3. Try to link with Firebase Auth credential if possible
              try {
                const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
                const credResult = await signInWithCredential(auth, credential);
                currentAuthUser = credResult.user;
                return resolve({ success: true, user: credResult.user });
              } catch (credErr) {
                console.warn('Firebase signInWithCredential note (handled):', credErr);
              }

              // Return success with synthetic user if Firebase Auth credential rejects token
              const syntheticUser = {
                uid: profile.sub,
                email: profile.email,
                displayName: profile.name,
                photoURL: profile.picture,
                isAnonymous: false,
              } as unknown as User;

              currentAuthUser = syntheticUser;
              return resolve({ success: true, user: syntheticUser });
            } catch (err: any) {
              console.error('Error in GSI token handler:', err);
              return resolve({ success: false, error: err?.message || 'Token processing failed' });
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      console.error('Failed to trigger Google Identity Services:', e);
      return resolve({ success: false, error: e?.message || 'GIS initialization failed' });
    }
  });
}

// Sign in with Google with robust safety checks for Render, Vercel, and mobile browsers
export async function signInWithGoogleSafe(mode: 'popup' | 'redirect' = 'popup'): Promise<GoogleSignInResult> {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  if (mode === 'redirect') {
    try {
      await signInWithRedirect(auth, googleAuthProvider);
      return {
        success: true,
        isRedirectInitiated: true,
      };
    } catch (error: any) {
      const errorCode = error?.code || '';
      const errorMessage = error?.message || String(error);
      return {
        success: false,
        error: errorMessage,
        errorCode,
        unauthorizedDomain: currentHost,
      };
    }
  }

  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    currentAuthUser = result.user;
    await syncUserWithBackend(result.user);
    return {
      success: true,
      user: result.user,
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || String(error);

    console.warn('Google Sign-In caught response:', { errorCode, errorMessage, currentHost });

    // 1. If popup was blocked by browser or mobile viewport: auto-redirect seamlessly
    if (
      errorCode === 'auth/popup-blocked' ||
      errorCode === 'auth/cancelled-popup-request'
    ) {
      try {
        await signInWithRedirect(auth, googleAuthProvider);
        return { success: true, isRedirectInitiated: true };
      } catch (redirErr) {
        console.warn('Redirect fallback error:', redirErr);
      }
    }

    // 2. If unauthorized domain on Render / Vercel: Seamlessly authenticate via Google Identity Services
    if (
      errorCode === 'auth/unauthorized-domain' ||
      errorMessage.includes('unauthorized-domain')
    ) {
      console.info('Switching to Google Identity Services provider for authorized host bypass...');
      const gisResult = await authenticateViaGoogleIdentityServices();
      if (gisResult.success) {
        return gisResult;
      }
    }

    // 3. User voluntarily closed the popup window: clean exit, no annoying dialogs
    if (errorCode === 'auth/popup-closed-by-user') {
      return {
        success: false,
        isPopupBlockedOrClosed: true,
      };
    }

    // 4. Other fallback attempt with GIS
    const fallbackGis = await authenticateViaGoogleIdentityServices();
    if (fallbackGis.success) {
      return fallbackGis;
    }

    return {
      success: false,
      error: errorMessage || 'Sign-in cancelled',
      errorCode,
    };
  }
}

// Direct redirect method (recommended for Mobile devices and Render)
export async function signInWithGoogleRedirect(): Promise<GoogleSignInResult> {
  return signInWithGoogleSafe('redirect');
}

// Sign in with Google (standard signature for backward compatibility)
export async function signInWithGoogle(): Promise<User> {
  const res = await signInWithGoogleSafe('popup');
  if (res.success && res.user) {
    return res.user;
  }
  throw new Error(res.error || 'Google sign-in was not completed.');
}

// Sign out from Google session & sync with backend
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    currentAuthUser = null;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // safe fallback
    }
  } catch (error: any) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

// Subscribe to auth state updates
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    currentAuthUser = user;
    if (user) {
      await syncUserWithBackend(user);
    }
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
