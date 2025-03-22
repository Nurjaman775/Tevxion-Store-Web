import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey:
    process.env.FIREBASE_API_KEY || "AIzaSyBZOvvYSy86-JqHxtU2zT8oPSTs7t-_vME",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || "tevxion-store-storage.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "tevxion-store-storage",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    "tevxion-store-storage.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "138176363117",
  appId:
    process.env.FIREBASE_APP_ID || "1:138176363117:web:cdaafd9d6dd5213967dd64",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-ZYMZJW3T2H",
  databaseURL:
    "https://tevxion-store-storage-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Realtime Database
const db = firebase.database();
