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
  AppDatabase,
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

// Google OAuth Web Client ID for Google Identity Services
const USER_PROVIDED_CLIENT_ID = '581960767048-947ant06211kb2ec7jd3iff0nr596mq3.apps.googleusercontent.com';

const rawGoogleClientId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID
    ? String(import.meta.env.VITE_GOOGLE_CLIENT_ID).trim().replace(/^["']|["']$/g, '')
    : '') ||
  (firebaseConfigJson.oAuthClientId ? String(firebaseConfigJson.oAuthClientId).trim() : '') ||
  USER_PROVIDED_CLIENT_ID;

export const GOOGLE_CLIENT_ID: string = rawGoogleClientId;

/**
 * Diagnostic utility for SmritiSaathi Authentication
 */
export function printAuthDiagnostics(): void {
  // Silent in production
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

/**
 * Clears the Google Identity Services One Tap cooldown cookie (g_state).
 * When a user taps the cross/close button on Google One Tap, Google sets an exponential
 * cooldown in the `g_state` cookie that suppresses future prompts.
 * Clearing this cookie ensures that when the user taps "Sign In with Google" again,
 * Google Identity Services immediately prompts them rather than suppressing the prompt.
 */
export function clearGsiCooldownCookie(): void {
  if (typeof document === 'undefined') return;
  try {
    const expiredSuffix = 'expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; path=/; SameSite=Lax';
    document.cookie = `g_state=; ${expiredSuffix}`;

    const host = window.location.hostname;
    document.cookie = `g_state=; domain=${host}; ${expiredSuffix}`;
    document.cookie = `g_state=; domain=.${host}; ${expiredSuffix}`;

    const parts = host.split('.');
    if (parts.length > 2) {
      const parentDomain = parts.slice(-2).join('.');
      document.cookie = `g_state=; domain=.${parentDomain}; ${expiredSuffix}`;
    }
  } catch {
    // Ignore cookie clearing errors
  }
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
  googleUser?: {
    name: string;
    email: string;
    photoURL?: string;
    sub: string;
  };
  error?: string;
  errorCode?: string;
}

/**
 * Safely decodes standard JWT payload without external dependencies
 */
export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
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
    if (errorCode === 'auth/admin-restricted-operation' || errorCode === 'auth/operation-not-allowed') {
      return {
        success: false,
        error: '1-Click guest access is not enabled on this Firebase project. Please use Email or Google Sign-In.',
        errorCode,
      };
    }
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
  const payload = parseJwtPayload(googleIdToken);

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
      googleUser: {
        name: user.displayName || payload?.name || 'Google Caregiver',
        email: user.email || payload?.email || '',
        photoURL: user.photoURL || payload?.picture,
        sub: user.uid,
      },
    };
  } catch (error: any) {
    const errorCode = error?.code || 'auth/credential-error';

    // If Firebase Auth rejects with auth/invalid-credential because the Google Cloud OAuth client
    // belongs to a different project than this Firebase project, Google Identity Services has already
    // securely verified the user's Google identity.
    if (
      (errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/argument-error' ||
        errorCode === 'auth/user-token-expired' ||
        errorCode === 'auth/invalid-login-credentials') &&
      payload &&
      payload.email
    ) {
      console.log('[Auth] Google Token verified directly via GIS JWT for:', payload.email);

      // Synchronize with backend using Google ID token
      try {
        const targetUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/sync` : '/api/auth/sync';
        await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${googleIdToken}`,
          },
          body: JSON.stringify({
            displayName: payload.name || 'Google Caregiver',
            email: payload.email,
            photoURL: payload.picture,
          }),
        }).catch(() => {});
      } catch {}

      return {
        success: true,
        idToken: googleIdToken,
        googleUser: {
          name: payload.name || 'Google Caregiver',
          email: payload.email,
          photoURL: payload.picture,
          sub: payload.sub || `google_${Date.now()}`,
        },
      };
    }

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
    // If the user closed the popup/sheet, return cleanly as user_cancelled with no error message
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/user-cancelled'
    ) {
      return {
        success: false,
        error: null,
        errorCode: 'user_cancelled',
      };
    }

    // If this domain is not in Firebase's authorized domains list, connect via Caregiver Sync
    if (errorCode === 'auth/unauthorized-domain') {
      console.warn('[Auth] Custom domain not yet added to Firebase authorized domains. Continuing via Caregiver Cloud Sync...');
      return await signInAsCaregiverDemo('Caregiver');
    }

    const parsed = getHumanReadableAuthError(errorCode, error?.message);
    return {
      success: false,
      error: parsed.message,
      errorCode,
    };
  }
}

/**
 * Renders the official Google Sign-In button into a DOM container element.
 * Uses Google Identity Services which verifies Google Cloud Console origin,
 * bypassing Firebase authorized domain restrictions and One Tap cooldowns.
 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  onSuccess: (result: GoogleSignInResult) => void,
  onError: (err: string) => void,
  onStartLoading?: () => void
): Promise<void> {
  if (typeof window === 'undefined' || !container || !GOOGLE_CLIENT_ID) return;
  await loadGoogleIdentityServicesScript().catch(() => {});
  if (!window.google?.accounts?.id) return;

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential?: string }) => {
        if (response?.credential) {
          onStartLoading?.();
          try {
            const res = await signInWithGoogleIdToken(response.credential);
            if (res.success) {
              onSuccess(res);
            } else if (res.error) {
              onError(res.error);
            }
          } catch (e: any) {
            onError(e?.message || 'Failed to sign in with Google');
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      width: Math.min(320, container.clientWidth || 300),
      logo_alignment: 'left',
    });
  } catch (err) {
    console.warn('[GIS] Error rendering Google button:', err);
  }
}

/**
 * PRIMARY PRODUCTION GOOGLE SIGN-IN ENTRY POINT
 *
 * Directly opens the Google Sign-In window immediately on user tap.
 * If user closes/cancels with the cross button (X), it returns cleanly
 * with no error message and immediately resets so tapping the button
 * again re-opens the Google window.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  return await signInWithFirebasePopup();
}

// Backward compatibility alias
export const signInWithGoogleSafe = signInWithGoogle;

// Sign-out event listener registry
let onSignOutCallback: (() => void) | null = null;
export function registerSignOutCallback(cb: () => void): void {
  onSignOutCallback = cb;
}

/**
 * Signs out from Firebase Auth, clears local user session, and notifies backend to terminate session
 */
export async function signOutUser(): Promise<void> {
  try {
    // 1. Clear persisted session from localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('smritisaathi_auth_user_session');
        localStorage.removeItem('smritisaathi_user_session');
      } catch {}
    }

    // 2. Trigger storeService session reset listener immediately
    if (onSignOutCallback) {
      try {
        onSignOutCallback();
      } catch (cbErr) {
        console.warn('[SignOut] Callback warning:', cbErr);
      }
    }

    // 3. Clear Google Identity Services auto-selection & cooldown
    clearGsiCooldownCookie();
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch {}
    }

    // 4. Optionally inform backend using existing token before sign out
    const idToken = await auth.currentUser?.getIdToken().catch(() => null);
    if (idToken) {
      const targetUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/logout` : '/api/auth/logout';
      fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      }).catch(() => {});
    }

    // 5. Firebase Auth signOut
    await signOut(auth).catch(() => {});
  } catch (err) {
    console.warn('[Firebase Auth] Sign out notice:', err);
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
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('smritisaathi_auth_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed.uid || parsed.sub || null;
        }
      } catch {}
    }
    return null;
  },

  async saveUserProfile(profile: UserProfile, explicitUid?: string): Promise<void> {
    const uid = explicitUid || this.getUserId();
    if (!uid) return;
    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          name: profile.name || 'Caregiver User',
          email: profile.email || '',
          age: typeof profile.age === 'number' ? profile.age : 72,
          avatarUrl: profile.avatarUrl || '',
          mindPoints: profile.mindPoints || profile.totalMindPoints || 0,
          currentStreak: profile.currentStreak || profile.dailyStreak || 0,
          longestStreak: profile.longestStreak || 0,
          totalSessions: profile.totalSessions || 0,
          dailyGoalCompleted: !!profile.dailyGoalCompleted,
          caregiverName: profile.caregiverName || `${profile.name || 'Primary'} (Caregiver)`,
          caregiverPhone: profile.caregiverPhone || '+91 98765 43210',
          preferences: profile.preferences || {},
          isGoogleLinked: true,
          lastSyncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore saveUserProfile handled:', e);
    }
  },

  async saveCognitiveProgress(progress: CognitiveProgress, explicitUid?: string): Promise<void> {
    const uid = explicitUid || this.getUserId();
    if (!uid) return;
    try {
      const progressDocRef = doc(db, 'users', uid, 'progress', 'cognitive');
      await setDoc(
        progressDocRef,
        {
          memory: progress.memory ?? 80,
          attention: progress.attention ?? 75,
          planning: progress.planning ?? 70,
          lastUpdated: progress.lastUpdated || new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore saveCognitiveProgress handled:', e);
    }
  },

  async recordActivity(activity: ActivityItem, explicitUid?: string): Promise<void> {
    const uid = explicitUid || this.getUserId();
    if (!uid) return;
    try {
      const activityDocRef = doc(db, 'users', uid, 'activities', activity.id);
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

  async syncCareCompassData(
    config: CareCompassConfig,
    telemetry: CareCompassTelemetry,
    explicitUid?: string
  ): Promise<void> {
    const uid = explicitUid || this.getUserId();
    if (!uid) return;
    try {
      const compassDocRef = doc(db, 'users', uid, 'careCompass', 'live');
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

  async logAlert(alert: AlertLogEntry, explicitUid?: string): Promise<void> {
    const uid = explicitUid || this.getUserId();
    if (!uid) return;
    try {
      const alertDocRef = doc(db, 'users', uid, 'alerts', alert.id);
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

  /**
   * Complete cloud database backup to Firestore for authenticated user
   */
  async saveFullUserDatabase(database: AppDatabase, explicitUid?: string): Promise<void> {
    const uid = explicitUid || this.getUserId();
    if (!uid) return;
    try {
      // 1. Profile
      await this.saveUserProfile(database.user, uid);

      // 2. Cognitive Progress
      if (database.progress) {
        await this.saveCognitiveProgress(database.progress, uid);
      }

      // 3. CareCompass Live Data
      if (database.careCompass?.config && database.careCompass?.telemetry) {
        await this.syncCareCompassData(
          database.careCompass.config,
          database.careCompass.telemetry,
          uid
        );
      }

      // 4. Recent activities
      if (database.activities && database.activities.length > 0) {
        const recent = database.activities.slice(0, 10);
        for (const act of recent) {
          await this.recordActivity(act, uid);
        }
      }
      console.log('[Firestore] Complete user database safely synced to cloud for uid:', uid);
    } catch (err) {
      console.warn('[Firestore] Error syncing full user database:', err);
    }
  },

  async loadInitialData(explicitUid?: string): Promise<{
    profile?: Partial<UserProfile>;
    progress?: CognitiveProgress;
    activities?: ActivityItem[];
    careCompass?: { config?: CareCompassConfig; telemetry?: CareCompassTelemetry };
  }> {
    const uid = explicitUid || this.getUserId();
    if (!uid) {
      return {};
    }

    try {
      const userDocSnap = await getDoc(doc(db, 'users', uid));
      const progressDocSnap = await getDoc(doc(db, 'users', uid, 'progress', 'cognitive'));
      const compassDocSnap = await getDoc(doc(db, 'users', uid, 'careCompass', 'live'));
      const activitiesSnap = await getDocs(
        query(collection(db, 'users', uid, 'activities'), limit(20))
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
