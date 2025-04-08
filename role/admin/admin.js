class AdminDashboard {
    constructor() {
      // Check for existing admin session first
      const sessionUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!sessionUser || sessionUser.role !== "admin") {
        window.location.href = "../../login/login.html";
        return;
      }
  
      // Check dependencies
      if (!window.NotificationManager) {
        throw new Error("NotificationManager not loaded");
      }
  
      // Initialize managers first
      this.notificationManager = new NotificationManager();
  
      // Add loading control methods
      this.showLoading = () =>
        (document.getElementById("loadingOverlay").style.display = "flex");
      this.hideLoading = () =>
        (document.getElementById("loadingOverlay").style.display = "none");
  
      // Initialize with loading control
      this.initialize();
    }
  
    async initialize() {
      try {
        await this.checkAdminAuth();
        this.initializeAdminPanel();
        this.setupEventListeners();
        this.initializeSidebarToggle();
        await this.initializeDashboard();
        this.hideLoading(); // Hide loading after initialization
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        this.showNotification("Error initializing dashboard", "error");
        this.hideLoading();
      }
    }
  
    async checkAdminAuth() {
      try {
        const sessionUser = JSON.parse(sessionStorage.getItem("currentUser"));
        if (!sessionUser || sessionUser.role !== "admin") {
          throw new Error("Unauthorized access");
        }
  
        // Update profile display
        document.getElementById("adminName").textContent =
          sessionUser.username || sessionUser.email;
        const avatarImg = document.getElementById("adminAvatar");
  
        if (sessionUser.photoURL) {
          avatarImg.src = sessionUser.photoURL;
        } else {
          avatarImg.src = "/img/default-avatar.png";
        }
  
        // Add error handler for images
        avatarImg.onerror = () => {
          avatarImg.src = "/img/default-avatar.png";
        };
  
        return true;
      } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = "/login/login.html";
        return false;
      }
    }
  
    initializeAdminPanel() {
      // Setup navigation
      document.querySelectorAll(".nav-menu li").forEach((item) => {
        item.addEventListener("click", () => {
          // Remove active class from all items
          document
            .querySelectorAll(".nav-menu li")
            .forEach((i) => i.classList.remove("active"));
  
          // Add active class to clicked item
          item.classList.add("active");
  
          // Show corresponding section
          const sectionId = item.dataset.section;
          this.showSection(sectionId);
        });
      });
    }
  
    initializeSidebarToggle() {
      const sidebar = document.getElementById("adminSidebar");
      const content = document.querySelector(".admin-content");
      const toggleBtn = document.getElementById("sidebarToggle");
  
      if (!sidebar || !content || !toggleBtn) {
        console.error("Required elements not found");
        return;
      }
  
      const handleToggle = () => {
        try {
          sidebar.classList.toggle("collapsed");
          content.classList.toggle("expanded");
  
          const isCollapsed = sidebar.classList.contains("collapsed");
          localStorage.setItem("sidebarCollapsed", isCollapsed);
  
          const icon = toggleBtn.querySelector("i");
          if (icon) {
            if (isCollapsed) {
              icon.classList.replace("bx-menu", "bx-menu-alt-right");
            } else {
              icon.classList.replace("bx-menu-alt-right", "bx-menu");
            }
          }
        } catch (error) {
          console.error("Toggle error:", error);
        }
      };
  
      // Add error handling for event listener
      toggleBtn.addEventListener("click", handleToggle);
  
      // Load saved state with error handling
      try {
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState === "true") {
          sidebar.classList.add("collapsed");
          content.classList.add("expanded");
          const icon = toggleBtn.querySelector("i");
          if (icon) {
            icon.classList.replace("bx-menu", "bx-menu-alt-right");
          }
        }
      } catch (error) {
        console.error("Error loading saved state:", error);
      }
    }
  
    showSection(sectionId) {
      // Hide all sections
      document.querySelectorAll(".admin-section").forEach((section) => {
        section.classList.remove("active");
      });
  
      // Show selected section
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add("active");
  
        // Update page title
        document.title = `${this.getSectionTitle(sectionId)} - Admin Dashboard`;
  
        // Load section data
        this.loadSectionData(sectionId);
      }
  
      // Update active menu item
      document.querySelectorAll(".nav-menu li").forEach((item) => {
        if (item.dataset.section === sectionId) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }
  
    getSectionTitle(sectionId) {
      const titles = {
        dashboard: "Dashboard Overview",
        products: "Manajemen Produk",
        categories: "Kategori Produk",
        orders: "Daftar Pesanan",
        shipping: "Status Pengiriman",
        users: "Manajemen Pengguna",
        reviews: "Review Pelanggan",
        analytics: "Laporan & Analisis",
        store: "Pengaturan Toko",
      };
      return titles[sectionId] || "Admin Dashboard";
    }
  
    async loadSectionData(sectionId) {
      const section = document.getElementById(sectionId);
      if (!section) return;
  
      section.innerHTML = '<div class="loading-spinner"></div>';
  
      try {
        switch (sectionId) {
          case "products":
            await this.loadProducts(section);
            break;
          case "users":
            await this.loadUsers(section);
            break;
          case "orders":
            await this.loadOrders(section);
            break;
          case "transactions":
            await this.loadTransactions();
            break;
          // Add more cases for other sections
        }
      } catch (error) {
        section.innerHTML = `<div class="error-message">Error loading data: ${error.message}</div>`;
      }
    }
  
    async initializeDashboard() {
      // Setup Chart.js
      this.setupCharts();
      // Load initial data
      await this.loadDashboardData();
      // Setup real-time updates
      this.setupRealtimeUpdates();
    }
  
    async loadDashboardData() {
      try {
        const stats = await this.getStats();
        this.updateStatCards(stats);
        this.updateCharts(stats);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        this.showNotification("Error loading dashboard data", "error");
      }
    }
  
    async getStats() {
      try {
        // Create and dispatch custom event for stock updates
        const stockUpdateEvent = new CustomEvent("stockUpdate", {
          detail: {
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(stockUpdateEvent);
  
        // Get products from all sources
        const localProducts =
          JSON.parse(localStorage.getItem("store_products")) || [];
        const apiProducts =
          JSON.parse(localStorage.getItem("api_products")) || [];
        const staticProducts = [
          { id: "static_1", name: "Laptop Gaming", stock: 10 },
          { id: "static_2", name: "PC Gaming", stock: 10 },
          { id: "static_3", name: "Headphone", stock: 10 },
        ];
  
        // Setup storage event listener for real-time updates
        window.addEventListener("storage", (e) => {
          if (e.key === "store_products" || e.key === "api_products") {
            this.loadDashboardData();
          }
        });
  
        // Setup custom event listener for real-time updates
        window.addEventListener("stockUpdate", () => {
          this.loadDashboardData();
        });
  
        // Combine all products
        const allProducts = [...localProducts, ...apiProducts, ...staticProducts];
  
        // Calculate product statistics
        const productStats = {
          total: allProducts.length,
          inStock: allProducts.filter((p) => p.stock > 0).length,
          outOfStock: allProducts.filter((p) => p.stock === 0).length,
          apiCount: apiProducts.length,
          localCount: localProducts.length + staticProducts.length,
        };
  
        // Update stat card with detailed information
        const statCard = document.querySelector(".stat-card:nth-child(1)");
        if (statCard) {
          statCard.querySelector(".stat-value").textContent = productStats.total;
          statCard.querySelector(".stat-details").innerHTML = `
            <span class="stat-label">Tersedia:</span>
            <span class="stock-count">${productStats.inStock}</span>
            <span class="stat-label">| Habis:</span>
            <span class="outofstock-count">${productStats.outOfStock}</span>
            <br>
            <span class="stat-label">API Products:</span>
            <span class="api-count">${productStats.apiCount}</span>
            <span class="stat-label">| Local Products:</span>
            <span class="local-count">${productStats.localCount}</span>
          `;
        }
  
        return {
          products: productStats,
          users: {
            total: JSON.parse(localStorage.getItem("users"))?.length || 0,
            new:
              JSON.parse(localStorage.getItem("users"))?.filter((u) => {
                const createdAt = new Date(u.createdAt || Date.now());
                return Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;
              }).length || 0,
          },
          orders: {
            total: JSON.parse(localStorage.getItem("orders"))?.length || 0,
            revenue:
              JSON.parse(localStorage.getItem("orders"))?.reduce(
                (sum, order) => sum + order.total,
                0
              ) || 0,
            recent: JSON.parse(localStorage.getItem("orders"))?.slice(-5) || [],
          },
        };
      } catch (error) {
        console.error("Error getting stats:", error);
        return {
          products: {
            total: 0,
            inStock: 0,
            outOfStock: 0,
            apiCount: 0,
            localCount: 0,
          },
          users: { total: 0, new: 0 },
          orders: { total: 0, revenue: 0, recent: [] },
        };
      }
    }
  
    updateStatCards(stats) {
      // Update Products Card
      document.querySelector(".stat-card:nth-child(1) .stat-value").textContent =
        stats.products.total;
  
      // Update Users Card
      document.querySelector(".stat-card:nth-child(2) .stat-value").textContent =
        stats.users.total;
  
      // Update Revenue Card
      document.querySelector(
        ".stat-card:nth-child(3) .stat-value"
      ).textContent = `Rp ${stats.orders.revenue.toLocaleString("id-ID")}`;
    }
  
    setupCharts() {
      const ctx = document.createElement("canvas");
      document.querySelector(".charts-container").appendChild(ctx);
  
      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Pendapatan Harian",
              data: [],
              borderColor: "#45f3ff",
              tension: 0.4,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(69, 243, 255, 0.1)",
              },
              ticks: {
                color: "#8f8f8f",
              },
            },
            x: {
              grid: {
                color: "rgba(69, 243, 255, 0.1)",
              },
              ticks: {
                color: "#8f8f8f",
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: "#ffffff",
              },
            },
          },
        },
      });
    }
  
    updateCharts(stats) {
      if (!this.chart) {
        console.warn("Chart not initialized");
        return;
      }
  
      try {
        // Get last 7 days dates
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
          });
        });
  
        // Get daily revenue data
        const dailyRevenue = this.calculateDailyRevenue(stats.orders.recent);
  
        // Update chart data
        this.chart.data.labels = dates;
        this.chart.data.datasets[0].data = dailyRevenue;
  
        // Update chart
        this.chart.update();
      } catch (error) {
        console.error("Error updating chart:", error);
        this.showNotification("Error updating chart", "error");
      }
    }
  
    calculateDailyRevenue(orders) {
      // Create array of 7 zeros for last 7 days
      const revenue = new Array(7).fill(0);
  
      try {
        orders.forEach((order) => {
          const orderDate = new Date(order.timestamp || order.date);
          const today = new Date();
          const diffTime = Math.abs(today - orderDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
  
          if (diffDays < 7) {
            revenue[6 - diffDays] += order.total || 0;
          }
        });
      } catch (error) {
        console.error("Error calculating daily revenue:", error);
      }
  
      return revenue;
    }
  
    setupRealtimeUpdates() {
      // Watch for localStorage changes
      window.addEventListener("storage", (e) => {
        if (
          ["store_products", "api_products", "users", "orders"].includes(e.key)
        ) {
          this.loadDashboardData();
        }
      });
  
      // Monitor both local and API product changes
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function (key, value) {
        originalSetItem.call(this, key, value);
        if (["store_products", "api_products"].includes(key)) {
          window.dispatchEvent(new StorageEvent("storage", { key }));
        }
      };
  
      // Setup periodic refresh
      setInterval(() => this.loadDashboardData(), 30000);
    }
  
    showNotification(message, type = "info") {
      this.notificationManager.showNotification(message, type);
    }
  
    logout() {
      try {
        // Clear both Firebase auth and session
        firebase
          .auth()
          .signOut()
          .then(() => {
            sessionStorage.removeItem("currentUser");
            window.location.href = "/login/login.html";
          })
          .catch((error) => {
            console.error("Logout error:", error);
            // Fallback logout
            sessionStorage.removeItem("currentUser");
            window.location.href = "/login/login.html";
          });
      } catch (error) {
        // Fallback logout
        sessionStorage.removeItem("currentUser");
        window.location.href = "/login/login.html";
      }
    }
  
    // Add setupEventListeners method
    setupEventListeners() {
      // Add event listeners for interactive elements
      this.setupNavigationEvents();
      this.setupFilterEvents();
      this.setupSearchEvents();
      this.setupActionButtons();
    }
  
    setupNavigationEvents() {
      // Navigation menu events
      document.querySelectorAll(".nav-menu li").forEach((item) => {
        item.addEventListener("click", () => {
          this.showSection(item.dataset.section);
        });
      });
  
      // Logout button
      document.querySelector(".logout-btn")?.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          this.logout();
        }
      });
    }
  
    setupFilterEvents() {
      // Date filter events
      const startDate = document.getElementById("startDate");
      const endDate = document.getElementById("endDate");
  
      if (startDate && endDate) {
        startDate.addEventListener("change", () => this.filterData());
        endDate.addEventListener("change", () => this.filterData());
      }
    }
  
    setupSearchEvents() {
      // Add debounced search functionality
      const searchInputs = document.querySelectorAll('input[type="search"]');
      searchInputs.forEach((input) => {
        let timeout;
        input.addEventListener("input", (e) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            this.handleSearch(e.target.value);
          }, 300);
        });
      });
    }
  
    setupActionButtons() {
      // Add click handlers for action buttons
      document.querySelectorAll(".action-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
  
          switch (action) {
            case "edit":
              this.handleEdit(id);
              break;
            case "delete":
              this.handleDelete(id);
              break;
            default:
              break;
          }
        });
      });
    }
  
    handleSearch(query) {
      // Implement search functionality
      console.log("Searching for:", query);
      // Add your search logic here
    }
  
    filterData() {
      const startDate = document.getElementById("startDate")?.value;
      const endDate = document.getElementById("endDate")?.value;
  
      if (startDate && endDate) {
        console.log("Filtering data between", startDate, "and", endDate);
        // Add your filter logic here
      }
    }
  
    handleEdit(id) {
      console.log("Editing item:", id);
      // Add your edit logic here
    }
  
    handleDelete(id) {
      if (confirm("Are you sure you want to delete this item?")) {
        console.log("Deleting item:", id);
        // Add your delete logic here
      }
    }
  
    handleAddProduct(event) {
      event.preventDefault();
      const form = event.target;
      const imageFile = form.productImage.files[0];
  
      try {
        // ...existing product creation code...
  
        // After adding product, dispatch custom event
        const stockUpdateEvent = new CustomEvent("stockUpdate", {
          detail: {
            type: "add",
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(stockUpdateEvent);
  
        // Dispatch storage event for other tabs/windows
        localStorage.setItem("lastStockUpdate", new Date().toISOString());
  
        // ...rest of existing code...
      } catch (error) {
        console.error("Error adding product:", error);
        this.showNotification("Failed to add product", "error");
      }
    }
  
    async loadTransactions() {
      try {
        const transactionsRef = firebase.firestore().collection("transactions");
        const snapshot = await transactionsRef.orderBy("createdAt", "desc").get();
  
        const transactions = [];
        snapshot.forEach((doc) => {
          transactions.push({
            id: doc.id,
            ...doc.data(),
          });
        });
  
        this.renderTransactions(transactions);
      } catch (error) {
        console.error("Error loading transactions:", error);
        this.showNotification("Error loading transactions", "error");
      }
    }
  
    renderTransactions(transactions) {
      const tbody = document.getElementById("transactionsTableBody");
      if (!tbody) return;
  
      tbody.innerHTML = transactions
        .map(
          (transaction) => `
        <tr>
          <td>${transaction.transactionId}</td>
          <td>${this.formatDate(transaction.createdAt?.toDate())}</td>
          <td>${transaction.customer.username || "Guest"}</td>
          <td>${transaction.items.length} items</td>
          <td>Rp ${transaction.payment.total.toLocaleString("id-ID")}</td>
          <td>
            <span class="status-badge ${transaction.status}">
              ${transaction.status}
            </span>
          </td>
          <td>
            <button class="btn-view" onclick="adminManager.viewTransactionDetails('${
              transaction.id
            }')">
              <i class="bx bx-show"></i>
            </button>
          </td>
        </tr>
      `
        )
        .join("");
    }
  
    async viewTransactionDetails(transactionId) {
      try {
        const doc = await firebase
          .firestore()
          .collection("transactions")
          .doc(transactionId)
          .get();
  
        if (!doc.exists) {
          throw new Error("Transaction not found");
        }
  
        const transaction = doc.data();
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h3>Detail Transaksi</h3>
              <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
              <div class="transaction-info">
                <p><strong>ID:</strong> ${transaction.transactionId}</p>
                <p><strong>Tanggal:</strong> ${this.formatDate(
                  transaction.createdAt?.toDate()
                )}</p>
                <p><strong>Customer:</strong> ${
                  transaction.customer.username || "Guest"
                }</p>
                <p><strong>Status:</strong> ${transaction.status}</p>
              </div>
              
              <h4>Items</h4>
              <div class="items-list">
                ${transaction.items
                  .map(
                    (item) => `
                  <div class="item">
                    <span>${item.name}</span>
                    <span>${item.quantity}x</span>
                    <span>Rp ${item.price.toLocaleString("id-ID")}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
              
              <div class="transaction-summary">
                <p><strong>Subtotal:</strong> Rp ${transaction.payment.subtotal.toLocaleString(
                  "id-ID"
                )}</p>
                <p><strong>Tax:</strong> Rp ${transaction.payment.tax.toLocaleString(
                  "id-ID"
                )}</p>
                <p><strong>Total:</strong> Rp ${transaction.payment.total.toLocaleString(
                  "id-ID"
                )}</p>
              </div>
            </div>
          </div>
        `;
  
        document.body.appendChild(modal);
      } catch (error) {
        console.error("Error viewing transaction:", error);
        this.showNotification("Error loading transaction details", "error");
      }
    }
  
    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  
  // Update initialization
  function initDashboard() {
    try {
      if (document.readyState === "complete" && window.NotificationManager) {
        new AdminDashboard();
      } else {
        window.addEventListener("load", () => {
          if (window.NotificationManager) {
            new AdminDashboard();
          } else {
            throw new Error("Required dependencies not loaded");
          }
        });
      }
    } catch (error) {
      console.error("Dashboard initialization error:", error);
      document.getElementById("loadingOverlay").style.display = "none";
      const errorContainer = document.getElementById("errorContainer");
      if (errorContainer) {
        errorContainer.innerHTML = `
          <div class="error-message">
            ${error.message}. Please refresh the page.
            <button onclick="window.location.reload()">Refresh</button>
          </div>
        `;
      }
    }
  }
  
  initDashboard();
  