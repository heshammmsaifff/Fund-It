let allCampaigns = [];

async function loadCampaigns() {
  const category = document.getElementById("categoryFilter").value;
  const sort = document.getElementById("sortFilter").value;
  const search = document.getElementById("searchInput").value.trim();

  let url = "/campaigns?isApproved=true";
  if (category) url += `&category=${category}`;
  if (sort) url += `&_sort=${sort}`;
  if (search) url += `&q=${encodeURIComponent(search)}`;

  allCampaigns = await api.get(url);
  renderCampaigns(allCampaigns);
}

async function getRaisedAmount(campaignId) {
  const pledges = await api.get(`/pledges?campaignId=${campaignId}`);
  return pledges.reduce((sum, p) => sum + p.amount, 0);
}

async function renderCampaigns(campaigns) {
  const grid = document.getElementById("campaignGrid");
  const emptyMsg = document.getElementById("emptyMsg");

  if (campaigns.length === 0) {
    grid.innerHTML = "";
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";
  grid.innerHTML = '<p class="text-muted">Loading...</p>';

  const cards = await Promise.all(
    campaigns.map(async (c) => {
      const raised = await getRaisedAmount(c.id);
      const percent = calcPercent(raised, c.goal);
      const imgHtml = c.image
        ? `<img src="${c.image}" alt="${c.title}" />`
        : `<span>No Image</span>`;

      return `
      <div class="campaign-card">
        <div class="campaign-card-img">${imgHtml}</div>
        <div class="campaign-card-body">
          <div class="campaign-card-title">${c.title}</div>
          <div class="campaign-card-desc">${c.description}</div>
          <div class="progress-wrap">
            <div class="progress-bar" style="width:${percent}%"></div>
          </div>
          <div class="campaign-card-meta">
            <span>$${raised.toLocaleString()} raised of $${c.goal.toLocaleString()}</span>
            <span>${percent}%</span>
          </div>
          <div class="campaign-card-meta">
            <span class="badge badge-info">${c.category}</span>
            <span>Deadline: ${formatDate(c.deadline)}</span>
          </div>
        </div>
        <div class="campaign-card-footer">
          <a href="../campaign-details/?id=${c.id}" class="btn btn-primary btn-sm">View Campaign</a>
        </div>
      </div>
    `;
    }),
  );

  grid.innerHTML = cards.join("");
}

document.getElementById("searchInput").addEventListener("input", loadCampaigns);
document
  .getElementById("categoryFilter")
  .addEventListener("change", loadCampaigns);
document.getElementById("sortFilter").addEventListener("change", loadCampaigns);

buildNavbar();
loadCampaigns();
