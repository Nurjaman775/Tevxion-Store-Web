const firebaseConfig = {
  apiKey: "AIzaSyBZOvvYSy86-JqHxtU2zT8oPSTs7t-_vME",
  authDomain: "tevxion-store-storage.firebaseapp.com",
  databaseURL:
    "https://tevxion-store-storage-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tevxion-store-storage",
  storageBucket: "tevxion-store-storage.firebasestorage.app",
  messagingSenderId: "138176363117",
  appId: "1:138176363117:web:cdaafd9d6dd5213967dd64",
  measurementId: "G-ZYMZJW3T2H",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Services
const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();
const analytics = firebase.analytics();

// Make services accessible globally
window.db = db;
window.auth = auth;
window.rtdb = rtdb;
window.analytics = analytics;
