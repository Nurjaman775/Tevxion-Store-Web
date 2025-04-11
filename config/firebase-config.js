// Initialize Firebase immediately
const firebaseConfig = {
  apiKey: "AIzaSyBZOvvYSy86-JqHxtU2zT8oPSTs7t-_vME",
  authDomain: "tevxion-store-storage.firebaseapp.com",
  databaseURL:
    "https://tevxion-store-storage-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tevxion-store-storage",
  storageBucket: "tevxion-store-storage.appspot.com",
  messagingSenderId: "138176363117",
  appId: "1:138176363117:web:cdaafd9d6dd5213967dd64",
  measurementId: "G-ZYMZJW3T2H",
};

// Initialize Firebase only if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Auth
const auth = firebase.auth();

// Enable persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
  console.error("Auth persistence error:", error);
});

// Initialize other services (only if available)
let db = null;
let firestore = null;
let storage = null;

try {
  db = firebase.database();
} catch (e) {
  console.warn("Realtime Database not initialized:", e);
}

try {
  if (firebase.firestore) {
    firestore = firebase.firestore();
  }
} catch (e) {
  console.warn("Firestore not initialized:", e);
}

// Update storage initialization
try {
  if (firebase.storage) {
    storage = firebase.storage();
    window.storage = storage;
  } else {
    console.warn("Firebase Storage SDK not loaded");
  }
} catch (e) {
  console.warn("Storage initialization error:", e);
}

// Export initialized services
window.firebaseServices = {
  auth,
  db,
  firestore,
  storage,
};

// Initialize database
let dbInstance = null;
let authInstance = null;

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

  // Modifikasi auth state observer
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      // Set role tanpa menggunakan custom claims
      if (currentUser && currentUser.role) {
        user.getIdTokenResult(true).then((idTokenResult) => {
          // Simpan role di session storage
          const userData = {
            ...currentUser,
            role: currentUser.role,
          };
          sessionStorage.setItem("currentUser", JSON.stringify(userData));
        });
      }
    }
  });
}

if (typeof firebase.firestore === "function") {
  try {
    firestore = firebase.firestore();
    firestore.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
      merge: true,
      cache: {
        tabManager: {
          forceOwnership: true, // Enable offline persistence with single tab mode
        },
        lruGarbageCollection: true, // Enable LRU garbage collection
      },
    });
    window.db = firestore;
  } catch (e) {
    console.warn("Firestore settings error:", e);
  }
}

if (typeof firebase.storage === "function") {
  try {
    storage = firebase.storage();
    window.storage = storage;
  } catch (e) {
    console.warn("Storage initialization error:", e);
  }
}

// Initialize database last
initializeDatabase();

console.log("Firebase services initialized successfully");
