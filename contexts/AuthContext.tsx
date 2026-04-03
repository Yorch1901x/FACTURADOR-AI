
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import {
  onAuthStateChanged, User,
  signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword,
} from 'firebase/auth';
import { logger } from '../services/logger';
import { rateLimiter } from '../services/rateLimiter';
import { OrganizationService } from '../services/organizationService';
import { UserProfile } from '../types';

// ── Demo session helpers ─────────────────────────────────────────────────────
const DEMO_SESSION_KEY    = 'fai_demo_user';
const DEMO_EXPIRY_KEY     = 'fai_demo_expiry';
const DEMO_TTL_MS         = 8 * 60 * 60 * 1000; // 8 h

const loadDemoSession = (): User | null => {
  try {
    const expiry = localStorage.getItem(DEMO_EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      localStorage.removeItem(DEMO_EXPIRY_KEY);
      return null;
    }
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
};
const saveDemoSession = (u: User) => {
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(u));
    localStorage.setItem(DEMO_EXPIRY_KEY, String(Date.now() + DEMO_TTL_MS));
  } catch { /* storage full */ }
};
const clearDemoSession = () => {
  localStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem(DEMO_EXPIRY_KEY);
};

// ── Password validation ───────────────────────────────────────────────────────
export const validatePassword = (password: string): string | null => {
  if (password.length < 8)           return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password))       return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(password))       return 'La contraseña debe incluir al menos un número.';
  return null;
};

// ── Context types ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login:    (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout:   () => Promise<void>;
  /** Reload userProfile from Firestore (e.g. after joining an org) */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load userProfile from Firestore for a given Firebase user
  const loadProfile = async (firebaseUser: User): Promise<void> => {
    try {
      const profile = await OrganizationService.ensureUserProfile(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        firebaseUser.displayName ?? undefined,
      );
      setUserProfile(profile);
    } catch (err) {
      logger.error('AuthContext: Failed to load user profile', err);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    const profile = await OrganizationService.getUserProfile(user.uid);
    setUserProfile(profile);
  };

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          await loadProfile(firebaseUser);
          rateLimiter.reset();
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
      return unsub;
    } else {
      // Demo mode
      const demoUser = loadDemoSession();
      setUser(demoUser);
      if (demoUser) {
        setUserProfile({
          uid: demoUser.uid,
          email: demoUser.email ?? '',
          displayName: (demoUser as any).displayName ?? 'Demo Admin',
          organizationId: localStorage.getItem('fai_demo_orgId') || null,
          createdAt: new Date().toISOString(),
        });
      }
      setLoading(false);
      return () => {};
    }
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    if (rateLimiter.isBlocked()) {
      const secs = rateLimiter.secondsUntilReset();
      throw new Error(`TOO_MANY_ATTEMPTS:${Math.ceil(secs / 60)}`);
    }
    if (auth) {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        rateLimiter.reset();
      } catch (err) {
        rateLimiter.recordFailure();
        throw err;
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      const demoUser = {
        uid: 'demo-' + Date.now(), email, emailVerified: true, isAnonymous: false,
        metadata: {}, providerData: [], refreshToken: '', tenantId: null,
        delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any),
        reload: async () => {}, toJSON: () => ({}),
        displayName: 'Demo Admin', phoneNumber: null, photoURL: null, providerId: 'password',
      } as unknown as User;
      saveDemoSession(demoUser);
      setUser(demoUser);
      const orgId = localStorage.getItem('fai_demo_orgId');
      setUserProfile({
        uid: demoUser.uid, email, displayName: 'Demo Admin',
        organizationId: orgId, createdAt: new Date().toISOString(),
      });
      rateLimiter.reset();
    }
  };

  const register = async (email: string, pass: string): Promise<void> => {
    if (auth) {
      await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will fire → loadProfile will run
    } else {
      await login(email, pass);
    }
  };

  const logout = async (): Promise<void> => {
    if (auth) {
      await signOut(auth);
    } else {
      clearDemoSession();
      setUser(null);
      setUserProfile(null);
    }
    rateLimiter.reset();
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
