
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Se utilizan variables de entorno para evitar exponer credenciales en el repositorio
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "gestor-de-gasto-mobile.firebaseapp.com",
  projectId: "gestor-de-gasto-mobile",
  storageBucket: "gestor-de-gasto-mobile.firebasestorage.app",
  messagingSenderId: "979775122403",
  appId: "1:979775122403:web:edbc96fcf6a2f1db184ed6",
  measurementId: "G-06BKNCTLWJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
