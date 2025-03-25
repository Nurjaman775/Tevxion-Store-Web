class ProfileManager {
  constructor() {
    this.init();
  }

  async init() {
    try {
      await this.loadUserData();
      this.setupEventListeners();
    } catch (error) {
      console.error("Kesalahan inisialisasi profil:", error);
      alert("Gagal memuat data profil");
    }
  }

  async loadUserData() {
    const user = AuthManager.getCurrentUser();
    if (!user) {
      window.location.href = "../login/login.html";
      return;
    }

    // Update elemen profil dengan aman
    this.updateProfileElement("fullName", user.fullName || user.username);
    this.updateProfileElement("username", user.username);
    this.updateProfileElement("role", user.role);
    this.updateProfileElement("email", user.email || "Belum diatur");
    this.updateProfileElement("whatsapp", user.whatsapp || "Belum diatur");

    // Muat avatar jika ada
    this.loadUserAvatar(user.username);
  }

  updateProfileElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  loadUserAvatar(username) {
    const avatarImg = document.getElementById("userAvatar");
    const avatarData = localStorage.getItem(`avatar_${username}`);

    if (avatarImg && avatarData) {
      avatarImg.src = avatarData;
    } else if (avatarImg) {
      avatarImg.src = "../web/img/default-avatar.png";
    }
  }

  setupEventListeners() {
    // Add null checks and only attach listeners if elements exist
    document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
      item.onclick = (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.loadSection(section);
      };
    });

    // Add null check for avatar-overlay
    const avatarOverlay = document.querySelector(".avatar-overlay");
    if (avatarOverlay) {
      avatarOverlay.onclick = () => this.handleAvatarUpload();
    }
  }

  async loadSection(sectionId) {
    const main = document.querySelector(".main-content");
    main.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const response = await fetch(`./sections/${sectionId}.html`);
      const content = await response.text();
      main.innerHTML = content;

      this.updateActiveNav(sectionId);
      this.initializeSectionFeatures(sectionId);
    } catch (error) {
      main.innerHTML = '<div class="error">Failed to load content</div>';
    }
  }

  async initializeSectionFeatures(sectionId) {
    switch (sectionId) {
      case "personal":
        await this.initializePersonalInfo();
        break;
      case "security":
        this.initializeSecuritySettings();
        break;
      case "addresses":
        await this.loadAddresses();
        break;
      case "orders":
        await this.loadOrderHistory();
        break;
      // Add more section initializations...
    }
  }

  async handleAvatarUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const base64 = await this.convertToBase64(file);
        document.getElementById("userAvatar").src = base64;

        const user = AuthManager.getCurrentUser();
        localStorage.setItem(`avatar_${user.username}`, base64);

        this.showNotification(
          "Profile picture updated successfully",
          "success"
        );
      } catch (error) {
        this.showNotification("Failed to update profile picture", "error");
      }
    };

    input.click();
  }

  convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // Add more methods for handling different sections...
}

// Inisialisasi ketika DOM siap
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.profileManager === "undefined") {
    window.profileManager = new ProfileManager();
  }
});

// Keep existing loadProfile function
function loadProfile() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!user) {
    window.location.href = "../login/login.html";
    return;
  }

  const profileData =
    JSON.parse(localStorage.getItem("users")).find(
      (u) => u.username === user.username
    ) || user;

  // Set profile info
  document.querySelector(".profile-avatar").textContent =
    user.username[0].toUpperCase();
  document.getElementById("fullName").textContent =
    profileData.fullName || user.username;
  document.getElementById("username").textContent = user.username;
  document.getElementById("role").textContent = user.role;
  document.getElementById("email").textContent = profileData.email || "Not set";
  document.getElementById("whatsapp").textContent =
    profileData.whatsapp || "Not set";
}
