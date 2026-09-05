/* ===========================================================
   Espresso Tracker — Live pull (live-pull.html)
   Timer-first shot flow per the Organic "1b / 2b" mockups: a
   full-bleed ink screen with a circular progress timer. Numbers
   land after the pour — taste, notes, and equipment stay on
   brew-log.html so this screen can stay to one job.

   The progress ring maps elapsed time onto a fixed max-scale
   (RING_MAX_SECONDS) so a sage arc can mark the target time
   band on the same dial the orange progress arc fills.
   =========================================================== */

const RING_MAX_SECONDS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // r=88, matches the SVG viewBox
const DEFAULT_TARGET_LOW = 25;
const DEFAULT_TARGET_HIGH = 30;
const DEFAULT_DOSE = "18.0";

// Quick single-select "how did it taste" tags. Sour / bitter / thin map onto
// the same ISSUE_TAGS ids used elsewhere in the app (see js/data.js) so a
// shot logged here shows up consistently on the shot log and home dashboard.
// Balanced / syrupy are positive reads with no issue tag attached.
const TASTE_QUICK_TAGS = [
  { id: "sour", label: "Sour", issueTag: "sour", rating: 3 },
  { id: "balanced", label: "Balanced", issueTag: null, rating: 5 },
  { id: "bitter", label: "Bitter", issueTag: "bitter", rating: 3 },
  { id: "thin", label: "Thin", issueTag: "thin", rating: 3 },
  { id: "syrupy", label: "Syrupy", issueTag: null, rating: 4 }
];

let beans = [];
let selectedBean = null;
let selectedTasteId = "balanced";

let running = false;
let elapsedSeconds = 0;
let startedAtMs = null;
let rafId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initLivePullSession();
  if (!session) return;

  drawBandArc(DEFAULT_TARGET_LOW, DEFAULT_TARGET_HIGH);
  document.getElementById("livepull-target-label").textContent =
    `target band ${DEFAULT_TARGET_LOW}–${DEFAULT_TARGET_HIGH} s`;

  renderTasteTags();
  await loadBeanDefaults();
  updateRatio();

  document.getElementById("livepull-toggle").addEventListener("click", onToggle);
  document.getElementById("livepull-reset").addEventListener("click", onReset);
  document.getElementById("livepull-yield").addEventListener("input", updateRatio);
  document.getElementById("livepull-bean-select").addEventListener("change", onBeanChange);
  document.getElementById("livepull-save-btn").addEventListener("click", () => onSave(false));
  document.getElementById("livepull-notes-btn").addEventListener("click", () => onSave(true));
});

// ---------- Session (this page draws its own minimal chrome) ----------

async function initLivePullSession() {
  if (!isSupabaseConfigured()) {
    window.location.href = "setup.html";
    return null;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html?redirect=live-pull.html";
    return null;
  }
  return session;
}

// ---------- Bean + last-used dose/grind defaults ----------

async function loadBeanDefaults() {
  const select = document.getElementById("livepull-bean-select");
  beans = await getBeans();

  if (!beans.length) {
    select.innerHTML = `<option value="">No beans yet — add one on the Beans page</option>`;
    return;
  }

  select.innerHTML = beans
    .map(b => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`)
    .join("");
  select.value = beans[0].id;
  await applyBeanSelection(beans[0]);
}

async function onBeanChange(e) {
  const bean = beans.find(b => b.id === e.target.value) || null;
  await applyBeanSelection(bean);
}

async function applyBeanSelection(bean) {
  selectedBean = bean;
  const doseInput = document.getElementById("livepull-dose");
  const grindInput = document.getElementById("livepull-grind");
  if (!bean) return;

  const brews = await getBrews();
  const lastForBean = brews.find(b => b.beanId === bean.id);
  doseInput.value = lastForBean && lastForBean.doseWeight !== "" ? lastForBean.doseWeight : DEFAULT_DOSE;
  grindInput.value = lastForBean && lastForBean.grindSize ? lastForBean.grindSize : "—";
}

// ---------- Timer ----------

function onToggle() {
  if (running) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  running = true;
  startedAtMs = performance.now() - elapsedSeconds * 1000;
  setPhase("pulling");
  setControlsLocked(true);
  document.getElementById("livepull-taste").hidden = true;

  const toggle = document.getElementById("livepull-toggle");
  toggle.textContent = "Stop";

  const tick = () => {
    if (!running) return;
    elapsedSeconds = (performance.now() - startedAtMs) / 1000;
    renderElapsed();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopTimer() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  setPhase("done");
  document.getElementById("livepull-toggle").textContent = "Resume";
  document.getElementById("livepull-taste").hidden = false;
}

function onReset() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  elapsedSeconds = 0;
  startedAtMs = null;
  renderElapsed();
  document.getElementById("livepull-yield").value = "0.0";
  updateRatio();
  setPhase("ready");
  setControlsLocked(false);
  document.getElementById("livepull-toggle").textContent = "Start shot";
  document.getElementById("livepull-taste").hidden = true;
}

function setPhase(phase) {
  const kicker = document.getElementById("livepull-kicker");
  const phaseLabel = document.getElementById("livepull-phase");
  phaseLabel.textContent = phase;
  kicker.textContent = phase === "pulling" ? "Pulling now" : phase === "done" ? "Shot done" : "Ready to pull";
}

function setControlsLocked(locked) {
  document.getElementById("livepull-bean-select").disabled = locked;
  document.getElementById("livepull-dose").disabled = locked;
  document.getElementById("livepull-grind").disabled = locked;
}

function renderElapsed() {
  document.getElementById("livepull-elapsed").textContent = elapsedSeconds.toFixed(1);
  const pct = Math.min(elapsedSeconds / RING_MAX_SECONDS, 1);
  const ring = document.getElementById("livepull-progress-ring");
  ring.setAttribute("stroke-dashoffset", String(RING_CIRCUMFERENCE * (1 - pct)));
}

function drawBandArc(lowSeconds, highSeconds) {
  const arc = document.getElementById("livepull-band-arc");
  const startPct = Math.min(lowSeconds / RING_MAX_SECONDS, 1);
  const spanPct = Math.max(Math.min(highSeconds / RING_MAX_SECONDS, 1) - startPct, 0);
  const arcLength = RING_CIRCUMFERENCE * spanPct;
  arc.setAttribute("stroke-dasharray", `${arcLength} ${RING_CIRCUMFERENCE - arcLength}`);
  arc.setAttribute("stroke-dashoffset", String(-RING_CIRCUMFERENCE * startPct));
}

// ---------- Yield / ratio ----------

function updateRatio() {
  const dose = Number(document.getElementById("livepull-dose").value);
  const yieldWeight = Number(document.getElementById("livepull-yield").value);
  const ratioEl = document.getElementById("livepull-ratio");
  ratioEl.textContent = dose && yieldWeight ? `1:${(yieldWeight / dose).toFixed(1)}` : "—";
}

// ---------- Taste tags ----------

function renderTasteTags() {
  const wrap = document.getElementById("livepull-taste-tags");
  wrap.innerHTML = TASTE_QUICK_TAGS.map(tag => `
    <button type="button" class="livepull-taste-tag${tag.id === selectedTasteId ? " selected" : ""}" data-id="${tag.id}">${escapeHtml(tag.label)}</button>
  `).join("");
  wrap.querySelectorAll(".livepull-taste-tag").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedTasteId = btn.dataset.id;
      wrap.querySelectorAll(".livepull-taste-tag").forEach(b => b.classList.toggle("selected", b.dataset.id === selectedTasteId));
    });
  });
}

// ---------- Save ----------

async function onSave(goToNotes) {
  const saveBtn = document.getElementById("livepull-save-btn");
  const notesBtn = document.getElementById("livepull-notes-btn");
  saveBtn.disabled = true;
  notesBtn.disabled = true;

  const taste = TASTE_QUICK_TAGS.find(t => t.id === selectedTasteId) || TASTE_QUICK_TAGS[1];
  const dose = document.getElementById("livepull-dose").value;
  const yieldWeight = document.getElementById("livepull-yield").value;
  const grind = document.getElementById("livepull-grind").value.trim();

  const brew = {
    beanId: selectedBean ? selectedBean.id : null,
    beanName: selectedBean ? selectedBean.name : "Unnamed bean",
    grindSize: grind && grind !== "—" ? grind : "",
    date: todayStr(),
    time: nowTimeStr(),
    doseWeight: dose !== "" ? dose : "",
    yieldWeight: yieldWeight !== "" ? yieldWeight : "",
    brewTime: Math.round(elapsedSeconds),
    rating: taste.rating,
    feedback: taste.label,
    issueTags: taste.issueTag ? [taste.issueTag] : []
  };

  try {
    const saved = await saveBrew(brew);
    window.location.href = goToNotes ? `brew-log.html?id=${encodeURIComponent(saved.id)}` : "index.html";
  } catch (err) {
    alert(err.message || "Couldn't save that shot. Please try again.");
    saveBtn.disabled = false;
    notesBtn.disabled = false;
  }
}
