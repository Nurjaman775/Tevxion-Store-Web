function checkAuth() {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!user) {
    window.location.href = "/login/login.html";
    return;
  }

  // Verify correct dashboard access
  const currentPath = window.location.pathname;
  if (
    (user.role === "admin" && !currentPath.includes("admin.html")) ||
    (user.role === "cashier" && !currentPath.includes("cashier.html"))
  ) {
    window.location.href = "/login/login.html";
  }
}

// Check authentication on page load
document.addEventListener("DOMContentLoaded", function () {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "../login/login.html";
    return;
  }

  // Redirect if wrong role
  const page = window.location.pathname;
  if (page.includes("admin.html") && currentUser.role !== "admin") {
    window.location.href = "../login/login.html";
  } else if (page.includes("cashier.html") && currentUser.role !== "cashier") {
    window.location.href = "../login/login.html";
  }
});

function logout() {
  sessionStorage.removeItem("currentUser");
  window.location.href = "../login/login.html";
}

function attachButtonListeners() {
  // Logout button
  document.querySelectorAll('[onclick="logout()"]').forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to logout?")) {
        logout();
      }
    };
  });

  // Navigation buttons
  document.querySelectorAll(".sidebar a").forEach((link) => {
    if (!link.hasAttribute("onclick")) {
      link.onclick = (e) => {
        const href = link.getAttribute("href");
        if (href === "#") {
          e.preventDefault();
          alert("Feature coming soon!");
        }
      };
    }
  });
}

// Add new dashboard functionality
function initDashboard() {
  loadStats();
  initCharts();
  loadActivityFeed();
  setupEventListeners();
}

function loadStats() {
  // Load users count
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const defaultUsers = [
    { username: "admin", role: "admin" },
    { username: "kasir", role: "cashier" },
    { username: "user", role: "customer" },
  ];

  // Load products from toko-belanja storage
  const products = JSON.parse(localStorage.getItem("store_products")) || [];

  // Calculate product statistics
  const productStats = {
    total: products.length,
    inStock: products.filter((p) => p.stock > 0).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  // Update stats display
  updateStatCard("totalProducts", productStats.total, {
    label: "Total Products",
    icon: "bx-package",
    details: `${productStats.inStock} In Stock, ${productStats.outOfStock} Out of Stock`,
  });

  // Update user stats
  updateStatCard("totalUsers", [...defaultUsers, ...users].length, {
    label: "Total Users",
    icon: "bx-user",
    details: `${users.length} Registered Users`,
  });

  // Update revenue stats
  const revenue = calculateTotalRevenue();
  updateStatCard("totalRevenue", revenue, {
    label: "Total Revenue",
    icon: "bx-money",
    details: "All Time Revenue",
  });

  // Add product observer for real-time updates
  setupProductObserver();
}

function setupProductObserver() {
  // Monitor changes to store_products in localStorage
  window.addEventListener("storage", (e) => {
    if (e.key === "store_products") {
      loadStats(); // Reload stats when products change
    }
  });

  // Override localStorage.setItem to catch direct modifications
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (key === "store_products") {
      loadStats();
    }
  };
}

// Add helper function to calculate total revenue
function calculateTotalRevenue() {
  try {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    return orders.reduce((total, order) => total + order.total, 0);
  } catch (error) {
    console.error("Error calculating revenue:", error);
    return 0;
  }
}

function updateStatCard(id, value, config = {}) {
  const card = document.getElementById(id);
  if (!card) return;

  card.innerHTML = `
    <div class="stat-header">
      <h3>${config.label || card.querySelector("h3").textContent}</h3>
      ${config.icon ? `<i class='bx ${config.icon}'></i>` : ""}
    </div>
    <div class="stat-value">${value.toLocaleString("id-ID")}</div>
    ${config.details ? `<div class="stat-details">${config.details}</div>` : ""}
  `;
}

function addActivity(type, title, description) {
  const activities = JSON.parse(localStorage.getItem("activities") || "[]");
  activities.unshift({
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("activities", JSON.stringify(activities.slice(0, 10)));
  loadActivityFeed();
}

function initCharts() {
  // Add chart initialization code here using Chart.js or similar library
}

function loadActivityFeed() {
  const activities = [
    {
      type: "sale",
      title: "New Sale",
      description: "Product X was sold",
      time: "5 min ago",
    },
    {
      type: "user",
      title: "New User",
      description: "John Doe registered",
      time: "10 min ago",
    },
    // Add more activities
  ];

  const feed = document.querySelector(".activity-feed");
  if (feed) {
    activities.forEach((activity) => {
      feed.appendChild(createActivityItem(activity));
    });
  }
}

function createActivityItem(activity) {
  const div = document.createElement("div");
  div.className = "activity-item";
  div.innerHTML = `
    <div class="activity-icon">
      <i class="bx ${activity.type === "sale" ? "bx-cart" : "bx-user"}"></i>
    </div>
    <div class="activity-details">
      <h4>${activity.title}</h4>
      <p>${activity.description}</p>
      <small>${activity.time}</small>
    </div>
  `;
  return div;
}

function setupEventListeners() {
  // Add event listeners for interactive elements
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.onclick = () => handleEdit(btn.dataset.id);
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.onclick = () => handleDelete(btn.dataset.id);
  });
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", initDashboard);

document.addEventListener("DOMContentLoaded", function () {
  checkAuth();
  attachButtonListeners();
});

class AdminManager {
  constructor() {
    this.initializeAdminFeatures();
  }

  async initializeAdminFeatures() {
    this.loadUserManagement();
    this.loadProductManagement();
    this.setupEventListeners();
  }

  async loadUserManagement() {
    const users = await this.fetchUsers();
    this.renderUsersTable(users);
  }

  async fetchUsers() {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    return users.map((user) => ({
      ...user,
      password: "******", // Hide passwords in UI
    }));
  }

  renderUsersTable(users) {
    const container = document.querySelector(".users-table-container");
    if (!container) return;

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (user) => `
            <tr>
              <td>${user.username}</td>
              <td>${user.role}</td>
              <td>
                <span class="status-badge ${user.status || "active"}">
                  ${user.status || "Active"}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button onclick="adminManager.editUser('${user.username}')">
                    <i class='bx bx-edit'></i>
                  </button>
                  <button onclick="adminManager.toggleUserStatus('${
                    user.username
                  }')">
                    <i class='bx bx-power-off'></i>
                  </button>
                </div>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  async handleUserAction(action, userData) {
    const users = await this.fetchUsers();

    switch (action) {
      case "add":
        if (users.some((u) => u.username === userData.username)) {
          throw new Error("Username already exists");
        }
        users.push(userData);
        break;

      case "edit":
        const index = users.findIndex((u) => u.username === userData.username);
        if (index !== -1) {
          users[index] = { ...users[index], ...userData };
        }
        break;

      case "toggle":
        const user = users.find((u) => u.username === userData.username);
        if (user) {
          user.status = user.status === "active" ? "inactive" : "active";
        }
        break;
    }

    localStorage.setItem("users", JSON.stringify(users));
    this.loadUserManagement();
  }

  // Product Management Methods
  async loadProductManagement() {
    const products = await this.fetchProducts();
    this.renderProductsTable(products);
  }

  async handleProductAction(action, productData) {
    const products = await this.fetchProducts();

    switch (action) {
      case "add":
        productData.id = Date.now();
        products.push(productData);
        break;

      case "edit":
        const index = products.findIndex((p) => p.id === productData.id);
        if (index !== -1) {
          products[index] = { ...products[index], ...productData };
        }
        break;

      case "delete":
        const productIndex = products.findIndex((p) => p.id === productData.id);
        if (productIndex !== -1) {
          products.splice(productIndex, 1);
        }
        break;
    }

    localStorage.setItem("store_products", JSON.stringify(products));
    this.loadProductManagement();
  }

  setupEventListeners() {
    // Role filter
    document.getElementById("roleFilter")?.addEventListener("change", (e) => {
      this.filterUsers(e.target.value);
    });

    // User search
    document.getElementById("userSearch")?.addEventListener("input", (e) => {
      this.searchUsers(e.target.value);
    });

    // Product filters
    document
      .getElementById("categoryFilter")
      ?.addEventListener("change", (e) => {
        this.filterProducts(e.target.value);
      });
  }

  showAddProductModal() {
    const modal = document.getElementById("productModal");
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Product</h3>
          <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
            <i class='bx bx-x'></i>
          </button>
        </div>
        <form id="addProductForm" onsubmit="adminManager.handleAddProduct(event)" class="product-form">
          <div class="form-grid">
            <div class="form-col">
              <div class="form-group">
                <label for="productName">Product Name</label>
                <input type="text" id="productName" required>
              </div>
              <div class="form-group">
                <label for="productPrice">Price (Rp)</label>
                <input type="number" id="productPrice" required min="0">
              </div>
              <div class="form-group">
                <label for="productMaterial">Material</label>
                <select id="productMaterial" required>
                  <option value="">Select Material</option>
                  <option value="Plastic">Plastic</option>
                  <option value="Metal">Metal</option>
                  <option value="Glass">Glass</option>
                  <option value="Carbon Fiber">Carbon Fiber</option>
                  <option value="Aluminum">Aluminum</option>
                  <option value="Stainless Steel">Stainless Steel</option>
                </select>
              </div>
              <div class="form-group">
                <label for="productStock">Stock</label>
                <input type="number" id="productStock" required min="0">
              </div>
            </div>
            <div class="form-col">
              <div class="form-group">
                <label for="productImage">Product Image</label>
                <div class="image-upload-container" onclick="document.getElementById('productImage').click()">
                  <img id="imagePreview" src="#" alt="Preview" style="display: none;">
                  <div class="upload-placeholder">
                    <i class='bx bx-image-add'></i>
                    <span>Click to upload image</span>
                  </div>
                  <input type="file" id="productImage" accept="image/*" required 
                         onchange="adminManager.previewImage(event)" style="display: none;">
                </div>
              </div>
            </div>
          </div>
          <div class="form-group full-width">
            <label for="productDescription">Description</label>
            <textarea id="productDescription" required></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" onclick="this.closest('.modal').style.display='none'">
              Cancel
            </button>
            <button type="submit" class="btn-save">
              Save Product
            </button>
          </div>
        </form>
      </div>
    `;
    modal.style.display = "flex";
  }

  previewImage(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      const preview = document.getElementById("imagePreview");

      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      };

      reader.readAsDataURL(file);
    }
  }

  async handleAddProduct(event) {
    event.preventDefault();
    const form = event.target;
    const imageFile = form.productImage.files[0];

    try {
      // Convert image to base64
      const imageBase64 = await this.convertToBase64(imageFile);

      const newProduct = {
        id: Date.now(),
        name: form.productName.value,
        price: parseInt(form.productPrice.value),
        material: form.productMaterial.value,
        stock: parseInt(form.productStock.value),
        image: imageBase64,
        description: form.productDescription.value,
        date: new Date().toISOString(),
      };

      // Get existing products
      const products = JSON.parse(localStorage.getItem("store_products")) || [];

      // Add new product
      products.push(newProduct);

      // Save back to localStorage
      localStorage.setItem("store_products", JSON.stringify(products));

      // Close modal and refresh product list
      document.getElementById("productModal").style.display = "none";
      this.loadProductManagement();

      // Show success message
      this.showNotification("Product added successfully", "success");

      // Update dashboard stats
      loadStats();
    } catch (error) {
      this.showNotification("Failed to add product", "error");
      console.error("Error adding product:", error);
    }
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
}

// Initialize AdminManager
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".admin-theme")) {
    window.adminManager = new AdminManager();
  }
});
