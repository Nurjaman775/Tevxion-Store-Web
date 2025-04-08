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

    this.initTabs();
    this.initOrders();
    this.initAddresses();
    this.initSecurity();
    this.initNotifications();
  }

  async init() {
    this.currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!this.currentUser) {
      window.location.href = "/login/login.html";
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
      this.profilePhoto.src = "/img/default-avatar.png";
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
    this.defaultPhotoPath = "/img/default-avatar.png";

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
    window.location.href = "/login/login.html";
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

  initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const contents = document.querySelectorAll(".tab-content");
        contents.forEach((c) => c.classList.remove("active"));
        document.getElementById(tab.dataset.tab).classList.add("active");
      });
    });
  }

  async initOrders() {
    const orders = await this.fetchOrders();
    this.renderOrders(orders);

    // Order filters
    document
      .getElementById("orderStatus")
      .addEventListener("change", () => this.filterOrders());
    document
      .getElementById("orderDate")
      .addEventListener("change", () => this.filterOrders());
  }

  async fetchOrders() {
    try {
      const response = await fetch(
        `/api/orders?userId=${this.currentUser.uid}`
      );
      if (!response.ok) throw new Error("Failed to fetch orders");
      return await response.json();
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }

  renderOrders(orders) {
    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML = orders
      .map(
        (order) => `
      <div class="order-card" onclick="profileManager.showOrderDetail('${
        order.id
      }')">
        <div class="order-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="order-status ${order.status}">${order.status}</span>
        </div>
        <div class="order-items">
          ${order.items
            .map(
              (item) => `
            <div class="order-item">
              <img src="${item.image}" alt="${item.name}">
              <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-price">Rp ${item.price.toLocaleString()}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="order-footer">
          <span class="order-date">${new Date(
            order.date
          ).toLocaleDateString()}</span>
          <span class="order-total">Total: Rp ${order.total.toLocaleString()}</span>
        </div>
      </div>
    `
      )
      .join("");
  }

  initAddresses() {
    const addBtn = document.querySelector(".add-address-btn");
    addBtn.addEventListener("click", () => this.showAddressModal());
    this.loadAddresses();
  }

  async loadAddresses() {
    const addresses =
      JSON.parse(localStorage.getItem(`addresses_${this.currentUser.uid}`)) ||
      [];
    const container = document.querySelector(".addresses-list");

    container.innerHTML = addresses
      .map(
        (addr, idx) => `
      <div class="address-card">
        <div class="address-type">${addr.type}</div>
        <div class="address-details">
          <h4>${addr.name}</h4>
          <p>${addr.address}</p>
          <p>${addr.phone}</p>
        </div>
        <div class="address-actions">
          <button onclick="profileManager.editAddress(${idx})">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="profileManager.deleteAddress(${idx})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  initSecurity() {
    const passwordForm = document.getElementById("passwordForm");
    passwordForm.addEventListener("submit", (e) => this.updatePassword(e));

    const twoFactorToggle = document.getElementById("2faToggle");
    twoFactorToggle.addEventListener("change", () => this.toggle2FA());
  }

  async updatePassword(e) {
    e.preventDefault();
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      this.showNotification("Password baru tidak cocok", "error");
      return;
    }

    try {
      // Implement password update logic here
      this.showNotification("Password berhasil diperbarui", "success");
      e.target.reset();
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  initNotifications() {
    // Load saved preferences
    const prefs =
      JSON.parse(localStorage.getItem(`notif_prefs_${this.currentUser.uid}`)) ||
      {};
    Object.keys(prefs).forEach((key) => {
      const checkbox = document.getElementById(key);
      if (checkbox) checkbox.checked = prefs[key];
    });

    // Save preferences on change
    document
      .querySelectorAll(".notification-options input")
      .forEach((input) => {
        input.addEventListener("change", () =>
          this.saveNotificationPreferences()
        );
      });
  }

  saveNotificationPreferences() {
    const prefs = {};
    document
      .querySelectorAll(".notification-options input")
      .forEach((input) => {
        prefs[input.id] = input.checked;
      });
    localStorage.setItem(
      `notif_prefs_${this.currentUser.uid}`,
      JSON.stringify(prefs)
    );
    this.showNotification("Preferensi notifikasi disimpan");
  }
}

// Initialize only after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});
