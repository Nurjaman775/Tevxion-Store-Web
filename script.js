document.addEventListener("DOMContentLoaded", function () {
  checkAuthStatus();
});

function checkAuthStatus() {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  const navLinks = document.querySelector(".nav-links");
  const loginRegisterBtns = document.querySelectorAll(
    ".btn-login, .btn-register"
  );

  if (currentUser && navLinks) {
    loginRegisterBtns.forEach((btn) => (btn.style.display = "none"));

    const profileLink = document.createElement("li");
    const firstLetter = currentUser.username.charAt(0).toUpperCase();

    profileLink.innerHTML = `
      <div class="user-profile">
        <div class="user-avatar">${firstLetter}</div>
        <span class="username">${currentUser.username}</span>
      </div>
    `;

    profileLink.querySelector(".user-profile").onclick = () => {
      window.location.href = "./dashboard/profile.html";
    };

    navLinks.appendChild(profileLink);
  }
}

function handleLogout() {
  sessionStorage.removeItem("currentUser");
  window.location.reload();
}
