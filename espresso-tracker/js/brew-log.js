/* ===========================================================
   Espresso Tracker — Brew Log page
   =========================================================== */

let currentRating = 0;

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
  await renderHistory();
  setupPhotoInputs();
  PHOTO_SLOTS.forEach(slot => renderPhotoPreview(slot, null));

  document.getElementById("brew-form").addEventListener("submit", onSubmitBrew);
  document.getElementById("cancel-edit").addEventListener("click", resetForm);
  document.getElementById("delete-brew").addEventListener("click", onDeleteBrew);
  document.getElementById("search-brews").addEventListener("input", debounce(renderHistory, 150));
  document.getElementById("sort-brews").addEventListener("change", renderHistory);
  document.getElementById("bean-select").addEventListener("change", onBeanSelectChange);

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

async function populateBeanSelect() {
  const sel = document.getElementById("bean-select");
  const beans = await getBeans();
  sel.innerHTML = `<option value="">— none / use text field —</option>` +
    beans.map(b => `<option value="${b.id}">${escapeHtml(b.name)}${b.roaster ? " (" + escapeHtml(b.roaster) + ")" : ""}</option>`).join("");
}

function onBeanSelectChange() {
  const sel = document.getElementById("bean-select");
  if (!sel.value) return;
  getBean(sel.value).then(bean => {
    if (bean) document.getElementById("bean-name").value = bean.name;
  });
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
    <button type="button" class="remove-photo" title="Remove photo">✕</button>
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

// ---------- History list ----------

async function renderHistory() {
  const el = document.getElementById("brew-history");
  el.innerHTML = `<div class="muted">Loading your brews…</div>`;

  const query = document.getElementById("search-brews").value.toLowerCase().trim();
  const sortMode = document.getElementById("sort-brews").value;

  let brews = await getBrews();

  if (query) {
    brews = brews.filter(b => {
      const hay = [b.beanName, b.machineType, b.grinderType, b.grindSize, b.toolsUsed, b.feedback, b.recommendation]
        .join(" ").toLowerCase();
      return hay.includes(query);
    });
  }

  if (sortMode === "date-asc") brews = brews.slice().reverse();
  if (sortMode === "rating-desc") brews = brews.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));

  if (!brews.length) {
    el.innerHTML = `<div class="empty-state card"><div class="icon">🔍</div><p>No brews match yet.</p></div>`;
    return;
  }

  el.innerHTML = brews.map(b => {
    const hasPhotos = b.photoShotPath || b.photoPuckPath || b.photoPackagingPath;
    return `
    <div class="brew-item" data-id="${b.id}">
      <div>
        <strong>${escapeHtml(b.beanName || "Unnamed bean")}</strong>
        <div class="meta">${formatDate(b.date)}${b.time ? " · " + b.time : ""} · ${escapeHtml(b.machineType || "—")} · grind ${escapeHtml(b.grindSize || "—")}</div>
        ${b.feedback ? `<div class="meta">"${escapeHtml(truncate(b.feedback, 90))}"</div>` : ""}
        <div class="tags">
          ${b.doseWeight ? `<span class="chip">${escapeHtml(b.doseWeight)}g in</span>` : ""}
          ${b.yieldWeight ? `<span class="chip">${escapeHtml(b.yieldWeight)}g out</span>` : ""}
          ${b.brewTime ? `<span class="chip">${escapeHtml(b.brewTime)}s</span>` : ""}
          ${hasPhotos ? `<span class="chip">📷 photos</span>` : ""}
        </div>
      </div>
      <div style="text-align:right;">
        <div>${b.rating ? starString(b.rating) : ""}</div>
      </div>
    </div>
  `;
  }).join("");

  [...el.querySelectorAll(".brew-item")].forEach(node => {
    node.addEventListener("click", async () => {
      const brew = await getBrew(node.dataset.id);
      if (brew) loadBrewIntoForm(brew);
    });
  });
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}
