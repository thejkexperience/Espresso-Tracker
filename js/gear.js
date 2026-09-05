/* ===========================================================
   Espresso Tracker — Gear catalog page
   The catalog below is always browsable, no account needed.
   The "gear compare" readout up top needs a signed-in user's
   own shot log to compute anything, so it's optional.
   =========================================================== */

let gearSession = null;

document.addEventListener("DOMContentLoaded", async () => {
  gearSession = await initAuthUI("gear.html", false);
  renderGear();
  renderGearCompare();

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

// ---------- Gear compare ----------
// Per the Organic "1e" mockup: a readout of how the two grinders the
// user actually logs shots with are performing, built entirely from
// their own shot log — no invented ratings or roast-specific claims,
// just what the numbers say. Needs at least two distinct grinders
// with logged shots, so it's skipped entirely for signed-out visitors
// or accounts with too little history yet.

async function renderGearCompare() {
  const el = document.getElementById("gear-compare");
  if (!el) return;

  if (!gearSession) {
    el.innerHTML = `<div class="gearcmp-empty">Sign in and log a few shots to see how your grinders are performing, side by side. <a href="login.html?redirect=gear.html">Sign in</a></div>`;
    return;
  }

  const brews = await getBrews();
  const groups = new Map();
  brews.forEach(b => {
    const key = (b.grinderType || "").trim();
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  });

  const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  if (ranked.length < 2) {
    el.innerHTML = `<div class="gearcmp-empty">${ranked.length === 0
      ? "Log a grinder with your shots to start building a performance readout here."
      : "Log a few shots with a second grinder to see a side-by-side comparison here."
    }</div>`;
    return;
  }

  const [nameA, brewsA] = ranked[0];
  const [nameB, brewsB] = ranked[1];
  const statsA = gearGroupStats(brewsA);
  const statsB = gearGroupStats(brewsB);
  const totalCompared = brewsA.length + brewsB.length;

  el.innerHTML = `
    <img class="gearcmp-hero-img washed" src="images/backgrounds/gear.jpg" alt="" />
    <div class="gearcmp-kicker">Gear · ${totalCompared} shot${totalCompared === 1 ? "" : "s"} compared</div>
    <h2 class="gearcmp-title">Grinder performance, from your log</h2>
    <div class="gearcmp-cards">
      ${gearCompareCard(nameA, statsA)}
      ${gearCompareCard(nameB, statsB)}
    </div>
    <div class="gearcmp-summary"><strong>What the log says:</strong> ${gearCompareSummary(nameA, statsA, nameB, statsB)}</div>
  `;
}

function gearGroupStats(brews) {
  const shots = brews.length;
  const rated = brews.filter(b => Number(b.rating) > 0);
  const avgRating = rated.length ? rated.reduce((sum, b) => sum + Number(b.rating), 0) / rated.length : 0;
  const inBand = brews.filter(gearInTargetBand).length;
  const bandPct = shots ? Math.round((inBand / shots) * 100) : 0;

  const grindValues = brews.map(b => parseFloat(b.grindSize)).filter(n => Number.isFinite(n));
  const grindRange = grindValues.length >= 2 ? `${Math.min(...grindValues)}–${Math.max(...grindValues)}` : "";

  const issueCounts = {};
  brews.forEach(b => (b.issueTags || []).forEach(id => { issueCounts[id] = (issueCounts[id] || 0) + 1; }));
  const topIssueId = Object.keys(issueCounts).sort((a, b) => issueCounts[b] - issueCounts[a])[0];
  const topIssue = topIssueId ? ISSUE_TAGS.find(t => t.id === topIssueId) : null;

  return { shots, avgRating, bandPct, grindRange, topIssue, topIssueCount: topIssueId ? issueCounts[topIssueId] : 0 };
}

// Same 1:1.8–1:2.2 espresso ratio definition used by Home's "in the
// target band" stat and the Shot log's "In band" filter.
function gearInTargetBand(b) {
  const d = Number(b.doseWeight), y = Number(b.yieldWeight);
  if (!d || !y) return false;
  const ratio = y / d;
  return ratio >= 1.8 && ratio <= 2.2;
}

function gearCompareCard(name, stats) {
  const ratingBarPct = Math.round((stats.avgRating / 5) * 100);
  const noteHtml = stats.topIssue
    ? `Most logged issue: “${escapeHtml(stats.topIssue.label)}” on ${stats.topIssueCount} of ${stats.shots} shots.`
    : `No issues logged on these shots yet.`;
  return `
    <div class="gearcmp-card">
      <div>
        <div class="gearcmp-card-name">${escapeHtml(name)}</div>
        <div class="gearcmp-card-meta">${stats.shots} shot${stats.shots === 1 ? "" : "s"}${stats.grindRange ? " · grind " + escapeHtml(stats.grindRange) : ""}</div>
      </div>
      <div>
        <div class="gearcmp-rating-row">
          <span class="gearcmp-rating-value">${stats.avgRating ? stats.avgRating.toFixed(1) : "—"}</span>
          <span class="gearcmp-rating-label">avg rating</span>
        </div>
        <div class="gearcmp-bar-track"><div class="gearcmp-bar-fill" style="width:${ratingBarPct}%;"></div></div>
      </div>
      <div class="gearcmp-band-row">
        <span>in target band</span><span>${stats.bandPct}%</span>
      </div>
      <div class="gearcmp-note">${noteHtml}</div>
    </div>
  `;
}

function gearCompareSummary(nameA, statsA, nameB, statsB) {
  const partA = `${escapeHtml(nameA)} lands in the target band on ${statsA.bandPct}% of shots (avg ${statsA.avgRating ? statsA.avgRating.toFixed(1) : "—"}★ across ${statsA.shots}).`;
  const partB = `${escapeHtml(nameB)}: ${statsB.bandPct}% in band (avg ${statsB.avgRating ? statsB.avgRating.toFixed(1) : "—"}★ across ${statsB.shots}).`;
  return `${partA} ${partB}`;
}
