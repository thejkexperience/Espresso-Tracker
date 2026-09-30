/* =============================================================
   Recipe photos
   - Starter recipes and Learn drink styles get real photos
     (free licensed, credited).
   - Users can add their own photo to recipes they create, when
     adding the recipe or later from the recipe popup.
   Photos are stored privately in the brew-photos bucket under
   <user id>/recipes/ and shown with signed URLs.
   ============================================================= */
(function () {
  "use strict";

  /* ---------- starter photos (filled with vetted images) ---------- */
  const U = (id, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=75&auto=format&fit=crop`;
  const DRINK_PHOTOS = window.JK_DRINK_PHOTOS || {
    espresso: { src: U("photo-1705952285570-113e76f63fb0"), author: "Katt Galvan", license: "Unsplash", page: "https://unsplash.com/photos/a-cup-of-coffee-sitting-on-top-of-a-white-plate-3v0vppDjvMI" },
    ristretto: { src: U("photo-1572286258217-40142c1c6a70"), author: "Irene Kredenets", license: "Unsplash", page: "https://unsplash.com/photos/cup-of-coffee-on-top-of-saucer-maO-qIKLqi8" },
    lungo: { src: U("photo-1579992357154-faf4bde95b3d"), author: "Nathan Dumlao", license: "Unsplash", page: "https://unsplash.com/photos/white-ceramic-cup-with-brown-liquid-dAYJfrtVjh0" },
    americano: { src: U("photo-1580661869408-55ab23f2ca6e"), author: "Christina DiBernardo", license: "Unsplash", page: "https://unsplash.com/photos/clear-glass-mug-with-brown-liquid-on-brown-wooden-table-MXXTl3Cj2Og" },
    macchiato: { src: U("photo-1485808191679-5f86510681a2"), author: "Jeremy Yap", license: "Unsplash", page: "https://unsplash.com/photos/selective-focus-photography-of-latte-in-teacup-jn-HaGWe4yw" },
    cortado: { src: U("photo-1519532059956-a63a37af5deb"), author: "Ben Moreland", license: "Unsplash", page: "https://unsplash.com/photos/clear-drinking-glass-with-brown-liquid-on-brown-wooden-table-eSzClaMXNkk" },
    flatwhite: { src: U("photo-1611564494260-6f21b80af7ea"), author: "Robbie Down", license: "Unsplash", page: "https://unsplash.com/photos/white-ceramic-cup-with-saucer-on-brown-wooden-table-LI8inyHnm_A" },
    latte: { src: U("photo-1570968915860-54d5c301fa9f"), author: "Billy Kwok", license: "Unsplash", page: "https://unsplash.com/photos/clear-drinking-glass-with-espresso-vfiA7rRtjWo" },
    cappuccino: { src: U("photo-1517256064527-09c73fc73e38"), author: "allison griffith", license: "Unsplash", page: "https://unsplash.com/photos/white-ceramic-teacup-on-white-ceramic-saucer-filled-with-coffee-in-focus-photography-VCXk_bO97VQ" },
    v60: { src: U("photo-1545665613-29394cee622b"), author: "Julien Labelle", license: "Unsplash", page: "https://unsplash.com/photos/clear-glass-pitcher-G163WX71GFE" },
    extraction: { src: U("photo-1627902511858-6ad7e004fd35"), author: "Charles Sims", license: "Unsplash", page: "https://unsplash.com/photos/coffee-in-clear-glass-mug-k-w7laFKa0g" },
    steam: { src: U("photo-1651608046898-abcd96c0ec9e"), author: "Jack Hishmeh", license: "Unsplash", page: "https://unsplash.com/photos/hands-holding-a-metal-rod-FLRMmGOfhMI" },
    pour: { src: U("photo-1621865091587-42f462729948"), author: "Frank Leuderalbert", license: "Unsplash", page: "https://unsplash.com/photos/person-pouring-brown-liquid-on-clear-drinking-glass-EsKtT1wuvNg" },
    tamp: { src: U("photo-1788843304133-76989afd45dd"), author: "Ashwini Chaudhary (Monty)", license: "Unsplash", page: "https://unsplash.com/photos/coffee-tamping-in-metal-portafilter-e7oG2mFVACg" },
    dosed: { src: U("photo-1522659516672-189a712c29af"), author: "Hanny Naibaho", license: "Unsplash", page: "https://unsplash.com/photos/person-holding-the-espresso-portafilter-zvvgwYoThjs" },
  };
  const RECIPE_TO_DRINK = {
    recipe_classic_espresso: "espresso", recipe_ristretto: "ristretto", recipe_lungo: "lungo",
    recipe_americano: "americano", recipe_cappuccino: "cappuccino", recipe_latte: "latte",
    recipe_cortado: "cortado", recipe_macchiato: "macchiato", recipe_flatwhite: "flatwhite", recipe_v60: "v60",
  };
  const STYLE_TO_DRINK = {
    "espresso": "espresso", "ristretto": "ristretto", "lungo": "lungo", "americano": "americano",
    "macchiato": "macchiato", "cortado": "cortado", "flat white": "flatwhite", "latte": "latte",
    "cappuccino": "cappuccino", "v60 pour-over": "v60",
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- styles ---------- */
  function styles() {
    if ($("rp-style")) return;
    const st = document.createElement("style");
    st.id = "rp-style";
    st.textContent = `
      .rp-card-photo{margin:-16px -16px 12px;height:150px;overflow:hidden;border-bottom:1.5px solid var(--color-ink,#1b1a17);background:#e9dfcc;position:relative}
      .rp-card-photo img{width:100%;height:100%;object-fit:cover;display:block}
      .rp-card-photo.yours::after{content:"Your photo";position:absolute;left:8px;bottom:8px;background:rgba(27,26,23,.8);color:#f6efe1;font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:3px 6px;border-radius:2px}
      .rp-hero{margin:-4px 0 14px;border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;overflow:hidden;background:#e9dfcc}
      .rp-hero img{width:100%;max-height:320px;object-fit:cover;display:block}
      .rp-credit{font-family:var(--font-mono,monospace);font-size:10px;color:rgba(27,26,23,.6);padding:5px 8px;background:var(--color-surface,#fbf7ee);border-top:1px solid rgba(27,26,23,.15)}
      .rp-credit a{color:inherit}
      .rp-photo-field .rp-drop{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .rp-preview{width:96px;height:72px;border:1.5px dashed rgba(27,26,23,.5);border-radius:3px;background:#f1e7d4 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:22px;color:rgba(27,26,23,.4)}
      .rp-preview.has{border-style:solid;font-size:0}
      .rp-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
      .rp-status{font-family:var(--font-mono,monospace);font-size:12px;margin-top:6px}
      .rp-status.err{color:var(--color-danger,#a3241b)}
      .lg-style-photo{margin:-16px -16px 12px;height:140px;overflow:hidden;border-bottom:1.5px solid var(--color-ink,#1b1a17)}
      .lg-style-photo img{width:100%;height:100%;object-fit:cover;display:block}
      .catalog-card{overflow:hidden}
      .rp-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:14px 0 6px}
      .rp-fig{margin:0;background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;overflow:hidden}
      .rp-fig img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
      .rp-fig figcaption{padding:8px 10px 0;font-size:13px;line-height:1.35}
      .rp-fig .rp-credit{margin:6px -10px 0;border-top:1px solid rgba(27,26,23,.15)}
    `;
    document.head.appendChild(st);
  }

  /* ---------- helpers ---------- */
  async function shrink(file, maxSide = 1600, quality = 0.85) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const s = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((r) => c.toBlob(r, "image/jpeg", quality));
    } finally { URL.revokeObjectURL(url); }
  }

  async function uploadRecipePhoto(recipeId, blob) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Please sign in to add a photo.");
    const path = `${user.id}/recipes/${recipeId}-${Date.now()}.jpg`;
    const { error } = await supabaseClient.storage.from("brew-photos").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) throw error;
    const { error: e2 } = await supabaseClient.from("recipes").update({ photo_path: path }).eq("id", recipeId);
    if (e2) throw e2;
    return path;
  }

  async function removeStored(path) {
    if (!path) return;
    try { await supabaseClient.storage.from("brew-photos").remove([path]); } catch (_) {}
  }

  /* ---------- data hooks ---------- */
  let cache = [];        // last recipes list
  let urlMap = {};       // photo_path -> signed url
  let pendingFile = null; // photo chosen in the add form

  function hook() {
    try {
      if (typeof recipeFromRow === "function" && !recipeFromRow.__rp) {
        const orig = recipeFromRow;
        const w = function (row) { const r = orig(row); r.photoPath = row && row.photo_path ? row.photo_path : ""; return r; };
        w.__rp = true; window.recipeFromRow = w; try { recipeFromRow = w; } catch (_) {} // eslint-disable-line no-global-assign
      }
      if (typeof getRecipes === "function" && !getRecipes.__rp) {
        const orig = getRecipes;
        const w = async function (...a) {
          const list = await orig.apply(this, a);
          cache = list || [];
          const paths = cache.map((r) => r.photoPath).filter((p) => p && !urlMap[p]);
          if (paths.length && typeof getSignedPhotoUrls === "function") Object.assign(urlMap, await getSignedPhotoUrls(paths));
          return list;
        };
        w.__rp = true; window.getRecipes = w; try { getRecipes = w; } catch (_) {} // eslint-disable-line no-global-assign
      }
      if (typeof saveRecipe === "function" && !saveRecipe.__rp) {
        const orig = saveRecipe;
        const w = async function (recipe, ...a) {
          const saved = await orig.call(this, recipe, ...a);
          if (pendingFile && saved && saved.id) {
            try {
              const blob = await shrink(pendingFile);
              saved.photoPath = await uploadRecipePhoto(saved.id, blob);
            } catch (e) {
              alert("Your recipe was saved, but the photo didn't upload: " + (e.message || e));
            }
          }
          clearPending();
          return saved;
        };
        w.__rp = true; window.saveRecipe = w; try { saveRecipe = w; } catch (_) {} // eslint-disable-line no-global-assign
      }
      if (typeof deleteRecipe === "function" && !deleteRecipe.__rp) {
        const orig = deleteRecipe;
        const w = async function (id, ...a) {
          const r = cache.find((x) => x.id === id);
          await orig.call(this, id, ...a);
          if (r && r.photoPath) removeStored(r.photoPath);
        };
        w.__rp = true; window.deleteRecipe = w; try { deleteRecipe = w; } catch (_) {} // eslint-disable-line no-global-assign
      }
    } catch (e) { console.warn("recipe photos: hook failed", e); }
  }

  function photoFor(recipe) {
    if (!recipe) return null;
    if (recipe.photoPath && urlMap[recipe.photoPath]) return { src: urlMap[recipe.photoPath], yours: true };
    const key = RECIPE_TO_DRINK[recipe.id];
    const p = key && DRINK_PHOTOS[key];
    return p ? { src: p.src, credit: p, yours: false } : null;
  }

  function creditHtml(p) {
    if (!p) return "";
    return `<div class="rp-credit">Photo: ${p.page ? `<a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.author || "Unknown")}</a>` : esc(p.author || "Unknown")}${p.license ? ` on ${esc(p.license)}` : ""}</div>`;
  }

  /* ---------- recipe grid ---------- */
  function decorateGrid() {
    const grid = $("recipe-grid");
    if (!grid) return;
    grid.querySelectorAll(".catalog-card[data-id]").forEach((card) => {
      if (card.querySelector(".rp-card-photo")) return;
      const r = cache.find((x) => String(x.id) === card.dataset.id);
      const p = photoFor(r);
      if (!p) return;
      const div = document.createElement("div");
      div.className = "rp-card-photo" + (p.yours ? " yours" : "");
      div.innerHTML = `<img src="${esc(p.src)}" alt="${esc(r.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()">`;
      card.prepend(div);
    });
  }

  /* ---------- recipe modal ---------- */
  let modalRecipeId = null;
  function decorateModal() {
    const body = $("recipe-modal-body");
    if (!body || body.querySelector(".rp-hero, .rp-actions")) return;
    const title = ($("recipe-modal-title") || {}).textContent || "";
    const r = cache.find((x) => x.name === title && (modalRecipeId == null || String(x.id) === String(modalRecipeId))) || cache.find((x) => x.name === title);
    if (!r) return;
    modalRecipeId = r.id;
    const p = photoFor(r);
    if (p) {
      const hero = document.createElement("div");
      hero.className = "rp-hero";
      hero.innerHTML = `<img src="${esc(p.src)}" alt="${esc(r.name)}" referrerpolicy="no-referrer">${p.yours ? "" : creditHtml(p.credit)}`;
      body.prepend(hero);
    }
    if (r.custom) {
      const act = document.createElement("div");
      act.className = "rp-actions";
      act.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" id="rp-change">📷 ${r.photoPath ? "Change photo" : "Add a photo"}</button>
        ${r.photoPath ? `<button type="button" class="btn btn-outline btn-sm" id="rp-remove">Remove photo</button>` : ""}
        <input type="file" accept="image/*" id="rp-file" hidden>
        <div class="rp-status" id="rp-status" hidden></div>`;
      const del = body.querySelector("#delete-recipe-btn");
      if (del) del.insertAdjacentElement("beforebegin", act); else body.appendChild(act);
      const status = act.querySelector("#rp-status");
      act.querySelector("#rp-change").addEventListener("click", () => act.querySelector("#rp-file").click());
      act.querySelector("#rp-file").addEventListener("change", async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        status.hidden = false; status.className = "rp-status"; status.textContent = "Uploading photo…";
        try {
          const old = r.photoPath;
          const path = await uploadRecipePhoto(r.id, await shrink(f));
          if (old) removeStored(old);
          r.photoPath = path;
          await refreshAll(r.id);
        } catch (err) {
          status.className = "rp-status err"; status.textContent = err.message || "Upload failed.";
        }
      });
      const rm = act.querySelector("#rp-remove");
      if (rm) rm.addEventListener("click", async () => {
        if (!confirm("Remove the photo from this recipe?")) return;
        try {
          await supabaseClient.from("recipes").update({ photo_path: null }).eq("id", r.id);
          removeStored(r.photoPath);
          r.photoPath = "";
          await refreshAll(r.id);
        } catch (err) { status.hidden = false; status.className = "rp-status err"; status.textContent = err.message || "Couldn't remove it."; }
      });
    }
  }

  async function refreshAll(reopenId) {
    if (typeof renderRecipes === "function") await renderRecipes();
    if (reopenId != null && typeof openRecipeModal === "function") await openRecipeModal(reopenId);
  }

  /* ---------- add form photo field ---------- */
  function clearPending() {
    pendingFile = null;
    const pv = $("rp-preview");
    if (pv) { pv.style.backgroundImage = ""; pv.classList.remove("has"); }
    const rm = $("rp-clear"); if (rm) rm.hidden = true;
  }

  function setupForm() {
    const form = $("add-recipe-form");
    if (!form || $("rp-photo-field")) return;
    const field = document.createElement("div");
    field.className = "field rp-photo-field";
    field.id = "rp-photo-field";
    field.innerHTML = `
      <label>Photo (optional)</label>
      <div class="rp-drop">
        <div class="rp-preview" id="rp-preview">☕</div>
        <button type="button" class="btn btn-outline btn-sm" id="rp-pick">📷 Add a photo</button>
        <button type="button" class="btn btn-outline btn-sm" id="rp-clear" hidden>Remove</button>
        <input type="file" accept="image/*" id="rp-input" hidden>
      </div>`;
    const submit = form.querySelector('button[type="submit"]');
    form.insertBefore(field, submit);
    $("rp-pick").addEventListener("click", () => $("rp-input").click());
    $("rp-clear").addEventListener("click", clearPending);
    $("rp-input").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      pendingFile = f;
      const pv = $("rp-preview");
      pv.style.backgroundImage = `url("${URL.createObjectURL(f)}")`;
      pv.classList.add("has");
      $("rp-clear").hidden = false;
    });
    const close = $("add-recipe-close");
    if (close) close.addEventListener("click", clearPending);
  }

  /* ---------- Learn page: drink style photos ---------- */
  function decorateStyles() {
    const grid = $("styles-grid");
    if (!grid) return;
    grid.querySelectorAll(".catalog-card").forEach((card) => {
      if (card.querySelector(".lg-style-photo")) return;
      const h = card.querySelector("h3, h2, strong");
      const key = h && STYLE_TO_DRINK[h.textContent.trim().toLowerCase()];
      const p = key && DRINK_PHOTOS[key];
      if (!p) return;
      const div = document.createElement("div");
      div.className = "lg-style-photo";
      div.innerHTML = `<img src="${esc(p.src)}" alt="${esc(h.textContent)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()">`;
      card.prepend(div);
      const cr = document.createElement("div");
      cr.innerHTML = creditHtml(p);
      const c = cr.firstElementChild; c.style.margin = "10px -16px -16px"; card.appendChild(c);
    });
  }

  /* ---------- Learn page: real photos in the guides ---------- */
  function photoFig(key, caption) {
    const p = DRINK_PHOTOS[key];
    if (!p) return "";
    return `<figure class="rp-fig"><img src="${esc(p.src)}" alt="${esc(caption)}" loading="lazy" referrerpolicy="no-referrer"><figcaption><b>${esc(caption)}</b>${creditHtml(p)}</figcaption></figure>`;
  }
  function decorateLearn() {
    const tools = $("lg-tools"), milk = $("lg-milk");
    if (tools && !tools.querySelector(".rp-strip")) {
      const strip = document.createElement("div");
      strip.className = "rp-strip";
      strip.innerHTML = photoFig("dosed", "A dosed portafilter, ready for WDT") + photoFig("tamp", "Tamping level and firm") + photoFig("extraction", "A healthy extraction from a bottomless portafilter");
      const anchor = tools.querySelector(".muted");
      (anchor || tools.querySelector("h2")).insertAdjacentElement("afterend", strip);
    }
    if (milk && !milk.querySelector(".rp-strip")) {
      const strip = document.createElement("div");
      strip.className = "rp-strip";
      strip.innerHTML = photoFig("steam", "Steaming: pitcher tilted, tip just under the surface") + photoFig("pour", "Pouring latte art once the milk is glossy");
      const why = milk.querySelector(".lg-why");
      (why || milk.querySelector("h2")).insertAdjacentElement("afterend", strip);
    }
  }

  /* ---------- boot ---------- */
  function observe(id, fn) {
    const el = $(id);
    if (!el) return;
    new MutationObserver(() => fn()).observe(el, { childList: true });
    fn();
  }

  function boot() {
    styles();
    hook();
    setupForm();
    observe("recipe-grid", decorateGrid);
    observe("recipe-modal-body", decorateModal);
    observe("styles-grid", decorateStyles);
    decorateLearn(); setTimeout(decorateLearn, 800); setTimeout(decorateLearn, 2500);
    const grid = $("recipe-grid");
    if (grid) grid.addEventListener("click", (e) => { const c = e.target.closest(".catalog-card[data-id]"); if (c) modalRecipeId = c.dataset.id; }, true);
  }
  // Hook the data functions right away (before recipes.js runs its first load).
  hook();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
