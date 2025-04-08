class StockManager {
  constructor() {
    this.products = [];
    this.initializeUI();
    this.loadProducts();
  }

  initializeUI() {
    // Initialize search and filters
    document
      .getElementById("searchInput")
      .addEventListener("input", () => this.filterProducts());
    document
      .getElementById("categoryFilter")
      .addEventListener("change", () => this.filterProducts());
    document
      .getElementById("stockFilter")
      .addEventListener("change", () => this.filterProducts());

    // Refresh button
    document
      .getElementById("refreshBtn")
      .addEventListener("click", () => this.loadProducts());

    // Modal elements
    this.modal = document.getElementById("stockModal");
    this.modal
      .querySelector(".close-btn")
      .addEventListener("click", () => this.closeModal());
    this.modal
      .querySelector(".cancel-btn")
      .addEventListener("click", () => this.closeModal());
    this.modal
      .querySelector(".save-btn")
      .addEventListener("click", () => this.updateStock());

    // Stock controls
    const stockInput = this.modal.querySelector("#stockChange");
    this.modal.querySelector(".minus-btn").addEventListener("click", () => {
      stockInput.value = Math.max(0, parseInt(stockInput.value) - 1);
    });
    this.modal.querySelector(".plus-btn").addEventListener("click", () => {
      stockInput.value = parseInt(stockInput.value) + 1;
    });
  }

  async loadProducts() {
    try {
      // Load local stocks
      const localStocks =
        JSON.parse(localStorage.getItem("local_product_stocks")) || {};
      const apiStocks =
        JSON.parse(localStorage.getItem("api_product_stocks")) || {};

      // Load local products
      const localProducts =
        JSON.parse(localStorage.getItem("store_products")) || [];
      const staticProducts = [...this.getDefaultProducts()];

      // Combine and format products
      this.products = [
        ...staticProducts.map((p) => ({
          ...p,
          type: "local",
          stock: localStocks[p.id] ?? p.stock,
        })),
        ...localProducts.map((p) => ({
          ...p,
          type: "local",
          stock: localStocks[p.id] ?? p.stock,
        })),
      ];

      // Load API products
      const response = await fetch("https://fakestoreapi.com/products");
      if (response.ok) {
        const apiData = await response.json();
        const apiProducts = apiData.map((item) => ({
          id: `api_${item.id}`,
          name: item.title,
          price: Math.round(item.price * 15000),
          image: item.image,
          type: "api",
          stock: apiStocks[`api_${item.id}`] ?? 10,
        }));
        this.products = [...this.products, ...apiProducts];
      }

      this.renderProducts();
    } catch (error) {
      console.error("Error loading products:", error);
      this.showNotification("Error loading products", "error");
    }
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
    const productId = this.modal.dataset.productId;
    const product = this.products.find((p) => p.id === productId);
    const changeAmount = parseInt(
      this.modal.querySelector("#stockChange").value
    );
    const note = this.modal.querySelector("#updateNote").value;

    if (!product || isNaN(changeAmount) || changeAmount < 0) {
      this.showNotification("Invalid input", "error");
      return;
    }

    try {
      const newStock = product.stock + changeAmount;

      // Update local storage based on product type
      if (product.id.startsWith("api_")) {
        const apiStocks =
          JSON.parse(localStorage.getItem("api_product_stocks")) || {};
        apiStocks[product.id] = newStock;
        localStorage.setItem("api_product_stocks", JSON.stringify(apiStocks));
      } else {
        const localStocks =
          JSON.parse(localStorage.getItem("local_product_stocks")) || {};
        localStocks[product.id] = newStock;
        localStorage.setItem(
          "local_product_stocks",
          JSON.stringify(localStocks)
        );
      }

      // Log the stock update
      await this.logStockUpdate(product, changeAmount, newStock, note);

      // Update local data
      product.stock = newStock;
      this.renderProducts();
      this.closeModal();
      this.showNotification("Stock updated successfully", "success");
    } catch (error) {
      console.error("Error updating stock:", error);
      this.showNotification("Error updating stock", "error");
    }
  }

  async logStockUpdate(product, change, newStock, note) {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

      // Initialize database reference directly
      const db = firebase.database();
      const stockUpdateRef = db.ref("stock_updates").push();

      const updateData = {
        productId: product.id,
        productName: product.name,
        previousStock: product.stock,
        change: change,
        newStock: newStock,
        note: note || "Stock update",
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        userId: currentUser?.username || "anonymous",
        userRole: currentUser?.role || "unknown",
      };

      await stockUpdateRef.set(updateData);
      console.log("Stock update logged successfully");

      // Update real-time stock
      const realTimeStockRef = db.ref(`real_time_stock/${product.id}`);
      await realTimeStockRef.update({
        stock: newStock,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP,
      });
    } catch (error) {
      console.error("Error logging stock update:", error);
      this.showNotification(`Error updating stock: ${error.message}`, "error");
      throw error;
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

const stockManager = new StockManager();
