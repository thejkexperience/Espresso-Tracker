/* ===========================================================
   Espresso Tracker — Gear catalog page
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderShell("gear.html");
  renderGear();

  document.getElementById("search-gear").addEventListener("input", debounce(renderGear, 150));
  document.getElementById("filter-category").addEventListener("change", renderGear);
  document.getElementById("filter-tier").addEventListener("change", renderGear);
});

function renderGear() {
  const el = document.getElementById("gear-grid");
  const query = document.getElementById("search-gear").value.toLowerCase().trim();
  const category = document.getElementById("filter-category").value;
  const tier = document.getElementById("filter-tier").value;

  let items = GEAR_CATALOG;
  if (category) items = items.filter(g => g.category === category);
  if (tier) items = items.filter(g => g.tier === tier);
  if (query) {
    items = items.filter(g => [g.name, g.type, g.notes, g.tier].join(" ").toLowerCase().includes(query));
  }

  if (!items.length) {
    el.innerHTML = `<div class="empty-state card" style="grid-column:1/-1;"><div class="icon">⚙️</div><p>No gear matches your filters.</p></div>`;
    return;
  }

  el.innerHTML = items.map(g => `
    <div class="catalog-card">
      <div class="flex-between">
        <h3>${escapeHtml(g.name)}</h3>
        <span class="badge badge-light">${escapeHtml(g.tier)}</span>
      </div>
      <div class="muted">${escapeHtml(g.category)} · ${escapeHtml(g.type)}</div>
      <div class="price">${escapeHtml(g.price)}</div>
      <p>${escapeHtml(g.notes)}</p>
      ${g.link ? `<a href="${escapeHtml(g.link)}" target="_blank" rel="noopener">Learn more ↗</a>` : ""}
    </div>
  `).join("");
}
