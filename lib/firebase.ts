import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(", ")}`);
  }

  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

export function getFirebaseFirestore() {
  return getFirestore(getFirebaseApp());
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  return getAnalytics(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();
