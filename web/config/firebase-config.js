// Initialize Firebase after DOM loads
document.addEventListener("DOMContentLoaded", function () {
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

  // Initialize Firebase only if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);

    // Add CORS and Popup settings
    firebase.auth().settings.appVerificationDisabledForTesting = true;
    firebase.auth().useDeviceLanguage();

    // Configure auth persistence
    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch((error) => console.error("Auth persistence error:", error));

    // Initialize services
    const db = firebase.firestore();
    const auth = firebase.auth();
    const rtdb = firebase.database();

    // Only initialize analytics if the function exists
    let analytics = null;
    if (typeof firebase.analytics === "function") {
      analytics = firebase.analytics();
    }

    // Make available globally
    window.db = db;
    window.auth = auth;
    window.rtdb = rtdb;
    if (analytics) window.analytics = analytics;

    console.log("Firebase initialized successfully");
  }
});
