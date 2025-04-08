// Initialize Firebase immediately
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
  }

  // Define global variables for Firebase services
  let dbInstance = null;
  let authInstance = null;
  let firestoreInstance = null;
  let storageInstance = null;

  // Function to safely initialize database
  function initializeDatabase() {
    if (typeof firebase.database === "function") {
      dbInstance = firebase.database();
      window.rtdb = dbInstance;

      // Initialize references only after database is available
      if (dbInstance) {
        window.dbRefs = {
          stockRef: dbInstance.ref("real_time_stock"),
          updatesRef: dbInstance.ref("stock_updates"),
          syncRef: dbInstance.ref("stock_sync"),
          alertsRef: dbInstance.ref("stock_alerts"),
        };

        // Setup stock monitoring
        window.dbRefs.stockRef.on("value", (snapshot) => {
          const stocks = snapshot.val();
          if (stocks) {
            monitorStockLevels(stocks);
          }
        });
      }
    }
  }

  // Function to monitor stock levels
  function monitorStockLevels(stocks) {
    Object.entries(stocks).forEach(([productId, data]) => {
      if (data.current_stock <= data.min_stock) {
        createStockAlert(productId, data);
      }
    });
  }

  // Function to create stock alerts
  function createStockAlert(productId, stockData) {
    if (window.dbRefs && window.dbRefs.alertsRef) {
      const alertData = {
        product_id: productId,
        type: "low_stock",
        current_stock: stockData.current_stock,
        threshold: stockData.min_stock,
        created_at: Date.now(),
        status: "active",
      };

      window.dbRefs.alertsRef.push(alertData);
    }
  }

  // Initialize other Firebase services
  if (typeof firebase.auth === "function") {
    authInstance = firebase.auth();
    window.auth = authInstance;
  }

  if (typeof firebase.firestore === "function") {
    // Update: Use new cache configuration instead of enablePersistence
    firestoreInstance = firebase.firestore();
    firestoreInstance.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
      merge: true,
      cache: {
        tabManager: {
          forceOwnership: true // Enable offline persistence with single tab mode
        },
        lruGarbageCollection: true // Enable LRU garbage collection
      }
    });
    window.db = firestoreInstance;
  }

  if (typeof firebase.storage === "function") {
    storageInstance = firebase.storage();
    window.storage = storageInstance;
  }

  // Initialize database last
  initializeDatabase();

  console.log("Firebase services initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}
