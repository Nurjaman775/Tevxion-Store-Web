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
  
    try {
      // Initialize Firebase only if not already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
  
        // Initialize services with proper error handling
        try {
          // Initialize auth
          const auth = firebase.auth();
          auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
          window.auth = auth;
          console.log("Auth initialized");
  
          // Initialize Firestore with new cache settings
          const db = firebase.firestore();
          db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
            merge: true,
            cache: {
              persistenceEnabled: true,
              tabSynchronization: true,
            },
          });
  
          window.db = db;
          console.log("Firestore initialized with cache settings");
  
          // Initialize Storage with error checking
          if (typeof firebase.storage === "function") {
            const storage = firebase.storage();
            window.storage = storage;
            console.log("Storage initialized");
          } else {
            console.warn("Firebase Storage SDK not loaded properly");
          }
  
          console.log("Firebase services initialized successfully");
        } catch (serviceError) {
          console.error("Error initializing Firebase services:", serviceError);
        }
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  });
  