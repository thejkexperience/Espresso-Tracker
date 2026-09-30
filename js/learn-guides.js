/* =============================================================
   Learn guides: tools, machine upgrades, milk steaming, videos.
   Renders into learn.html above the history section.
   Videos are verified YouTube links (thumbnails from i.ytimg.com).
   ============================================================= */
(function () {
  "use strict";

  /* ---------------- videos ---------------- */
  const V = {
    hoffDose:   { id: "aTFsBqhpLes", title: "Understanding Espresso: Dose", by: "James Hoffmann" },
    hoffRatio:  { id: "F4wrUP4c5P4", title: "Understanding Espresso: Ratio", by: "James Hoffmann" },
    hoffTime:   { id: "hQaV3w_XNiw", title: "Understanding Espresso: Brew Time", by: "James Hoffmann" },
    hoffTemp:   { id: "QAzE-_ocf1U", title: "Understanding Espresso: Brew Temperature", by: "James Hoffmann" },
    hoffPress:  { id: "po3oGIicu-8", title: "Understanding Espresso: Pressure", by: "James Hoffmann" },
    hoffGrind:  { id: "G7xGhGtvYIs", title: "The Best Espresso Grinder Under £250", by: "James Hoffmann" },
    wdt:        { id: "i1BD0aBAg10", title: "WDT Tool: The Difference It Makes", by: "Entek Coffee" },
    wdtTest:    { id: "wscKwGozt4U", title: "Does WDT Work? I Tested It", by: "Coffee with Arthur" },
    screen:     { id: "BzIBNhnd85c", title: "Are Puck Screens Worth It?", by: "Lance Hedrick" },
    tamp:       { id: "ogujVacRDr4", title: "How to Tamp Correctly", by: "Alternative Brewing" },
    scale:      { id: "a8z4zmV5xl8", title: "Why Weigh Your Espresso Shots?", by: "Seattle Coffee Gear" },
    bottomless: { id: "CHl4AN0yjPM", title: "Upgrading to a Bottomless Portafilter", by: "Home Barista Corner" },
    gaggia:     { id: "HSJ7ErHwiwA", title: "The Upgrade Your Gaggia Classic Pro Needs", by: "Liz Happybeans" },
    profiling:  { id: "yOCCaT-_eF0", title: "Pressure Profiling for Better Espresso", by: "Seattle Coffee Gear" },
    water:      { id: "mZKKW5Bs51w", title: "Water Filtration for Espresso Machines", by: "Whole Latte Love" },
    milkLance:  { id: "gTC3dJvwgUI", title: "How to Steam Milk for Latte Art", by: "Lance Hedrick" },
    milkEmilee: { id: "SswxZZlgEyg", title: "How to Steam Milk: A Guide for Beginners", by: "Emilee Bryant" },
    milkWLL:    { id: "4PSCsv7kcKA", title: "Beginner's Guide to Steaming Milk and Latte Art", by: "Whole Latte Love" },
    latteArt:   { id: "xlOa6aIVyeE", title: "Latte Art Tutorial with a Champion", by: "Flair Espresso / Emilee Bryant" },
  };
  const yt = (v) => `https://www.youtube.com/watch?v=${v.id}`;
  const thumb = (v) => `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

  function videoCard(v) {
    return `<a class="lg-video" href="${yt(v)}" target="_blank" rel="noopener">
      <span class="lg-video-thumb"><img src="${thumb(v)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="lg-play">▶</span></span>
      <span class="lg-video-text"><strong>${v.title}</strong><small>${v.by} · YouTube</small></span>
    </a>`;
  }
  const videoRow = (...vs) => `<div class="lg-video-row">${vs.map(videoCard).join("")}</div>`;

  /* ---------------- diagrams (inline SVG) ---------------- */
  const INK = "currentColor";

  const svgPuckPrep = `
  <ol class="lg-prep">
    ${[
      ["Grind", "Weigh the beans and grind fresh."],
      ["Dose", "Grind into the basket and check the weight."],
      ["WDT", "Stir with fine needles to break clumps."],
      ["Tamp", "Press level and firm, once."],
      ["Screen", "Optional puck screen on top."],
      ["Brew", "Lock in, start, and weigh the yield."],
    ].map(([t, s], i) => `<li><span class="lg-prep-n">${i + 1}</span><b>${t}</b><small>${s}</small></li>`).join("")}
  </ol>`;

  const svgPortafilter = `
  <svg viewBox="0 0 420 250" class="lg-svg lg-svg-pf" role="img" aria-label="Cross section of the group head, puck and basket">
    <rect x="40" y="10" width="220" height="38" rx="4" fill="var(--color-surface-2,#f1e7d4)" stroke="${INK}" stroke-width="1.5"/>
    <text x="150" y="34" text-anchor="middle" font-size="14" fill="${INK}">Group head</text>
    <line x1="60" y1="58" x2="240" y2="58" stroke="${INK}" stroke-width="3" stroke-dasharray="6 4"/>
    <rect x="70" y="68" width="160" height="8" fill="#9aa0a6" stroke="${INK}"/>
    <path d="M70 78 L230 78 L224 146 L76 146 Z" fill="#6b4a2b" stroke="${INK}" stroke-width="1.5"/>
    <text x="150" y="118" text-anchor="middle" font-size="15" fill="#f6efe1" font-weight="700">Coffee puck</text>
    <path d="M60 68 L240 68 L232 154 L68 154 Z" fill="none" stroke="${INK}" stroke-width="2.5"/>
    <line x1="76" y1="152" x2="224" y2="152" stroke="${INK}" stroke-width="2" stroke-dasharray="2 3"/>
    <path d="M50 156 Q150 196 250 156" fill="none" stroke="${INK}" stroke-width="2.5"/>
    <path d="M140 186 q10 20 0 45" stroke="#8a5a2b" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M160 186 q-10 20 0 45" stroke="#8a5a2b" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${[["Shower screen", 58, 244], ["Puck screen", 72, 232], ["Coffee bed", 112, 226], ["Basket holes", 152, 226], ["Portafilter", 176, 222], ["Espresso", 214, 160]]
      .map(([t, y, x0]) => `<line x1="${x0}" y1="${y}" x2="290" y2="${y}" stroke="${INK}" stroke-width="1"/><text x="296" y="${y + 5}" font-size="14" fill="${INK}">${t}</text>`).join("")}
  </svg>`;

  const pitcher = (k) => {
    const surf = k ? 96 : 104, tipX = k ? 128 : 120, tipY = k ? 126 : 110;
    return `<svg viewBox="0 0 270 230" class="lg-svg" role="img" aria-label="${k ? "Texturing" : "Stretching"} wand position">
      <path d="M40 50 L200 50 L190 215 L50 215 Z" fill="#fffaf0" stroke="${INK}" stroke-width="2"/>
      <path d="M200 50 L224 40" stroke="${INK}" stroke-width="2"/>
      <path d="M41 50 L199 50 L198 ${surf} L42 ${surf} Z" fill="#f4efe6"/>
      <line x1="42" y1="${surf}" x2="198" y2="${surf}" stroke="#b9a98f" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="206" y="${surf + 4}" font-size="12" fill="${INK}">milk line</text>
      <line x1="${tipX + 22}" y1="8" x2="${tipX}" y2="${tipY}" stroke="#555" stroke-width="8" stroke-linecap="round"/>
      <circle cx="${tipX}" cy="${tipY}" r="6" fill="var(--color-primary,#a3241b)"/>
      ${k ? `<ellipse cx="120" cy="170" rx="52" ry="26" fill="none" stroke="var(--color-accent-2,#2f5d3a)" stroke-width="3" stroke-dasharray="9 6"/>
             <path d="M168 160 l8 10 l-12 3" fill="none" stroke="var(--color-accent-2,#2f5d3a)" stroke-width="3"/>`
          : `<g fill="#cfc3ad"><circle cx="100" cy="98" r="4"/><circle cx="112" cy="90" r="3"/><circle cx="138" cy="96" r="4"/><circle cx="128" cy="86" r="3"/></g>`}
    </svg>`;
  };
  const svgWand = `
  <div class="lg-fig-grid">
    <figure class="lg-fig">${pitcher(0)}<figcaption><b>Step 1: Stretch.</b> Tip just under the surface. Listen for a soft tss tss. Air goes in and the milk grows.</figcaption></figure>
    <figure class="lg-fig">${pitcher(1)}<figcaption><b>Step 2: Texture.</b> Tip about 1 cm deeper and off center. The milk spins in a whirlpool and the bubbles get tiny.</figcaption></figure>
  </div>`;

  const svgTemp = `
  <svg viewBox="0 0 400 50" class="lg-svg lg-svg-bar" role="img" aria-label="Milk temperature scale">
    <defs><linearGradient id="lgTempGrad" x1="0" x2="1">
      <stop offset="0" stop-color="#6fa8dc"/><stop offset="0.45" stop-color="#f3d27a"/><stop offset="0.75" stop-color="#e59a3c"/><stop offset="1" stop-color="#a3241b"/>
    </linearGradient></defs>
    <rect x="10" y="14" width="380" height="22" rx="11" fill="url(#lgTempGrad)" stroke="${INK}" stroke-width="1.5"/>
    <rect x="${10 + (55 / 80) * 380}" y="9" width="${(10 / 80) * 380}" height="32" rx="4" fill="none" stroke="var(--color-accent-2,#2f5d3a)" stroke-width="3"/>
    ${[[4, "1"], [37, "2"], [60, "3"], [74, "4"]].map(([c, n]) => { const x = 10 + (c / 80) * 380; return `<circle cx="${x}" cy="25" r="9" fill="#fffaf0" stroke="${INK}" stroke-width="1.5"/><text x="${x}" y="29.5" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}">${n}</text>`; }).join("")}
  </svg>
  <ol class="lg-temp-key">
    <li><b>Fridge cold</b> 4°C / 40°F. Start here.</li>
    <li><b>Stop adding air</b> around 37°C / 100°F, when the pitcher is barely warm.</li>
    <li><b>Sweet spot</b> 55 to 65°C / 130 to 150°F. Stop steaming here.</li>
    <li><b>Too hot</b> 70°C+ / 160°F+. Sweetness fades and foam breaks down.</li>
  </ol>
  <p class="muted lg-note">Hand trick: when the pitcher is too hot to hold for more than 2 or 3 seconds, you are close to 60°C.</p>`;

  const cup = (foam, wide) => {
    const w = wide ? 176 : 150, half = w / 2, cx = 100, top = 20, bottom = 130;
    return `<svg viewBox="0 0 220 140" class="lg-svg" role="img" aria-hidden="true">
      <path d="M${cx - half} ${top} L${cx + half} ${top} L${cx + half - 18} ${bottom} L${cx - half + 18} ${bottom} Z" fill="#8a5a2b" stroke="${INK}" stroke-width="2"/>
      <path d="M${cx - half + 12} ${top + 70} L${cx + half - 12} ${top + 70} L${cx + half - 18} ${bottom} L${cx - half + 18} ${bottom} Z" fill="#3b2412"/>
      <rect x="${cx - half + 1}" y="${top + 1}" width="${w - 2}" height="${foam}" fill="#fff6e6"/>
      <path d="M${cx + half} ${top + 25} q24 5 0 40" fill="none" stroke="${INK}" stroke-width="2.5"/>
    </svg>`;
  };
  const svgCups = `
  <div class="lg-fig-grid lg-fig-3">
    <figure class="lg-fig">${cup(6, false)}<figcaption><b>Flat white</b> 5 to 6 oz. Thin foam, about 0.5 cm.</figcaption></figure>
    <figure class="lg-fig">${cup(12, true)}<figcaption><b>Latte</b> 8 to 12 oz. About 1 cm of foam.</figcaption></figure>
    <figure class="lg-fig">${cup(30, false)}<figcaption><b>Cappuccino</b> 5 to 6 oz. 1.5 to 2 cm of foam.</figcaption></figure>
  </div>
  <p class="muted lg-note">Darkest layer is espresso, brown is steamed milk, white is foam.</p>`;

  /* ---------------- content ---------------- */
  const TOOLS = [
    { icon: "⚖️", name: "Espresso scale", pri: "Must have", what: "Weighs your dose going in and your yield coming out, to 0.1 g, with a built in timer.",
      why: "Espresso is a recipe. Without weights you are guessing, and small changes like 1 g of dose change the taste a lot. A scale is how you repeat a great shot.", video: V.scale },
    { icon: "🔨", name: "Tamper", pri: "Must have", what: "Presses the ground coffee into a flat, firm puck. Size must match your basket (58, 54 or 51 mm are common).",
      why: "Water takes the easiest path. A level, well fitted tamp leaves no weak spots, so the water flows evenly instead of drilling a hole. How hard matters less than keeping it level.", video: V.tamp },
    { icon: "🪡", name: "WDT tool", pri: "Must have", what: "A handle with very thin needles you stir through the grounds before tamping (Weiss Distribution Technique).",
      why: "Grinders make clumps. Clumps become dense spots water avoids, which causes channeling and sour or bitter shots. Stirring for 10 to 15 seconds breaks them up. It is the cheapest big improvement in espresso.", video: V.wdt },
    { icon: "🥛", name: "Milk pitcher", pri: "Must have for milk", what: "A stainless jug with a pointed spout. 12 oz (350 ml) for one drink, 20 oz (600 ml) for two.",
      why: "The shape lets the milk spin while steaming, and the spout gives you control when pouring latte art. Too big a pitcher for the amount of milk makes good foam much harder." },
    { icon: "🥄", name: "Dosing cup or funnel", pri: "Nice to have", what: "A cup you grind into, or a ring that sits on top of the basket.",
      why: "Stops grounds spilling over the sides while you stir, so your dose stays exact and the counter stays clean." },
    { icon: "🗑️", name: "Knock box", pri: "Nice to have", what: "A box with a padded bar you knock the used puck into.",
      why: "Clean and quick, and it saves your trash can and your portafilter from getting banged up." },
    { icon: "⚪", name: "Puck screen", pri: "Nice to have", what: "A thin metal mesh disc that sits on top of the tamped puck.",
      why: "Spreads the incoming water more evenly and keeps the shower screen much cleaner. It can help a little with evenness, but it will not fix a bad grind or skipped WDT.", video: V.screen },
    { icon: "🔍", name: "Bottomless portafilter", pri: "Nice to have", what: "A portafilter with the bottom cut away so you can see the basket while the shot runs.",
      why: "It is a teacher. You can see spurts, pale streaks and holes (channeling) as they happen, then fix your prep. Great shots pour as one even, syrupy stream.", video: V.bottomless },
    { icon: "🧺", name: "Precision basket", pri: "Upgrade", what: "Baskets from brands like IMS or VST with very even, carefully sized holes.",
      why: "Stock baskets can have uneven holes. A precision basket helps water leave the puck evenly and often lets you grind a bit finer for more flavor." },
    { icon: "💧", name: "Spray bottle (RDT)", pri: "Nice to have", what: "One tiny spritz of water on the beans before grinding.",
      why: "Cuts static, so less coffee sticks to the grinder and flies around. Most useful with single dose grinders." },
    { icon: "🌡️", name: "Milk thermometer", pri: "Learning tool", what: "A clip on or digital thermometer for the pitcher.",
      why: "Helps you learn what 60°C feels and sounds like. After a few weeks most people stop needing it." },
    { icon: "🧽", name: "Cleaning kit", pri: "Must have", what: "Blind basket, group head brush, espresso machine cleaner and descaler.",
      why: "Old coffee oils taste rancid and scale kills machines. Backflush if your machine has a 3 way valve, wipe the group after every session, and descale on schedule." },
  ];

  const UPGRADES = [
    { name: "A better grinder", impact: 5, cost: "$$ to $$$", diff: "Easy", fits: "Every setup",
      body: "The single biggest upgrade in home espresso. An espresso capable grinder makes fine, even grounds and lets you adjust in very small steps. A great grinder with a basic machine beats a great machine with a weak grinder.", video: V.hoffGrind },
    { name: "A scale with a timer", impact: 4, cost: "$", diff: "Easy", fits: "Every setup",
      body: "Weighing dose and yield turns guessing into dialing in. The app's Live Pull page can even read supported Bluetooth scales.", video: V.scale },
    { name: "WDT tool and puck prep", impact: 4, cost: "$", diff: "Easy", fits: "Every setup",
      body: "Stirring out clumps and tamping level fixes most channeling. Cheap, fast and noticeable in the cup.", video: V.wdt },
    { name: "Precision basket", impact: 3, cost: "$", diff: "Easy", fits: "Most machines with 58 mm or 54 mm baskets",
      body: "More even flow through the bottom of the puck, fewer dry or wet spots, and often a sweeter shot at a finer grind." },
    { name: "Bottomless portafilter", impact: 3, cost: "$ to $$", diff: "Easy", fits: "Most machines",
      body: "Does not change the coffee by itself, but shows you exactly what your prep is doing so you improve faster." , video: V.bottomless },
    { name: "Filtered or softened water", impact: 3, cost: "$ to $$", diff: "Easy", fits: "Every machine",
      body: "Hard water leaves scale that clogs and kills machines, and water minerals affect flavor. Use a filter made for espresso or a known water recipe. Avoid pure distilled water: it tastes flat and some machines need minerals for their sensors.", video: V.water },
    { name: "PID temperature control", impact: 3, cost: "$$", diff: "Medium (wiring)", fits: "Gaggia Classic Pro, Rancilio Silvia and similar single boiler machines",
      body: "Machines without a PID swing several degrees between heating cycles. A PID holds the brew temperature steady, so shots are repeatable and you can pick a temperature for light or dark roasts.", video: V.hoffTemp },
    { name: "OPV spring (9 bar)", impact: 2, cost: "$", diff: "Medium", fits: "Gaggia Classic Pro and some older machines",
      body: "Some machines ship running well above the classic 9 bar. A lighter over pressure valve spring brings it down, which makes shots more forgiving and less harsh.", video: V.gaggia },
    { name: "Steam tip upgrade", impact: 2, cost: "$", diff: "Easy", fits: "Breville Bambino, many entry machines",
      body: "Aftermarket tips with more or differently sized holes can give more power or more control, making silky microfoam easier." },
    { name: "Flow or pressure profiling", impact: 2, cost: "$$ to $$$", diff: "Medium to hard", fits: "E61 machines (flow paddle), DIY kits for some single boilers",
      body: "Lets you start the shot gently (pre infusion) and shape the flow. It shines with light roasts. Learn the basics first, then add this.", video: V.profiling },
    { name: "New gasket and shower screen", impact: 1, cost: "$", diff: "Easy to medium", fits: "Any machine a few years old",
      body: "A hard, cracked gasket leaks around the portafilter, and a worn screen spreads water poorly. A cheap refresh that makes an older machine feel new." },
  ];

  const MILK_STEPS = [
    ["Start cold", "Use milk straight from the fridge and a cold pitcher. Cold milk gives you more time to build good foam before it gets hot."],
    ["Fill to the right level", "Pour milk to just below where the spout begins, about one third full. It needs room to grow."],
    ["Purge the wand", "Open the steam for a second into a towel to blow out water, so you are steaming with dry steam."],
    ["Stretch (add air)", "Put the tip just under the surface and open the steam fully. You want a gentle tss tss, like paper tearing. Lower the pitcher slowly as the milk rises. Stop adding air around body temperature, when the pitcher feels just barely warm."],
    ["Texture (spin)", "Raise the pitcher so the tip is about 1 cm under the surface, slightly off center. The milk should spin in a whirlpool. This folds big bubbles into tiny ones and makes it glossy."],
    ["Stop at 55 to 65°C", "When the pitcher gets too hot to hold for more than 2 or 3 seconds, shut the steam off before pulling the wand out."],
    ["Clean right away", "Wipe the wand with a damp cloth and purge it again so milk does not bake on or get sucked back in."],
    ["Groom and pour", "Tap the pitcher on the counter to pop any big bubbles, then swirl until it looks like wet paint. Pour soon, before the foam separates."],
  ];

  const MILK_FIX = [
    ["Big bubbles, soapy foam", "Tip too high or too much air too late. Keep the stretch short and early, then go deeper to spin."],
    ["Screeching noise", "Tip too deep during the stretch. Bring it up until you hear a soft hiss."],
    ["Flat milk, no foam", "Tip never broke the surface. Start with the tip just under the surface for the first few seconds."],
    ["Foam separates into a thick cap", "Not enough spinning, or the drink sat too long. Texture longer and keep swirling until you pour."],
    ["Tastes cooked or less sweet", "Too hot. Stop earlier, around 60°C."],
    ["Milk splashes everywhere", "Tip too close to the edge or opened before submerged. Submerge first, then open."],
  ];

  const MILKS = [
    ["Whole milk", "The easiest to learn with. Fat makes it creamy and the proteins hold foam well."],
    ["2% or skim", "Foams very easily but the foam is dry and stiff. Great for a big cappuccino cap, harder for latte art."],
    ["Oat (barista edition)", "The best dairy free option for texture. Barista versions add fat and stabilizers so they foam like milk."],
    ["Almond, soy, others", "Vary a lot by brand. Look for barista editions, and steam a little cooler to avoid splitting."],
  ];

  /* ---------------- render ---------------- */
  const stars = (n) => `<span class="lg-impact" aria-label="Impact ${n} of 5">${"●".repeat(n)}<span>${"●".repeat(5 - n)}</span></span>`;
  const priClass = (p) => /must/i.test(p) ? "must" : /upgrade/i.test(p) ? "up" : "nice";

  function render() {
    const main = document.querySelector("main.app-shell");
    if (!main || document.getElementById("lg-root")) return;

    // Refresh the header now that Learn covers more than history.
    const h1 = main.querySelector(".page-header h1");
    const sub = main.querySelector(".page-header .muted");
    if (h1) h1.textContent = "Learn espresso";
    if (sub) sub.textContent = "What your tools do, which upgrades are worth it, how to steam great milk, and where coffee came from.";

    const sections = main.querySelectorAll(":scope > .section");
    if (sections[0]) sections[0].id = sections[0].id || "lg-history";
    if (sections[1]) sections[1].id = sections[1].id || "lg-drinks";

    const root = document.createElement("div");
    root.id = "lg-root";
    root.innerHTML = `
      <nav class="lg-jump" aria-label="Learn sections">
        <a href="#lg-tools">🧰 Tools</a><a href="#lg-upgrades">⬆️ Upgrades</a><a href="#lg-milk">🥛 Milk</a>
        <a href="#lg-videos">▶ Videos</a><a href="#lg-history">📜 History</a><a href="#lg-drinks">☕ Drinks</a>
      </nav>

      <section class="section lg-section" id="lg-tools">
        <h2>Tools and what they are for</h2>
        <p class="muted">You do not need everything at once. Start with the "Must have" stamps, then add the rest as you get curious.</p>
        <h3 class="lg-h3">How a shot is prepped</h3>
        ${svgPuckPrep}
        <h3 class="lg-h3">What is inside the portafilter</h3>
        ${svgPortafilter}
        <div class="lg-tool-grid">
          ${TOOLS.map((t) => `
            <article class="lg-tool">
              <div class="lg-tool-head"><span class="lg-tool-icon">${t.icon}</span><h3>${t.name}</h3><span class="lg-stamp ${priClass(t.pri)}">${t.pri}</span></div>
              <p><b>What it is:</b> ${t.what}</p>
              <p><b>Why it matters:</b> ${t.why}</p>
              ${t.video ? `<a class="lg-watch" href="${yt(t.video)}" target="_blank" rel="noopener">▶ Watch: ${t.video.title}</a>` : ""}
            </article>`).join("")}
        </div>
        <p class="lg-more"><a href="gear.html">Browse tools, grinders and machines in Gear →</a></p>
      </section>

      <section class="section lg-section" id="lg-upgrades">
        <h2>Upgrading your home espresso setup</h2>
        <p class="muted">Ranked by how much they improve the cup for most people. Cost: $ under $50, $$ $50 to $250, $$$ more than $250.</p>
        <div class="lg-upgrades">
          ${UPGRADES.map((u, i) => `
            <details class="lg-upgrade"${i < 2 ? " open" : ""}>
              <summary>
                <span class="lg-rank">${String(i + 1).padStart(2, "0")}</span>
                <span class="lg-up-name">${u.name}</span>
                ${stars(u.impact)}
              </summary>
              <div class="lg-up-body">
                <div class="lg-up-meta"><span>Cost <b>${u.cost}</b></span><span>Difficulty <b>${u.diff}</b></span><span>Best for <b>${u.fits}</b></span></div>
                <p>${u.body}</p>
                ${u.video ? videoRow(u.video) : ""}
              </div>
            </details>`).join("")}
        </div>
        <div class="lg-callout"><b>Before you open a machine:</b> unplug it and let it cool fully, and check your warranty. Wiring mods like a PID are best done with a kit made for your exact model. If you are not comfortable with electrical work, a local repair shop can install it.</div>
        <h3 class="lg-h3">Which upgrade first?</h3>
        <ul class="lg-list">
          <li><b>Under $50:</b> scale, WDT tool, then a precision basket.</li>
          <li><b>$50 to $250:</b> bottomless portafilter, water filter, then a PID kit if your machine needs one.</li>
          <li><b>Bigger budget:</b> put it into the grinder before the machine.</li>
        </ul>
      </section>

      <section class="section lg-section" id="lg-milk">
        <h2>Steaming milk: the why and the how</h2>
        <div class="lg-why">
          <p><b>What steaming does.</b> The steam wand does two jobs at once: it heats the milk and it adds air. The goal is <b>microfoam</b>, millions of bubbles too small to see, so the milk turns silky, shiny and pourable like wet paint.</p>
          <p><b>Why temperature matters.</b> Milk tastes sweetest around 55 to 65°C (130 to 150°F). Hotter than about 70°C, the proteins that hold foam start to break down, the sweetness fades and it can taste cooked.</p>
          <p><b>Why two steps.</b> Air only goes in while the tip is near the surface (stretching). Spinning the milk afterwards (texturing) breaks big bubbles into tiny ones and mixes the foam through the milk.</p>
        </div>
        <h3 class="lg-h3">Where to hold the wand</h3>
        ${svgWand}
        <h3 class="lg-h3">Temperature guide</h3>
        ${svgTemp}
        <h3 class="lg-h3">Step by step</h3>
        <ol class="lg-steps">
          ${MILK_STEPS.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join("")}
        </ol>
        <h3 class="lg-h3">How much foam for each drink</h3>
        ${svgCups}
        <p class="muted" style="margin-top:6px">Stretch a little for a flat white (milk grows about 10%), a bit more for a latte (about 20%), and the most for a cappuccino (about 40 to 50%).</p>
        <h3 class="lg-h3">Troubleshooting</h3>
        <div class="lg-fix">
          ${MILK_FIX.map(([p, f]) => `<div><b>${p}</b><span>${f}</span></div>`).join("")}
        </div>
        <h3 class="lg-h3">Which milk?</h3>
        <div class="lg-fix">
          ${MILKS.map(([p, f]) => `<div><b>${p}</b><span>${f}</span></div>`).join("")}
        </div>
        <h3 class="lg-h3">Watch it done</h3>
        ${videoRow(V.milkLance, V.milkEmilee, V.milkWLL, V.latteArt)}
      </section>

      <section class="section lg-section" id="lg-videos">
        <h2>Video library</h2>
        <p class="muted">Hand picked videos from trusted coffee creators. They open in YouTube.</p>
        <h3 class="lg-h3">Espresso fundamentals (James Hoffmann series)</h3>
        ${videoRow(V.hoffDose, V.hoffRatio, V.hoffTime, V.hoffTemp, V.hoffPress)}
        <h3 class="lg-h3">Puck prep and tools</h3>
        ${videoRow(V.wdt, V.wdtTest, V.tamp, V.screen, V.bottomless, V.scale)}
        <h3 class="lg-h3">Upgrades and machine care</h3>
        ${videoRow(V.hoffGrind, V.gaggia, V.profiling, V.water)}
        <h3 class="lg-h3">Milk and latte art</h3>
        ${videoRow(V.milkLance, V.milkEmilee, V.milkWLL, V.latteArt)}
      </section>`;

    const header = main.querySelector(".page-header");
    if (header) header.insertAdjacentElement("afterend", root);
    else main.prepend(root);
  }

  function styles() {
    if (document.getElementById("lg-style")) return;
    const st = document.createElement("style");
    st.id = "lg-style";
    st.textContent = `
      .lg-jump{display:flex;gap:8px;overflow-x:auto;padding:4px 0 14px;margin-bottom:6px;position:sticky;top:0;z-index:5;background:var(--color-bg,#d9c29c)}
      .lg-jump a{flex:0 0 auto;text-decoration:none;color:var(--color-ink,#1b1a17);border:1.5px solid var(--color-ink,#1b1a17);background:var(--color-surface,#fbf7ee);border-radius:3px;padding:6px 10px;font-family:var(--font-mono,monospace);font-size:12px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
      .lg-jump a:hover{background:var(--color-ink,#1b1a17);color:#f6efe1}
      html{scroll-behavior:smooth}
      .lg-section,#lg-history,#lg-drinks{scroll-margin-top:60px}
      .lg-section h2{margin-bottom:6px}
      .lg-h3{font-family:var(--font-mono,monospace);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-primary,#a3241b);margin:22px 0 10px}
      .lg-svg{width:100%;height:auto;display:block;background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;padding:8px;box-sizing:border-box;color:var(--color-ink,#1b1a17);font-family:inherit}
      .lg-prep{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;counter-reset:none}
      .lg-prep li{background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;padding:10px 12px;display:flex;flex-direction:column;gap:3px}
      .lg-prep b{font-size:15px}
      .lg-prep small{font-size:12.5px;line-height:1.4;color:rgba(27,26,23,.8)}
      .lg-prep-n{width:22px;height:22px;border-radius:50%;background:var(--color-primary,#a3241b);color:#fff8ec;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono,monospace);font-size:12px;font-weight:700;margin-bottom:2px}
      .lg-fig-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
      .lg-fig-3{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
      .lg-fig{margin:0;background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;overflow:hidden}
      .lg-fig .lg-svg{border:none;border-radius:0;max-height:260px}
      .lg-fig figcaption{padding:8px 12px 12px;font-size:13.5px;line-height:1.45;border-top:1.5px dashed rgba(27,26,23,.35)}
      .lg-svg-bar{padding:6px 8px;max-width:640px}
      .lg-svg-pf{max-width:520px}
      .lg-temp-key{margin:10px 0 0;padding-left:22px;font-size:14px;line-height:1.6}
      .lg-temp-key b{margin-right:4px}
      .lg-note{margin-top:8px;font-size:13px}
      .lg-svg-small{font-size:10.5px;line-height:1.3;color:var(--color-ink,#1b1a17);font-family:var(--font-body,inherit)}
      .lg-tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:18px}
      .lg-tool{background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;padding:14px}
      .lg-tool p{margin:8px 0 0;font-size:14px;line-height:1.5}
      .lg-tool-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:8px;border-bottom:1.5px dashed rgba(27,26,23,.4)}
      .lg-tool-head h3{margin:0;font-size:17px;flex:1}
      .lg-tool-icon{font-size:22px}
      .lg-stamp{font-family:var(--font-mono,monospace);font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;border:1.5px solid currentColor;padding:2px 6px;border-radius:2px}
      .lg-stamp.must{color:var(--color-primary,#a3241b)} .lg-stamp.nice{color:var(--color-accent-2,#2f5d3a)} .lg-stamp.up{color:#6b4a2b}
      .lg-watch{display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--color-primary,#a3241b)}
      .lg-more a{font-weight:600;color:var(--color-primary,#a3241b)}
      .lg-upgrades{display:flex;flex-direction:column;gap:8px}
      .lg-upgrade{background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px}
      .lg-upgrade summary{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;list-style:none}
      .lg-upgrade summary::-webkit-details-marker{display:none}
      .lg-upgrade summary::after{content:"+";font-family:var(--font-mono,monospace);font-weight:700;margin-left:4px}
      .lg-upgrade[open] summary::after{content:"−"}
      .lg-rank{font-family:var(--font-mono,monospace);font-weight:700;color:var(--color-primary,#a3241b)}
      .lg-up-name{flex:1;font-weight:700;font-size:16px}
      .lg-impact{color:var(--color-primary,#a3241b);letter-spacing:2px;font-size:12px;white-space:nowrap}
      .lg-impact span{color:rgba(27,26,23,.2)}
      .lg-up-body{padding:0 14px 14px;border-top:1.5px dashed rgba(27,26,23,.35)}
      .lg-up-body p{font-size:14px;line-height:1.55;margin:10px 0 0}
      .lg-up-meta{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-family:var(--font-mono,monospace);font-size:11.5px;color:rgba(27,26,23,.75)}
      .lg-up-meta b{color:var(--color-ink,#1b1a17)}
      .lg-callout{margin-top:14px;padding:12px 14px;border:1.5px dashed var(--color-primary,#a3241b);background:rgba(163,36,27,.06);border-radius:3px;font-size:14px;line-height:1.5}
      .lg-list{margin:0;padding-left:20px;line-height:1.7;font-size:14.5px}
      .lg-why{background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;padding:6px 16px}
      .lg-why p{font-size:14.5px;line-height:1.6}
      .lg-steps{margin:0;padding-left:22px;font-size:14.5px;line-height:1.6}
      .lg-steps li{margin-bottom:8px}
      .lg-fix{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
      .lg-fix div{background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;padding:10px 12px;font-size:13.5px;line-height:1.45}
      .lg-fix b{display:block;margin-bottom:3px}
      .lg-video-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-top:10px}
      .lg-video{display:flex;flex-direction:column;text-decoration:none;color:var(--color-ink,#1b1a17);background:var(--color-surface,#fbf7ee);border:1.5px solid var(--color-ink,#1b1a17);border-radius:3px;overflow:hidden}
      .lg-video:hover{box-shadow:3px 3px 0 var(--color-ink,#1b1a17)}
      .lg-video-thumb{position:relative;aspect-ratio:16/9;background:#222;display:block;overflow:hidden}
      .lg-video-thumb img{width:100%;height:100%;object-fit:cover;display:block}
      .lg-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:var(--color-primary,#a3241b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff8ec}
      .lg-video-text{padding:9px 11px 11px;display:flex;flex-direction:column;gap:3px}
      .lg-video-text strong{font-size:13.5px;line-height:1.3}
      .lg-video-text small{font-family:var(--font-mono,monospace);font-size:10.5px;color:rgba(27,26,23,.65)}
    `;
    document.head.appendChild(st);
  }

  function boot() { styles(); render(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
