// Initialize Firebase
if (!firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyBZOvvYSy86-JqHxtU2zT8oPSTs7t-_vME",
      authDomain: "tevxion-store-storage.firebaseapp.com",
      projectId: "tevxion-store-storage",
      storageBucket: "tevxion-store-storage.appspot.com",
      messagingSenderId: "138176363117",
      appId: "1:138176363117:web:cdaafd9d6dd5213967dd64",
      measurementId: "G-ZYMZJW3T2H",
    };
    firebase.initializeApp(firebaseConfig);
  }
  
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
  
    // Trigger animation
    setTimeout(() => notification.classList.add("show"), 100);
  
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  async function handleReset(event) {
    event.preventDefault();
  
    const email = document.getElementById("email").value;
    const submitBtn = document.querySelector('input[type="submit"]');
  
    if (!validateEmail(email)) {
      showNotification("Masukkan alamat email yang valid", "error");
      return false;
    }
  
    try {
      submitBtn.disabled = true;
      submitBtn.value = "Mengirim...";
  
      // Check if email exists in localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
      const userExists = existingUsers.some(user => user.email === email);
  
      if (userExists) {
        // Send reset email through Firebase
        await firebase.auth().sendPasswordResetEmail(email);
        showNotification(
          "Email reset password telah dikirim. Silakan periksa kotak masuk email Anda.",
          "success"
        );
        setTimeout(() => {
          window.location.href = "/login1/login1.html";
        }, 3000);
      } else {
        // Email not found in local storage
        showNotification(
          "Email tidak terdaftar. Silakan daftar terlebih dahulu.",
          "error"
        );
        setTimeout(() => {
          window.location.href = "/register1/register1.html";
        }, 3000);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.code === "auth/too-many-requests") {
        showNotification("Terlalu banyak percobaan. Silakan coba lagi nanti.", "error");
      } else if (error.code === "auth/invalid-email") {
        showNotification("Format email tidak valid", "error");
      } else {
        showNotification("Terjadi kesalahan. Silakan coba lagi.", "error");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.value = "Reset Password";
    }
  
    return false;
  }
  
  // Add event listeners once DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetForm");
    const emailInput = document.getElementById("email");
  
    // Clear error state on input
    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("error");
    });
  });
  