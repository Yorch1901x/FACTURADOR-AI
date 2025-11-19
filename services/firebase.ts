
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Configuración específica del proyecto
const firebaseConfig = {
  apiKey: "AIzaSyANHrj6TVTf_OCslCyJqvzPXXAA3shTmsg",
  authDomain: "gestor-de-gasto-mobile.firebaseapp.com",
  projectId: "gestor-de-gasto-mobile",
  storageBucket: "gestor-de-gasto-mobile.firebasestorage.app",
  messagingSenderId: "979775122403",
  appId: "1:979775122403:web:edbc96fcf6a2f1db184ed6",
  measurementId: "G-06BKNCTLWJ"
};

let app = null;
let analytics = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Only initialize analytics in browser environment
  if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.warn("Analytics initialization skipped (likely due to environment block)", e);
    }
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("✅ Firebase connected successfully to:", firebaseConfig.projectId);
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  // Fallback to null to trigger offline mode in services if connection fails completely
  db = null;
  auth = null;
}

// Export initialization status for UI indicators
export const isFirebaseInitialized = !!app;

export { app, analytics, db, auth };
