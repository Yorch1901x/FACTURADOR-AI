
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Configuración cargada desde import.meta.env (estándar de Vite)
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyDuLJ73U2GOQejjTL7gyArEjhJyhAsIgZ0",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "base-de-dato-crm.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "base-de-dato-crm",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "base-de-dato-crm.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1094020138496",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:1094020138496:web:b3393251da420e7ff57ae5",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-KBHQY0HVB1"
};

let app = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Intentar inicializar solo si la configuración mínima existe
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      getAnalytics(app);
    }
    console.log("✅ Firebase configurado correctamente.");
  } catch (error) {
    console.error("❌ Error en Firebase config:", error);
  }
} else {
  console.warn("⚠️ Firebase no configurado. Usando almacenamiento local (LocalStorage).");
}

export const isFirebaseInitialized = !!app;
export { app, db, auth };
