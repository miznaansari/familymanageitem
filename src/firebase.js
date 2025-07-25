// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-4z2TyZYj5CCmldnTHQmGSrOdSPsm5P0",
  authDomain: "familymanageitem.firebaseapp.com",
  projectId: "familymanageitem",
  storageBucket: "familymanageitem.firebasestorage.app",
  messagingSenderId: "502942760991",
  appId: "1:502942760991:web:3b98c466656c1de66c152a",
  measurementId: "G-29SBK35G56"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
