/* ===========================================================
   Espresso Tracker — Home dashboard (index.html)
   Sidebar layout (desktop) / top bar + bottom nav (mobile),
   per the Organic design system "1a / 2a" mockups.

   This page renders its own shell (sidebar + mobile top bar +
   bottom nav) instead of using renderShell()/initAuthUI()'s
   account menu directly, because the account menu needs to
   exist twice at once (desktop sidebar + mobile avatar slot),
   and auth.js's setupAccountMenu() is wired to hardcoded ids
   that can only appear once in the DOM. renderAccountMenu()
   below is a class-scoped reimplementation of that same menu
   so it can be safely instantiated more than once.
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initHomeSession();
  if (!session) return; // redirect to setup/login already underway

  renderAccountMenu(document.getElementById("home-sidebar-account"), session);
  renderAccountMenu(document.getElementById("home-avatar-slot"), session);
  renderKickerAndGreeting(session);

  await Promise.all([
    renderShelf(),
    renderLastShot(),
    renderStatsNew(),
    renderRecentNew()
  ]);

  setupMoreSheet();
});

// ---------- Session (no shared shell — this page draws its own) ----------

async function initHomeSession() {
  if (!isSupabaseConfigured()) {
    window.location.href = "setup.html";
    return null;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html?redirect=index.html";
    return null;
  }
  return session;
}

// ---------- Account menu (desktop sidebar + mobile avatar slot) ----------

function renderAccountMenu(container, session) {
  if (!container) return;
  const firstName = (session.user.user_metadata && session.user.user_metadata.first_name) || "";
  const displayName = firstName || session.user.email.split("@")[0];

  container.innerHTML = `
    <div class="account-menu">
      <button type="button" class="account-toggle" aria-haspopup="true" aria-expanded="false">
        <span class="account-name">${escapeHtml(displayName)}</span>
        <span class="account-caret">▾</span>
      </button>
      <div class="account-dropdown">
        <div class="account-email">${escapeHtml(session.user.email)}</div>
        <div class="account-edit-name" style="display:none;">
          <input type="text" class="account-name-input" placeholder="First name" value="${escapeHtml(firstName)}" />
          <div class="account-edit-error" style="display:none;"></div>
          <div class="account-edit-actions">
            <button type="button" class="btn btn-sm btn-primary save-name-btn">Save</button>
            <button type="button" class="btn btn-sm btn-outline cancel-name-btn">Cancel</button>
          </div>
        </div>
        <button type="button" class="account-dropdown-item edit-name-btn">${firstName ? "Edit name" : "Add your name"}</button>
        <button type="button" class="account-dropdown-item sign-out-btn">Sign out</button>
      </div>
    </div>`;

  const menu = container.querySelector(".account-menu");
  const toggle = container.querySelector(".account-toggle");
  const dropdown = container.querySelector(".account-dropdown");
  const editNameBtn = container.querySelector(".edit-name-btn");
  const editNameBox = container.querySelector(".account-edit-name");
  const nameInput = container.querySelector(".account-name-input");
  const errorEl = container.querySelector(".account-edit-error");
  const saveNameBtn = container.querySelector(".save-name-btn");
  const cancelNameBtn = container.querySelector(".cancel-name-btn");
  const signOutBtn = container.querySelector(".sign-out-btn");

  const closeDropdown = () => {
    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    editNameBox.style.display = "none";
    errorEl.style.display = "none";
  };
  const openDropdown = () => {
    dropdown.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.contains("open") ? closeDropdown() : openDropdown();
  });
  document.addEventListener("click", (e) => {
    if (menu && !menu.contains(e.target)) closeDropdown();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  editNameBtn.addEventListener("click", () => {
    errorEl.style.display = "none";
    editNameBox.style.display = "block";
    nameInput.value = (session.user.user_metadata && session.user.user_metadata.first_name) || "";
    nameInput.focus();
  });

  cancelNameBtn.addEventListener("click", () => {
    editNameBox.style.display = "none";
    errorEl.style.display = "none";
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveNameBtn.click();
    }
  });

  saveNameBtn.addEventListener("click", async () => {
    const newName = nameInput.value.trim();
    errorEl.style.display = "none";
    if (!newName) {
      errorEl.textContent = "Please enter a name.";
      errorEl.style.display = "block";
      return;
    }
    saveNameBtn.disabled = true;
    try {
      const { data, error } = await supabaseClient.auth.updateUser({ data: { first_name: newName } });
      if (error) throw error;
      if (data && data.user) session.user = data.user;
      document.querySelectorAll(".account-name").forEach(el => { el.textContent = newName; });
      editNameBtn.textContent = "Edit name";
      editNameBox.style.display = "none";
      renderKickerAndGreeting(session);
    } catch (err) {
      errorEl.textContent = err.message || "Couldn't save your name. Please try again.";
      errorEl.style.display = "block";
    } finally {
      saveNameBtn.disabled = false;
    }
  });

  signOutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });
}

// ---------- Kicker / greeting ----------

function renderKickerAndGreeting(session) {
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const time = formatTimeOfDay(now.toTimeString().slice(0, 5));
  const kickerEl = document.getElementById("home-kicker");
  if (kickerEl) kickerEl.textContent = `${weekday}, ${time}`;

  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const firstName = (session.user.user_metadata && session.user.user_metadata.first_name) || "";
  const greetingEl = document.getElementById("home-greeting");
  if (greetingEl) greetingEl.textContent = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
}

// ---------- "On the shelf" (sidebar) ----------

async function renderShelf() {
  const el = document.getElementById("home-shelf-card");
  if (!el) return;
  const beans = await getBeans();
  if (!beans.length) {
    el.innerHTML = `
      <div class="home-shelf-kicker">On the shelf</div>
      <div class="home-shelf-name">No beans yet</div>
      <div class="home-shelf-meta"><a href="beans.html">Add a bean →</a></div>`;
    return;
  }
  const bean = beans[0];
  const days = daysSince(bean.dateAdded);
  const daysLabel = days === null ? "" : days === 0 ? "Added today" : `${days} day${days === 1 ? "" : "s"} off roast`;
  const metaParts = [bean.roaster, daysLabel].filter(Boolean);
  el.innerHTML = `
    <div class="home-shelf-kicker">On the shelf</div>
    <div class="home-shelf-name">${escapeHtml(bean.name)}</div>
    <div class="home-shelf-meta">${escapeHtml(metaParts.join(" · "))}</div>`;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

// ---------- Last shot card ----------

async function renderLastShot() {
  const el = document.getElementById("home-last-shot");
  if (!el) return;
  const brews = await getBrews();
  const last = brews[0];

  if (!last) {
    el.innerHTML = `
      <div class="home-last-shot-head">
        <img class="home-last-shot-avatar washed" src="images/backgrounds/home.jpg" alt="" />
        <div class="home-last-shot-kicker">Last shot</div>
      </div>
      <div class="home-last-shot-empty">No shots logged yet. Pull one to see it here.</div>`;
    return;
  }

  const seconds = last.brewTime !== "" && last.brewTime != null ? Math.round(last.brewTime) : null;
  const ratio = ratioLabel(last.doseWeight, last.yieldWeight);
  const stars = last.rating ? starString(last.rating) : "";
  const metaParts = [
    last.beanName || "Unnamed bean",
    last.grindSize ? `grind ${last.grindSize}` : "",
    stars
  ].filter(Boolean);

  const tags = (last.issueTags || [])
    .map(id => ISSUE_TAGS.find(t => t.id === id))
    .filter(Boolean)
    .map(tag => `<span class="home-tag negative">${escapeHtml(tag.label.toLowerCase())}</span>`)
    .join("");

  el.innerHTML = `
    <div class="home-last-shot-head">
      <img class="home-last-shot-avatar washed" src="images/backgrounds/home.jpg" alt="" />
      <div class="home-last-shot-kicker">Last shot${last.time ? " · " + formatTimeOfDay(last.time) : ""}</div>
    </div>
    <div>
      <div class="home-last-shot-number">
        <span class="big">${seconds !== null ? seconds : "—"}</span>
        <span class="sub">${[seconds !== null ? "s" : "", ratio].filter(Boolean).join(" · ")}</span>
      </div>
      <div class="home-last-shot-meta">${escapeHtml(metaParts.join(" · "))}</div>
    </div>
    ${tags ? `<div class="home-last-shot-tags">${tags}</div>` : ""}`;
}

function ratioLabel(dose, yieldWeight) {
  const d = Number(dose), y = Number(yieldWeight);
  if (!d || !y) return "";
  return `1:${(y / d).toFixed(1)}`;
}

function formatTimeOfDay(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase().replace(" ", "");
}

// ---------- Stat tiles ----------

async function renderStatsNew() {
  const el = document.getElementById("home-stats");
  if (!el) return;
  const [stats, brews] = await Promise.all([computeStats(), getBrews()]);
  const avgRatio = averageRatio(brews.filter(b => isWithinDays(b.date, 30)));
  const band = targetBandCount(brews);

  el.innerHTML = `
    <div class="home-stat-tile">
      <div class="value">${stats.brewsThisWeek}</div>
      <div class="label">shots this week</div>
    </div>
    <div class="home-stat-tile home-stat-ratio">
      <div class="value">${avgRatio || "—"}</div>
      <div class="label">average ratio</div>
    </div>
    <div class="home-stat-tile accent">
      <div class="value">${band.text}</div>
      <div class="label">in the target band</div>
    </div>`;
}

function averageRatio(brews) {
  const ratios = brews
    .map(b => {
      const d = Number(b.doseWeight), y = Number(b.yieldWeight);
      return d && y ? y / d : null;
    })
    .filter(r => r !== null);
  if (!ratios.length) return "";
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return `1:${avg.toFixed(1)}`;
}

// A shot is "in the target band" when its ratio falls within a
// typical 1:1.8–1:2.2 espresso range. Measured across the most
// recent 5 shots to mirror the mockup's "3 of 5" stat.
function targetBandCount(brews) {
  const recent = brews.slice(0, 5);
  const inBand = recent.filter(b => {
    const d = Number(b.doseWeight), y = Number(b.yieldWeight);
    if (!d || !y) return false;
    const ratio = y / d;
    return ratio >= 1.8 && ratio <= 2.2;
  });
  return { count: inBand.length, total: recent.length, text: `${inBand.length} of ${recent.length}` };
}

// ---------- Recent list ----------

async function renderRecentNew() {
  const listEl = document.getElementById("home-recent-list");
  const allLink = document.getElementById("home-recent-all");
  if (!listEl) return;

  const brews = await getBrews();
  if (allLink) allLink.textContent = `All ${brews.length} shot${brews.length === 1 ? "" : "s"}`;

  const recent = brews.slice(0, 8);
  if (!recent.length) {
    listEl.innerHTML = `
      <div class="empty-state card">
        <div class="icon">☕</div>
        <h3>No shots logged yet</h3>
        <p>Pull your first shot to start building your history.</p>
        <a href="brew-log.html" class="btn btn-primary">Log your first shot</a>
      </div>`;
    return;
  }

  listEl.innerHTML = recent.map(b => {
    const when = relativeWhen(b.date, b.time);
    const ratio = ratioLabel(b.doseWeight, b.yieldWeight) || "—";
    const stars = b.rating ? starString(b.rating) : "—";
    const grind = b.grindSize ? escapeHtml(b.grindSize) : "—";
    const bean = escapeHtml(b.beanName || "Unnamed bean");
    const href = `brew-log.html?id=${encodeURIComponent(b.id)}`;
    return `
      <a class="home-recent-row-desktop" href="${href}">
        <span class="home-recent-when">${escapeHtml(when)}</span>
        <span class="home-recent-bean">${bean}</span>
        <span class="home-recent-grind">grind ${grind}</span>
        <span class="home-recent-ratio">${ratio}</span>
        <span class="home-recent-stars">${stars}</span>
      </a>
      <a class="home-recent-row-mobile" href="${href}">
        <div>
          <div class="home-recent-bean">${bean}</div>
          <div class="home-recent-sub">${escapeHtml(when)} · grind ${grind}</div>
        </div>
        <div class="home-recent-right">
          <div class="home-recent-ratio">${ratio}</div>
          <div class="home-recent-stars">${stars}</div>
        </div>
      </a>`;
  }).join("");
}

function relativeWhen(dateStr, timeStr) {
  if (!dateStr) return "";
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

// ---------- Mobile "More" sheet ----------

function setupMoreSheet() {
  const modal = document.getElementById("home-more-modal");
  const openBtn = document.getElementById("home-more-btn");
  const closeBtn = document.getElementById("home-more-close");
  if (!modal || !openBtn) return;

  openBtn.addEventListener("click", () => modal.classList.add("open"));
  closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.classList.remove("open");
  });
}
