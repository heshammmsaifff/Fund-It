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
  const user = Auth.getUser();
  const isOwner = user && user.id === campaign.creatorId;
  const canPledge = user && !isOwner && user.role !== "admin";

  const imgHtml = campaign.image
    ? '<div class="campaign-img"><img src="' +
      campaign.image +
      '" alt="' +
      campaign.title +
      '" /></div>'
    : '<div class="campaign-img"><span>No Image</span></div>';

  let pledgeBtn = "";
  if (canPledge) {
    pledgeBtn =
      '<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="openModal()">Back this Campaign</button>';
  } else if (!user) {
    pledgeBtn =
      '<a href="../auth/" class="btn btn-primary" style="width:100%;display:block;text-align:center;margin-top:8px">Login to Support</a>';
  } else if (isOwner) {
    pledgeBtn =
      '<p class="text-muted" style="font-size:13px;margin-top:8px">This is your campaign.</p>';
  }

  const pledgeRows =
    pledges.length > 0
      ? pledges
          .map(
            (p) =>
              '<div class="pledge-item"><span>Backer #' +
              p.userId +
              '</span><span style="font-weight:600;color:var(--primary)">$' +
              p.amount.toLocaleString() +
              "</span></div>",
          )
          .join("")
      : '<p class="text-muted">No pledges yet. Be the first!</p>';

  document.getElementById("content").innerHTML =
    '<a href="../home/" style="font-size:13px;color:var(--text-muted)">&larr; Back to campaigns</a>' +
    '<div class="campaign-layout">' +
    "<div>" +
    imgHtml +
    '<div class="campaign-title">' +
    campaign.title +
    "</div>" +
    '<div class="campaign-meta">' +
    '<div class="meta-item"><strong>' +
    formatDate(campaign.deadline) +
    "</strong>Deadline</div>" +
    '<div class="meta-item"><strong><span class="badge badge-info">' +
    campaign.category +
    "</span></strong>Category</div>" +
    '<div class="meta-item"><strong>' +
    (campaign.isApproved
      ? '<span class="badge badge-success">Approved</span>'
      : '<span class="badge badge-warning">Pending</span>') +
    "</strong>Status</div>" +
    "</div>" +
    '<p class="campaign-description">' +
    campaign.description +
    "</p>" +
    '<div class="pledges-section">' +
    '<h3 style="font-size:16px;font-weight:600;margin-bottom:12px">Backers (' +
    pledges.length +
    ")</h3>" +
    pledgeRows +
    "</div>" +
    "</div>" +
    "<div>" +
    '<div class="sidebar-card">' +
    '<div class="raised-amount">$' +
    raised.toLocaleString() +
    "</div>" +
    '<div class="goal-text">raised of $' +
    campaign.goal.toLocaleString() +
    " goal</div>" +
    '<div class="progress-wrap"><div class="progress-bar" style="width:' +
    percent +
    '%"></div></div>' +
    '<div class="percent-text">' +
    percent +
    "% funded</div>" +
    '<hr class="sidebar-divider" />' +
    '<div class="sidebar-stat"><span>Backers</span><span>' +
    pledges.length +
    "</span></div>" +
    '<div class="sidebar-stat"><span>Deadline</span><span>' +
    formatDate(campaign.deadline) +
    "</span></div>" +
    '<div class="sidebar-stat"><span>Goal</span><span>$' +
    campaign.goal.toLocaleString() +
    "</span></div>" +
    pledgeBtn +
    "</div>" +
    "</div>" +
    "</div>";
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
    "You are pledging $" +
    amount +
    ' to "' +
    campaign.title +
    '". This is a mock payment.';
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
  }, 4000);
}

buildNavbar();
loadPage();
