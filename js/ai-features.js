/* =============================================================
   AI features: Scan a bean bag + Film the pour shot review
   Talks to the Supabase edge function "espresso-ai".
   Self contained: hooks into existing page elements by id.
   ============================================================= */
(function () {
  "use strict";

  const FN = "espresso-ai";
  const FRAME_EVERY_MS = 2500;
  const MAX_SEND_FRAMES = 12;
  const MAX_KEEP_FRAMES = 24;

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);

  function findClient() {
    const named = [];
    try { if (typeof supabaseClient !== "undefined") named.push(supabaseClient); } catch (_) {}
    try { if (typeof sb !== "undefined") named.push(sb); } catch (_) {}
    try { if (typeof supa !== "undefined") named.push(supa); } catch (_) {}
    try { if (typeof db !== "undefined") named.push(db); } catch (_) {}
    for (const c of named) if (c && c.auth && c.functions) return c;
    for (const k of Object.keys(window)) {
      try {
        const v = window[k];
        if (v && typeof v === "object" && v.auth && typeof v.auth.getSession === "function" && v.functions) return v;
      } catch (_) {}
    }
    return null;
  }

  async function callAI(body) {
    const client = findClient();
    if (!client) throw new Error("Could not connect. Please refresh and try again.");
    const { data: s } = await client.auth.getSession();
    if (!s || !s.session) throw new Error("Please sign in to use AI features.");
    const { data, error } = await client.functions.invoke(FN, { body });
    if (error) {
      let msg = error.message || "AI request failed";
      try {
        if (error.context && typeof error.context.json === "function") {
          const j = await error.context.json();
          if (j && j.error) msg = j.error;
        }
      } catch (_) {}
      throw new Error(msg);
    }
    if (data && data.error) throw new Error(data.error);
    return data && data.result;
  }

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  async function fileToJpeg(file, maxSide, quality) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/jpeg", quality);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", quality));
      return { dataUrl, blob };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function setVal(id, v, { append = false } = {}) {
    const el = $(id);
    if (!el || !v) return false;
    if (append && el.value && !el.value.includes(v)) el.value = el.value.trim() + "\n" + v;
    else if (!append || !el.value) el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.classList.add("ai-filled");
    setTimeout(() => el.classList.remove("ai-filled"), 2200);
    return true;
  }

  function setSelect(id, v) {
    const el = $(id);
    if (!el || !v) return false;
    const opt = [...el.options].find((o) => (o.value || o.text).toLowerCase() === v.toLowerCase() || o.text.toLowerCase() === v.toLowerCase());
    if (!opt) return false;
    el.value = opt.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.classList.add("ai-filled");
    setTimeout(() => el.classList.remove("ai-filled"), 2200);
    return true;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- styles ---------- */
  function injectStyles() {
    if ($("ai-features-style")) return;
    const st = document.createElement("style");
    st.id = "ai-features-style";
    st.textContent = `
      .ai-scan-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 14px;padding:12px;border:1.5px dashed rgba(27,26,23,.5);border-radius:3px;background:var(--color-surface-2,#f1e7d4)}
      .ai-scan-bar p{margin:0;font-size:13px;color:rgba(27,26,23,.75);flex:1;min-width:180px}
      .ai-status{font-family:var(--font-mono,monospace);font-size:12px;letter-spacing:.04em;margin-top:6px;width:100%}
      .ai-status.err{color:var(--color-danger,#a3241b)}
      .ai-status.ok{color:var(--color-accent-2,#2f5d3a)}
      .ai-filled{box-shadow:0 0 0 3px rgba(47,93,58,.35)!important;transition:box-shadow .3s}
      .ai-pour{margin-top:16px;border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;background:var(--color-surface,#fbf7ee);padding:14px}
      .ai-pour-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
      .ai-pour-kicker{font-family:var(--font-mono,monospace);font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:var(--color-primary,#a3241b)}
      .ai-pour-help{font-size:13px;color:rgba(27,26,23,.72);margin:6px 0 10px}
      .ai-pour video{width:100%;max-height:340px;object-fit:cover;background:#111;border:1.5px solid var(--color-ink,#1b1a17);border-radius:2px;display:none}
      .ai-pour.cam-on video{display:block}
      .ai-pour-meta{display:flex;justify-content:space-between;font-family:var(--font-mono,monospace);font-size:12px;margin-top:8px}
      .ai-rec-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#a3241b;margin-right:6px;animation:aiblink 1s infinite}
      @keyframes aiblink{50%{opacity:.2}}
      .ai-thumbs{display:flex;gap:4px;overflow-x:auto;margin-top:8px}
      .ai-thumbs img{height:44px;border:1px solid var(--color-ink,#1b1a17);border-radius:2px}
      .ai-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .ai-review{margin-top:12px;background:var(--color-ink,#1b1a17);color:#f6efe1;border-radius:3px;padding:14px}
      .ai-review .k{font-family:var(--font-mono,monospace);font-weight:600;font-size:11px;letter-spacing:.14em;color:var(--color-accent-on-dark,#f0b64a);text-transform:uppercase;margin-bottom:6px}
      .ai-review .rec{font-size:16px;line-height:1.45;margin:0 0 10px}
      .ai-review ul{margin:6px 0 0 18px;padding:0;font-size:13px;line-height:1.5}
      .ai-review .targets{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--font-mono,monospace);font-size:13px;margin:8px 0}
      .ai-review .verdict{display:inline-block;border:1.5px solid currentColor;padding:2px 7px;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
      .ai-review .saved{font-family:var(--font-mono,monospace);font-size:11px;opacity:.7;margin-top:10px}
    `;
    document.head.appendChild(st);
  }

  /* =============================================================
     1. SCAN A BEAN BAG
     ============================================================= */
  function buildScanBar(prefix) {
    const bar = document.createElement("div");
    bar.className = "ai-scan-bar";
    bar.innerHTML = `
      <button type="button" class="btn btn-accent btn-sm ai-scan-btn">📷 Scan bag</button>
      <p>Snap the front of the bag and AI fills in the name, roaster, roast and more. Check it before saving.</p>
      <input type="file" accept="image/*" capture="environment" hidden class="ai-scan-input">
      <div class="ai-status" hidden></div>`;
    const btn = bar.querySelector(".ai-scan-btn");
    const input = bar.querySelector(".ai-scan-input");
    const status = bar.querySelector(".ai-status");
    btn.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      status.hidden = false;
      status.className = "ai-status";
      status.textContent = "Reading the bag…";
      btn.disabled = true;
      try {
        const { dataUrl, blob } = await fileToJpeg(file, 1400, 0.82);
        const r = await callAI({ action: "scan_bag", image: dataUrl });
        if (!r || r.is_coffee_bag === false) throw new Error("That doesn't look like a coffee bag. Try again with the label facing the camera.");
        const filled = applyScan(prefix, r);
        if (prefix === "bean") attachBagPhoto(blob);
        status.className = "ai-status ok";
        status.textContent = filled
          ? `Filled ${filled} field${filled === 1 ? "" : "s"}${r.confidence === "low" ? " (low confidence, please double check)" : ""}. Review, then save.`
          : "Couldn't find much on that photo. Try a closer, well lit shot of the label.";
      } catch (e) {
        status.className = "ai-status err";
        status.textContent = e.message || "Scan failed.";
      } finally {
        btn.disabled = false;
      }
    });
    return bar;
  }

  function applyScan(prefix, r) {
    const ids = prefix === "bean"
      ? { name: "bean-name-input", roaster: "bean-roaster", roast: "bean-roast-type", source: "bean-source", process: "bean-process", history: "bean-history", notes: "bean-notes" }
      : { name: "nb-name", roaster: "nb-roaster", roast: "nb-roast-type", source: "nb-source", process: "nb-process", history: "nb-history", notes: "nb-notes" };
    let n = 0;
    if (setVal(ids.name, r.name)) n++;
    if (setVal(ids.roaster, r.roaster)) n++;
    if (setSelect(ids.roast, r.roast_level)) n++;
    if (setVal(ids.source, r.origin)) n++;
    if (setVal(ids.process, r.process)) n++;
    if (setVal(ids.history, r.roaster_info, { append: true })) n++;
    const noteBits = [];
    if (r.tasting_notes) noteBits.push(`Tasting notes: ${r.tasting_notes}`);
    if (r.roast_date) noteBits.push(`Roast date: ${r.roast_date}`);
    if (r.varietal) noteBits.push(`Varietal: ${r.varietal}`);
    if (r.altitude) noteBits.push(`Altitude: ${r.altitude}`);
    if (r.weight) noteBits.push(`Bag: ${r.weight}`);
    if (noteBits.length && setVal(ids.notes, noteBits.join("\n"), { append: true })) n += noteBits.length;
    return n;
  }

  function attachBagPhoto(blob) {
    if (!blob) return;
    const file = new File([blob], "bag-scan.jpg", { type: "image/jpeg" });
    try {
      if (typeof beanPhotoFile !== "undefined") {
        // Only use the scan as the packaging photo if there isn't one already.
        const hasExisting = (typeof beanPhotoExistingPath !== "undefined" && beanPhotoExistingPath && !(typeof beanPhotoRemoved !== "undefined" && beanPhotoRemoved));
        if (beanPhotoFile || hasExisting) return;
        beanPhotoFile = file; // eslint-disable-line no-global-assign
        if (typeof beanPhotoRemoved !== "undefined") beanPhotoRemoved = false; // eslint-disable-line no-global-assign
        if (typeof renderBeanPhotoPreview === "function") renderBeanPhotoPreview(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.warn("Could not attach bag photo", e);
    }
  }

  function setupScan() {
    [["bean", "bean-name-input"], ["nb", "nb-name"]].forEach(([prefix, anchorId]) => {
      const anchor = $(anchorId);
      if (!anchor || anchor.dataset.aiScan) return;
      anchor.dataset.aiScan = "1";
      const form = anchor.closest("form") || anchor.parentElement;
      // Put the scan bar at the top of the form (after a heading if the first child is one).
      let ref = form.firstElementChild;
      while (ref && /^(H1|H2|H3|H4|INPUT)$/.test(ref.tagName) && ref.type !== "text") ref = ref.nextElementSibling;
      form.insertBefore(buildScanBar(prefix), ref || null);
    });
  }

  /* =============================================================
     2. FILM THE POUR + AI SHOT REVIEW (live-pull page)
     ============================================================= */
  const pour = { stream: null, frames: [], timer: null, lastElapsed: "", review: null };

  function elapsedText() {
    const el = $("livepull-elapsed");
    return el ? (el.value != null && el.tagName === "INPUT" ? el.value : el.textContent).trim() : "";
  }

  function parseSeconds(t) {
    if (!t) return null;
    const m = t.match(/(\d+):(\d+(?:\.\d+)?)/);
    if (m) return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    const n = parseFloat(t.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function grabFrame(video) {
    if (!video || !video.videoWidth) return null;
    const w = 640;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(video, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.7);
  }

  function pickFrames(all, n) {
    if (all.length <= n) return all.slice();
    const out = [];
    for (let i = 0; i < n; i++) out.push(all[Math.round((i * (all.length - 1)) / (n - 1))]);
    return out;
  }

  function setupPour() {
    const card = $("livepull-card");
    if (!card || $("ai-pour")) return;
    const box = document.createElement("section");
    box.id = "ai-pour";
    box.className = "ai-pour";
    box.innerHTML = `
      <div class="ai-pour-head">
        <span class="ai-pour-kicker">AI shot coach</span>
        <button type="button" class="btn btn-outline btn-sm" id="ai-cam-btn">📹 Film the pour</button>
      </div>
      <p class="ai-pour-help">Prop your phone so it sees the portafilter and cup, then start the timer. Frames are grabbed during the shot. When you stop, get an AI review and a plan for the next shot. You can also get a review from the numbers alone.</p>
      <video id="ai-cam-video" playsinline muted autoplay></video>
      <div class="ai-pour-meta"><span id="ai-cam-state"></span><span id="ai-frame-count"></span></div>
      <div class="ai-thumbs" id="ai-thumbs"></div>
      <div class="ai-actions">
        <button type="button" class="btn btn-accent btn-sm" id="ai-review-btn">Get AI shot review</button>
      </div>
      <div class="ai-status" id="ai-review-status" hidden></div>
      <div id="ai-review-out"></div>`;
    card.insertAdjacentElement("afterend", box);

    $("ai-cam-btn").addEventListener("click", toggleCamera);
    $("ai-review-btn").addEventListener("click", runReview);
    const reset = $("livepull-reset");
    if (reset) reset.addEventListener("click", clearShot);
    updateMeta();

    pour.timer = setInterval(tick, FRAME_EVERY_MS);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopCamera(); });
    wrapSave();
  }

  async function toggleCamera() {
    if (pour.stream) { stopCamera(); return; }
    const status = $("ai-review-status");
    try {
      pour.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const v = $("ai-cam-video");
      v.srcObject = pour.stream;
      await v.play().catch(() => {});
      $("ai-pour").classList.add("cam-on");
      $("ai-cam-btn").textContent = "■ Stop camera";
      status.hidden = true;
    } catch (e) {
      pour.stream = null;
      status.hidden = false;
      status.className = "ai-status err";
      status.textContent = "Camera not available. Allow camera access in your browser or app settings, or get a review from the numbers only.";
    }
    updateMeta();
  }

  function stopCamera() {
    if (pour.stream) pour.stream.getTracks().forEach((t) => t.stop());
    pour.stream = null;
    const v = $("ai-cam-video");
    if (v) v.srcObject = null;
    const box = $("ai-pour");
    if (box) box.classList.remove("cam-on");
    const b = $("ai-cam-btn");
    if (b) b.textContent = "📹 Film the pour";
    updateMeta();
  }

  function tick() {
    const t = elapsedText();
    const running = t && t !== pour.lastElapsed && parseSeconds(t) > 0;
    pour.lastElapsed = t;
    pour.running = !!running;
    if (running && pour.stream) {
      const f = grabFrame($("ai-cam-video"));
      if (f) {
        pour.frames.push(f);
        if (pour.frames.length > MAX_KEEP_FRAMES) pour.frames = pickFrames(pour.frames, MAX_KEEP_FRAMES / 2);
        const th = $("ai-thumbs");
        if (th) {
          const img = document.createElement("img");
          img.src = f; img.alt = "";
          th.appendChild(img);
          while (th.children.length > MAX_KEEP_FRAMES) th.removeChild(th.firstChild);
        }
      }
    }
    updateMeta();
  }

  function updateMeta() {
    const s = $("ai-cam-state");
    const c = $("ai-frame-count");
    if (!s || !c) return;
    s.innerHTML = pour.stream
      ? (pour.running ? '<span class="ai-rec-dot"></span>Recording frames' : "Camera ready, start the timer")
      : "Camera off";
    c.textContent = pour.frames.length ? `${pour.frames.length} frame${pour.frames.length === 1 ? "" : "s"}` : "";
  }

  function clearShot() {
    pour.frames = [];
    pour.review = null;
    const th = $("ai-thumbs"); if (th) th.innerHTML = "";
    const out = $("ai-review-out"); if (out) out.innerHTML = "";
    const st = $("ai-review-status"); if (st) st.hidden = true;
    updateMeta();
  }

  async function shotData() {
    const val = (id) => { const el = $(id); return el ? String(el.value || "").trim() : ""; };
    const beanSel = $("livepull-bean-select");
    const beanText = beanSel && beanSel.selectedIndex >= 0 ? beanSel.options[beanSel.selectedIndex].text : "";
    const tasteEl = document.querySelector(".livepull-taste-tag.selected");
    const secs = parseSeconds(elapsedText());
    let roast = "";
    try {
      if (typeof getBeans === "function" && beanSel) {
        const list = (await getBeans()) || [];
        const b = Array.isArray(list) ? list.find((x) => String(x.id) === String(beanSel.value)) : null;
        if (b) roast = b.roastType || b.roast_type || "";
      }
    } catch (_) {}
    return {
      dose: val("livepull-dose"),
      yield: val("livepull-yield"),
      time: secs ? secs.toFixed(1) : "",
      grind: val("livepull-grind"),
      bean: /select|choose/i.test(beanText) ? "" : beanText,
      roast,
      taste: tasteEl ? tasteEl.textContent.trim() : "",
      scale: (window.JKScale && JKScale.curveSummary) ? JKScale.curveSummary() : "",
    };
  }

  async function runReview() {
    const btn = $("ai-review-btn");
    const status = $("ai-review-status");
    const out = $("ai-review-out");
    const shot = await shotData();
    if (!shot.dose && !shot.yield && !shot.time && !pour.frames.length) {
      status.hidden = false;
      status.className = "ai-status err";
      status.textContent = "Pull a shot first: add dose and yield and run the timer.";
      return;
    }
    btn.disabled = true;
    status.hidden = false;
    status.className = "ai-status";
    const frames = pickFrames(pour.frames, MAX_SEND_FRAMES);
    status.textContent = frames.length ? `Reviewing ${frames.length} frames and your numbers…` : "Reviewing your numbers…";
    try {
      const r = await callAI({ action: "review_shot", shot, frames });
      pour.review = r;
      status.hidden = true;
      out.innerHTML = renderReview(r);
    } catch (e) {
      status.className = "ai-status err";
      status.textContent = e.message || "Review failed.";
    } finally {
      btn.disabled = false;
    }
  }

  function renderReview(r) {
    const ns = r.next_shot || {};
    const targets = [
      ns.grind ? `Grind: ${esc(ns.grind)}` : "",
      ns.dose_g ? `Dose: ${esc(ns.dose_g)}g` : "",
      ns.yield_g ? `Yield: ${esc(ns.yield_g)}g` : "",
      ns.time_s ? `Time: ${esc(ns.time_s)}s` : "",
    ].filter(Boolean).map((t) => `<span>${t}</span>`).join("");
    const obs = (r.observations || []).map((o) => `<li>${esc(o)}</li>`).join("");
    const tips = (r.tips || []).map((o) => `<li>${esc(o)}</li>`).join("");
    return `<div class="ai-review">
      ${r.verdict ? `<span class="verdict">${esc(r.verdict)}</span>` : ""}
      <div class="k">Next shot</div>
      <p class="rec">${esc(r.recommendation || r.summary || "")}</p>
      ${targets ? `<div class="targets">${targets}</div>` : ""}
      ${r.summary && r.recommendation ? `<div class="k" style="margin-top:10px">What happened</div><p style="margin:0;font-size:14px;line-height:1.45">${esc(r.summary)}</p>` : ""}
      ${obs ? `<ul>${obs}</ul>` : ""}
      ${tips ? `<div class="k" style="margin-top:10px">Tips</div><ul>${tips}</ul>` : ""}
      <div class="saved">This recommendation is saved with the shot when you tap save.</div>
    </div>`;
  }

  function recommendationText() {
    const r = pour.review;
    if (!r) return "";
    const ns = r.next_shot || {};
    const bits = [
      ns.grind ? `grind ${ns.grind}` : "",
      ns.dose_g ? `${ns.dose_g}g in` : "",
      ns.yield_g ? `${ns.yield_g}g out` : "",
      ns.time_s ? `${ns.time_s}s` : "",
    ].filter(Boolean).join(", ");
    return `AI: ${r.recommendation || r.summary || ""}${bits ? ` (${bits})` : ""}`.slice(0, 600);
  }

  // Attach the AI recommendation to the brew when the page saves it.
  function wrapSave() {
    try {
      if (typeof saveBrew !== "function" || saveBrew.__aiWrapped) return;
      const orig = saveBrew;
      const wrapped = function (brew, ...rest) {
        const rec = recommendationText();
        if (rec && brew && typeof brew === "object" && !brew.recommendation) brew.recommendation = rec;
        const out = orig.call(this, brew, ...rest);
        if (rec) Promise.resolve(out).then(() => clearShot()).catch(() => {});
        return out;
      };
      wrapped.__aiWrapped = true;
      window.saveBrew = wrapped;
      try { saveBrew = wrapped; } catch (_) {} // eslint-disable-line no-global-assign
    } catch (e) {
      console.warn("AI: could not hook saveBrew", e);
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    injectStyles();
    setupScan();
    setupPour();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  // Modals can be built late; try again shortly.
  setTimeout(setupScan, 1200);
})();
