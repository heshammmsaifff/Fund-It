const user = Auth.getUser();

if (!Auth.isAdmin()) {
  goTo("auth");
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
    panel.innerHTML =
      '<p class="text-muted">You have no campaigns yet. Create your first one!</p>';
    return;
  }

  const rows = await Promise.all(
    campaigns.map(async (c) => {
      const pledges = await api.get("/pledges?campaignId=" + c.id);
      const raised = pledges.reduce((sum, p) => sum + p.amount, 0);
      const percent = calcPercent(raised, c.goal);
      const status = c.isApproved
        ? '<span class="badge badge-success">Approved</span>'
        : '<span class="badge badge-warning">Pending</span>';

      return (
        '<div class="campaign-row">' +
        '<div class="campaign-row-info">' +
        '<div class="campaign-row-title">' +
        c.title +
        "</div>" +
        '<div class="campaign-row-meta">' +
        "<span>" +
        status +
        "</span>" +
        "<span>Goal: $" +
        c.goal.toLocaleString() +
        "</span>" +
        "<span>Raised: $" +
        raised.toLocaleString() +
        " (" +
        percent +
        "%)</span>" +
        "<span>Deadline: " +
        formatDate(c.deadline) +
        "</span>" +
        "</div>" +
        "</div>" +
        '<div class="campaign-row-actions">' +
        '<a href="../campaign-details/?id=' +
        c.id +
        '" class="btn btn-outline btn-sm">View</a>' +
        '<button class="btn btn-outline btn-sm" onclick="openEditModal(' +
        c.id +
        ')">Edit</button>' +
        "</div>" +
        "</div>"
      );
    }),
  );

  panel.innerHTML = rows.join("");
}

async function loadPledges() {
  const pledges = await api.get("/pledges?userId=" + user.id);
  const panel = document.getElementById("pledgesPanel");

  if (pledges.length === 0) {
    panel.innerHTML =
      '<p class="text-muted">You have not backed any campaigns yet.</p>';
    return;
  }

  const rows = await Promise.all(
    pledges.map(async (p) => {
      const campaign = await api.get("/campaigns/" + p.campaignId);
      const title = campaign ? campaign.title : "Unknown Campaign";
      return (
        '<div class="pledge-row">' +
        "<div>" +
        '<div style="font-weight:600;margin-bottom:4px">' +
        title +
        "</div>" +
        '<div class="text-muted">Campaign #' +
        p.campaignId +
        "</div>" +
        "</div>" +
        '<div class="pledge-amount">$' +
        p.amount.toLocaleString() +
        "</div>" +
        "</div>"
      );
    }),
  );

  panel.innerHTML = rows.join("");
}

function openCreateModal() {
  editingId = null;
  document.getElementById("modalHeading").textContent = "New Campaign";
  document.getElementById("modalAlert").innerHTML = "";
  document.getElementById("editId").value = "";
  document.getElementById("fieldTitle").value = "";
  document.getElementById("fieldDesc").value = "";
  document.getElementById("fieldGoal").value = "";
  document.getElementById("fieldDeadline").value = "";
  document.getElementById("fieldCategory").value = "technology";
  document.getElementById("campaignModal").style.display = "flex";
}

async function openEditModal(id) {
  const c = await api.get("/campaigns/" + id);
  editingId = id;
  document.getElementById("modalHeading").textContent = "Edit Campaign";
  document.getElementById("modalAlert").innerHTML = "";
  document.getElementById("editId").value = id;
  document.getElementById("fieldTitle").value = c.title;
  document.getElementById("fieldDesc").value = c.description;
  document.getElementById("fieldGoal").value = c.goal;
  document.getElementById("fieldDeadline").value = c.deadline;
  document.getElementById("fieldCategory").value = c.category;
  document.getElementById("campaignModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("campaignModal").style.display = "none";
}

async function saveCampaign() {
  const title = document.getElementById("fieldTitle").value.trim();
  const desc = document.getElementById("fieldDesc").value.trim();
  const goal = parseInt(document.getElementById("fieldGoal").value);
  const deadline = document.getElementById("fieldDeadline").value;
  const category = document.getElementById("fieldCategory").value;
  const fileInput = document.getElementById("fieldImage");

  if (!title || !desc || !goal || !deadline) {
    document.getElementById("modalAlert").innerHTML =
      '<div class="alert alert-error">Please fill in all required fields.</div>';
    return;
  }

  let image = "";
  if (fileInput.files.length > 0) {
    image = await toBase64(fileInput.files[0]);
  }

  if (editingId) {
    const updateData = { title, description: desc, goal, deadline, category };
    if (image) updateData.image = image;
    await api.patch("/campaigns/" + editingId, updateData);
  } else {
    await api.post("/campaigns", {
      title,
      description: desc,
      goal,
      deadline,
      category,
      image,
      creatorId: user.id,
      isApproved: false,
    });
  }

  closeModal();
  loadCampaigns();
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("welcomeMsg").textContent = "Welcome, " + user.name;

buildNavbar();
loadCampaigns();
loadPledges();
