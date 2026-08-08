/* ===========================================================
   Espresso Tracker — Shared App Shell (nav, helpers)
   =========================================================== */

const NAV_ITEMS = [
  { href: "index.html", label: "Home", icon: "☕" },
  { href: "brew-log.html", label: "Brew Log", icon: "📝" },
  { href: "beans.html", label: "Beans", icon: "🌱" },
  { href: "recipes.html", label: "Recipes", icon: "📖" },
  { href: "gear.html", label: "Gear", icon: "⚙️" },
  { href: "discover.html", label: "Discover", icon: "🗺️" },
  { href: "learn.html", label: "Learn", icon: "🎓" }
];

function renderShell(activePage, opts) {
  opts = opts || {};
  const topbar = document.getElementById("topbar");
  const bottomnav = document.getElementById("bottomnav");
  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="index.html">
          <span class="brand-mark">☕</span>
          <span>The JK Espresso Tracker</span>
        </a>
        <nav class="primary-nav">
          ${NAV_ITEMS.map(item => `<a href="${item.href}" class="${item.href === activePage ? "active" : ""}">${item.icon} ${item.label}</a>`).join("")}
        </nav>
        <div class="auth-slot" id="auth-slot">${opts.authSlotHtml || ""}</div>
      </div>`;
  }
  if (bottomnav) {
    bottomnav.className = "bottom-nav";
    bottomnav.innerHTML = NAV_ITEMS.map(item =>
      `<a href="${item.href}" class="${item.href === activePage ? "active" : ""}"><span class="icon">${item.icon}</span>${item.label}</a>`
    ).join("");
  }
}

// ---------- Small helpers shared across pages ----------

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function starString(rating) {
  const r = Math.round(rating || 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr() {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait || 200);
  };
}
