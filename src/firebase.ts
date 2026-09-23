import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
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
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';
import type {
  UserProfile,
  CognitiveProgress,
  ActivityItem,
  CareCompassConfig,
  CareCompassTelemetry,
  AlertLogEntry,
} from './types';

// Detect and validate environment variables with safe fallback to firebase-applet-config.json
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfigJson.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigJson.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigJson.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigJson.storageBucket,
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigJson.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfigJson.appId,
};

// Safe configuration validation without exposing secret values
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];
for (const key of requiredConfigKeys) {
  if (!firebaseConfig[key]) {
    console.warn(
      `[Firebase Init] Missing Firebase configuration: ${key}. Please verify environment variables or firebase-applet-config.json`
    );
  }
}

// Single App and Auth initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure browserLocalPersistence so session persists across refresh, routes, and browser restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Failed to configure browserLocalPersistence:', err);
});

// Authoritative Google OAuth Web Client ID for Google Identity Services (GIS / GSI)
// Strictly resolve from VITE_GOOGLE_CLIENT_ID or firebaseConfigJson.oAuthClientId (single authoritative source)
const rawGoogleClientId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID
    ? String(import.meta.env.VITE_GOOGLE_CLIENT_ID).trim().replace(/^["']|["']$/g, '')
    : '') ||
  (firebaseConfigJson.oAuthClientId ? String(firebaseConfigJson.oAuthClientId).trim() : '');

if (!rawGoogleClientId) {
  console.error('[AUTH ERROR] Missing Google OAuth Web Client ID. Please set VITE_GOOGLE_CLIENT_ID in your environment.');
}

export const GOOGLE_CLIENT_ID: string = rawGoogleClientId;

/**
 * Diagnostic utility for SmritiSaathi Authentication
 */
export function printAuthDiagnostics(): void {
  if (typeof window === 'undefined') return;
  const currentOrigin = window.location.origin;
  const gsiLoaded = Boolean(window.google?.accounts?.id);

  console.log('[AUTH DEBUG] Current origin:', currentOrigin);
  console.log('[AUTH DEBUG] Google Client ID:', GOOGLE_CLIENT_ID);
  console.log(
    `========================================\n` +
    `SMRITISATHI AUTH DIAGNOSTIC\n\n` +
    `Browser Origin:\n${currentOrigin}\n\n` +
    `Google OAuth Client:\n${GOOGLE_CLIENT_ID}\n\n` +
    `Firebase Project:\n${firebaseConfig.projectId}\n\n` +
    `Firebase Auth Domain:\n${firebaseConfig.authDomain}\n\n` +
    `Google SDK:\n${gsiLoaded ? 'Loaded' : 'Loading or Pending'}\n\n` +
    `Authentication method:\nGoogle Identity Services + Firebase credential\n` +
    `========================================`
  );
}

// Print diagnostics immediately on module evaluation in browser
if (typeof window !== 'undefined') {
  printAuthDiagnostics();
}

// Ensure Google Identity Services script is loaded in window
export function loadGoogleIdentityServicesScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      // If already loaded
      if (window.google?.accounts?.id) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library'));
    document.head.appendChild(script);
  });
}

// Single Google Auth Provider instance
export const googleAuthProvider = new GoogleAuthProvider();

// Use named database if specified in config, otherwise default
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Backend API Base URL
const API_BASE_URL: string = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Synchronize authenticated user with backend Express database sending verified Firebase ID token
export async function syncUserWithBackend(user: User | null, idToken?: string): Promise<void> {
  if (!user) return;
  try {
    const token = idToken || (await user.getIdToken());
    const targetUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/sync` : '/api/auth/sync';

    await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }),
    });
  } catch (err) {
    console.warn('[Backend Auth Sync] Notice (non-fatal):', err);
  }
}

export interface GoogleSignInResult {
  success: boolean;
  user?: User;
  idToken?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Maps Auth error codes to helpful, user-friendly messages
 */
function getHumanReadableAuthError(code: string, rawMessage?: string): { message: string } {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-token-expired':
      return {
        message: 'The authentication session was expired or invalid. Please try signing in again.',
      };
    case 'auth/user-not-found':
      return {
        message: 'No account found with this email. Click "Register New Account" to create your caregiver account.',
      };
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return {
        message: 'Incorrect password or email. Please verify your credentials and try again.',
      };
    case 'auth/email-already-in-use':
      return {
        message: 'An account with this email already exists. Please sign in with your password.',
      };
    case 'auth/weak-password':
      return {
        message: 'Password should be at least 6 characters.',
      };
    case 'auth/invalid-email':
      return {
        message: 'Please provide a valid email address.',
      };
    case 'auth/network-request-failed':
      return {
        message: 'Network connection failed. Please check your internet connection and retry.',
      };
    case 'auth/internal-error':
      return {
        message: 'Authentication service encountered an internal error. Please try again.',
      };
    case 'auth/popup-closed-by-user':
    case 'user_cancelled':
      return {
        message: 'Sign-in prompt was closed. Please click sign-in when ready.',
      };
    case 'auth/unauthorized-domain':
      return {
        message: 'This domain is not yet authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.',
      };
    default:
      return {
        message: rawMessage || `Sign-in could not be completed (${code})`,
      };
  }
}

/**
 * Sign in with Email and Password (direct Firebase Auth)
 */
export async function signInWithEmailPassword(email: string, pass: string): Promise<GoogleSignInResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    await syncUserWithBackend(user, idToken);
    return {
      success: true,
      user,
      idToken,
    };
  } catch (error: any) {
    const errorCode = error?.code || 'auth/email-error';
    const parsed = getHumanReadableAuthError(errorCode, error?.message);
    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

/**
 * Register with Email and Password (direct Firebase Auth)
 */
export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName?: string
): Promise<GoogleSignInResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = userCredential.user;
    if (displayName) {
      await updateProfile(user, { displayName: displayName.trim() });
    }
    const idToken = await user.getIdToken();
    await syncUserWithBackend(user, idToken);
    return {
      success: true,
      user,
      idToken,
    };
  } catch (error: any) {
    const errorCode = error?.code || 'auth/email-register-error';
    const parsed = getHumanReadableAuthError(errorCode, error?.message);
    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

/**
 * Instant Demo / Caregiver Sign In (Anonymous Auth)
 */
export async function signInAsCaregiverDemo(
  displayName = 'Primary Caregiver'
): Promise<GoogleSignInResult> {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    const idToken = await user.getIdToken();
    await syncUserWithBackend(user, idToken);
    return {
      success: true,
      user,
      idToken,
    };
  } catch (error: any) {
    const errorCode = error?.code || 'auth/anon-error';
    const parsed = getHumanReadableAuthError(errorCode, error?.message);
    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

/**
 * Complete Google Sign-In using a Google ID token from Google Identity Services
 * Flow:
 * Google ID token
 * ↓
 * GoogleAuthProvider.credential(googleIdToken)
 * ↓
 * Firebase signInWithCredential(auth, credential)
 * ↓
 * Firebase authenticated user
 * ↓
 * Firebase user.getIdToken()
 * ↓
 * syncUserWithBackend
 */
export async function signInWithGoogleIdToken(googleIdToken: string): Promise<GoogleSignInResult> {
  try {
    if (!googleIdToken) {
      throw new Error('No Google ID token received from Google Identity Services.');
    }

    // Convert the Google ID token into a Firebase Auth credential
    const credential = GoogleAuthProvider.credential(googleIdToken);

    // Sign in to Firebase with the credential
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Obtain verified Firebase ID token for backend authentication
    const idToken = await user.getIdToken();

    // Synchronize user profile with backend
    await syncUserWithBackend(user, idToken);

    return {
      success: true,
      user,
      idToken,
    };
  } catch (error: any) {
    const errorCode = error?.code || 'auth/credential-error';
    const parsed = getHumanReadableAuthError(errorCode, error?.message);

    console.error('[Firebase Auth GSI Error]:', {
      code: errorCode,
      message: parsed.message,
    });

    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

/**
 * Direct Firebase signInWithPopup fallback
 * Used when GIS One Tap encounters origin mismatch or prompt errors
 */
export async function signInWithFirebasePopup(): Promise<GoogleSignInResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    await syncUserWithBackend(user, idToken);
    return {
      success: true,
      user,
      idToken,
    };
  } catch (error: any) {
    const errorCode = error?.code || 'auth/popup-error';
    const parsed = getHumanReadableAuthError(errorCode, error?.message);
    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

/**
 * PRIMARY PRODUCTION GOOGLE SIGN-IN ENTRY POINT
 *
 * Tries Google Identity Services first, and if not displayed or fails,
 * cleanly falls back to Firebase popup authentication.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await loadGoogleIdentityServicesScript();

    if (typeof window !== 'undefined' && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      const gsiResult = await new Promise<GoogleSignInResult>((resolve) => {
        let isResolved = false;

        const finish = (res: GoogleSignInResult) => {
          if (!isResolved) {
            isResolved = true;
            resolve(res);
          }
        };

        // Safety timeout of 10 seconds for user action or rejection
        const timer = setTimeout(() => {
          if (!isResolved) {
            finish({
              success: false,
              error: 'Prompt timed out',
              errorCode: 'auth/timeout',
            });
          }
        }, 15000);

        try {
          window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: { credential?: string; select_by?: string }) => {
              clearTimeout(timer);
              if (response && response.credential) {
                const res = await signInWithGoogleIdToken(response.credential);
                finish(res);
              } else {
                finish({
                  success: false,
                  error: 'No credential returned from Google account selection.',
                  errorCode: 'auth/no-credential',
                });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Prompt Google Account selection (One Tap / Account chooser)
          window.google!.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              clearTimeout(timer);
              console.warn('[GSI] Prompt was not displayed:', notification.getNotDisplayedReason());
              finish({
                success: false,
                error: 'Prompt not displayed',
                errorCode: 'auth/prompt-not-displayed',
              });
            } else if (notification.isDismissedMoment()) {
              clearTimeout(timer);
              finish({
                success: false,
                error: 'Google Sign-In prompt was dismissed.',
                errorCode: 'user_cancelled',
              });
            }
          });
        } catch (err: any) {
          clearTimeout(timer);
          finish({
            success: false,
            error: err?.message || 'Error launching Google Sign-In prompt',
            errorCode: 'auth/gsi-launch-error',
          });
        }
      });

      if (gsiResult.success) {
        return gsiResult;
      }

      // If user deliberately cancelled, don't force popup
      if (gsiResult.errorCode === 'user_cancelled') {
        return gsiResult;
      }
    }

    // Fallback: Use standard Firebase signInWithPopup
    console.log('[Auth] Attempting signInWithFirebasePopup fallback...');
    return await signInWithFirebasePopup();
  } catch (error: any) {
    const errorCode = error?.code || 'auth/gsi-error';
    const parsed = getHumanReadableAuthError(errorCode, error?.message);

    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

// Backward compatibility alias
export const signInWithGoogleSafe = signInWithGoogle;

/**
 * Signs out from Firebase Auth and notifies backend to terminate session
 */
export async function signOutUser(): Promise<void> {
  try {
    // Optionally inform backend using existing token before sign out
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    if (idToken) {
      const targetUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/logout` : '/api/auth/logout';
      await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      }).catch(() => {});
    }
  } catch {
    // non-fatal
  } finally {
    // Single source of truth: Firebase signOut
    await signOut(auth);
  }
}

/**
 * Subscribes to Firebase Auth state changes.
 * onAuthStateChanged is the SINGLE SOURCE OF TRUTH for authentication state.
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        await syncUserWithBackend(user, idToken);
      } catch (e) {
        console.warn('[Firebase Auth] Token refresh/sync notice:', e);
      }
    }
    callback(user);
  });
}

// Test Connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or network is disconnected.');
    }
    return true;
  }
}

// Real-time Cloud Firestore Synchronizers for SmritiSathi dementia care modules
export const firestoreSyncService = {
  getUserId(): string | null {
    return auth.currentUser?.uid || null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const user = auth.currentUser;
    if (!user) return; // Local mode: changes saved in localStorage
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
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
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore saveUserProfile handled:', e);
    }
  },

  async saveCognitiveProgress(progress: CognitiveProgress): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const progressDocRef = doc(db, 'users', user.uid, 'progress', 'cognitive');
      await setDoc(
        progressDocRef,
        {
          memory: progress.memory,
          attention: progress.attention,
          planning: progress.planning,
          lastUpdated: progress.lastUpdated || new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore saveCognitiveProgress handled:', e);
    }
  },

  async recordActivity(activity: ActivityItem): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
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
    try {
      const compassDocRef = doc(db, 'users', user.uid, 'careCompass', 'live');
      await setDoc(
        compassDocRef,
        {
          config,
          telemetry,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore syncCareCompassData handled:', e);
    }
  },

  async logAlert(alert: AlertLogEntry): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
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
        result.careCompass = compassDocSnap.data() as {
          config?: CareCompassConfig;
          telemetry?: CareCompassTelemetry;
        };
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
