/* ===========================================================
   Espresso Tracker — Bean Library page
   =========================================================== */

// Packaging photo state for the bean currently in the form.
let beanPhotoFile = null;        // newly picked File, not yet uploaded
let beanPhotoExistingPath = "";  // storage path already saved on this bean
let beanPhotoRemoved = false;    // user tapped the remove button

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initAuthUI("beans.html", true);
  if (!session) return;

  setupBeanPhotoInput();
  renderBeanPhotoPreview(null);
  await renderBeans();

  document.getElementById("bean-form").addEventListener("submit", onSubmitBean);
  document.getElementById("cancel-bean-edit").addEventListener("click", resetBeanForm);
  document.getElementById("delete-bean").addEventListener("click", onDeleteBean);
  document.getElementById("search-beans").addEventListener("input", debounce(renderBeans, 150));
});

async function onSubmitBean(e) {
  e.preventDefault();
  const bean = {
    id: document.getElementById("bean-id").value || undefined,
    name: document.getElementById("bean-name-input").value.trim(),
    roaster: document.getElementById("bean-roaster").value.trim(),
    roastType: document.getElementById("bean-roast-type").value,
    source: document.getElementById("bean-source").value.trim(),
    process: document.getElementById("bean-process").value.trim(),
    price: document.getElementById("bean-price").value.trim(),
    history: document.getElementById("bean-history").value.trim(),
    notes: document.getElementById("bean-notes").value.trim()
  };
  if (!bean.name) return;

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  try {
    const saved = await saveBean(bean);
    try {
      await persistBeanPhoto(saved.id);
    } catch (photoErr) {
      alert("Your bean was saved, but the packaging photo couldn't upload: " + (photoErr.message || photoErr));
    }
    resetBeanForm();
    await renderBeans();
  } catch (err) {
    alert("Couldn't save that bean: " + (err.message || err));
  } finally {
    submitBtn.disabled = false;
  }
}

async function loadBeanIntoForm(bean) {
  document.getElementById("bean-form-title").textContent = "Edit bean";
  document.getElementById("bean-id").value = bean.id;
  document.getElementById("bean-name-input").value = bean.name || "";
  document.getElementById("bean-roaster").value = bean.roaster || "";
  document.getElementById("bean-roast-type").value = bean.roastType || "";
  document.getElementById("bean-source").value = bean.source || "";
  document.getElementById("bean-process").value = bean.process || "";
  document.getElementById("bean-price").value = bean.price || "";
  document.getElementById("bean-history").value = bean.history || "";
  document.getElementById("bean-notes").value = bean.notes || "";
  document.getElementById("cancel-bean-edit").style.display = "inline-flex";
  document.getElementById("delete-bean").style.display = "inline-flex";
  document.getElementById("bean-form").scrollIntoView({ behavior: "smooth" });

  resetBeanPhotoState();
  beanPhotoExistingPath = bean.photoPath || "";
  if (beanPhotoExistingPath) {
    const url = await getSignedPhotoUrl(beanPhotoExistingPath);
    renderBeanPhotoPreview(url);
  }
}

function resetBeanForm() {
  document.getElementById("bean-form-title").textContent = "Add a bean";
  document.getElementById("bean-form").reset();
  document.getElementById("bean-id").value = "";
  document.getElementById("cancel-bean-edit").style.display = "none";
  document.getElementById("delete-bean").style.display = "none";
  resetBeanPhotoState();
}

async function onDeleteBean() {
  const id = document.getElementById("bean-id").value;
  if (!id) return;
  if (!confirm("Delete this bean from your library? (Past brews that reference it will keep the bean name.)")) return;
  try {
    const oldPath = beanPhotoExistingPath;
    await deleteBean(id);
    if (oldPath) deleteBrewPhoto(oldPath); // best effort cleanup
    resetBeanForm();
    await renderBeans();
  } catch (err) {
    alert("Couldn't delete that bean: " + (err.message || err));
  }
}

/* ---------- Packaging photo ---------- */

function setupBeanPhotoInput() {
  document.getElementById("bean-photo").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    beanPhotoFile = file;
    beanPhotoRemoved = false;
    renderBeanPhotoPreview(URL.createObjectURL(file));
  });
}

function renderBeanPhotoPreview(imgUrl) {
  const el = document.getElementById("bean-photo-preview");
  if (!imgUrl) {
    el.innerHTML = `<span>No photo yet</span>`;
    return;
  }
  el.innerHTML = `
    <img src="${imgUrl}" alt="Bean packaging photo" />
    <button type="button" class="remove-photo" title="Remove photo" aria-label="Remove photo">✕</button>`;
  el.querySelector(".remove-photo").addEventListener("click", () => {
    beanPhotoFile = null;
    beanPhotoRemoved = true;
    document.getElementById("bean-photo").value = "";
    renderBeanPhotoPreview(null);
  });
}

function resetBeanPhotoState() {
  beanPhotoFile = null;
  beanPhotoExistingPath = "";
  beanPhotoRemoved = false;
  document.getElementById("bean-photo").value = "";
  renderBeanPhotoPreview(null);
}

// Upload a newly picked photo (or clear a removed one) after the bean row exists.
async function persistBeanPhoto(beanId) {
  const oldPath = beanPhotoExistingPath;
  if (beanPhotoFile) {
    const small = await shrinkImage(beanPhotoFile, 1200);
    const newPath = await uploadBeanPhoto(beanId, small);
    await updateBeanPhotoPath(beanId, newPath);
    if (oldPath) deleteBrewPhoto(oldPath);
  } else if (beanPhotoRemoved && oldPath) {
    await updateBeanPhotoPath(beanId, null);
    deleteBrewPhoto(oldPath);
  }
}

// Scale big phone photos down so the library loads quickly.
function shrinkImage(file, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 800000) { URL.revokeObjectURL(url); resolve(file); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ? new File([blob], "packaging.jpg", { type: "image/jpeg" }) : file);
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/* ---------- Library list ---------- */

async function renderBeans() {
  const el = document.getElementById("bean-grid");
  el.innerHTML = `<div class="muted" style="grid-column:1/-1;">Loading your beans…</div>`;

  const query = document.getElementById("search-beans").value.toLowerCase().trim();
  let beans = await getBeans();
  if (query) {
    beans = beans.filter(b => [b.name, b.roaster, b.source, b.notes, b.history].join(" ").toLowerCase().includes(query));
  }
  if (!beans.length) {
    el.innerHTML = `<div class="empty-state card" style="grid-column:1/-1;"><div class="icon">🌱</div><p>No beans yet — add your first one above.</p></div>`;
    return;
  }

  const photoUrls = await getSignedPhotoUrls(beans.map(b => b.photoPath).filter(Boolean));

  el.innerHTML = beans.map(b => {
    const photoUrl = b.photoPath ? photoUrls[b.photoPath] : null;
    const thumb = photoUrl
      ? `<img class="bean-thumb" src="${photoUrl}" alt="${escapeHtml(b.name)} packaging" loading="lazy" />`
      : `<div class="bean-thumb bean-thumb-empty" aria-hidden="true">☕</div>`;
    return `
    <div class="catalog-card" data-id="${b.id}" style="cursor:pointer;">
      <div class="bean-card-head">
        ${thumb}
        <div class="bean-card-title">
          <div class="flex-between">
            <h3>${escapeHtml(b.name)}</h3>
            ${b.roastType ? `<span class="badge badge-light">${escapeHtml(b.roastType)}</span>` : ""}
          </div>
          ${b.roaster ? `<div class="muted">${escapeHtml(b.roaster)}</div>` : ""}
        </div>
      </div>
      ${b.source ? `<div class="muted">${escapeHtml(b.source)}${b.process ? " · " + escapeHtml(b.process) : ""}</div>` : ""}
      ${b.notes ? `<p style="margin-top:6px;">${escapeHtml(truncate(b.notes, 120))}</p>` : ""}
      ${b.price ? `<div class="chip">${escapeHtml(b.price)}</div>` : ""}
      <a href="dial-in.html?beanId=${encodeURIComponent(b.id)}" class="btn btn-sm btn-outline dial-in-link" style="margin-top:8px;align-self:flex-start;">🎯 Dial in this bag</a>
    </div>`;
  }).join("");

  el.querySelectorAll(".dial-in-link").forEach(link => {
    link.addEventListener("click", (e) => e.stopPropagation());
  });

  [...el.querySelectorAll(".catalog-card")].forEach(node => {
    node.addEventListener("click", async () => {
      const bean = await getBean(node.dataset.id);
      if (bean) loadBeanIntoForm(bean);
    });
  });
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}
