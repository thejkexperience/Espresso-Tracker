/* ===========================================================
   Espresso Tracker — Brew Log page
   =========================================================== */

let currentRating = 0;
let selectedIssues = new Set();
let historyFilter = "all"; // all | band | top — shot log filter chips

// Photo state for the form currently being edited.
// pendingFiles: newly-picked File objects, keyed by slot, not yet uploaded.
// existingPaths: storage paths already saved on this brew (from the DB).
// removedSlots: slots the user explicitly cleared.
let pendingFiles = { shot: null, puck: null, packaging: null };
let existingPaths = { shot: "", puck: "", packaging: "" };
let removedSlots = new Set();

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initAuthUI("brew-log.html", true);
  if (!session) return;

  await populateBeanSelect();
  renderRatingInput();
  renderIssueTags();
  await renderHistory();
  setupPhotoInputs();
  PHOTO_SLOTS.forEach(slot => renderPhotoPreview(slot, null));

  document.getElementById("brew-form").addEventListener("submit", onSubmitBrew);
  document.getElementById("cancel-edit").addEventListener("click", resetForm);
  document.getElementById("delete-brew").addEventListener("click", onDeleteBrew);
  document.getElementById("search-brews").addEventListener("input", debounce(renderHistory, 150));
  document.getElementById("sort-brews").addEventListener("change", renderHistory);
  document.querySelectorAll(".shotlog-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      historyFilter = btn.dataset.filter;
      document.querySelectorAll(".shotlog-filter-btn").forEach(b => b.classList.toggle("active", b === btn));
      renderHistory();
    });
  });
  document.getElementById("bean-select").addEventListener("change", onBeanSelectChange);
  document.getElementById("use-suggestion-btn").addEventListener("click", applyIssueSuggestion);
  document.getElementById("add-bean-close").addEventListener("click", () => toggleModal("add-bean-modal", false));
  document.getElementById("add-bean-form").addEventListener("submit", onAddBeanFromBrewLog);
  [...document.querySelectorAll(".modal-backdrop")].forEach(bd => {
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.classList.remove("open"); });
  });

  // deep-link to a specific brew (from dashboard) for quick editing
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    const brew = await getBrew(id);
    if (brew) loadBrewIntoForm(brew);
  } else {
    document.getElementById("brew-date").value = todayStr();
    document.getElementById("brew-time-of-day").value = nowTimeStr();
  }
});

async function populateBeanSelect(selectedId) {
  const sel = document.getElementById("bean-select");
  const beans = await getBeans();
  sel.innerHTML = `<option value="">— none / use text field —</option>` +
    `<option value="__new__">+ Add a new bean…</option>` +
    beans.map(b => `<option value="${b.id}">${escapeHtml(b.name)}${b.roaster ? " (" + escapeHtml(b.roaster) + ")" : ""}</option>`).join("");
  if (selectedId) sel.value = selectedId;
}

function onBeanSelectChange() {
  const sel = document.getElementById("bean-select");
  if (sel.value === "__new__") {
    sel.value = "";
    toggleModal("add-bean-modal", true);
    return;
  }
  if (!sel.value) return;
  getBean(sel.value).then(bean => {
    if (bean) document.getElementById("bean-name").value = bean.name;
  });
}

// Adding a bean from the brew log opens a modal on top of the in-progress
// brew form. Only the bean-select and bean-name fields get touched on save —
// everything else the user has already filled in stays exactly as it was.
async function onAddBeanFromBrewLog(e) {
  e.preventDefault();
  const bean = {
    name: document.getElementById("nb-name").value.trim(),
    roaster: document.getElementById("nb-roaster").value.trim(),
    roastType: document.getElementById("nb-roast-type").value,
    source: document.getElementById("nb-source").value.trim(),
    process: document.getElementById("nb-process").value.trim(),
    price: document.getElementById("nb-price").value.trim(),
    history: document.getElementById("nb-history").value.trim(),
    notes: document.getElementById("nb-notes").value.trim()
  };
  if (!bean.name) return;

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  try {
    const saved = await saveBean(bean);
    await populateBeanSelect(saved.id);
    document.getElementById("bean-name").value = saved.name;
    document.getElementById("add-bean-form").reset();
    toggleModal("add-bean-modal", false);
  } catch (err) {
    alert("Couldn't save that bean: " + (err.message || err));
  } finally {
    submitBtn.disabled = false;
  }
}

function toggleModal(id, open) {
  document.getElementById(id).classList.toggle("open", open);
}

function renderRatingInput() {
  const el = document.getElementById("rating-input");
  el.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "★";
    btn.dataset.value = i;
    btn.addEventListener("click", () => {
      currentRating = i;
      updateRatingDisplay();
    });
    el.appendChild(btn);
  }
  updateRatingDisplay();
}

function updateRatingDisplay() {
  const el = document.getElementById("rating-input");
  [...el.children].forEach((btn, idx) => {
    btn.classList.toggle("filled", idx < currentRating);
  });
}

// ---------- Issue tags & suggested fixes ----------

function renderIssueTags() {
  const el = document.getElementById("issue-tags");
  el.innerHTML = "";
  ISSUE_TAGS.forEach(tag => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = tag.label;
    btn.dataset.id = tag.id;
    btn.classList.toggle("selected", selectedIssues.has(tag.id));
    btn.addEventListener("click", () => {
      if (selectedIssues.has(tag.id)) selectedIssues.delete(tag.id);
      else selectedIssues.add(tag.id);
      btn.classList.toggle("selected");
      updateIssueSuggestion();
    });
    el.appendChild(btn);
  });
  updateIssueSuggestion();
}

function updateIssueSuggestion() {
  const box = document.getElementById("issue-suggestion");
  const list = document.getElementById("issue-suggestion-list");
  if (!selectedIssues.size) {
    box.style.display = "none";
    list.innerHTML = "";
    return;
  }
  const tips = ISSUE_TAGS.filter(t => selectedIssues.has(t.id));
  list.innerHTML = tips.map(t => `<li><strong>${escapeHtml(t.label)}:</strong> ${escapeHtml(t.tip)}</li>`).join("");
  box.style.display = "block";
}

function applyIssueSuggestion() {
  const tips = ISSUE_TAGS.filter(t => selectedIssues.has(t.id)).map(t => t.tip);
  if (!tips.length) return;
  const field = document.getElementById("recommendation");
  const existing = field.value.trim();
  const addition = tips.join(" ");
  field.value = existing ? `${existing}\n\n${addition}` : addition;
}

// ---------- Photos ----------

function setupPhotoInputs() {
  PHOTO_SLOTS.forEach(slot => {
    document.getElementById(`photo-${slot}`).addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pendingFiles[slot] = file;
      removedSlots.delete(slot);
      renderPhotoPreview(slot, URL.createObjectURL(file), true);
    });
  });
}

function renderPhotoPreview(slot, imgUrl, isLocalPreview) {
  const el = document.getElementById(`photo-${slot}-preview`);
  if (!imgUrl) {
    el.innerHTML = `<span>No photo</span>`;
    return;
  }
  el.innerHTML = `
    <img src="${imgUrl}" alt="${slot} photo" />
    <button type="button" class="remove-photo" title="Remove photo" aria-label="Remove photo">✕</button>
  `;
  el.querySelector(".remove-photo").addEventListener("click", () => {
    pendingFiles[slot] = null;
    if (existingPaths[slot]) removedSlots.add(slot);
    document.getElementById(`photo-${slot}`).value = "";
    renderPhotoPreview(slot, null);
  });
}

async function loadExistingPhotoPreviews(brew) {
  for (const slot of PHOTO_SLOTS) {
    const path = brew[`photo${capitalize(slot)}Path`];
    existingPaths[slot] = path || "";
    if (path) {
      const url = await getSignedPhotoUrl(path);
      renderPhotoPreview(slot, url, false);
    } else {
      renderPhotoPreview(slot, null);
    }
  }
}

function resetPhotoState() {
  pendingFiles = { shot: null, puck: null, packaging: null };
  existingPaths = { shot: "", puck: "", packaging: "" };
  removedSlots = new Set();
  PHOTO_SLOTS.forEach(slot => {
    document.getElementById(`photo-${slot}`).value = "";
    renderPhotoPreview(slot, null);
  });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

async function persistPhotos(brewId) {
  const updates = {};
  let changed = false;

  for (const slot of PHOTO_SLOTS) {
    const field = `photo${capitalize(slot)}Path`;
    if (pendingFiles[slot]) {
      const oldPath = existingPaths[slot];
      const newPath = await uploadBrewPhoto(brewId, slot, pendingFiles[slot]);
      updates[field] = newPath;
      changed = true;
      if (oldPath) deleteBrewPhoto(oldPath); // best-effort cleanup, don't block on it
    } else if (removedSlots.has(slot)) {
      if (existingPaths[slot]) deleteBrewPhoto(existingPaths[slot]);
      updates[field] = "";
      changed = true;
    }
  }

  if (changed) {
    await updateBrewPhotoPaths(brewId, updates);
  }
}

// ---------- Form submit / load / reset ----------

async function onSubmitBrew(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    const beanSelect = document.getElementById("bean-select");
    const beanId = beanSelect.value || null;
    const selectedBean = beanId ? await getBean(beanId) : null;
    const beanName = document.getElementById("bean-name").value.trim() ||
      (selectedBean ? selectedBean.name : "") || "Unnamed bean";

    const brew = {
      id: document.getElementById("brew-id").value || undefined,
      beanId,
      beanName,
      machineType: document.getElementById("machine-type").value.trim(),
      grinderType: document.getElementById("grinder-type").value.trim(),
      grindSize: document.getElementById("grind-size").value.trim(),
      toolsUsed: document.getElementById("tools-used").value.trim(),
      date: document.getElementById("brew-date").value || todayStr(),
      time: document.getElementById("brew-time-of-day").value,
      doseWeight: document.getElementById("dose-weight").value,
      yieldWeight: document.getElementById("yield-weight").value,
      brewTime: document.getElementById("brew-time").value,
      waterTemp: document.getElementById("water-temp").value,
      rating: currentRating,
      feedback: document.getElementById("feedback").value.trim(),
      issueTags: Array.from(selectedIssues),
      recommendation: document.getElementById("recommendation").value.trim(),
      photoShotPath: existingPaths.shot,
      photoPuckPath: existingPaths.puck,
      photoPackagingPath: existingPaths.packaging
    };

    const saved = await saveBrew(brew);
    await persistPhotos(saved.id);

    resetForm();
    await renderHistory();
  } catch (err) {
    alert("Couldn't save that brew: " + (err.message || err));
  } finally {
    submitBtn.disabled = false;
  }
}

async function loadBrewIntoForm(brew) {
  document.getElementById("form-title").textContent = "Edit brew";
  document.getElementById("brew-id").value = brew.id;
  document.getElementById("bean-select").value = brew.beanId || "";
  document.getElementById("bean-name").value = brew.beanName || "";
  document.getElementById("machine-type").value = brew.machineType || "";
  document.getElementById("grinder-type").value = brew.grinderType || "";
  document.getElementById("grind-size").value = brew.grindSize || "";
  document.getElementById("tools-used").value = brew.toolsUsed || "";
  document.getElementById("brew-date").value = brew.date || todayStr();
  document.getElementById("brew-time-of-day").value = brew.time || "";
  document.getElementById("dose-weight").value = brew.doseWeight || "";
  document.getElementById("yield-weight").value = brew.yieldWeight || "";
  document.getElementById("brew-time").value = brew.brewTime || "";
  document.getElementById("water-temp").value = brew.waterTemp || "";
  document.getElementById("feedback").value = brew.feedback || "";
  document.getElementById("recommendation").value = brew.recommendation || "";
  currentRating = brew.rating || 0;
  updateRatingDisplay();
  selectedIssues = new Set(brew.issueTags || []);
  renderIssueTags();

  pendingFiles = { shot: null, puck: null, packaging: null };
  removedSlots = new Set();
  await loadExistingPhotoPreviews(brew);

  document.getElementById("cancel-edit").style.display = "inline-flex";
  document.getElementById("delete-brew").style.display = "inline-flex";
  document.getElementById("brew-form").scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  document.getElementById("form-title").textContent = "Log a new brew";
  document.getElementById("brew-form").reset();
  document.getElementById("brew-id").value = "";
  document.getElementById("brew-date").value = todayStr();
  document.getElementById("brew-time-of-day").value = nowTimeStr();
  currentRating = 0;
  updateRatingDisplay();
  selectedIssues = new Set();
  renderIssueTags();
  resetPhotoState();
  document.getElementById("cancel-edit").style.display = "none";
  document.getElementById("delete-brew").style.display = "none";
  history.replaceState(null, "", "brew-log.html");
}

async function onDeleteBrew() {
  const id = document.getElementById("brew-id").value;
  if (!id) return;
  if (!confirm("Delete this brew from your history? Any attached photos will be removed too.")) return;
  try {
    for (const slot of PHOTO_SLOTS) {
      if (existingPaths[slot]) deleteBrewPhoto(existingPaths[slot]);
    }
    await deleteBrew(id);
    resetForm();
    await renderHistory();
  } catch (err) {
    alert("Couldn't delete that brew: " + (err.message || err));
  }
}

// ---------- History list (shot log) ----------
// Per the Organic "1d / 2c" mockups: a scannable, filterable list —
// desktop grid rows (When / Bean / Grind / Ratio / Time / Taste)
// collapse to two-line mobile rows via CSS (.shotlog-row vs.
// .shotlog-row-mobile), same dual-render pattern used on Home.

async function renderHistory() {
  const el = document.getElementById("brew-history");
  el.innerHTML = `<div class="muted">Loading your shots…</div>`;

  const query = document.getElementById("search-brews").value.toLowerCase().trim();
  const sortMode = document.getElementById("sort-brews").value;

  let brews = await getBrews();
  const totalCount = brews.length;

  if (query) {
    brews = brews.filter(b => {
      const issueLabels = (b.issueTags || []).map(id => (ISSUE_TAGS.find(t => t.id === id) || {}).label || "").join(" ");
      const hay = [b.beanName, b.machineType, b.grinderType, b.grindSize, b.toolsUsed, b.feedback, b.recommendation, issueLabels]
        .join(" ").toLowerCase();
      return hay.includes(query);
    });
  }

  if (historyFilter === "band") {
    brews = brews.filter(inTargetBand);
  } else if (historyFilter === "top") {
    brews = brews.filter(b => Number(b.rating) >= 4);
  }

  if (sortMode === "date-asc") brews = brews.slice().reverse();
  if (sortMode === "rating-desc") brews = brews.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const countEl = document.getElementById("shotlog-count");
  if (countEl) countEl.textContent = `${totalCount} shot${totalCount === 1 ? "" : "s"}`;

  if (!brews.length) {
    el.innerHTML = `<div class="empty-state card"><div class="icon">🔍</div><p>No shots match yet.</p></div>`;
    return;
  }

  el.innerHTML = brews.map(b => {
    const when = escapeHtml(relativeWhen(b.date, b.time));
    const grind = b.grindSize ? escapeHtml(b.grindSize) : "—";
    const ratio = ratioLabel(b.doseWeight, b.yieldWeight) || "—";
    const time = b.brewTime !== "" && b.brewTime != null ? `${Math.round(b.brewTime)}s` : "—";
    const bean = escapeHtml(b.beanName || "Unnamed bean");
    const taste = tasteLabel(b);
    return `
    <div class="shotlog-row" data-id="${b.id}">
      <span class="shotlog-row-when">${when}</span>
      <span class="shotlog-row-bean">${bean}</span>
      <span class="shotlog-row-grind">${grind}</span>
      <span class="shotlog-row-ratio">${ratio}</span>
      <span class="shotlog-row-time">${time}</span>
      <span class="shotlog-row-taste" style="color:${taste.color};">${escapeHtml(taste.label)}</span>
    </div>
    <div class="shotlog-row-mobile" data-id="${b.id}">
      <div class="shotlog-row-mobile-left">
        <div class="shotlog-row-mobile-bean">${bean}</div>
        <div class="shotlog-row-mobile-meta">${when} · grind ${grind} · ${time}</div>
      </div>
      <div class="shotlog-row-mobile-right">
        <div class="shotlog-row-mobile-ratio">${ratio}</div>
        <div class="shotlog-row-mobile-taste" style="color:${taste.color};">${escapeHtml(taste.label)}</div>
      </div>
    </div>
  `;
  }).join("");

  [...el.querySelectorAll("[data-id]")].forEach(node => {
    node.addEventListener("click", async () => {
      const brew = await getBrew(node.dataset.id);
      if (brew) loadBrewIntoForm(brew);
    });
  });
}

// A shot is "in the target band" at a typical 1:1.8–1:2.2 espresso ratio —
// mirrors the same definition used for Home's "in the target band" stat.
function inTargetBand(b) {
  const d = Number(b.doseWeight), y = Number(b.yieldWeight);
  if (!d || !y) return false;
  const ratio = y / d;
  return ratio >= 1.8 && ratio <= 2.2;
}

function ratioLabel(dose, yieldWeight) {
  const d = Number(dose), y = Number(yieldWeight);
  if (!d || !y) return "";
  return `1:${(y / d).toFixed(1)}`;
}

function relativeWhen(dateStr, timeStr) {
  if (!dateStr) return "—";
  if (dateStr === todayStr()) return timeStr ? formatTimeOfDay(timeStr) : "Today";

  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";

  const diffDays = Math.round((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return formatDate(dateStr);
}

function formatTimeOfDay(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase().replace(" ", "");
}

// A short, honest taste read for the row: the first logged issue tag
// if the shot had one, otherwise a plain-language bucket from the
// star rating. Keeps the log scannable without inventing tasting notes.
function tasteLabel(b) {
  if (b.issueTags && b.issueTags.length) {
    const tag = ISSUE_TAGS.find(t => t.id === b.issueTags[0]);
    return { label: tag ? tag.label : "Off", color: "var(--color-danger)" };
  }
  const rating = Number(b.rating) || 0;
  if (rating >= 5) return { label: "Great", color: "var(--color-accent-2-text)" };
  if (rating >= 4) return { label: "Good", color: "var(--color-accent-2-text)" };
  if (rating >= 1) return { label: "OK", color: "var(--color-muted)" };
  return { label: "—", color: "var(--color-muted)" };
}
