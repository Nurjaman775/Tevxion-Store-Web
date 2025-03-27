let profileManagerInstance = null;

class ProfileManager {
  constructor() {
    // Singleton pattern
    if (profileManagerInstance) {
      return profileManagerInstance;
    }
    profileManagerInstance = this;

    // Initialize manager
    this.init();
  }

  async init() {
    this.currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!this.currentUser) {
      window.location.href = "../login/login.html";
      return;
    }

    this.initializeElements();
    this.loadUserProfile();
    this.attachEventListeners();
    this.hasUnsavedChanges = false;
  }

  initializeElements() {
    this.profilePhoto = document.getElementById("profilePhoto");
    // Add error handler for profile photo
    this.profilePhoto.onerror = () => {
      this.profilePhoto.src = "../../img/default-avatar.png";
    };
    this.photoInput = document.getElementById("photoInput");
    this.usernameInput = document.getElementById("username");
    this.emailInput = document.getElementById("email");
    this.whatsappInput = document.getElementById("whatsapp");
    this.saveButton = document.getElementById("saveProfile");
    this.displayName = document.getElementById("displayName");
    this.logoutBtn = document.getElementById("logoutBtn");
    this.removePhotoBtn = document.getElementById("removePhotoBtn");

    // Set default photo path
    this.defaultPhotoPath = "../../img/default-avatar.png";

    // Add error handler for profile photo
    this.profilePhoto.onerror = () => {
      this.profilePhoto.src = this.defaultPhotoPath;
    };
  }

  attachEventListeners() {
    this.photoInput.addEventListener("change", (e) =>
      this.handlePhotoChange(e)
    );
    this.saveButton.addEventListener("click", () => this.saveProfile());

    // Add validation for WhatsApp number
    this.whatsappInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    });

    // Track changes
    ["usernameInput", "emailInput", "whatsappInput"].forEach((inputId) => {
      this[inputId].addEventListener("input", () => {
        this.hasUnsavedChanges = true;
      });
    });

    // Logout handler
    this.logoutBtn.addEventListener("click", () => this.handleLogout());

    // Warn about unsaved changes
    window.addEventListener("beforeunload", (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    });

    // Add remove photo handler
    this.removePhotoBtn.addEventListener("click", () =>
      this.handleRemovePhoto()
    );
  }

  loadUserProfile() {
    try {
      const userProfile =
        JSON.parse(
          localStorage.getItem(`userProfile_${this.currentUser.uid}`)
        ) || {};

      // Update UI with saved data
      this.usernameInput.value =
        userProfile.username || this.currentUser.username || "";
      this.emailInput.value = userProfile.email || this.currentUser.email || "";
      this.whatsappInput.value = userProfile.whatsapp || "";
      this.displayName.textContent =
        userProfile.username || this.currentUser.username || "User";

      // Load saved photo if exists
      if (userProfile.photoURL) {
        this.profilePhoto.src = userProfile.photoURL;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      this.showNotification("Error loading profile", "error");
    }
  }

  async handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      this.showNotification(
        "File harus berupa gambar (JPG, PNG, dll)",
        "error"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      this.showNotification("Ukuran foto maksimal 5MB", "error");
      return;
    }

    try {
      this.saveButton.disabled = true;
      this.showNotification("Sedang mengupload foto...", "info");

      // Convert image to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoURL = e.target.result;
        this.profilePhoto.src = photoURL;

        // Save to localStorage
        const userProfile =
          JSON.parse(
            localStorage.getItem(`userProfile_${this.currentUser.uid}`)
          ) || {};
        userProfile.photoURL = photoURL;
        localStorage.setItem(
          `userProfile_${this.currentUser.uid}`,
          JSON.stringify(userProfile)
        );

        this.showNotification("Foto profil berhasil diperbarui");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      this.showNotification("Gagal mengupload foto profil", "error");
    } finally {
      this.saveButton.disabled = false;
    }
  }

  async handleRemovePhoto() {
    try {
      if (confirm("Apakah Anda yakin ingin menghapus foto profil?")) {
        // Reset photo to default
        this.profilePhoto.src = this.defaultPhotoPath;

        // Update local storage
        const userProfile =
          JSON.parse(
            localStorage.getItem(`userProfile_${this.currentUser.uid}`)
          ) || {};
        userProfile.photoURL = this.defaultPhotoPath;
        localStorage.setItem(
          `userProfile_${this.currentUser.uid}`,
          JSON.stringify(userProfile)
        );

        this.hasUnsavedChanges = true;
        this.showNotification("Foto profil berhasil dihapus");
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      this.showNotification("Gagal menghapus foto profil", "error");
    }
  }

  async saveProfile() {
    try {
      // Basic validation
      const username = this.usernameInput.value.trim();
      const email = this.emailInput.value.trim();
      const whatsapp = this.whatsappInput.value.trim();

      if (!username || !email) {
        this.showNotification(
          "Mohon lengkapi semua field yang diperlukan",
          "error"
        );
        return;
      }

      if (!this.validateEmail(email)) {
        this.showNotification("Format email tidak valid", "error");
        return;
      }

      this.saveButton.disabled = true;
      this.saveButton.classList.add("saving");
      this.showNotification("Sedang menyimpan perubahan...", "info");

      // Save to localStorage
      const userProfile = {
        username,
        email,
        whatsapp,
        photoURL: this.profilePhoto.src,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        `userProfile_${this.currentUser.uid}`,
        JSON.stringify(userProfile)
      );

      // Update session storage
      const updatedUser = { ...this.currentUser, username, email };
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      this.displayName.textContent = username;
      this.hasUnsavedChanges = false;
      this.showNotification("Profil Anda berhasil diperbarui");
    } catch (error) {
      console.error("Error saving profile:", error);
      this.showNotification("Terjadi kesalahan saat menyimpan profil", "error");
    } finally {
      this.saveButton.disabled = false;
      this.saveButton.classList.remove("saving");
    }
  }

  async handleLogout() {
    if (this.hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Do you want to save them before logging out?"
      );
      if (confirm) {
        await this.saveProfile();
      }
    }

    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("currentUser");
    window.location.href = "../login/login.html";
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    let icon = "";
    let title = "";

    switch (type) {
      case "success":
        icon = '<i class="fas fa-check-circle"></i>';
        title = "Berhasil! ";
        break;
      case "error":
        icon = '<i class="fas fa-exclamation-circle"></i>';
        title = "Gagal! ";
        break;
      case "info":
        icon = '<i class="fas fa-info-circle"></i>';
        title = "Info: ";
        break;
    }

    notification.innerHTML = `${icon}<div><strong>${title}</strong>${message}</div>`;
    notification.className = `notification ${type}`;
    notification.classList.add("show");

    // Remove notification after delay
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.innerHTML = "";
      }, 300);
    }, 3000);
  }
}

// Initialize only after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});
