function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("loginPanel").style.display = isLogin
    ? "block"
    : "none";
  document.getElementById("registerPanel").style.display = isLogin
    ? "none"
    : "block";
  document.getElementById("tabLogin").classList.toggle("active", isLogin);
  document.getElementById("tabRegister").classList.toggle("active", !isLogin);
}

function showAlert(containerId, message, type) {
  document.getElementById(containerId).innerHTML =
    '<div class="alert alert-' + type + '">' + message + "</div>";
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    showAlert("loginAlert", "Please fill in all fields.", "error");
    return;
  }

  const users = await api.get(
    "/users?email=" +
      encodeURIComponent(email) +
      "&password=" +
      encodeURIComponent(password),
  );

  if (users.length === 0) {
    showAlert("loginAlert", "Invalid email or password.", "error");
    return;
  }

  const user = users[0];

  if (!user.isActive) {
    showAlert("loginAlert", "Your account has been banned.", "error");
    return;
  }

  Auth.login(user);
  goTo(user.role === "admin" ? "dashboard-admin" : "home");
}

async function handleRegister() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!name || !email || !password) {
    showAlert("registerAlert", "Please fill in all fields.", "error");
    return;
  }

  const existing = await api.get("/users?email=" + encodeURIComponent(email));

  if (existing.length > 0) {
    showAlert("registerAlert", "Email already registered.", "error");
    return;
  }

  const newUser = await api.post("/users", {
    name,
    email,
    password,
    role: "user",
    isActive: true,
  });

  Auth.login(newUser);
  goTo("home");
}

buildNavbar();
