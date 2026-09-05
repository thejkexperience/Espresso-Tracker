/* ===========================================================
   Espresso Tracker — Bean Library page
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initAuthUI("beans.html", true);
  if (!session) return;

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
    await saveBean(bean);
    resetBeanForm();
    await renderBeans();
  } catch (err) {
    alert("Couldn't save that bean: " + (err.message || err));
  } finally {
    submitBtn.disabled = false;
  }
}

function loadBeanIntoForm(bean) {
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
}

function resetBeanForm() {
  document.getElementById("bean-form-title").textContent = "Add a bean";
  document.getElementById("bean-form").reset();
  document.getElementById("bean-id").value = "";
  document.getElementById("cancel-bean-edit").style.display = "none";
  document.getElementById("delete-bean").style.display = "none";
}

async function onDeleteBean() {
  const id = document.getElementById("bean-id").value;
  if (!id) return;
  if (!confirm("Delete this bean from your library? (Past brews that reference it will keep the bean name.)")) return;
  try {
    await deleteBean(id);
    resetBeanForm();
    await renderBeans();
  } catch (err) {
    alert("Couldn't delete that bean: " + (err.message || err));
  }
}

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
  el.innerHTML = beans.map(b => `
    <div class="catalog-card" data-id="${b.id}" style="cursor:pointer;">
      <div class="flex-between">
        <h3>${escapeHtml(b.name)}</h3>
        ${b.roastType ? `<span class="badge badge-light">${escapeHtml(b.roastType)}</span>` : ""}
      </div>
      ${b.roaster ? `<div class="muted">${escapeHtml(b.roaster)}</div>` : ""}
      ${b.source ? `<div class="muted">${escapeHtml(b.source)}${b.process ? " · " + escapeHtml(b.process) : ""}</div>` : ""}
      ${b.notes ? `<p style="margin-top:6px;">${escapeHtml(truncate(b.notes, 120))}</p>` : ""}
      ${b.price ? `<div class="chip">${escapeHtml(b.price)}</div>` : ""}
      <a href="dial-in.html?beanId=${encodeURIComponent(b.id)}" class="btn btn-sm btn-outline dial-in-link" style="margin-top:8px;align-self:flex-start;">🎯 Dial in this bag</a>
    </div>
  `).join("");

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
