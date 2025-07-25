// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Optional: Only import analytics if used on frontend
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD-4z2TyZYj5CCmldnTHQmGSrOdSPsm5P0",
  authDomain: "familymanageitem.firebaseapp.com",
  projectId: "familymanageitem",
  storageBucket: "familymanageitem.appspot.com", // ✅ FIXED HERE
  messagingSenderId: "502942760991",
  appId: "1:502942760991:web:3b98c466656c1de66c152a",
  measurementId: "G-29SBK35G56"
};

const app = initializeApp(firebaseConfig);

// Optional: avoid analytics error in SSR
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
