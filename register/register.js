// Add Firebase initialization check at the start
let app;
try {
  app = firebase.app();
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Initialize with config if not already initialized
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

  app = firebase.initializeApp(firebaseConfig);
}

function validateName(name) {
  // Empty check
  if (!name.trim()) return "Nama tidak boleh kosong";

  // Only letters and spaces
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name)) {
    return "Nama hanya boleh mengandung huruf (a-z) dan spasi";
  }

  // Word case validation not needed anymore since we auto-capitalize
  return "";
}

function validateUsername(username) {
  if (!username.trim()) return "Username tidak boleh kosong";

  const usernameRegex = /^[a-z0-9]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return "Username hanya boleh mengandung huruf kecil dan angka (3-20 karakter)";
  }
  return "";
}

function validatePassword(password) {
  if (!password) return "Password tidak boleh kosong";
  if (password.length < 6 || password.length > 20) {
    return "Password harus antara 6-20 karakter";
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
  if (!passwordRegex.test(password)) {
    return "Password harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka";
  }

  return "";
}

function validateWhatsApp(whatsapp) {
  if (!whatsapp.trim()) return "Nomor WhatsApp tidak boleh kosong";

  // Convert leading 0 to 62
  let cleanNumber = whatsapp.trim();
  if (cleanNumber.startsWith("0")) {
    cleanNumber = "62" + cleanNumber.substring(1);

    // Update input field with converted number
    const whatsappInput = document.getElementById("whatsapp");
    if (whatsappInput) {
      whatsappInput.value = cleanNumber;
    }
  }

  const whatsappRegex = /^628[0-9]{8,11}$/;
  if (!whatsappRegex.test(cleanNumber)) {
    return "Nomor WhatsApp harus diawali 628 dan berisi 11-14 digit angka";
  }
  return "";
}

function validateConfirmPassword(confirmPassword) {
  const password = document.getElementById("password").value;
  if (confirmPassword.trim() === "") return "";

  if (confirmPassword !== password) {
    return "Password tidak cocok!";
  }
  return "";
}

function validateEmail(email) {
  if (!email) return "Email tidak boleh kosong";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Format email tidak valid";
  }
  return "";
}

function validateField(input) {
  const id = input.id;
  const value = input.value;

  switch (id) {
    case "fullName":
      return validateName(value);
    case "username":
      return validateUsername(value);
    case "whatsapp":
      return validateWhatsApp(value);
    case "email":
      return validateEmail(value);
    case "password":
      return validatePassword(value);
    case "confirm_password":
      return validateConfirmPassword(value);
    default:
      return "";
  }
}

// Tampilkan error pada masing-masing input
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorDiv =
    input.parentElement.querySelector(".error-message") ||
    document.createElement("div");

  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  if (!input.parentElement.querySelector(".error-message")) {
    input.parentElement.appendChild(errorDiv);
  }

  input.style.borderColor = message ? "#ff2770" : "#45f3ff";
  errorDiv.style.display = message ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", function () {
  // Add input event listener for fullName
  const fullNameInput = document.getElementById("fullName");
  if (fullNameInput) {
    fullNameInput.addEventListener("input", function (e) {
      let words = e.target.value.split(" ");
      // Capitalize first letter of each word
      words = words.map((word) =>
        word ? word.charAt(0).toUpperCase() + word.slice(1) : ""
      );
      e.target.value = words.join(" ");
    });
  }

  // Rest of your event listeners
  const inputs = {
    fullName: { validate: validateName },
    username: { validate: validateUsername },
    whatsapp: { validate: validateWhatsApp },
    password: { validate: validatePassword },
    confirm_password: { validate: validateConfirmPassword },
  };

  // Menambahkan event listener untuk validasi real-time
  for (const [id, { validate }] of Object.entries(inputs)) {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", function () {
        const error = validate(this.value);
        showError(id, error);
      });
    }
  }

  enhanceFormButtons();
});

async function handleRegister(event) {
  event.preventDefault();

  // Show loading state
  const submitBtn = document.querySelector('input[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.value = "Registering...";

  try {
    // Get Firebase Auth instance
    const auth = firebase.auth();
    const db = firebase.database();

    // Get form values
    const fullName = document.getElementById("fullName").value;
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const whatsapp = document.getElementById("whatsapp").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    // Validasi input
    const nameError = validateName(fullName);
    if (nameError) {
      showError("fullName", nameError);
      return false;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      showError("username", usernameError);
      return false;
    }

    const whatsappError = validateWhatsApp(whatsapp);
    if (whatsappError) {
      showError("whatsapp", whatsappError);
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      showError("password", passwordError);
      return false;
    }

    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    if (confirmPasswordError) {
      showError("confirm_password", confirmPasswordError);
      return false;
    }

    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Hash password before storing
    const hashedPassword = await hashPassword(password);

    // Add user data to Realtime Database
    await db.ref("users/" + user.uid).set({
      uid: user.uid,
      fullName: fullName,
      username: username,
      whatsapp: whatsapp,
      email: email,
      password: hashedPassword, // Store hashed password
      role: "customer",
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      lastLogin: firebase.database.ServerValue.TIMESTAMP,
      accountStatus: "active",
      metadata: {
        registrationMethod: "email",
        userAgent: navigator.userAgent,
        registrationDate: new Date().toISOString(),
      },
    });

    // Send email verification
    await user.sendEmailVerification();

    // Show success message
    alert(
      "Registration successful! Please check your email to verify your account."
    );
    window.location.href = "/login/login.html";
  } catch (error) {
    console.error("Registration error:", error);
    let errorMessage = "Registration failed: ";

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage += "Email already registered";
        break;
      case "auth/invalid-email":
        errorMessage += "Invalid email format";
        break;
      case "auth/operation-not-allowed":
        errorMessage += "Email/password registration is disabled";
        break;
      case "auth/weak-password":
        errorMessage += "Password is too weak";
        break;
      default:
        errorMessage += error.message;
    }

    alert(errorMessage);
  } finally {
    // Reset loading state
    submitBtn.disabled = false;
    submitBtn.value = "Register";
  }

  return false;
}

// Add password hashing function
async function hashPassword(password) {
  // Simple hash for demo - in production use proper hashing like bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function enhanceFormButtons() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  // Enhance submit button
  const submitBtn = form.querySelector('input[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        // Highlight invalid fields
        Array.from(form.elements).forEach((el) => {
          if (!el.checkValidity()) {
            el.classList.add("invalid");
          }
        });
        return;
      }
    });
  }

  // Add input validation feedback
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.remove("invalid");
      const error = validateField(this);
      showError(this.id, error);
    });
  });
}
