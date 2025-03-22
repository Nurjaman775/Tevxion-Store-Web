import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

class StockManager {
  constructor() {
    this.db = firebase.database();
    this.loadProducts();
    this.initializeListeners();
  }

  async loadProducts() {
    try {
      const snapshot = await this.db.ref("products").once("value");
      const products = snapshot.val() || {};

      const tableBody = document.getElementById("productsTableBody");
      tableBody.innerHTML = "";

      Object.entries(products).forEach(([id, product]) => {
        const row = this.createProductRow(id, product);
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading products:", error);
      this.showNotification("Gagal memuat data produk", "error");
    }
  }

  createProductRow(id, product) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.name}</td>
      <td class="stock-value">${product.stock || 0}</td>
      <td>
        <input type="number" min="1" class="stock-input" id="stock-${id}">
      </td>
      <td>
        <button onclick="stockManager.updateStock('${id}')" class="btn-update">
          Update Stok
        </button>
      </td>
    `;
    return row;
  }

  async updateStock(productId) {
    const input = document.getElementById(`stock-${productId}`);
    const addStock = parseInt(input.value);

    if (isNaN(addStock) || addStock <= 0) {
      this.showNotification("Masukkan jumlah stok yang valid", "error");
      return;
    }

    try {
      const productRef = this.db.ref(`products/${productId}`);
      const snapshot = await productRef.once("value");
      const currentStock = snapshot.val()?.stock || 0;

      await productRef.update({
        stock: currentStock + addStock,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP,
      });

      this.showNotification("Stok berhasil diperbarui", "success");
      this.loadProducts();
      input.value = "";
    } catch (error) {
      console.error("Error updating stock:", error);
      this.showNotification("Gagal memperbarui stok", "error");
    }
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  initializeListeners() {
    // Filter dan pencarian produk
    document.getElementById("searchProduct")?.addEventListener("input", (e) => {
      this.filterProducts(e.target.value);
    });

    document
      .getElementById("categoryFilter")
      ?.addEventListener("change", (e) => {
        this.filterProducts("", e.target.value);
      });
  }
}

// Initialize stock manager
let stockManager;
document.addEventListener("DOMContentLoaded", () => {
  stockManager = new StockManager();
});
