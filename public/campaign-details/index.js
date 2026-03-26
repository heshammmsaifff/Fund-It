const params = new URLSearchParams(window.location.search);
const campaignId = parseInt(params.get("id"));

let campaign = null;
let pledges = [];
let pendingAmount = 0;

async function loadPage() {
  if (!campaignId) {
    document.getElementById("content").innerHTML =
      '<p class="text-muted">Campaign not found.</p>';
    return;
  }

  campaign = await api.get("/campaigns/" + campaignId);
  pledges = await api.get("/pledges?campaignId=" + campaignId);

  const user = Auth.getUser();
  if (!campaign || (!campaign.isApproved && !Auth.isAdmin())) {
    document.getElementById("content").innerHTML =
      '<p class="text-muted">This campaign is not available.</p>';
    return;
  }

  renderPage();
}

async function renderPage() {
  const raised = pledges.reduce((sum, p) => sum + p.amount, 0);
  const percent = calcPercent(raised, campaign.goal);
  const safePercent = Math.min(percent, 100);

  const user = Auth.getUser();
  const isOwner = user?.id === campaign.creatorId;
  const canPledge = user && !isOwner && user.role !== "admin";
  const isExpired = new Date() > new Date(campaign.deadline);

  const content = `
    <a href="../home/" class="text-sm text-muted">&larr; Back to campaigns</a>
    <div class="campaign-layout">
      
      <div class="main-content">
        ${renderImage()}
        <div class="campaign-title">${campaign.title}</div>

        <div class="campaign-meta">
          ${renderStat("Deadline", formatDate(campaign.deadline))}
          ${renderStat("Category", `<span class="badge badge-info">${campaign.category}</span>`)}
          ${renderStat(
            "Status",
            campaign.isApproved
              ? `<span class="badge badge-success">Approved</span>`
              : `<span class="badge badge-warning">Pending</span>`,
          )}
        </div>

        <p class="campaign-description">${campaign.description}</p>

        <div class="pledges-section">
          <h3 class="text-base font-semibold mb-3">
            Backers (${pledges.length})
          </h3>
          ${renderPledges()}
        </div>
      </div>

      <div class="sidebar">
        ${renderSidebar(raised, safePercent, canPledge, isOwner, user, isExpired)}
      </div>

    </div>
  `;

  document.getElementById("content").innerHTML = content;
}

function renderImage() {
  if (campaign.image) {
    return `
      <div class="campaign-img">
        <img src="${campaign.image}" alt="${campaign.title}" />
      </div>
    `;
  }

  return `<div class="campaign-img"><span>No Image</span></div>`;
}

function renderStat(label, value) {
  return `
    <div class="meta-item">
      <span>${label}</span>
      <span>${value}</span>
    </div>
  `;
}

function renderPledges() {
  if (pledges.length === 0) {
    return `<p class="text-muted">No pledges yet. Be the first!</p>`;
  }

  return pledges
    .map(
      (p) => `
      <div class="pledge-item">
        <span>Backer #${p.userId}</span>
        <span class="font-semibold text-primary">$${p.amount.toLocaleString()}</span>
      </div>
    `,
    )
    .join("");
}

function renderSidebar(raised, percent, canPledge, isOwner, user, isExpired) {
  return `
    <div class="sidebar-card">
      
      <div class="raised-amount">
        $${raised.toLocaleString()}
      </div>
      <div class="goal-text">
        raised of $${campaign.goal.toLocaleString()}
      </div>

      <div class="progress-wrap">
        <div class="progress-bar" style="width: ${percent}%"></div>
      </div>
      

      ${renderPledgeButton(canPledge, isOwner, user, isExpired)}

    </div>
  `;
}

function renderPledgeButton(canPledge, isOwner, user, isExpired) {
  if (isExpired) {
    return `<p class="text-muted text-sm mt-2">Campaign ended.</p>`;
  }

  if (canPledge) {
    return `
      <button class="btn btn-primary w-full mt-2" onclick="openModal()">
        Back this Campaign
      </button>
    `;
  }

  if (!user) {
    return `
      <a href="../auth/" class="btn btn-primary w-full block text-center mt-2">
        Login to Support
      </a>
    `;
  }

  if (isOwner) {
    return `<p class="text-muted text-sm mt-2">This is your campaign.</p>`;
  }

  return "";
}

function openModal() {
  document.getElementById("pledgeAlert").innerHTML = "";
  document.getElementById("pledgeAmount").value = "";
  document.getElementById("pledgeModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("pledgeModal").style.display = "none";
}

function confirmPledge() {
  const amount = parseInt(document.getElementById("pledgeAmount").value);
  if (!amount || amount < 1) {
    document.getElementById("pledgeAlert").innerHTML =
      '<div class="alert alert-error">Please enter a valid amount.</div>';
    return;
  }
  pendingAmount = amount;
  closeModal();
  document.getElementById("paymentMsg").textContent =
    "You are pledging $" + amount + ' to "' + campaign.title;
  document.getElementById("cardNumber").value = "";
  document.getElementById("cardExpiry").value = "";
  document.getElementById("cardCvv").value = "";
  document.getElementById("paymentAlert").innerHTML = "";
  document.getElementById("paymentModal").style.display = "flex";
}

function closePayment() {
  document.getElementById("paymentModal").style.display = "none";
}

async function processPledge() {
  const card = document.getElementById("cardNumber").value.trim();
  const expiry = document.getElementById("cardExpiry").value.trim();
  const cvv = document.getElementById("cardCvv").value.trim();

  if (!card || !expiry || !cvv) {
    document.getElementById("paymentAlert").innerHTML =
      '<div class="alert alert-error">Please fill in all payment fields.</div>';
    return;
  }

  const user = Auth.getUser();
  await api.post("/pledges", {
    campaignId: campaign.id,
    userId: user.id,
    amount: pendingAmount,
  });

  closePayment();
  pledges = await api.get("/pledges?campaignId=" + campaignId);
  renderPage();

  document.getElementById("alertBox").innerHTML =
    '<div class="alert alert-success">Pledge submitted successfully! Thank you.</div>';
  setTimeout(() => {
    document.getElementById("alertBox").innerHTML = "";
  }, 5000);
}

buildNavbar();
loadPage();
