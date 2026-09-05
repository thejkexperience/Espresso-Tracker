/* ===========================================================
   Espresso Tracker — Dial in a bag (dial-in.html)
   Per the Organic "1c" mockup: a draggable grind dial with a
   "sweet band" learned from past attempts, a plain-language
   prediction, and a scannable history of attempts on this bag.

   Grind values are treated as a numeric 1.0 (coarse) – 8.0
   (fine) scale, matching common stepped grinders (Niche,
   Baratza, etc). An attempt whose grindSize isn't a plain
   number just won't plot on the dial or sweet band.
   =========================================================== */

const GRIND_MIN = 1.0;
const GRIND_MAX = 8.0;
const TARGET_LOW = 25;
const TARGET_HIGH = 30;
const TIME_AXIS_MIN = 15;
const TIME_AXIS_MAX = 40;

let currentBean = null;
let bagAttempts = []; // brews for this bean, most recent first
let currentGrind = 4.5;

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initAuthUI("dial-in.html", true);
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const beanId = params.get("beanId");

  const beans = await getBeans();
  currentBean = beanId ? beans.find(b => b.id === beanId) : beans[0];

  if (!currentBean) {
    document.getElementById("dialin-title").textContent = "No beans yet";
    document.getElementById("dialin-sub").textContent = "Add a bag on the Beans page to start dialing it in.";
    document.querySelector(".dialin-card").style.display = "none";
    return;
  }

  const allBrews = await getBrews();
  bagAttempts = allBrews.filter(b => b.beanId === currentBean.id);

  renderHead();
  const sweet = computeSweetBand();
  currentGrind = lastNumericGrind() ?? (sweet ? (sweet.low + sweet.high) / 2 : 4.5);
  renderSlider(sweet);
  renderPrediction(sweet);
  renderAttempts();
  updatePullLink();
  setupDrag(sweet);
});

// ---------- Header ----------

function renderHead() {
  document.getElementById("dialin-kicker").textContent = `Dialing in · shot ${bagAttempts.length}`;
  document.getElementById("dialin-title").textContent = currentBean.name;
  const subParts = [currentBean.roaster, currentBean.process, daysOffRoastLabel(currentBean.dateAdded)].filter(Boolean);
  document.getElementById("dialin-sub").textContent = subParts.join(" · ");

  const badge = document.getElementById("dialin-badge");
  const last = bagAttempts[0];
  if (!last) { badge.hidden = true; return; }

  const inBand = last.brewTime >= TARGET_LOW && last.brewTime <= TARGET_HIGH;
  const clean = !(last.issueTags && last.issueTags.length) && Number(last.rating) >= 4;
  if (inBand && clean) {
    badge.textContent = "Dialed in";
  } else if (last.brewTime != null && last.brewTime !== "") {
    const center = (TARGET_LOW + TARGET_HIGH) / 2;
    const delta = Math.round(last.brewTime - center);
    badge.textContent = delta > 0 ? `${delta}s slow` : `${Math.abs(delta)}s fast`;
  } else {
    badge.textContent = "Keep dialing in";
  }
  badge.hidden = false;
}

function daysOffRoastLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const days = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  if (days < 0) return "";
  return days === 0 ? "added today" : `${days} day${days === 1 ? "" : "s"} off roast`;
}

// ---------- Sweet band (learned from in-band attempts) ----------

function computeSweetBand() {
  const grinds = bagAttempts
    .filter(b => b.brewTime >= TARGET_LOW && b.brewTime <= TARGET_HIGH)
    .map(b => parseFloat(b.grindSize))
    .filter(g => !isNaN(g));
  if (!grinds.length) return null;
  const low = Math.max(GRIND_MIN, Math.min(...grinds) - 0.2);
  const high = Math.min(GRIND_MAX, Math.max(...grinds) + 0.2);
  return { low, high };
}

function lastNumericGrind() {
  for (const b of bagAttempts) {
    const g = parseFloat(b.grindSize);
    if (!isNaN(g)) return g;
  }
  return null;
}

function grindToPct(g) {
  return ((g - GRIND_MIN) / (GRIND_MAX - GRIND_MIN)) * 100;
}

// ---------- Slider ----------

function renderSlider(sweet) {
  document.getElementById("dialin-min-label").textContent = `${GRIND_MIN.toFixed(1)} coarse`;
  document.getElementById("dialin-max-label").textContent = `${GRIND_MAX.toFixed(1)} fine`;

  const bandEl = document.getElementById("dialin-slider-band");
  const sweetLabel = document.getElementById("dialin-sweet-label");
  if (sweet) {
    const leftPct = grindToPct(sweet.low);
    const widthPct = grindToPct(sweet.high) - leftPct;
    bandEl.style.left = `${leftPct}%`;
    bandEl.style.width = `${widthPct}%`;
    bandEl.hidden = false;
    sweetLabel.textContent = "sweet band";
  } else {
    bandEl.hidden = true;
    sweetLabel.textContent = "";
  }

  setGrindValue(currentGrind);
}

function setGrindValue(g) {
  currentGrind = Math.max(GRIND_MIN, Math.min(GRIND_MAX, Math.round(g * 10) / 10));
  document.getElementById("dialin-grind-value").textContent = currentGrind.toFixed(1);
  document.getElementById("dialin-slider-thumb").style.left = `${grindToPct(currentGrind)}%`;
}

function setupDrag(sweet) {
  const track = document.getElementById("dialin-slider-track");

  const moveToClientX = (clientX) => {
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setGrindValue(GRIND_MIN + pct * (GRIND_MAX - GRIND_MIN));
    renderPrediction(sweet);
    updatePullLink();
  };

  track.addEventListener("pointerdown", (e) => {
    track.setPointerCapture(e.pointerId);
    moveToClientX(e.clientX);
    const onMove = (ev) => moveToClientX(ev.clientX);
    const onUp = () => {
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
    };
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
  });
}

// ---------- Prediction ----------

function renderPrediction(sweet) {
  const el = document.getElementById("dialin-prediction");
  const last = bagAttempts[0];

  if (!last) {
    el.textContent = "Log a shot to start dialing in this bag.";
    return;
  }
  if (sweet && currentGrind >= sweet.low && currentGrind <= sweet.high) {
    el.textContent = "This setting sits in your sweet band for this bag — pull a shot here to confirm it's repeatable.";
    return;
  }
  if (last.brewTime != null && last.brewTime !== "") {
    if (last.brewTime < TARGET_LOW) {
      el.textContent = `Last shot ran fast at ${Math.round(last.brewTime)}s. Grind finer (raise the number) to slow it toward ${TARGET_LOW}–${TARGET_HIGH}s.`;
      return;
    }
    if (last.brewTime > TARGET_HIGH) {
      el.textContent = `Last shot ran slow at ${Math.round(last.brewTime)}s. Grind coarser (lower the number) to speed it toward ${TARGET_LOW}–${TARGET_HIGH}s.`;
      return;
    }
  }
  el.textContent = "Time's on target — if the last shot still tasted off, try adjusting dose or distribution before moving the grind.";
}

// ---------- Attempts list ----------

function renderAttempts() {
  const listEl = document.getElementById("dialin-attempts-list");
  const axisEl = document.getElementById("dialin-attempts-axis");

  if (!bagAttempts.length) {
    listEl.innerHTML = `<div class="empty-state card"><div class="icon">🎯</div><p>No attempts yet on this bag — pull a shot to start dialing it in.</p></div>`;
    axisEl.hidden = true;
    return;
  }

  document.getElementById("dialin-axis-min").textContent = `${TIME_AXIS_MIN} s`;
  document.getElementById("dialin-axis-band").textContent = `${TARGET_LOW}–${TARGET_HIGH} s`;
  document.getElementById("dialin-axis-max").textContent = `${TIME_AXIS_MAX} s`;
  axisEl.hidden = false;

  const bandLeftPct = ((TARGET_LOW - TIME_AXIS_MIN) / (TIME_AXIS_MAX - TIME_AXIS_MIN)) * 100;
  const bandWidthPct = ((TARGET_HIGH - TARGET_LOW) / (TIME_AXIS_MAX - TIME_AXIS_MIN)) * 100;

  listEl.innerHTML = bagAttempts.slice(0, 10).map(b => {
    const grindLabel = b.grindSize ? escapeHtml(b.grindSize) : "—";
    const hasTime = b.brewTime != null && b.brewTime !== "";
    const pct = hasTime ? Math.max(0, Math.min(100, ((b.brewTime - TIME_AXIS_MIN) / (TIME_AXIS_MAX - TIME_AXIS_MIN)) * 100)) : null;
    const negative = b.issueTags && b.issueTags.length;
    const dotColor = negative ? "var(--color-accent)" : Number(b.rating) >= 4 ? "var(--color-accent-2)" : "var(--color-neutral-500)";
    const note = b.feedback ? escapeHtml(truncateNote(b.feedback))
      : negative ? escapeHtml(ISSUE_TAGS.find(t => t.id === b.issueTags[0])?.label || "")
      : b.rating ? starString(b.rating)
      : "—";
    return `
      <div class="dialin-attempt-row">
        <span class="dialin-attempt-grind">${grindLabel}</span>
        <div class="dialin-attempt-bar">
          <div class="dialin-attempt-band" style="left:${bandLeftPct}%;width:${bandWidthPct}%;"></div>
          ${pct !== null ? `<div class="dialin-attempt-dot" style="left:${pct}%;background:${dotColor};"></div>` : ""}
        </div>
        <span class="dialin-attempt-note">${note}</span>
      </div>`;
  }).join("");
}

function truncateNote(str) {
  return str.length > 34 ? str.slice(0, 34) + "…" : str;
}

// ---------- "Pull a shot at this setting" ----------

function updatePullLink() {
  const link = document.getElementById("dialin-pull-btn");
  link.href = `live-pull.html?beanId=${encodeURIComponent(currentBean.id)}&grind=${encodeURIComponent(currentGrind.toFixed(1))}`;
}
