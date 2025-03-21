const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "fallback-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fallback-auth-domain",
  projectId: process.env.FIREBASE_PROJECT_ID || "fallback-project-id",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || "fallback-storage-bucket",
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID || "fallback-messaging-sender-id",
  appId: process.env.FIREBASE_APP_ID || "fallback-app-id",
  measurementId:
    process.env.FIREBASE_MEASUREMENT_ID || "fallback-measurement-id",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
