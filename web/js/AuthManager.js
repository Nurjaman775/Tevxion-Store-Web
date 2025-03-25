class AuthManager {
  static getCurrentUser() {
    try {
      return JSON.parse(sessionStorage.getItem("currentUser"));
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  static isLoggedIn() {
    return Boolean(this.getCurrentUser());
  }

  static logout() {
    sessionStorage.removeItem("currentUser");
    window.location.href = "/login/login.html";
  }
}

window.AuthManager = AuthManager;
