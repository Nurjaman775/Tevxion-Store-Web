// Mock user database
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "kasir", password: "kasir123", role: "cashier" },
  { username: "user", password: "user123", role: "customer" },
];

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY || "fallback-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fallback-auth-domain",
    projectId: process.env.FIREBASE_PROJECT_ID || "fallback-project-id",
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || "fallback-storage-bucket",
    messagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      "fallback-messaging-sender-id",
    appId: process.env.FIREBASE_APP_ID || "fallback-app-id",
    measurementId:
      process.env.FIREBASE_MEASUREMENT_ID || "fallback-measurement-id",
  });
}

function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // First check local users
  const savedUsers = JSON.parse(localStorage.getItem("users")) || [];
  const defaultUsers = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "kasir", password: "kasir123", role: "cashier" },
    { username: "user", password: "user123", role: "customer" },
  ];

  const allUsers = [...defaultUsers, ...savedUsers];
  const user = allUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    // Local login successful
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({
        username: user.username,
        role: user.role,
      })
    );

    // Redirect based on role
    handleLoginRedirect(user.role);
  } else {
    // Try Firebase login
    firebase
      .auth()
      .signInWithEmailAndPassword(username, password)
      .then((userCredential) => {
        const firebaseUser = {
          username: userCredential.user.email,
          role: "customer",
          email: userCredential.user.email,
        };

        sessionStorage.setItem("currentUser", JSON.stringify(firebaseUser));
        handleLoginRedirect("customer");
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert("Username atau password salah!");
      });
  }

  return false;
}

function handleLoginRedirect(role) {
  switch (role) {
    case "admin":
      window.location.href = "../dashboard/admin.html";
      break;
    case "cashier":
      window.location.href = "../dashboard/cashier.html";
      break;
    case "customer":
      window.location.href = "../toko-belanja/index.html";
      break;
  }
}

// Initialize Google Sign-In with better error handling
function initGoogleSignIn() {
  const googleSignInBtn = document.getElementById("googleSignIn");
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");

        const result = await firebase.auth().signInWithPopup(provider);
        console.log("Google sign in success:", result);

        // Create user object
        const user = {
          username: result.user.email,
          fullName: result.user.displayName,
          email: result.user.email,
          role: "customer",
          googleId: result.user.uid,
          photoURL: result.user.photoURL,
        };

        // Store in localStorage
        const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
        if (!existingUsers.some((u) => u.email === user.email)) {
          existingUsers.push(user);
          localStorage.setItem("users", JSON.stringify(existingUsers));
        }

        // Set session
        sessionStorage.setItem("currentUser", JSON.stringify(user));

        // Redirect
        window.location.href = "../toko-belanja/index.html";
      } catch (error) {
        console.error("Google Sign-In Error Details:", error);
        alert(`Login gagal: ${error.message}`);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", handleLogin);
  }
  initGoogleSignIn();
});
