if (!user || user.role === "admin") {
  goTo("auth");
}

function switchTab(tab) {
  const panels = ["users", "campaigns", "pledges"];
  panels.forEach((p) => {
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

  const totalRaised = pledges.reduce((sum, p) => sum + p.amount, 0);
  const approved = campaigns.filter((c) => c.isApproved).length;
  const pending = campaigns.filter((c) => !c.isApproved).length;
  const activeUsers = users.filter(
    (u) => u.isActive && u.role === "user",
  ).length;

  document.getElementById("statsGrid").innerHTML =
    statCard("$" + totalRaised.toLocaleString(), "Total Raised") +
    statCard(approved, "Approved Campaigns") +
    statCard(pending, "Pending Campaigns") +
    statCard(activeUsers, "Active Users");
}

function statCard(value, label) {
  return (
    '<div class="stat-card">' +
    '<div class="stat-value">' +
    value +
    "</div>" +
    '<div class="stat-label">' +
    label +
    "</div>" +
    "</div>"
  );
}

async function loadUsers() {
  const users = await api.get("/users");
  const panel = document.getElementById("usersPanel");

  const rows = users.map((u) => {
    const roleBadge =
      u.role === "admin"
        ? '<span class="badge badge-info">Admin</span>'
        : '<span class="badge badge-success">User</span>';

    const statusBadge = u.isActive
      ? '<span class="badge badge-success">Active</span>'
      : '<span class="badge badge-danger">Banned</span>';

    const banBtn =
      u.role !== "admin"
        ? u.isActive
          ? '<button class="btn btn-danger btn-sm" onclick="toggleBan(' +
            u.id +
            ', false)">Ban</button>'
          : '<button class="btn btn-success btn-sm" onclick="toggleBan(' +
            u.id +
            ', true)">Unban</button>'
        : "";

    return (
      "<tr>" +
      "<td>" +
      u.id +
      "</td>" +
      "<td>" +
      u.name +
      "</td>" +
      "<td>" +
      u.email +
      "</td>" +
      "<td>" +
      roleBadge +
      "</td>" +
      "<td>" +
      statusBadge +
      "</td>" +
      "<td>" +
      banBtn +
      "</td>" +
      "</tr>"
    );
  });

  panel.innerHTML =
    '<div class="table-wrap">' +
    '<table class="table">' +
    "<thead><tr>" +
    "<th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th>" +
    "</tr></thead>" +
    "<tbody>" +
    rows.join("") +
    "</tbody>" +
    "</table>" +
    "</div>";
}

async function loadCampaigns() {
  const campaigns = await api.get("/campaigns");
  const panel = document.getElementById("campaignsPanel");

  const rows = campaigns.map((c) => {
    const statusBadge = c.isApproved
      ? '<span class="badge badge-success">Approved</span>'
      : '<span class="badge badge-warning">Pending</span>';

    const approveBtn = c.isApproved
      ? '<button class="btn btn-outline btn-sm" onclick="toggleApprove(' +
        c.id +
        ', false)">Reject</button>'
      : '<button class="btn btn-success btn-sm" onclick="toggleApprove(' +
        c.id +
        ', true)">Approve</button>';

    return (
      "<tr>" +
      "<td>" +
      c.id +
      "</td>" +
      "<td>" +
      c.title +
      "</td>" +
      "<td>" +
      c.category +
      "</td>" +
      "<td>$" +
      c.goal.toLocaleString() +
      "</td>" +
      "<td>" +
      formatDate(c.deadline) +
      "</td>" +
      "<td>" +
      statusBadge +
      "</td>" +
      '<td style="display:flex;gap:6px">' +
      approveBtn +
      '<button class="btn btn-danger btn-sm" onclick="deleteCampaign(' +
      c.id +
      ')">Delete</button>' +
      "</td>" +
      "</tr>"
    );
  });

  panel.innerHTML =
    '<div class="table-wrap">' +
    '<table class="table">' +
    "<thead><tr>" +
    "<th>ID</th><th>Title</th><th>Category</th><th>Goal</th><th>Deadline</th><th>Status</th><th>Actions</th>" +
    "</tr></thead>" +
    "<tbody>" +
    rows.join("") +
    "</tbody>" +
    "</table>" +
    "</div>";
}

async function loadPledges() {
  const pledges = await api.get("/pledges");
  const panel = document.getElementById("pledgesPanel");

  const rows = pledges.map(
    (p) =>
      "<tr>" +
      "<td>" +
      p.id +
      "</td>" +
      "<td>" +
      p.campaignId +
      "</td>" +
      "<td>" +
      p.userId +
      "</td>" +
      "<td>$" +
      p.amount.toLocaleString() +
      "</td>" +
      "</tr>",
  );

  panel.innerHTML =
    '<div class="table-wrap">' +
    '<table class="table">' +
    "<thead><tr>" +
    "<th>ID</th><th>Campaign ID</th><th>User ID</th><th>Amount</th>" +
    "</tr></thead>" +
    "<tbody>" +
    rows.join("") +
    "</tbody>" +
    "</table>" +
    "</div>";
}

async function toggleBan(id, isActive) {
  await api.patch("/users/" + id, { isActive });
  loadUsers();
  loadStats();
}

async function toggleApprove(id, isApproved) {
  await api.patch("/campaigns/" + id, { isApproved });
  loadCampaigns();
  loadStats();
}

async function deleteCampaign(id) {
  if (!confirm("Delete this campaign? This cannot be undone.")) return;
  await api.delete("/campaigns/" + id);
  loadCampaigns();
  loadStats();
}

buildNavbar();
loadStats();
loadUsers();
loadCampaigns();
loadPledges();
