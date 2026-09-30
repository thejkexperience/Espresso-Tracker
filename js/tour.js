/* =============================================================
   First run tour. Shows once after a user's first sign in, can be
   skipped, and can be replayed any time with:
     - index.html?tour=1  (used by the menu link)
     - any element with [data-tour-start]
     - window.JKTour.start()
   "Seen" is saved to the user's account (user_metadata.tour_done)
   and to this device, so it does not reappear on other devices.
   ============================================================= */
(function () {
  "use strict";

  const LS_KEY = "jk-tour-done";
  const STEPS = [
    { icon: "☕", title: "Welcome to The JK Espresso Tracker",
      text: "Here's a quick tour of what you can do. It takes about a minute, and you can skip it anytime." },
    { icon: "⏱️", title: "Pull a shot with Live Pull",
      text: "Pick your beans, set your dose and grind, then start the timer. Tap how it tasted and save it to your log.", link: ["live-pull.html", "Open Live Pull"] },
    { icon: "🤖", title: "Your AI shot coach",
      text: "Film the pour or just use your numbers, and get one clear tip for your next shot. Got a Bluetooth scale? Connect it on Live Pull. It can even start the timer on first drips." },
    { icon: "🌱", title: "Build your bean shelf",
      text: "Snap a photo of the bag and AI fills in the name, roaster, roast and tasting notes for you.", link: ["beans.html", "Open Beans"] },
    { icon: "📝", title: "Track and dial in",
      text: "Your Brew Log keeps every shot with ratings and notes, so you can see what worked and repeat it.", link: ["brew-log.html", "Open Brew Log"] },
    { icon: "🗺️", title: "Explore gear, recipes and roasters",
      text: "Compare machines and tools, save recipes, and find roasters and cafés near you." },
    { icon: "💬", title: "Learn and connect",
      text: "Learn has guides on tools, upgrades and steaming milk with videos. Community is where you ask questions and share tips.", link: ["forum.html", "Open Community"] },
    { icon: "🎉", title: "You're all set",
      text: "You can replay this tour anytime from the More menu or the main menu.", final: true },
  ];

  let idx = 0, root = null, touchX = null;

  function styles() {
    if (document.getElementById("jk-tour-style")) return;
    const st = document.createElement("style");
    st.id = "jk-tour-style";
    st.textContent = `
      .jk-tour{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(27,26,23,.62);animation:jkTourFade .2s ease}
      @keyframes jkTourFade{from{opacity:0}to{opacity:1}}
      .jk-tour-card{position:relative;width:100%;max-width:420px;background:var(--color-surface,#fbf7ee);color:var(--color-ink,#1b1a17);border:2px solid var(--color-ink,#1b1a17);border-radius:4px;box-shadow:6px 6px 0 rgba(0,0,0,.35);padding:22px 20px 18px;text-align:center}
      .jk-tour-card::after{content:"";position:absolute;inset:6px;border:1.5px dashed rgba(27,26,23,.25);border-radius:2px;pointer-events:none}
      .jk-tour-skip{position:absolute;top:10px;right:12px;z-index:1;background:none;border:none;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(27,26,23,.65);cursor:pointer;padding:6px}
      .jk-tour-kicker{font-family:var(--font-mono,monospace);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--color-primary,#a3241b)}
      .jk-tour-icon{width:84px;height:84px;margin:12px auto 10px;border-radius:50%;background:var(--color-surface-2,#f1e7d4);display:flex;align-items:center;justify-content:center;font-size:42px;border:2px solid var(--color-ink,#1b1a17);box-shadow:4px 4px 0 var(--color-primary,#a3241b);transform:rotate(-4deg)}
      .jk-tour-title{font-family:var(--font-heading,inherit);font-weight:700;font-size:22px;line-height:1.2;margin:4px 0 8px}
      .jk-tour-text{font-size:15px;line-height:1.55;margin:0 auto;max-width:340px;min-height:70px}
      .jk-tour-link{display:inline-block;margin-top:10px;font-weight:600;font-size:14px;color:var(--color-primary,#a3241b)}
      .jk-tour-dots{display:flex;gap:6px;justify-content:center;margin:16px 0 14px}
      .jk-tour-dots span{width:8px;height:8px;border-radius:50%;background:rgba(27,26,23,.2)}
      .jk-tour-dots span.on{background:var(--color-primary,#a3241b);width:20px;border-radius:4px}
      .jk-tour-actions{display:flex;gap:10px;justify-content:space-between;position:relative;z-index:1}
      .jk-tour-actions .btn{flex:1}
      .jk-tour-actions .btn[disabled]{opacity:.35}
    `;
    document.head.appendChild(st);
  }

  function render() {
    const s = STEPS[idx];
    const last = idx === STEPS.length - 1;
    root.querySelector(".jk-tour-card").innerHTML = `
      <button type="button" class="jk-tour-skip" data-act="skip">${last ? "Close" : "Skip tour"}</button>
      <div class="jk-tour-kicker">Step ${idx + 1} of ${STEPS.length}</div>
      <div class="jk-tour-icon" aria-hidden="true">${s.icon}</div>
      <h2 class="jk-tour-title" id="jk-tour-title">${s.title}</h2>
      <p class="jk-tour-text">${s.text}</p>
      ${s.link ? `<a class="jk-tour-link" href="${s.link[0]}" data-act="go">${s.link[1]} →</a>` : ""}
      <div class="jk-tour-dots" aria-hidden="true">${STEPS.map((_, i) => `<span class="${i === idx ? "on" : ""}"></span>`).join("")}</div>
      <div class="jk-tour-actions">
        <button type="button" class="btn btn-outline" data-act="back" ${idx === 0 ? "disabled" : ""}>Back</button>
        ${last
          ? `<a class="btn btn-primary" href="live-pull.html" data-act="go">Pull a shot</a>`
          : `<button type="button" class="btn btn-primary" data-act="next">${idx === 0 ? "Let's go" : "Next"}</button>`}
      </div>`;
    const focusEl = root.querySelector('[data-act="next"], [data-act="go"].btn');
    if (focusEl) focusEl.focus({ preventScroll: true });
  }

  function onClick(e) {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) { if (e.target === root) finish(); return; }
    if (act === "next") { idx = Math.min(idx + 1, STEPS.length - 1); render(); }
    else if (act === "back") { idx = Math.max(idx - 1, 0); render(); }
    else if (act === "skip") finish();
    else if (act === "go") markDone(); // let the link navigate
  }

  function onKey(e) {
    if (!root) return;
    if (e.key === "Escape") finish();
    else if (e.key === "ArrowRight" && idx < STEPS.length - 1) { idx++; render(); }
    else if (e.key === "ArrowLeft" && idx > 0) { idx--; render(); }
  }

  function start() {
    styles();
    if (root) return;
    idx = 0;
    root = document.createElement("div");
    root.className = "jk-tour";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "jk-tour-title");
    root.innerHTML = `<div class="jk-tour-card"></div>`;
    root.addEventListener("click", onClick);
    root.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && idx < STEPS.length - 1) { idx++; render(); }
      if (dx > 0 && idx > 0) { idx--; render(); }
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(root);
    document.documentElement.style.overflow = "hidden";
    render();
  }

  function close() {
    if (!root) return;
    document.removeEventListener("keydown", onKey);
    root.remove(); root = null;
    document.documentElement.style.overflow = "";
  }

  async function markDone() {
    try { localStorage.setItem(LS_KEY, "1"); } catch (_) {}
    try {
      if (typeof supabaseClient !== "undefined") {
        const { data } = await supabaseClient.auth.getSession();
        const meta = data && data.session && data.session.user && data.session.user.user_metadata;
        if (data && data.session && !(meta && meta.tour_done)) {
          await supabaseClient.auth.updateUser({ data: { tour_done: true } });
        }
      }
    } catch (_) {}
  }

  function finish() { markDone(); close(); }

  async function autoStart() {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "1") {
      // Clean the URL so a refresh doesn't replay it.
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (_) {}
      start();
      return;
    }
    let local = false;
    try { local = localStorage.getItem(LS_KEY) === "1"; } catch (_) {}
    if (local) return;
    try {
      if (typeof supabaseClient === "undefined") return;
      const { data } = await supabaseClient.auth.getSession();
      const session = data && data.session;
      if (!session) return; // not signed in; the page is redirecting to login
      const meta = session.user && session.user.user_metadata;
      if (meta && meta.tour_done) { try { localStorage.setItem(LS_KEY, "1"); } catch (_) {} return; }
      setTimeout(start, 600);
    } catch (_) {}
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tour-start]");
    if (!t) return;
    e.preventDefault();
    document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
    start();
  });

  window.JKTour = { start, close, reset() { try { localStorage.removeItem(LS_KEY); } catch (_) {} } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoStart);
  else autoStart();
})();
