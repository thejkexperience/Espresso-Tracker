/* ===========================================================
   Espresso Tracker — Dashboard (index.html)
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initAuthUI("index.html", true);
  if (!session) return; // redirect to login/setup already underway

  await renderStats();
  await renderRecentBrews();
});

async function renderStats() {
  const stats = await computeStats();
  const el = document.getElementById("stats-row");
  const avg = stats.avgRating ? stats.avgRating.toFixed(1) + " ★" : "—";
  el.innerHTML = `
    <div class="stat-card">
      <div class="value">${stats.totalBrews}</div>
      <div class="label">Total brews logged</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.brewsThisWeek}</div>
      <div class="label">Brews this week</div>
    </div>
    <div class="stat-card">
      <div class="value">${avg}</div>
      <div class="label">Average rating</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.totalBeans}</div>
      <div class="label">Beans in your library</div>
    </div>
  `;
}

async function renderRecentBrews() {
  const brews = (await getBrews()).slice(0, 5);
  const el = document.getElementById("recent-brews");
  if (!brews.length) {
    el.innerHTML = `
      <div class="empty-state card">
        <div class="icon">☕</div>
        <h3>No brews logged yet</h3>
        <p>Log your first shot to start building your history.</p>
        <a href="brew-log.html" class="btn btn-primary">Log your first brew</a>
      </div>`;
    return;
  }
  el.innerHTML = brews.map(b => `
    <a class="brew-item" href="brew-log.html?id=${encodeURIComponent(b.id)}" style="text-decoration:none;color:inherit;">
      <div>
        <strong>${escapeHtml(b.beanName || "Unnamed bean")}</strong>
        <div class="meta">${formatDate(b.date)} · ${escapeHtml(b.machineType || "—")} · ${escapeHtml(b.grindSize || "—")}</div>
      </div>
      <div style="text-align:right;">
        <div>${b.rating ? starString(b.rating) : ""}</div>
        <div class="meta">${escapeHtml(b.doseWeight || "?")}g → ${escapeHtml(b.yieldWeight || "?")}g</div>
      </div>
    </a>
  `).join("");
}
