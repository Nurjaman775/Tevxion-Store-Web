class ProfileManager {
  constructor() {
    this.currentSection = "personal";
    this.init();
  }

  async init() {
    await this.loadUserData();
    this.setupEventListeners();
    this.loadSection(this.currentSection);
  }

  async loadUserData() {
    const user = AuthManager.getCurrentUser();
    if (!user) {
      window.location.href = "../../login/login.html";
      return;
    }

    document.getElementById("userName").textContent =
      user.fullName || user.username;
    document.getElementById("userRole").textContent = user.role;

    // Load avatar if exists
    const avatar = localStorage.getItem(`avatar_${user.username}`);
    if (avatar) {
      document.getElementById("userAvatar").src = avatar;
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".nav-item[data-section]").forEach((item) => {
      item.onclick = (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.loadSection(section);
      };
    });

    // Avatar upload handler
    document.querySelector(".avatar-overlay").onclick = () =>
      this.handleAvatarUpload();
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

// Initialize profile manager
document.addEventListener("DOMContentLoaded", () => {
  window.profileManager = new ProfileManager();
});

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

document.addEventListener("DOMContentLoaded", loadProfile);
