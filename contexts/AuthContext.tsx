import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // DEMO MODE: Check for stored "fake" session
      const storedUser = localStorage.getItem('fai_demo_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return () => {};
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // DEMO MODE LOGIN
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const demoUser = { 
        uid: 'demo-user-' + Date.now(), 
        email: email, 
        emailVerified: true, 
        isAnonymous: false, 
        metadata: {}, 
        providerData: [], 
        refreshToken: '', 
        tenantId: null, 
        delete: async () => {}, 
        getIdToken: async () => '', 
        getIdTokenResult: async () => ({} as any), 
        reload: async () => {}, 
        toJSON: () => ({}), 
        displayName: 'Demo Admin', 
        phoneNumber: null, 
        photoURL: null, 
        providerId: 'password'
      } as unknown as User;
      
      localStorage.setItem('fai_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
    }
  };

  const register = async (email: string, pass: string) => {
    if (auth) {
      await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      await login(email, pass); // Reuse logic for demo
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      localStorage.removeItem('fai_demo_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
