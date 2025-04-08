// akun pengguna
const users = [
  { username: "tevxion", password: "tevxion123", role: "admin" },
  { username: "kasir", password: "tevxion123", role: "cashier" },
  { username: "user", password: "tevxion123", role: "customer" },
];

// memasang firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    apikey: process.env.FIREBASE_API_KEY || "fallback-api-key",
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
  event.preventDefault(); // Mencegah pengiriman form default

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // login dengan keadaan local
  const defaultUsers = [
    { username: "tevxion", password: "tevxion123", role: "admin" },
    { username: "kasir", password: "tevxion123", role: "cashier" },
    { username: "user", password: "tevxion123", role: "customer" },
  ];

  const allUsers = [...defaultUsers, ...users];
  const user = allUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    // login dengan local berhasil
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({ username: user.username, role: user.role })
    );

    // periksa base aktif role
    handleLoginRedirect(user.role);
  } else {
    // coba login dengan firebase
    firebase
      .auth()
      .signInWithEmailAndPassword(username, password)
      .then((userCredential) => {
        // login dengan firebase berhasil
        const firebaseUser = {
          username: userCredential.user.email,
          role: "customer",
          email: userCredential.user.email,
        };

        sessionStorage.setItem("currentUser", JSON.stringify(firebaseUser));
        handleLoginRedirect("customer");
      })
      .catch((error) => {
        // login dengan firebase gagal
        console.error("login error:", error);
        alert("Username atau Password salah!");
      });
  }
  return false;
}

function handleLoginRedirect(role) {
  if (role === "admin") {
    window.location.href = "/role/admin/admin.html";
  } else if (role === "cashier") {
    window.location.href = "/role/kasir/kasir.html";
  } else if (role === "customer") {
    window.location.href = "/index.html";
  }
}


function initGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const googleSignInBtn = document.getElementById("googleSignIn");
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async () => {
      try {
        provider.addScope("email");
        provider.addScope("profile");
        const result = await firebase.auth().signInWithPopup(provider);

        // buat objek untuk user
        const user = {
          username: result.user.email,
          fullName: result.user.displayName,
          email: result.user.email,
          role: "customer",
          googleId: result.user.uid,
          photoURL: result.user.photoURL,
        };

        // simpan ke localStorage untuk data persisten
        const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
        if (!existingUsers.some((u) => u.email === user.email)) {
          existingUsers.push(user);
          localStorage.setItem("users", JSON.stringify(existingUsers));
        }

        // set session untuk status login
        sessionStorage.setItem("currentUser", JSON.stringify(user));

        // redirect langsung ke halaman toko
        window.location.href = "/role/customer/customer.html";
      } catch (error) {
        console.error("Error signing in with Google:", error);
        alert("Gagal login dengan Google. Silakan coba lagi.");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  initGoogleSignIn();
});