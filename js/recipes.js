/* ===========================================================
   Espresso Tracker — Recipes page
   Starter recipes are always visible, no account needed. Saving
   your own recipe requires signing in (so it can sync).
   =========================================================== */

let currentSession = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentSession = await initAuthUI("recipes.html", false);

  await populateStyleFilter();
  await renderRecipes();

  document.getElementById("search-recipes").addEventListener("input", debounce(renderRecipes, 150));
  document.getElementById("filter-style").addEventListener("change", renderRecipes);

  document.getElementById("add-recipe-btn").addEventListener("click", onAddRecipeClick);
  document.getElementById("add-recipe-close").addEventListener("click", () => toggleModal("add-recipe-modal", false));
  document.getElementById("recipe-modal-close").addEventListener("click", () => toggleModal("recipe-modal", false));
  document.getElementById("add-recipe-form").addEventListener("submit", onAddRecipe);

  [...document.querySelectorAll(".modal-backdrop")].forEach(bd => {
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.classList.remove("open"); });
  });
});

function onAddRecipeClick() {
  if (!currentSession) {
    if (confirm("Sign in to save your own recipes (they'll sync across your devices). Go to the sign-in page now?")) {
      window.location.href = "login.html?redirect=recipes.html";
    }
    return;
  }
  toggleModal("add-recipe-modal", true);
}

async function populateStyleFilter() {
  const sel = document.getElementById("filter-style");
  const styles = [...new Set((await getRecipes()).map(r => r.style).filter(Boolean))];
  sel.innerHTML = `<option value="">All styles</option>` + styles.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
}

async function renderRecipes() {
  const el = document.getElementById("recipe-grid");
  el.innerHTML = `<div class="muted" style="grid-column:1/-1;">Loading recipes…</div>`;

  const query = document.getElementById("search-recipes").value.toLowerCase().trim();
  const styleFilter = document.getElementById("filter-style").value;

  let recipes = await getRecipes();
  if (styleFilter) recipes = recipes.filter(r => r.style === styleFilter);
  if (query) {
    recipes = recipes.filter(r => [r.name, r.style, r.instructions, (r.tags || []).join(" ")].join(" ").toLowerCase().includes(query));
  }

  if (!recipes.length) {
    el.innerHTML = `<div class="empty-state card" style="grid-column:1/-1;"><div class="icon">📖</div><p>No recipes match.</p></div>`;
    return;
  }

  el.innerHTML = recipes.map(r => `
    <div class="catalog-card" data-id="${r.id}" style="cursor:pointer;">
      <div class="flex-between">
        <h3>${escapeHtml(r.name)}</h3>
        ${r.custom ? `<span class="badge badge-light">Yours</span>` : ""}
      </div>
      <div class="muted">${escapeHtml(r.style || "")}</div>
      ${r.ratio ? `<div class="price">${escapeHtml(r.ratio)}</div>` : ""}
      <div class="tags">${(r.tags || []).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>
    </div>
  `).join("");

  [...el.querySelectorAll(".catalog-card")].forEach(node => {
    node.addEventListener("click", () => openRecipeModal(node.dataset.id));
  });
}

async function openRecipeModal(id) {
  const recipe = (await getRecipes()).find(r => r.id === id);
  if (!recipe) return;
  document.getElementById("recipe-modal-title").textContent = recipe.name;
  document.getElementById("recipe-modal-body").innerHTML = `
    <div class="mb-16">
      <span class="chip accent">${escapeHtml(recipe.style || "")}</span>
      ${recipe.ratio ? `<span class="chip">${escapeHtml(recipe.ratio)}</span>` : ""}
      ${recipe.dose ? `<span class="chip">${escapeHtml(recipe.dose)}</span>` : ""}
      ${recipe.time ? `<span class="chip">${escapeHtml(recipe.time)}</span>` : ""}
    </div>
    <p>${escapeHtml(recipe.instructions || "")}</p>
    ${recipe.custom ? `<button class="btn btn-danger btn-sm" id="delete-recipe-btn">Delete this recipe</button>` : ""}
  `;
  toggleModal("recipe-modal", true);

  const delBtn = document.getElementById("delete-recipe-btn");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      if (confirm("Delete this recipe?")) {
        await deleteRecipe(recipe.id);
        toggleModal("recipe-modal", false);
        await populateStyleFilter();
        await renderRecipes();
      }
    });
  }
}

async function onAddRecipe(e) {
  e.preventDefault();
  const recipe = {
    name: document.getElementById("r-name").value.trim(),
    style: document.getElementById("r-style").value.trim() || "Custom",
    ratio: document.getElementById("r-ratio").value.trim(),
    dose: document.getElementById("r-dose").value.trim(),
    time: document.getElementById("r-time").value.trim(),
    instructions: document.getElementById("r-instructions").value.trim(),
    tags: document.getElementById("r-tags").value.split(",").map(t => t.trim()).filter(Boolean)
  };
  if (!recipe.name) return;

  try {
    await saveRecipe(recipe);
    document.getElementById("add-recipe-form").reset();
    toggleModal("add-recipe-modal", false);
    await populateStyleFilter();
    await renderRecipes();
  } catch (err) {
    alert("Couldn't save that recipe: " + (err.message || err));
  }
}

function toggleModal(id, open) {
  document.getElementById(id).classList.toggle("open", open);
}
