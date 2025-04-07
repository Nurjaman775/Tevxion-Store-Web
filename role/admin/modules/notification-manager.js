class NotificationManager {
    constructor() {
      this.notifications = [];
      this.initializeFirebase();
    }
  
    initializeFirebase() {
      this.db = firebase.firestore();
    }
  
    async getNotifications() {
      try {
        const snapshot = await this.db.collection("notifications").get();
        this.notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return this.notifications;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    }
  
    showNotification(message, type = "info") {
      const notification = document.createElement("div");
      notification.className = `notification ${type}`;
      notification.textContent = message;
  
      document.body.appendChild(notification);
      notification.classList.add("show");
  
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }
  
  // Export for use in admin.js
  window.NotificationManager = NotificationManager;
  