/* =============================================================
   Bluetooth scale support (Web Bluetooth)
   Works in Chrome on Android (and the Android app), Chrome/Edge on
   desktop. Not available in Safari / iPhone.
   Supported: Timemore (Black Mirror family), Felicita, Decent,
   Bookoo Themis, Varia Aku.
   Protocols based on the open source Beanconqueror project.
   ============================================================= */
(function () {
  "use strict";

  const u16 = (s) => (s.length === 4 ? `0000${s.toLowerCase()}-0000-1000-8000-00805f9b34fb` : s.toLowerCase());
  const xor = (arr) => arr.reduce((a, b) => a ^ b, 0);

  /* ---------- scale drivers ---------- */
  const DRIVERS = [
    {
      id: "timemore",
      label: "Timemore",
      match: (n) => n.includes("timemore"),
      prefixes: ["TIMEMORE", "Timemore", "timemore"],
      service: u16("181d"),
      notify: u16("2a9d"),
      write: "553f4e49-bf21-4468-9c6c-0e4fb5b17697",
      tare: () => [0x00],
      parse(dv) {
        if (dv.byteLength < 3) return null;
        return dv.getInt16(1, true) / 10;
      },
    },
    {
      id: "felicita",
      label: "Felicita",
      match: (n) => n.includes("felicita"),
      prefixes: ["FELICITA", "Felicita"],
      service: u16("ffe0"),
      notify: u16("ffe1"),
      write: u16("ffe1"),
      tare: () => [0x54],
      parse(dv) {
        if (dv.byteLength < 9) return null;
        let s = "";
        for (let i = 3; i < 9; i++) {
          const d = dv.getUint8(i) - 48;
          if (d < 0 || d > 9) return null;
          s += d;
        }
        const neg = dv.getUint8(2) === 45; // '-'
        return (neg ? -1 : 1) * (parseInt(s, 10) / 100);
      },
    },
    {
      id: "decent",
      label: "Decent Scale",
      match: (n) => n.startsWith("decent"),
      prefixes: ["Decent", "DECENT"],
      service: u16("fff0"),
      notify: u16("fff4"),
      write: u16("36f5"),
      tareCounter: 0,
      tare() {
        const c = (this.tareCounter = (this.tareCounter + 1) & 0xff);
        const b = [0x03, 0x0f, 0xfd, c, 0x00, 0x01];
        return [...b, xor(b)];
      },
      heartbeat: { every: 2000, bytes: [0x03, 0x0a, 0x03, 0xff, 0xff, 0x00, 0x0a] },
      parse(dv) {
        if (dv.byteLength < 4) return null;
        const t = dv.getUint8(1);
        if (t !== 0xce && t !== 0xca) return null;
        return dv.getInt16(2, false) / 10;
      },
    },
    {
      id: "bookoo",
      label: "Bookoo Themis",
      match: (n) => n.includes("bookoo"),
      prefixes: ["BOOKOO", "bookoo", "Bookoo"],
      service: u16("0ffe"),
      notify: u16("ff11"),
      write: u16("ff12"),
      tare: () => [0x03, 0x0a, 0x01, 0x00, 0x00, 0x08],
      parse(dv) {
        if (dv.byteLength < 10) return null;
        const w = (dv.getUint8(7) << 16) + (dv.getUint8(8) << 8) + dv.getUint8(9);
        return (dv.getUint8(6) === 45 ? -1 : 1) * (w / 100);
      },
    },
    {
      id: "varia",
      label: "Varia Aku",
      match: (n) => n.includes("varia aku") || n.includes("aku mini") || n.startsWith("aku"),
      prefixes: ["Varia", "VARIA", "AKU", "Aku"],
      service: u16("fff0"),
      notify: u16("fff1"),
      write: u16("fff2"),
      tare: () => { const b = [0x82, 0x01, 0x01]; return [0xfa, ...b, xor(b)]; },
      parse(dv) {
        if (dv.byteLength < 6 || dv.getUint8(1) !== 0x01) return null;
        const b3 = dv.getUint8(3);
        const sign = (b3 & 0x10) === 0 ? 1 : -1;
        return (sign * (((b3 & 0x0f) << 16) + (dv.getUint8(4) << 8) + dv.getUint8(5))) / 100;
      },
    },
  ];

  const ALL_SERVICES = [...new Set(DRIVERS.map((d) => d.service))];

  /* ---------- core scale object ---------- */
  const listeners = new Set();
  const state = {
    supported: !!(navigator.bluetooth && navigator.bluetooth.requestDevice),
    connected: false,
    connecting: false,
    name: "",
    driver: null,
    weight: null,
    samples: [], // {t: ms since recording start, w: grams}
    recording: false,
    recordStart: 0,
    error: "",
  };
  let device = null, notifyChar = null, writeChar = null, hbTimer = null;

  function emit() { listeners.forEach((fn) => { try { fn(state); } catch (_) {} }); }

  async function connect({ showAll = false } = {}) {
    if (!state.supported) throw new Error("Bluetooth isn't available in this browser. Use Chrome on Android or a computer.");
    state.error = "";
    state.connecting = true; emit();
    try {
      const opts = showAll
        ? { acceptAllDevices: true, optionalServices: ALL_SERVICES }
        : { filters: DRIVERS.flatMap((d) => d.prefixes.map((p) => ({ namePrefix: p }))), optionalServices: ALL_SERVICES };
      device = await navigator.bluetooth.requestDevice(opts);
      const name = (device.name || "").toLowerCase();
      device.addEventListener("gattserverdisconnected", onDisconnected);
      const server = await device.gatt.connect();

      let driver = DRIVERS.find((d) => d.match(name));
      let service = null;
      if (driver) {
        service = await server.getPrimaryService(driver.service);
      } else {
        // Unknown name: try each driver's service until one exists.
        for (const d of DRIVERS) {
          try { service = await server.getPrimaryService(d.service); driver = d; break; } catch (_) {}
        }
      }
      if (!driver || !service) throw new Error("This scale isn't supported yet.");

      notifyChar = await service.getCharacteristic(driver.notify);
      writeChar = driver.write === driver.notify ? notifyChar : await service.getCharacteristic(driver.write).catch(() => null);
      notifyChar.addEventListener("characteristicvaluechanged", onValue);
      await notifyChar.startNotifications();

      if (driver.heartbeat && writeChar) {
        hbTimer = setInterval(() => send(driver.heartbeat.bytes).catch(() => {}), driver.heartbeat.every);
      }
      state.driver = driver;
      state.name = device.name || driver.label;
      state.connected = true;
      try { localStorage.setItem("jk-scale-name", state.name); } catch (_) {}
    } catch (e) {
      if (e && e.name === "NotFoundError") state.error = ""; // user closed the picker
      else state.error = (e && e.message) || "Could not connect to the scale.";
      cleanup();
      throw e;
    } finally {
      state.connecting = false; emit();
    }
  }

  function onValue(ev) {
    const d = state.driver;
    if (!d) return;
    let w = null;
    try { w = d.parse(ev.target.value); } catch (_) { w = null; }
    if (w == null || !Number.isFinite(w) || Math.abs(w) > 5000) return;
    state.weight = Math.round(w * 10) / 10;
    if (state.recording) {
      state.samples.push({ t: Date.now() - state.recordStart, w: state.weight });
      if (state.samples.length > 3000) state.samples.shift();
    }
    emit();
  }

  function onDisconnected() {
    cleanup();
    state.error = "Scale disconnected.";
    emit();
  }

  function cleanup() {
    if (hbTimer) clearInterval(hbTimer);
    hbTimer = null;
    try { notifyChar && notifyChar.removeEventListener("characteristicvaluechanged", onValue); } catch (_) {}
    notifyChar = null; writeChar = null;
    state.connected = false;
    state.driver = null;
    state.weight = null;
  }

  function disconnect() {
    try { device && device.gatt && device.gatt.connected && device.gatt.disconnect(); } catch (_) {}
    cleanup();
    state.error = "";
    emit();
  }

  async function send(bytes) {
    if (!writeChar) return;
    const buf = new Uint8Array(bytes);
    if (writeChar.writeValueWithoutResponse) {
      try { await writeChar.writeValueWithoutResponse(buf); return; } catch (_) {}
    }
    await writeChar.writeValue(buf);
  }

  async function tare() {
    if (!state.connected || !state.driver) return;
    await send(state.driver.tare());
  }

  function startRecording() { state.samples = []; state.recordStart = Date.now(); state.recording = true; }
  function stopRecording() { state.recording = false; }

  // Short text summary of the pour curve for the AI coach.
  function curveSummary() {
    const s = state.samples;
    if (s.length < 4) return "";
    const first = s.find((p) => p.w >= 0.5);
    const firstDrip = first ? (first.t / 1000).toFixed(1) + "s" : "none";
    const pts = [];
    const end = s[s.length - 1].t;
    for (let t = 0; t <= end; t += 3000) {
      const p = s.find((x) => x.t >= t) || s[s.length - 1];
      pts.push(`${(t / 1000).toFixed(0)}s:${p.w.toFixed(1)}g`);
    }
    let peak = 0;
    for (let i = 1; i < s.length; i++) {
      const dt = (s[i].t - s[i - 1].t) / 1000;
      if (dt > 0.15) peak = Math.max(peak, (s[i].w - s[i - 1].w) / dt);
    }
    return `first drips at ${firstDrip}; weight every 3s ${pts.join(", ")}; peak flow about ${peak.toFixed(1)} g/s`;
  }

  window.JKScale = {
    get state() { return state; },
    DRIVERS,
    connect, disconnect, tare,
    startRecording, stopRecording, curveSummary,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };

  /* =============================================================
     Live Pull integration
     ============================================================= */
  const $ = (id) => document.getElementById(id);

  function injectStyles() {
    if ($("jk-scale-style")) return;
    const st = document.createElement("style");
    st.id = "jk-scale-style";
    st.textContent = `
      .jk-scale{margin-top:16px;border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;background:var(--color-surface,#fbf7ee);padding:14px}
      .jk-scale-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
      .jk-scale-kicker{font-family:var(--font-mono,monospace);font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:var(--color-primary,#a3241b)}
      .jk-scale-read{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-top:10px}
      .jk-scale-weight{font-family:var(--font-mono,monospace);font-weight:600;font-size:40px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
      .jk-scale-flow{font-family:var(--font-mono,monospace);font-size:13px;color:rgba(27,26,23,.7)}
      .jk-scale-name{font-family:var(--font-mono,monospace);font-size:12px;color:rgba(27,26,23,.7)}
      .jk-scale-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .jk-scale-opt{display:flex;gap:8px;align-items:center;font-size:13px;margin-top:10px;font-weight:500}
      .jk-scale-opt input{width:auto!important;accent-color:var(--color-primary,#a3241b)}
      .jk-scale-msg{font-family:var(--font-mono,monospace);font-size:12px;margin-top:8px}
      .jk-scale-msg.err{color:var(--color-danger,#a3241b)}
      .jk-scale-more{background:none;border:none;padding:0;margin-top:8px;font-size:12px;text-decoration:underline;color:inherit;cursor:pointer}
      .jk-scale.off .jk-scale-read,.jk-scale.off .jk-scale-live{display:none}
    `;
    document.head.appendChild(st);
  }

  function setField(el, v) {
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function elapsedText() {
    const el = $("livepull-elapsed");
    return el ? (el.tagName === "INPUT" ? el.value : el.textContent).trim() : "";
  }

  function setupLivePull() {
    const card = $("livepull-card");
    if (!card || $("jk-scale")) return;
    injectStyles();
    const box = document.createElement("section");
    box.id = "jk-scale";
    box.className = "jk-scale off";
    box.innerHTML = `
      <div class="jk-scale-head">
        <span class="jk-scale-kicker">Bluetooth scale</span>
        <button type="button" class="btn btn-outline btn-sm" id="jk-scale-connect">⚖️ Connect scale</button>
      </div>
      <div class="jk-scale-read">
        <span class="jk-scale-weight" id="jk-scale-weight">0.0g</span>
        <span class="jk-scale-flow" id="jk-scale-flow"></span>
        <span class="jk-scale-name" id="jk-scale-name"></span>
      </div>
      <div class="jk-scale-live">
        <div class="jk-scale-actions">
          <button type="button" class="btn btn-outline btn-sm" id="jk-scale-tare">Tare</button>
          <button type="button" class="btn btn-outline btn-sm" id="jk-scale-dose">Use as dose</button>
        </div>
        <label class="jk-scale-opt"><input type="checkbox" id="jk-scale-auto" checked> Start the timer on first drips</label>
        <label class="jk-scale-opt"><input type="checkbox" id="jk-scale-yield" checked> Fill yield from the scale during the shot</label>
      </div>
      <div class="jk-scale-msg" id="jk-scale-msg"></div>
      <button type="button" class="jk-scale-more" id="jk-scale-all">Don't see your scale? Show all Bluetooth devices</button>`;
    const after = $("ai-pour") || card;
    after.insertAdjacentElement("afterend", box);

    try {
      const a = localStorage.getItem("jk-scale-auto"); if (a != null) $("jk-scale-auto").checked = a === "1";
      const y = localStorage.getItem("jk-scale-yieldfill"); if (y != null) $("jk-scale-yield").checked = y === "1";
    } catch (_) {}
    $("jk-scale-auto").addEventListener("change", (e) => { try { localStorage.setItem("jk-scale-auto", e.target.checked ? "1" : "0"); } catch (_) {} });
    $("jk-scale-yield").addEventListener("change", (e) => { try { localStorage.setItem("jk-scale-yieldfill", e.target.checked ? "1" : "0"); } catch (_) {} });

    const msg = $("jk-scale-msg");
    if (!state.supported) {
      msg.className = "jk-scale-msg err";
      msg.textContent = "Bluetooth scales work in Chrome on Android and on computers. iPhone browsers don't allow it yet.";
      $("jk-scale-connect").disabled = true;
      $("jk-scale-all").hidden = true;
      return;
    }

    const doConnect = async (showAll) => {
      if (state.connected) { disconnect(); return; }
      msg.className = "jk-scale-msg";
      msg.textContent = "Turn the scale on, then pick it from the list…";
      try { await connect({ showAll }); msg.textContent = ""; }
      catch (_) { msg.className = "jk-scale-msg err"; msg.textContent = state.error; }
    };
    $("jk-scale-connect").addEventListener("click", () => doConnect(false));
    $("jk-scale-all").addEventListener("click", () => doConnect(true));
    $("jk-scale-tare").addEventListener("click", () => { tare().catch(() => {}); armed = true; });
    $("jk-scale-dose").addEventListener("click", () => {
      if (state.weight != null && state.weight > 0) setField($("livepull-dose"), state.weight.toFixed(1));
    });
    const reset = $("livepull-reset");
    if (reset) reset.addEventListener("click", () => { stopRecording(); state.samples = []; armed = true; });

    let armed = true, lastElapsed = "", timerRunning = false, prevW = null, prevT = 0, flow = 0, dripHits = 0;

    // Watch the timer so recording follows it.
    setInterval(() => {
      const t = elapsedText();
      const running = !!t && t !== lastElapsed && parseFloat(t.replace(/[^\d.]/g, "")) > 0;
      lastElapsed = t;
      if (running && !timerRunning && state.connected && !state.recording) startRecording();
      if (!running && timerRunning) stopRecording();
      timerRunning = running;
    }, 500);

    JKScale.on(() => {
      box.classList.toggle("off", !state.connected);
      $("jk-scale-connect").textContent = state.connecting ? "Connecting…" : state.connected ? "Disconnect" : "⚖️ Connect scale";
      $("jk-scale-all").hidden = state.connected;
      $("jk-scale-name").textContent = state.connected ? state.name : "";
      if (!state.connected) {
        if (state.error) { msg.className = "jk-scale-msg err"; msg.textContent = state.error; }
        return;
      }
      const w = state.weight;
      if (w == null) return;
      $("jk-scale-weight").textContent = `${w.toFixed(1)}g`;

      const now = Date.now();
      if (prevW != null && now - prevT >= 400) {
        const inst = (w - prevW) / ((now - prevT) / 1000);
        flow = flow * 0.6 + inst * 0.4;
        prevW = w; prevT = now;
      } else if (prevW == null) { prevW = w; prevT = now; }
      $("jk-scale-flow").textContent = timerRunning && flow > 0.05 ? `${flow.toFixed(1)} g/s` : "";

      // Auto start on first drips (after a tare, near zero before).
      dripHits = (w >= 0.5 && w < 5) ? dripHits + 1 : 0;
      if (armed && $("jk-scale-auto").checked && !timerRunning && dripHits >= 3) {
        const toggle = $("livepull-toggle");
        if (toggle) {
          armed = false;
          toggle.click();
          startRecording();
        }
      }
      if (w < 0.3 && !timerRunning) armed = true;

      if ($("jk-scale-yield").checked && timerRunning && w > 0) {
        setField($("livepull-yield"), w.toFixed(1));
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupLivePull);
  else setupLivePull();
})();
