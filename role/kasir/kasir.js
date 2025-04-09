class StockManager {
  constructor() {
    this.products = [];
    this.db = null;
    this.realTimeStockRef = null;
    this.productsRef = null;

    // Initialize UI first
    this.initializeUI();
    this.setupEventListeners();

    // Then initialize Firebase and load data
    this.init();
  }

  async init() {
    try {
      // Check auth first
      if (!this.checkAuth()) {
        return;
      }

      // Initialize Firebase
      await this.initializeFirebase();

      // Setup real-time sync and load products only after Firebase is initialized
      this.setupRealtimeSync();
      await this.loadProducts();
    } catch (error) {
      console.error("Initialization error:", error);
      this.showNotification("Error initializing application", "error");
    }
  }

  async initializeFirebase() {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!currentUser) throw new Error("User not found");

      // Initialize Firebase references
      this.db = firebase.database();
      this.realTimeStockRef = this.db.ref("real_time_stock");
      this.productsRef = this.db.ref("products");

      // Tambahkan anonymous auth untuk read access
      if (!firebase.auth().currentUser) {
        await firebase.auth().signInAnonymously();
      }

      console.log("Firebase initialized successfully");
      return true;
    } catch (error) {
      console.error("Firebase initialization error:", error);
      this.showNotification(
        "Error initializing Firebase: " + error.message,
        "error"
      );
      return false;
    }
  }

  checkAuth() {
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!user || user.role !== "cashier") {
      alert("Anda harus login sebagai kasir");
      window.location.href = "/login/login.html";
      return false;
    }
    return true;
  }

  initializeUI() {
    // Initialize UI elements
    this.searchInput = document.getElementById("searchInput");
    this.categoryFilter = document.getElementById("categoryFilter");
    this.stockFilter = document.getElementById("stockFilter");
    this.productsGrid = document.getElementById("productsGrid");
    this.modal = document.getElementById("stockModal");

    // Initialize modal elements
    if (this.modal) {
      // Setup modal close button
      this.modal
        .querySelector(".close-btn")
        .addEventListener("click", () => this.closeModal());
      this.modal
        .querySelector(".cancel-btn")
        .addEventListener("click", () => this.closeModal());
      this.modal
        .querySelector(".save-btn")
        .addEventListener("click", () => this.updateStock());

      // Setup stock control buttons
      const minusBtn = this.modal.querySelector(".minus-btn");
      const plusBtn = this.modal.querySelector(".plus-btn");
      const stockInput = this.modal.querySelector("#stockChange");

      minusBtn.addEventListener("click", () => {
        const currentValue = parseInt(stockInput.value) || 0;
        stockInput.value = Math.max(0, currentValue - 1);
      });

      plusBtn.addEventListener("click", () => {
        const currentValue = parseInt(stockInput.value) || 0;
        stockInput.value = currentValue + 1;
      });
    }

    // Initialize refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.loadProducts());
    }
  }

  setupEventListeners() {
    // Add event listeners for filters
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => this.filterProducts());
    }

    if (this.categoryFilter) {
      this.categoryFilter.addEventListener("change", () =>
        this.filterProducts()
      );
    }

    if (this.stockFilter) {
      this.stockFilter.addEventListener("change", () => this.filterProducts());
    }
  }

  setupRealtimeSync() {
    if (!this.realTimeStockRef) return;

    this.realTimeStockRef.on("value", (snapshot) => {
      const realtimeStocks = snapshot.val() || {};
      this.updateProductStocks(realtimeStocks);
    });
  }

  updateProductStocks(realtimeStocks) {
    if (!this.products) return;

    this.products = this.products.map((product) => ({
      ...product,
      stock: realtimeStocks[product.id]?.stock ?? product.stock,
    }));

    this.renderProducts();
  }

  async loadProducts() {
    try {
      if (!this.realTimeStockRef) {
        throw new Error("Firebase not initialized");
      }

      const realtimeSnapshot = await this.realTimeStockRef.once("value");
      const realtimeStocks = realtimeSnapshot.val() || {};

      // Load local products first
      const localProducts = this.getDefaultProducts();
      const apiProducts = await this.fetchApiProducts();

      this.products = [
        ...localProducts.map((p) => ({
          ...p,
          type: "local",
          stock: realtimeStocks[p.id]?.stock ?? p.stock,
        })),
        ...apiProducts.map((p) => ({
          ...p,
          type: "api",
          stock: realtimeStocks[p.id]?.stock ?? p.stock,
        })),
      ];

      this.renderProducts();
      await this.syncProductsToFirebase(this.products);
    } catch (error) {
      console.error("Error loading products:", error);
      this.showNotification("Gagal memuat produk: " + error.message, "error");
    }
  }

  async fetchApiProducts() {
    try {
      const response = await fetch("https://fakestoreapi.com/products");
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      return data.map((item) => ({
        id: `api_${item.id}`,
        name: item.title,
        price: Math.round(item.price * 15000),
        image: item.image,
        category: item.category,
        description: item.description,
        stock: 10,
      }));
    } catch (error) {
      console.error("Error fetching API products:", error);
      return [];
    }
  }

  async syncProductsToFirebase(products) {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!currentUser || currentUser.role !== "cashier") {
        throw new Error("Unauthorized access");
      }

      // Sederhanakan struktur data
      const updates = {};
      products.forEach((product) => {
        updates[product.id] = {
          stock: product.stock || 0,
          lastUpdate: Date.now(),
          name: product.name,
          type: product.type || "local",
        };
      });

      // Update langsung ke real_time_stock
      await this.realTimeStockRef.update(updates);
      console.log("Products synced successfully");
    } catch (error) {
      console.error("Sync error:", error);
      this.showNotification("Failed to sync: " + error.message, "error");
    }
  }

  getRandomMaterial() {
    const materials = [
      "Plastic",
      "Metal",
      "Glass",
      "Carbon Fiber",
      "Aluminum",
      "Stainless Steel",
    ];
    return materials[Math.floor(Math.random() * materials.length)];
  }

  getDefaultProducts() {
    return [
      {
        id: "static_1",
        name: "Laptop Gaming",
        price: 15999000,
        image: "/img/Laptop.jpg",
        stock: 10,
      },
      {
        id: "static_2",
        name: "PC Gaming",
        price: 55999000,
        image: "/img/PC Gaming.jpg",
        stock: 10,
      },
      {
        id: "static_3",
        name: "Headphone",
        price: 18000000,
        image: "/img/Handphone.jpg",
        stock: 10,
      },
    ];
  }

  renderProducts(filteredProducts = null) {
    const products = filteredProducts || this.products;
    const grid = document.getElementById("productsGrid");

    grid.innerHTML = products
      .map(
        (product) => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>Rp ${product.price.toLocaleString("id-ID")}</p>
                    <div class="stock-level ${this.getStockLevelClass(
                      product.stock
                    )}">
                        <i class="fas ${this.getStockIcon(product.stock)}"></i>
                        <span>Stok: ${product.stock}</span>
                    </div>
                    <button class="update-stock-btn" onclick="stockManager.showUpdateModal('${
                      product.id
                    }')">
                        <i class="fas fa-edit"></i> Update Stok
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  getStockLevelClass(stock) {
    if (stock === 0) return "out";
    if (stock < 5) return "low";
    return "";
  }

  getStockIcon(stock) {
    if (stock === 0) return "fa-times-circle";
    if (stock < 5) return "fa-exclamation-circle";
    return "fa-check-circle";
  }

  filterProducts() {
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const stockLevel = document.getElementById("stockFilter").value;

    let filtered = this.products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || product.type === category;
      const matchesStock = this.matchesStockFilter(product.stock, stockLevel);

      return matchesSearch && matchesCategory && matchesStock;
    });

    this.renderProducts(filtered);
  }

  matchesStockFilter(stock, filter) {
    switch (filter) {
      case "low":
        return stock > 0 && stock < 5;
      case "out":
        return stock === 0;
      default:
        return true;
    }
  }

  showUpdateModal(productId) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    // Update modal content
    this.modal.querySelector("#productImage").src = product.image;
    this.modal.querySelector("#productName").textContent = product.name;
    this.modal.querySelector(
      "#currentStock"
    ).textContent = `Stok Saat Ini: ${product.stock}`;
    this.modal.querySelector("#stockChange").value = 0;
    this.modal.querySelector("#updateNote").value = "";

    // Store current product ID
    this.modal.dataset.productId = productId;

    // Show modal
    this.modal.style.display = "block";
  }

  closeModal() {
    this.modal.style.display = "none";
  }

  async updateStock() {
    try {
      const productId = this.modal.dataset.productId;
      const product = this.products.find((p) => p.id === productId);
      const changeAmount = parseInt(this.modal.querySelector("#stockChange").value);
      const note = this.modal.querySelector("#updateNote").value;

      if (!product || isNaN(changeAmount) || changeAmount < 0) {
        this.showNotification("Input tidak valid", "error");
        return;
      }

      const newStock = product.stock + changeAmount;

      // Simplify update data structure
      const updateData = {
        stock: newStock,
        lastUpdate: Date.now(),
        name: product.name,
        type: product.type || 'local'
      };

      // Update stock
      await this.realTimeStockRef.child(productId).update(updateData);

      // Log update separately
      await this.logStockUpdate(product, changeAmount, newStock, note);

      // Update local data
      product.stock = newStock;
      this.renderProducts();
      this.closeModal();
      this.showNotification("Stok berhasil diperbarui", "success");

    } catch (error) {
      console.error("Error updating stock:", error);
      this.showNotification("Gagal memperbarui stok: " + error.message, "error"); 
    }
  }

  async logStockUpdate(product, change, newStock, note) {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      
      const updateData = {
        productId: product.id,
        productName: product.name,
        previousStock: product.stock,
        newStock: newStock,
        change: change,
        note: note || "Stock update",
        timestamp: Date.now(),
        userId: currentUser?.username || "anonymous"
      };

      // Use stockUpdatesRef directly from db
      const stockUpdateRef = this.db.ref("stock_updates").push();
      await stockUpdateRef.set(updateData);
      
      console.log("Stock update logged successfully");

    } catch (error) {
      console.error("Error logging update:", error);
      // Don't throw error to prevent blocking stock update
    }
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }, 100);
  }
}

// Initialize after DOM is ready and Firebase is loaded
window.addEventListener("load", () => {
  if (typeof firebase !== "undefined") {
    window.stockManager = new StockManager();
  } else {
    console.error("Firebase not loaded");
    alert("Error: Firebase not loaded. Please check your internet connection.");
  }
});
