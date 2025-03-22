class StockManager {
  constructor() {
    this.db = firebase.firestore();
    this.initializeListeners();
    this.loadProducts();
    this.loadTransactions();
  }

  async loadProducts() {
    const productsRef = this.db.collection("products");
    const snapshot = await productsRef.get();

    const tableBody = document.getElementById("productsTableBody");
    tableBody.innerHTML = "";

    snapshot.forEach((doc) => {
      const product = doc.data();
      const row = this.createProductRow(doc.id, product);
      tableBody.appendChild(row);
    });
  }

  createProductRow(id, product) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.stock}</td>
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
      alert("Masukkan jumlah stok yang valid");
      return;
    }

    try {
      const productRef = this.db.collection("products").doc(productId);

      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(productRef);
        const newStock = doc.data().stock + addStock;
        transaction.update(productRef, { stock: newStock });
      });

      alert("Stok berhasil diperbarui");
      this.loadProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Gagal memperbarui stok");
    }
  }

  async updateBatchStock(stockUpdates) {
    const batch = this.db.batch();

    try {
      for (const update of stockUpdates) {
        const productRef = this.db.collection("products").doc(update.productId);
        batch.update(productRef, { stock: update.newStock });
      }

      await batch.commit();
      this.showNotification("Stock updated successfully", "success");
      this.loadProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      this.showNotification("Failed to update stock", "error");
    }
  }

  async exportStockReport() {
    try {
      const snapshot = await this.db.collection("products").get();
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const csv = this.convertToCSV(products);
      this.downloadCSV(csv, `stock-report-${new Date().toISOString()}.csv`);
    } catch (error) {
      console.error("Error exporting report:", error);
      this.showNotification("Failed to export report", "error");
    }
  }

  async filterProducts(filters = {}) {
    let query = this.db.collection("products");

    if (filters.stock === "low") {
      query = query.where("stock", "<=", 10);
    } else if (filters.stock === "out") {
      query = query.where("stock", "==", 0);
    }

    if (filters.search) {
      query = query
        .where("name", ">=", filters.search)
        .where("name", "<=", filters.search + "\uf8ff");
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  convertToCSV(items) {
    const headers = ["ID", "Name", "Stock", "Last Updated"];
    const rows = items.map((item) => [
      item.id,
      item.name,
      item.stock,
      new Date(item.lastUpdated).toLocaleString(),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async loadTransactions() {
    const transactionsRef = this.db
      .collection("transactions")
      .orderBy("timestamp", "desc")
      .limit(50);

    const snapshot = await transactionsRef.get();
    const container = document.getElementById("transactionsTable");

    container.innerHTML = snapshot.docs
      .map((doc) => {
        const trans = doc.data();
        return `
        <div class="transaction-item">
          <div class="transaction-header">
            <span>ID: ${doc.id}</span>
            <span>User: ${trans.userId}</span>
            <span>Total: Rp${trans.totalAmount.toLocaleString("id-ID")}</span>
          </div>
          <div class="transaction-details">
            ${trans.items
              .map(
                (item) => `
              <div class="transaction-item-detail">
                ${item.name} x ${item.quantity}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
      })
      .join("");
  }

  initializeListeners() {
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
