/* ===========================================================
   Espresso Tracker — Learn page (history + styles)
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderShell("learn.html");
  renderTimeline();
  renderStyles();

  document.getElementById("search-styles").addEventListener("input", debounce(renderStyles, 150));
});

function renderTimeline() {
  const el = document.getElementById("history-timeline");
  el.innerHTML = COFFEE_HISTORY_TIMELINE.map(item => `
    <div class="timeline-item">
      <div class="year">${escapeHtml(item.year)}</div>
      <p>${escapeHtml(item.text)}</p>
    </div>
  `).join("");
}

function renderStyles() {
  const el = document.getElementById("styles-grid");
  const query = document.getElementById("search-styles").value.toLowerCase().trim();
  let styles = COFFEE_STYLES;
  if (query) {
    styles = styles.filter(s => [s.name, s.family, s.desc, s.howTo].join(" ").toLowerCase().includes(query));
  }
  if (!styles.length) {
    el.innerHTML = `<div class="empty-state card" style="grid-column:1/-1;"><p>No styles match.</p></div>`;
    return;
  }
  el.innerHTML = styles.map(s => `
    <div class="catalog-card">
      <div class="flex-between">
        <h3>${escapeHtml(s.name)}</h3>
        <span class="badge badge-light">${escapeHtml(s.family)}</span>
      </div>
      <p>${escapeHtml(s.desc)}</p>
      <div class="divider" style="margin:8px 0;"></div>
      <div class="muted"><strong>How to make it:</strong> ${escapeHtml(s.howTo)}</div>
    </div>
  `).join("");
}
