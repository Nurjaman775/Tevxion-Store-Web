class StoreMonitoring {
    constructor() {
      this.initialized = false;
      this.init();
    }
  
    async init() {
      try {
        await this.initializeCharts();
        this.setupIntervalUpdates();
        this.initialized = true;
        console.log("Monitoring initialized successfully");
      } catch (error) {
        console.error("Failed to initialize monitoring:", error);
      }
    }
  
    setupIntervalUpdates() {
      // Regular interval updates instead of realtime
      this.updateInterval = setInterval(() => {
        this.updateAllStats();
      }, 30000); // Update every 30 seconds
    }
  
    async initializeCharts() {
      const stockChartEl = document.getElementById("stockChart");
      if (stockChartEl) {
        this.stockChart = new Chart(stockChartEl, {
          type: "bar",
          data: {
            labels: [],
            datasets: [
              {
                label: "Stock Levels",
                data: [],
                backgroundColor: "#45f3ff",
              },
            ],
          },
        });
      }
    }
  
    updateAllStats() {
      this.updateStockStats();
      this.updateActiveUsers();
    }
  
    updateStockStats() {
      try {
        const products = JSON.parse(localStorage.getItem("store_products")) || [];
        const lowStockCount = products.filter((p) => p.stock < 5).length;
  
        const totalProductsEl = document.querySelector("#totalProducts");
        const lowStockAlertEl = document.querySelector("#lowStockAlert");
  
        if (totalProductsEl) {
          totalProductsEl.textContent = products.length;
        }
  
        if (lowStockAlertEl) {
          lowStockAlertEl.textContent = `${lowStockCount} products low on stock`;
        }
  
        if (this.stockChart && products.length > 0) {
          this.updateStockChart(products);
        }
      } catch (error) {
        console.error("Error updating stock stats:", error);
      }
    }
  
    updateActiveUsers() {
      try {
        const users = JSON.parse(localStorage.getItem("active_users")) || [];
        const activeCount = users.length;
  
        const activeUsersEl = document.querySelector("#activeUsers");
        if (activeUsersEl) {
          activeUsersEl.textContent = activeCount;
        }
      } catch (error) {
        console.error("Error updating active users:", error);
      }
    }
  
    updateStockChart(products) {
      if (!this.stockChart) return;
  
      const labels = products.map((p) => p.name);
      const data = products.map((p) => p.stock);
  
      this.stockChart.data.labels = labels;
      this.stockChart.data.datasets[0].data = data;
      this.stockChart.update();
    }
  
    destroy() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      if (this.stockChart) {
        this.stockChart.destroy();
      }
    }
  }
  
  // Update initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.storeMonitoring = new StoreMonitoring();
    });
  } else {
    window.storeMonitoring = new StoreMonitoring();
  }
  
  // Cleanup on page unload
  window.addEventListener("unload", () => {
    if (window.storeMonitoring) {
      window.storeMonitoring.destroy();
    }
  });
  