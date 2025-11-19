
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Access environment variables safely
// Vite replaces process.env.FIREBASE_API_KEY with the string value defined in vite.config.ts
const envApiKey = process.env.FIREBASE_API_KEY;

// Validation to prevent "Missing App configuration value" crash
// We use a placeholder if missing so initializeApp doesn't throw synchronously
const firebaseApiKey = envApiKey || "MISSING_KEY_PLACEHOLDER";

if (!envApiKey) {
  console.warn("WARNING: Firebase API Key is missing. The app will load but database connections will fail.");
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "gestor-de-gasto-mobile.firebaseapp.com",
  projectId: "gestor-de-gasto-mobile",
  storageBucket: "gestor-de-gasto-mobile.firebasestorage.app",
  messagingSenderId: "979775122403",
  appId: "1:979775122403:web:edbc96fcf6a2f1db184ed6",
  measurementId: "G-06BKNCTLWJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Only initialize analytics if we have a real key to avoid 400 INVALID_ARGUMENT errors on load
let analytics: any = null;
if (envApiKey && envApiKey !== "MISSING_KEY_PLACEHOLDER") {
  try {
     analytics = getAnalytics(app);
  } catch (e) {
     console.warn("Analytics skipped:", e);
  }
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
