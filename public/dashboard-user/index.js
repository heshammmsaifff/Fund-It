const user = Auth.getUser();

if (!user) {
  goTo("auth");
}

if (user.role === "admin") {
  goTo("dashboard-admin");
}

let editingId = null;

function switchTab(tab) {
  const isCampaigns = tab === "campaigns";

  document.getElementById("campaignsPanel").style.display = isCampaigns
    ? "block"
    : "none";
  document.getElementById("pledgesPanel").style.display = isCampaigns
    ? "none"
    : "block";

  document
    .getElementById("tabCampaigns")
    .classList.toggle("active", isCampaigns);
  document
    .getElementById("tabPledges")
    .classList.toggle("active", !isCampaigns);
}

async function loadCampaigns() {
  const campaigns = await api.get("/campaigns?creatorId=" + user.id);
  const panel = document.getElementById("campaignsPanel");

  if (campaigns.length === 0) {
    panel.innerHTML = '<p class="text-muted">You have no campaigns yet.</p>';
    return;
  }

  const rows = await Promise.all(
    campaigns.map(async (c) => {
      const pledges = await api.get("/pledges?campaignId=" + c.id);
      const raised = pledges.reduce((sum, p) => sum + p.amount, 0);
      const percent = calcPercent(raised, c.goal);

      return `
        <div class="campaign-row">
          <div class="campaign-row-info">
            <div class="campaign-row-title">${c.title}</div>
            <div class="campaign-row-meta">
              <span>${c.isApproved ? "Approved" : "Pending"}</span>
              <span>Goal: $${c.goal}</span>
              <span>Raised: $${raised} (${percent}%)</span>
              <span>${formatDate(c.deadline)}</span>
            </div>
          </div>
          <div>
            <button onclick="openEditModal(${c.id})">Edit</button>
          </div>
        </div>
      `;
    }),
  );

  panel.innerHTML = rows.join("");
}

async function loadPledges() {
  const pledges = await api.get("/pledges?userId=" + user.id);
  const panel = document.getElementById("pledgesPanel");

  if (pledges.length === 0) {
    panel.innerHTML = "<p>No pledges yet</p>";
    return;
  }

  const rows = await Promise.all(
    pledges.map(async (p) => {
      const campaign = await api.get("/campaigns/" + p.campaignId);

      return `
        <div class="pledge-row">
          <div>${campaign?.title || "Unknown"}</div>
          <div>$${p.amount}</div>
        </div>
      `;
    }),
  );

  panel.innerHTML = rows.join("");
}

async function saveCampaign() {
  const title = document.getElementById("fieldTitle").value;
  const desc = document.getElementById("fieldDesc").value;
  const goal = +document.getElementById("fieldGoal").value;
  const deadline = document.getElementById("fieldDeadline").value;

  if (!title || !desc || !goal || !deadline) return;

  if (editingId) {
    await api.patch("/campaigns/" + editingId, {
      title,
      description: desc,
      goal,
      deadline,
    });
  } else {
    await api.post("/campaigns", {
      title,
      description: desc,
      goal,
      deadline,
      creatorId: user.id,
      isApproved: false,
    });
  }

  loadCampaigns();
}

document.getElementById("welcomeMsg").textContent = "Welcome, " + user.name;

buildNavbar();
loadCampaigns();
loadPledges();
