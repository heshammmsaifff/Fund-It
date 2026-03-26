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
  window.location.href = `/${page}/`;
}

function requireAuth() {
  if (!Auth.isLoggedIn()) {
    goTo("auth");
  }
}

function requireAdmin() {
  if (!Auth.isAdmin()) {
    goTo("home");
  }
}

function buildNavbar() {
  const user = Auth.getUser();
  const nav = document.getElementById("navbar");
  if (!nav) return;

  let links = "";

  if (!user) {
    links = `
      <a href="#" onclick="goTo('home')">Browse</a>
      <a href="#" onclick="goTo('auth')" class="btn btn-primary btn-sm">Login</a>
    `;
  } else if (user.role === "admin") {
    links = `
      <a href="#" onclick="goTo('home')">Browse</a>
      <a href="#" onclick="goTo('dashboard-admin')">Admin Panel</a>
      <a href="#" onclick="logout()">Logout</a>
    `;
  } else {
    links = `
      <a href="#" onclick="goTo('home')">Browse</a>
      <a href="#" onclick="goTo('dashboard-user')">My Dashboard</a>
      <a href="#" onclick="logout()">Logout (${user.name})</a>
    `;
  }

  nav.innerHTML = `
    <a class="navbar-brand" href="#" onclick="goTo('home')">FundIt</a>
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
