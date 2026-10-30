import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDLlDmPPwMGO_v_4IzyGgnS6oUauvfHJJ8",
  authDomain: "innovation-feedback-20206.firebaseapp.com",
  projectId: "innovation-feedback-20206",
  storageBucket: "innovation-feedback-20206.firebasestorage.app",
  messagingSenderId: "238452748914",
  appId: "1:238452748914:web:4b1ede63901a445d1508eb"
};

// Initialize Firebase (guarding against multiple initializations)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export const FEEDBACK_COLLECTION = 'feedback';
