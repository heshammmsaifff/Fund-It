const user = Auth.getUser();

if (!user) {
  goTo("auth");
}

if (user.role !== "admin") {
  goTo("home");
}

function switchTab(tab) {
  ["users", "campaigns", "pledges"].forEach((p) => {
    document.getElementById(p + "Panel").style.display =
      p === tab ? "block" : "none";
    document
      .getElementById("tab" + p.charAt(0).toUpperCase() + p.slice(1))
      .classList.toggle("active", p === tab);
  });
}

async function loadStats() {
  const [users, campaigns, pledges] = await Promise.all([
    api.get("/users"),
    api.get("/campaigns"),
    api.get("/pledges"),
  ]);

  const total = pledges.reduce((s, p) => s + p.amount, 0);

  document.getElementById("statsGrid").innerHTML = `
    <div>${total}</div>
    <div>${campaigns.length}</div>
    <div>${users.length}</div>
  `;
}

async function loadUsers() {
  const users = await api.get("/users");

  document.getElementById("usersPanel").innerHTML = users
    .map(
      (u) => `
    <div style="margin-bottom:10px; padding:10px; border:1px solid #ccc">
      <div>
        <strong>${u.name}</strong> (${u.role})
      </div>

      <div style="margin:5px 0">
        Status: 
        <span style="color:${u.isActive ? "green" : "red"}">
          ${u.isActive ? "Active" : "Banned"}
        </span>
      </div>

      ${
        u.role !== "admin"
          ? `<button onclick="toggleBan(${u.id}, ${!u.isActive})">
              ${u.isActive ? "Ban User" : "Unban User"}
            </button>`
          : ""
      }

      <button onclick="toggleRole(${u.id}, '${u.role}')">
        ${u.role === "admin" ? "Remove Admin" : "Make Admin"}
      </button>
    </div>
  `,
    )
    .join("");
}
async function loadCampaigns() {
  const campaigns = await api.get("/campaigns");

  document.getElementById("campaignsPanel").innerHTML = campaigns
    .map(
      (c) => `
    <div>
      ${c.title}
      <button onclick="toggleApprove(${c.id}, ${!c.isApproved})">
        ${c.isApproved ? "Reject" : "Approve"}
      </button>
    </div>
  `,
    )
    .join("");
}

async function loadPledges() {
  const pledges = await api.get("/pledges");

  document.getElementById("pledgesPanel").innerHTML = pledges
    .map(
      (p) => `
    <div>
      ${p.id} - $${p.amount}
    </div>
  `,
    )
    .join("");
}

async function toggleBan(id, isActive) {
  await api.patch("/users/" + id, { isActive });
  loadUsers();
}

async function toggleApprove(id, isApproved) {
  await api.patch("/campaigns/" + id, { isApproved });
  loadCampaigns();
}

async function toggleRole(id, currentRole) {
  console.log("Current role:", currentRole);

  const newRole = currentRole === "admin" ? "user" : "admin";

  console.log("New role:", newRole);

  await api.patch("/users/" + id, { role: newRole });

  loadUsers();
}

buildNavbar();
loadStats();
loadUsers();
loadCampaigns();
loadPledges();
