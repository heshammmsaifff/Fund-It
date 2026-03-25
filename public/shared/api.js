const BASE = "http://localhost:3000";

const api = {
  get(path) {
    return fetch(BASE + path).then((r) => r.json());
  },
  post(path, data) {
    return fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json());
  },
  patch(path, data) {
    return fetch(BASE + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json());
  },
  delete(path) {
    return fetch(BASE + path, { method: "DELETE" }).then((r) => r.json());
  },
};

const Auth = {
  login(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem("currentUser");
  },
  getUser() {
    const u = localStorage.getItem("currentUser");
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn() {
    return !!Auth.getUser();
  },
  isAdmin() {
    const u = Auth.getUser();
    return u && u.role === "admin";
  },
};

function goTo(page) {
  const origin = window.location.origin;
  const path = window.location.pathname;
  const idx = path.indexOf("/public");
  const base = idx !== -1 ? path.substring(0, idx) : "";
  window.location.href = origin + base + "/" + page + "/";
}

function buildNavbar() {
  const user = Auth.getUser();
  const root = document.getElementById("navbar");
  if (!root) return;

  const origin = window.location.origin;
  const path = window.location.pathname;
  const idx = path.indexOf("/");
  const base = idx !== -1 ? path.substring(0, idx) : "";
  const root_ = origin + base;

  let links = "";
  if (!user) {
    links = `
      <a href="${root_}/home/">Browse</a>
      <a href="${root_}/auth/" class="btn btn-primary btn-sm">Login</a>
    `;
  } else if (user.role === "admin") {
    links = `
      <a href="${root_}/home/">Browse</a>
      <a href="${root_}/dashboard-admin/">Admin Panel</a>
      <a href="#" onclick="logout()">Logout</a>
    `;
  } else {
    links = `
      <a href="${root_}/home/">Browse</a>
      <a href="${root_}/dashboard-user/">My Dashboard</a>
      <a href="#" onclick="logout()">Logout (${user.name})</a>
    `;
  }

  root.innerHTML = `
    <a class="navbar-brand" href="${root_}/home/">FundIt</a>
    <div class="navbar-links">${links}</div>
  `;
}

function logout() {
  Auth.logout();
  goTo("home");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcPercent(raised, goal) {
  return Math.min(100, Math.round((raised / goal) * 100));
}
