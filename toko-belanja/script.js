/**
 * Manages the entire shopping experience for an e-commerce application.
 * Handles product fetching, filtering, cart management, and checkout processes.
 *
 * @class
 * @property {Array} products - List of all available products
 * @property {Array} cart - Current items in the user's shopping cart
 * @property {number} currentPage - Current page number for product pagination
 * @property {number} ITEMS_PER_PAGE - Number of products displayed per page
 * @property {boolean} isCartOpen - Tracks whether the cart dropdown is currently open
 */
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

class ShopManager {
  constructor() {
    this.products = [];
    this.apiProducts = []; // Add new property for API products
    this.cart = [];
    this.currentPage = 1;
    this.ITEMS_PER_PAGE = 10;
    this.isCartOpen = false; // Add this

    this.staticProducts = [
      {
        id: "static_1",
        name: "Laptop Gaming",
        price: 15999000,
        material: "Metal",
        date: "2024-02-20",
        image: "../img/Laptop.jpg",
        description: "High-performance gaming laptop",
        stock: 10,
      },
      {
        id: "static_2",
        name: "PC Gaming",
        price: 55999000,
        material: "Metal",
        date: "2024-02-19",
        image: "../img/PC Gaming.jpg",
        description: "Custom built gaming PC",
        stock: 10,
      },
      {
        id: "static_3",
        name: "Headphone",
        price: 18000000,
        material: "Plastic",
        date: "2024-02-18",
        image: "../img/Handphone.jpg",
        description: "Premium gaming headphones",
        stock: 10,
      },
    ];

    this.initializeElements();
    this.loadCart();
    this.attachEventListeners();
    this.fetchProducts();
  }

  async fetchProducts() {
    try {
      // 1. Get local products
      const localProducts =
        JSON.parse(localStorage.getItem("store_products")) || [];
      this.products = [...this.staticProducts, ...localProducts];

      // 2. Fetch API products separately
      const response = await fetch("https://fakestoreapi.com/products");
      if (!response.ok) throw new Error("Network response was not ok");

      const apiData = await response.json();
      this.apiProducts = apiData.map((item) => ({
        id: `api_${item.id}`,
        name: item.title,
        price: Math.round(item.price * 15000),
        category: item.category,
        material: this.getRandomMaterial(),
        date: new Date(
          Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30
        ).toISOString(),
        image: item.image,
        description: item.description,
        stock: 10,
        isApiProduct: true, // Flag to identify API products
      }));

      // 3. Combine all products for display
      this.filteredProducts = [...this.products, ...this.apiProducts];
      this.displayProducts();
    } catch (error) {
      console.error("Error fetching products:", error);
      // If API fails, still show local products
      this.filteredProducts = [...this.products];
      this.displayProducts();
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

  initializeElements() {
    // Initialize DOM elements
    this.productsContainer = document.querySelector(".products-container");
    this.cartCount = document.querySelector(".cart-count");
    this.cartTotal = document.querySelector(".cart-sticky .cart-total");
    this.searchInput = document.getElementById("searchInput");
    this.sortSelect = document.getElementById("sortBy");
    this.categorySelect = document.getElementById("filterCategory");
    this.cartSticky = document.querySelector(".cart-sticky");
    this.cartIcon = this.cartSticky.querySelector(".cart-icon");
    this.loadCartFromCookies(); // Add this line
    this.materialSelect = document.getElementById("materialSelect");
    this.dateSelect = document.getElementById("dateSelect");
  }

  filterProducts() {
    // Start with all products
    let filtered = [...this.products, ...this.apiProducts];
    const searchTerm = this.searchInput?.value.toLowerCase() || "";
    const sortBy = this.sortSelect?.value || "";
    const category = this.categorySelect?.value || "";
    const material = this.materialSelect?.value || "";
    const dateRange = this.dateSelect?.value || "";

    // Keyword search
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.material.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter((product) => product.category === category);
    }

    // Material filter
    if (material) {
      filtered = filtered.filter((product) => product.material === material);
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      const days = parseInt(dateRange);
      const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((product) => new Date(product.date) >= cutoff);
    }

    // Sorting
    switch (sortBy) {
      case "priceAsc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "dateDesc":
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "dateAsc":
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
    }

    this.filteredProducts = filtered;
    this.currentPage = 1;
    this.displayProducts();
    this.updateFilterStats();
  }

  updateFilterStats() {
    const stats = document.getElementById("filterStats");
    if (stats) {
      const total = this.products.length;
      const filtered = this.filteredProducts.length;
      stats.textContent = `Menampilkan ${filtered} dari ${total} produk`;
      stats.style.display = filtered < total ? "block" : "none";
    }
  }

  updatePriceLabel() {
    this.priceValue.textContent = `Rp ${this.priceRange.value.toLocaleString()}`;
  }

  attachEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => this.filterProducts());
    }
    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", () => this.filterProducts());
    }
    if (this.categorySelect) {
      this.categorySelect.addEventListener("change", () =>
        this.filterProducts()
      );
    }
    if (this.materialSelect) {
      this.materialSelect.addEventListener("change", () =>
        this.filterProducts()
      );
    }
    if (this.dateSelect) {
      this.dateSelect.addEventListener("change", () => this.filterProducts());
    }

    if (this.cartSticky) {
      this.cartSticky.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleCart();
      });

      // Close cart when clicking outside
      document.addEventListener("click", (e) => {
        if (this.isCartOpen && !e.target.closest(".cart-dropdown")) {
          this.closeCart();
        }
      });
    }

    // Improve button feedback
    document.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        if (this.disabled) {
          e.preventDefault();
          return;
        }

        // Add visual feedback
        this.classList.add("clicked");
        setTimeout(() => this.classList.remove("clicked"), 200);

        // Prevent double clicks
        if (!this.classList.contains("quantity-btn")) {
          this.disabled = true;
          setTimeout(() => (this.disabled = false), 500);
        }
      });
    });
  }

  displayProducts() {
    const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
    const paginatedProducts = this.filteredProducts.slice(
      start,
      start + this.ITEMS_PER_PAGE
    );

    this.productsContainer.innerHTML = `
      ${this.renderProducts(paginatedProducts)}
      ${this.renderPagination()}
    `;

    this.attachProductListeners();
  }

  checkAuth() {
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!user) {
      // Store current URL to redirect back after login
      sessionStorage.setItem("returnUrl", window.location.href);
      return false;
    }
    return true;
  }

  async handleCheckout() {
    if (!this.checkAuth()) {
      this.saveCartToCookies();
      alert("Silakan login terlebih dahulu untuk melakukan checkout");
      window.location.href = "../login/login.html";
      return;
    }

    try {
      const db = firebase.database();
      const updates = {};

      // Update stok untuk setiap item di keranjang
      for (const item of this.cart) {
        const productRef = db.ref(`products/${item.id}`);
        const snapshot = await productRef.once("value");
        const currentStock = snapshot.val()?.stock || 0;

        if (currentStock < item.quantity) {
          alert(`Stok tidak mencukupi untuk produk ${item.name}`);
          return;
        }

        // Perbarui stok
        updates[`products/${item.id}/stock`] = currentStock - item.quantity;
      }

      // Catat transaksi
      const transactionRef = db.ref("transactions").push();
      updates[`transactions/${transactionRef.key}`] = {
        userId: JSON.parse(sessionStorage.getItem("currentUser")).username,
        items: this.cart,
        totalAmount: this.calculateTotal(),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: "completed",
      };

      // Jalankan semua update dalam satu transaksi
      await db.ref().update(updates);

      // Tampilkan struk dan bersihkan keranjang
      this.showReceipt();
      this.cart = [];
      this.updateCartDisplay();
      this.saveCartToSession();
      this.clearCartCookies();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Terjadi kesalahan saat checkout. Silakan coba lagi.");
    }
  }

  addToCart(productId) {
    // Find product from all sources (static, admin-added, and API products)
    const product = this.filteredProducts.find(
      (p) =>
        // Convert both to strings for comparison since API products use string IDs
        String(p.id) === String(productId)
    );

    // Check if product exists and has stock
    if (!product) {
      console.error("Product not found:", productId);
      return;
    }

    if (product.stock === 0) {
      this.showCartNotification("Produk tidak tersedia");
      return;
    }

    const existingItem = this.cart.find(
      (item) => String(item.id) === String(productId)
    );

    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= product.stock) {
        this.showCartNotification("Stok produk tidak mencukupi");
        return;
      }
      existingItem.quantity++;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        maxStock: product.stock,
      });
    }

    this.saveCartToSession();
    this.saveCartToCookies();
    this.updateCartDisplay();
    this.displayProducts(); // Refresh to update buttons
    this.showCartNotification("Produk ditambahkan ke keranjang");
  }

  removeFromCart(productId) {
    const itemIndex = this.cart.findIndex(
      (item) => String(item.id) === String(productId)
    );
    if (itemIndex > -1) {
      if (this.cart[itemIndex].quantity > 1) {
        this.cart[itemIndex].quantity--;
      } else {
        this.cart.splice(itemIndex, 1);
      }

      this.saveCartToSession();
      this.saveCartToCookies();
      this.updateCartDisplay();
      this.displayProducts(); // Refresh to update buttons
      this.showCartNotification("Produk dihapus dari keranjang");
    }
  }

  saveCartToSession() {
    sessionStorage.setItem("cart", JSON.stringify(this.cart));
  }

  loadCart() {
    this.cart = JSON.parse(sessionStorage.getItem("cart")) || [];
    this.updateCartDisplay();
  }

  saveCartToCookies() {
    const cartData = JSON.stringify({
      items: this.cart,
      total: this.calculateTotal(),
      lastUpdated: new Date().toISOString(),
    });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Cookie expires in 7 days

    document.cookie = `tevxionCart=${encodeURIComponent(
      cartData
    )};expires=${expiryDate.toUTCString()};path=/;SameSite=Strict`;
  }

  loadCartFromCookies() {
    try {
      const cookieValue = this.getCookie("tevxionCart");
      if (cookieValue) {
        const cartData = JSON.parse(decodeURIComponent(cookieValue));
        this.cart = cartData.items || [];
        this.updateCartDisplay();
      }
    } catch (error) {
      console.error("Error loading cart from cookies:", error);
      this.cart = [];
    }
  }

  clearCartCookies() {
    document.cookie =
      "tevxionCart=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }

  getCookie(name) {
    const cookies = document.cookie.split(";");
    const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));
    return cookie ? cookie.split("=")[1] : null;
  }

  calculateTotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  renderProducts(products) {
    if (products.length === 0) {
      return '<p class="error">Tidak ada produk yang ditemukan</p>';
    }

    return products
      .map((product) => {
        const cartItem = this.cart.find((item) => item.id === product.id);
        const isInCart = Boolean(cartItem);
        const isOutOfStock = product.stock === 0;
        const isApiProduct = product.isApiProduct;
        // Add a badge for API products
        const apiProductBadge = isApiProduct
          ? `<div class="api-product-badge">API Product</div>`
          : "";

        return `
        <div class="product-card ${
          isApiProduct ? "api-product" : ""
        }" data-id="${product.id}">
          ${apiProductBadge}
          <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <h3>${product.name}</h3>
          <p class="price">Rp ${product.price.toLocaleString()}</p>
          <div class="product-details">
            <p class="material">Material: ${product.material}</p>
            <p class="date">Added: ${new Date(product.date).toLocaleDateString(
              "id-ID"
            )}</p>
          </div>
          <p class="stock ${isOutOfStock ? "out-of-stock" : ""}">
            Stok: ${product.stock}
          </p>
          <div class="button-group">
            ${
              isOutOfStock
                ? `
              <button class="cart-btn disabled" disabled>
                <i class="fas fa-cart-plus"></i> Stok Habis
              </button>
            `
                : isInCart
                ? `
              <div class="cart-controls" data-id="${product.id}">
                <button class="cart-btn quantity-btn minus-btn" data-id="${
                  product.id
                }">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="quantity-display">${cartItem.quantity}</span>
                <button class="cart-btn quantity-btn plus-btn" data-id="${
                  product.id
                }" 
                  ${cartItem.quantity >= product.stock ? "disabled" : ""}>
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            `
                : `
              <button class="cart-btn add-to-cart" data-id="${product.id}" 
                title="Tambah ke Keranjang">
                <i class="fas fa-cart-plus"></i>
              </button>
            `
            }
            <button class="buy-btn" data-id="${product.id}"
              ${isOutOfStock ? "disabled" : ""}>
              <i class="fas fa-shopping-bag"></i> Beli
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  renderPagination() {
    const totalPages = Math.ceil(
      this.filteredProducts.length / this.ITEMS_PER_PAGE
    );

    let buttons = "";
    if (totalPages > 1) {
      buttons += `
        <button class="page-btn" ${this.currentPage === 1 ? "disabled" : ""} 
          onclick="shop.changePage(${this.currentPage - 1})">
          <i class="fas fa-chevron-left"></i>
        </button>
      `;

      for (let i = 1; i <= totalPages; i++) {
        buttons += `
          <button class="page-btn ${this.currentPage === i ? "active" : ""}" 
            onclick="shop.changePage(${i})">${i}</button>
        `;
      }

      buttons += `
        <button class="page-btn" ${
          this.currentPage === totalPages ? "disabled" : ""
        } 
          onclick="shop.changePage(${this.currentPage + 1})">
          <i class="fas fa-chevron-right"></i>
        </button>
      `;
    }

    return `<div class="pagination">${buttons}</div>`;
  }

  changePage(page) {
    this.currentPage = page;
    this.displayProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateCartDisplay() {
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.calculateTotal();

    // Update all cart count elements
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = totalItems;
    });

    // Update cart total price
    const cartTotal = document.querySelector(".cart-total");
    if (cartTotal) {
      cartTotal.textContent = `Rp ${totalPrice.toLocaleString("id-ID")}`;
    }

    // Add bump animation
    const cartIcon = document.querySelector(".cart-icon");
    if (cartIcon) {
      cartIcon.classList.add("cart-bump");
      setTimeout(() => cartIcon.classList.remove("cart-bump"), 300);
    }

    // Save cart state
    this.saveCartToSession();
    this.saveCartToCookies();
  }

  showReceipt() {
    const modal = document.getElementById("receiptModal");
    if (!modal) {
      console.error("Receipt modal not found");
      return;
    }

    const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {
      username: "Guest",
    };
    const now = new Date();
    const invoiceNumber = `INV/${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${Math.random()
      .toString(36)
      .substr(2, 8)
      .toUpperCase()}`;

    // Calculate totals with tax
    const subtotal = this.calculateTotal();
    const tax = Math.round(subtotal * 0.11); // 11% tax
    const total = subtotal + tax;

    // Generate receipt items HTML
    const itemsHtml = this.cart
      .map(
        (item) => `
      <div class="receipt-item">
        <div class="receipt-item-header">${item.name}</div>
        <div class="receipt-item-details">
          <span>${item.quantity} x Rp ${item.price.toLocaleString(
          "id-ID"
        )}</span>
          <span>Rp ${(item.price * item.quantity).toLocaleString(
            "id-ID"
          )}</span>
        </div>
      </div>
    `
      )
      .join("");

    // Update receipt content with detailed calculations
    modal.querySelector(".receipt-items").innerHTML = `
      <div style="margin-bottom: 3mm">
        <div>No. Invoice: ${invoiceNumber}</div>
        <div>Kasir: ${currentUser.username}</div>
        <div>Tanggal: ${now.toLocaleString("id-ID")}</div>
      </div>
      <div class="receipt-divider"></div>
      ${itemsHtml}
      <div class="receipt-divider"></div>
    `;

    modal.querySelector(".receipt-summary").innerHTML = `
      <div class="receipt-item-details">
        <span>Subtotal:</span>
        <span>Rp ${subtotal.toLocaleString("id-ID")}</span>
      </div>
      <div class="receipt-item-details">
        <span>PPN (11%):</span>
        <span>Rp ${tax.toLocaleString("id-ID")}</span>
      </div>
      <div class="receipt-total">
        <span>TOTAL:</span>
        <span>Rp ${total.toLocaleString("id-ID")}</span>
      </div>
    `;

    modal.style.display = "flex";
  }

  showCartNotification(message) {
    const notification = document.createElement("div");
    notification.className = "cart-notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 2000);
    }, 100);
  }

  attachProductListeners() {
    // Add to cart buttons
    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.addToCart(productId);
      };
    });

    // Buy buttons
    document.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.showBuyOptions(productId, btn);
      };
    });

    // Quantity controls
    document.querySelectorAll(".minus-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.removeFromCart(productId);
      };
    });

    document.querySelectorAll(".plus-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.addToCart(productId);
      };
    });

    // Filter controls
    document
      .getElementById("materialSelect")
      ?.addEventListener("change", () => this.filterProducts());
    document
      .getElementById("dateSelect")
      ?.addEventListener("change", () => this.filterProducts());
  }

  showBuyOptions(productId, buyBtn) {
    const product = this.filteredProducts.find(
      (p) => String(p.id) === String(productId)
    );

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "buy-options-overlay";
    document.body.appendChild(overlay);

    // Create modal
    const modal = document.createElement("div");
    modal.className = "buy-options-modal";
    modal.innerHTML = `
      <div class="title">Konfirmasi Pembelian "${product.name}"</div>
      <div class="button-group">
      <button class="btn-cancel">
      <i class="fas fa-times"></i> Batal
      </button>
      <button class="btn-checkout">
        <i class="fas fa-check"></i> Checkout
      </button>
      </div>
    `;

    // Handle button clicks
    modal.querySelector(".btn-checkout").onclick = (e) => {
      e.stopPropagation();
      this.addToCart(productId);
      this.handleCheckout();
      this.closeBuyOptions(overlay, modal);
    };

    modal.querySelector(".btn-cancel").onclick = (e) => {
      e.stopPropagation();
      this.closeBuyOptions(overlay, modal);
    };

    document.body.appendChild(modal);
  }

  closeBuyOptions(overlay, modal) {
    overlay.remove();
    modal.remove();
  }

  handleBuyNow(productId) {
    this.addToCart(productId);
    this.handleCheckout();
  }

  // Optional: Method to merge cart data when user logs in
  mergeCartWithCookies() {
    const cookieCart = this.loadCartFromCookies();
    if (cookieCart && cookieCart.length > 0) {
      cookieCart.forEach((cookieItem) => {
        const existingItem = this.cart.find(
          (item) => item.id === cookieItem.id
        );
        if (existingItem) {
          existingItem.quantity = Math.min(
            existingItem.quantity + cookieItem.quantity,
            existingItem.maxStock
          );
        } else {
          this.cart.push(cookieItem);
        }
      });
      this.updateCartDisplay();
      this.saveCartToCookies();
    }
  }

  // Cookie utility methods
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // Add loading state handling
  showLoading(button) {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
  }

  hideLoading(button) {
    button.innerHTML = button.dataset.originalText;
    button.disabled = false;
  }

  toggleCart() {
    if (this.cart.length === 0) {
      alert("Keranjang belanja kosong");
      return;
    }

    if (!this.isCartOpen) {
      this.showCartDropdown();
    } else {
      this.closeCart();
    }
  }

  showCartDropdown() {
    let cartDropdown = document.querySelector(".cart-dropdown");
    if (!cartDropdown) {
      cartDropdown = document.createElement("div");
      cartDropdown.className = "cart-dropdown";
      document.body.appendChild(cartDropdown);
    }

    const totalPrice = this.calculateTotal();
    cartDropdown.innerHTML = `
      <div class="cart-header">
        <h3>Keranjang Belanja</h3>
        <span>${this.cart.length} item</span>
      </div>
      <div class="cart-items">
        ${this.cart
          .map(
            (item) => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">
                Rp ${(item.price * item.quantity).toLocaleString("id-ID")}
              </div>
              <div class="cart-item-controls">
                <div class="cart-item-quantity">
                  <button class="cart-quantity-btn minus-btn" data-id="${
                    item.id
                  }" 
                    ${item.quantity <= 1 ? "disabled" : ""}>
                    <i class="fas fa-minus"></i>
                  </button>
                  <span class="cart-quantity-display">${item.quantity}</span>
                  <button class="cart-quantity-btn plus-btn" data-id="${
                    item.id
                  }"
                    ${item.quantity >= item.maxStock ? "disabled" : ""}>
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                <button class="cart-remove-btn" data-id="${item.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="cart-actions">
        <button class="btn-cancel" onclick="shop.closeCart()">Batal</button>
        <button class="btn-checkout" onclick="shop.handleCheckout()">
          Checkout (Rp ${totalPrice.toLocaleString("id-ID")})
        </button>
      </div>
    `;

    // Attach event listeners
    cartDropdown.querySelectorAll(".minus-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.removeFromCart(productId);
        // Refresh cart display
        this.showCartDropdown();
      };
    });

    cartDropdown.querySelectorAll(".plus-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.addToCart(productId);
        // Refresh cart display
        this.showCartDropdown();
      };
    });

    cartDropdown.querySelectorAll(".cart-remove-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const productId = btn.dataset.id;
        this.removeItemFromCart(productId);
      };
    });

    setTimeout(() => cartDropdown.classList.add("show"), 10);
    this.isCartOpen = true;
  }

  removeItemFromCart(productId) {
    const itemIndex = this.cart.findIndex(
      (item) => String(item.id) === String(productId)
    );
    if (itemIndex > -1) {
      this.cart.splice(itemIndex, 1);
      this.saveCartToSession();
      this.saveCartToCookies();
      this.updateCartDisplay();
      this.displayProducts();
      this.showCartNotification("Produk dihapus dari keranjang");

      // Close cart if empty
      if (this.cart.length === 0) {
        this.closeCart();
      } else {
        // Refresh cart display
        this.showCartDropdown();
      }
    }
  }

  closeCart() {
    const cartDropdown = document.querySelector(".cart-dropdown");
    if (cartDropdown) {
      cartDropdown.classList.remove("show");
      setTimeout(() => cartDropdown.remove(), 300);
    }
    this.isCartOpen = false;
  }
}

// Global instance for pagination access
let shop;

// Initialize shop
document.addEventListener("DOMContentLoaded", () => {
  shop = new ShopManager();
});

// Receipt modal functions
function printReceipt() {
  window.print();
}

function closeReceipt() {
  const modal = document.getElementById("receiptModal");
  if (modal) {
    modal.style.display = "none";
    // Clear cart after printing
    shop.clearCartCookies();
    shop.cart = [];
    shop.updateCartDisplay();
  }
}

async function recordTransaction(transactionData) {
  try {
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!user) {
      alert("Anda harus login untuk melakukan transaksi.");
      return;
    }

    const transaction = {
      ...transactionData,
      userId: user.username,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("transactions").add(transaction);
    alert("Transaksi berhasil dicatat!");
  } catch (error) {
    console.error("Error mencatat transaksi:", error);
    alert("Gagal mencatat transaksi. Silakan coba lagi.");
  }
}

function handleCheckout(cartItems) {
  if (!cartItems.length) {
    alert("Keranjang belanja kosong.");
    return;
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const transactionData = {
    items: cartItems,
    totalAmount,
  };

  // Simpan transaksi ke Firestore
  recordTransaction(transactionData);

  // Kosongkan keranjang setelah checkout
  CartManager.clearCart();
  updateCartUI();
}

// Tambahkan event listener untuk tombol checkout
document.querySelector(".btn-checkout").addEventListener("click", () => {
  const cartItems = CartManager.getFromLocal();
  handleCheckout(cartItems);
});
