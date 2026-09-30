/* =============================================================
   Learn art: shaded, realistic style illustrations (inline SVG).
   Shared gradients live in one hidden <svg> so every drawing can
   reuse them. Exposes window.LG_ART.
   ============================================================= */
(function () {
  "use strict";

  const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="la-steel" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#7b8288"/><stop offset=".18" stop-color="#e9edf0"/>
        <stop offset=".38" stop-color="#b3bac0"/><stop offset=".62" stop-color="#f7f9fa"/>
        <stop offset=".82" stop-color="#9aa2a9"/><stop offset="1" stop-color="#5d646a"/>
      </linearGradient>
      <linearGradient id="la-steel-v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#b9c0c6"/><stop offset="1" stop-color="#6f777e"/>
      </linearGradient>
      <linearGradient id="la-chrome" x1="0" x2="1">
        <stop offset="0" stop-color="#5a6167"/><stop offset=".35" stop-color="#ffffff"/><stop offset=".55" stop-color="#aab2b8"/><stop offset="1" stop-color="#40474d"/>
      </linearGradient>
      <linearGradient id="la-black" x1="0" x2="1">
        <stop offset="0" stop-color="#0d0d0e"/><stop offset=".4" stop-color="#3b3d40"/><stop offset=".6" stop-color="#1f2123"/><stop offset="1" stop-color="#070708"/>
      </linearGradient>
      <linearGradient id="la-wood" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#b87a45"/><stop offset=".5" stop-color="#8a5328"/><stop offset="1" stop-color="#5b3317"/>
      </linearGradient>
      <radialGradient id="la-milk" cx=".45" cy=".35" r=".8">
        <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fbf6ec"/><stop offset="1" stop-color="#e9dfcc"/>
      </radialGradient>
      <linearGradient id="la-milk-body" x1="0" x2="1">
        <stop offset="0" stop-color="#e6dcc8"/><stop offset=".35" stop-color="#fffdf8"/><stop offset=".7" stop-color="#f6efe2"/><stop offset="1" stop-color="#d8cbb2"/>
      </linearGradient>
      <radialGradient id="la-crema" cx=".4" cy=".35" r=".75">
        <stop offset="0" stop-color="#e4b06a"/><stop offset=".55" stop-color="#b5733a"/><stop offset="1" stop-color="#6e3d17"/>
      </radialGradient>
      <linearGradient id="la-espresso" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#6e3f1c"/><stop offset="1" stop-color="#1e0f06"/>
      </linearGradient>
      <linearGradient id="la-latte" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#c79a67"/><stop offset="1" stop-color="#8d5a2e"/>
      </linearGradient>
      <linearGradient id="la-ceramic" x1="0" x2="1">
        <stop offset="0" stop-color="#d9d6d0"/><stop offset=".25" stop-color="#ffffff"/><stop offset=".7" stop-color="#f3f1ec"/><stop offset="1" stop-color="#c7c3bb"/>
      </linearGradient>
      <linearGradient id="la-glass" x1="0" x2="1">
        <stop offset="0" stop-color="#cfe3ea" stop-opacity=".9"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#a9c6d0" stop-opacity=".8"/>
      </linearGradient>
      <pattern id="la-grounds" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#4a2b14"/>
        <circle cx="1.5" cy="1.5" r=".9" fill="#6b4222"/><circle cx="4.5" cy="3.5" r=".8" fill="#2f1a0b"/><circle cx="2.5" cy="5" r=".6" fill="#7a4e2a"/>
      </pattern>
      <pattern id="la-holes" width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="url(#la-steel)"/><circle cx="3.5" cy="3.5" r="1.3" fill="#2a2e31"/>
      </pattern>
      <filter id="la-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".22"/>
      </filter>
      <filter id="la-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      <marker id="la-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#2f5d3a"/></marker>
    </defs>
  </svg>`;

  const bg = (w, h) => `<rect width="${w}" height="${h}" fill="#f7f2e8"/><ellipse cx="${w / 2}" cy="${h - 14}" rx="${w * 0.36}" ry="9" fill="#000" opacity=".12" filter="url(#la-soft)"/>`;
  const wrap = (w, h, label, body) => `<svg viewBox="0 0 ${w} ${h}" class="lg-art" role="img" aria-label="${label}">${bg(w, h)}${body}</svg>`;

  /* ---------- tool illustrations (240 x 160) ---------- */
  const dosingCup = () => wrap(240, 160, "Dosing cup", `
    <g filter="url(#la-shadow)">
      <path d="M78 40 L162 40 L154 128 Q120 138 86 128 Z" fill="url(#la-steel)"/>
      <ellipse cx="120" cy="40" rx="42" ry="10" fill="#8e969c"/>
      <ellipse cx="120" cy="40" rx="38" ry="8" fill="url(#la-grounds)"/>
      <path d="M86 128 Q120 138 154 128" fill="none" stroke="#5d646a" stroke-width="2"/>
      <path d="M92 52 L96 120" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>
    </g>`);

  const knockBox = () => wrap(240, 160, "Knock box", `
    <g filter="url(#la-shadow)">
      <path d="M48 58 L192 58 L184 136 L56 136 Z" fill="url(#la-black)"/>
      <path d="M48 58 L192 58 L188 70 L52 70 Z" fill="#2c2e31"/>
      <rect x="44" y="64" width="152" height="12" rx="6" fill="#141516"/>
      <rect x="44" y="64" width="152" height="4" rx="2" fill="#4a4d52"/>
      <path d="M62 84 L66 128" stroke="#6b6e73" stroke-width="3" opacity=".6"/>
    </g>
    <g transform="translate(96,20) rotate(8)">
      <ellipse cx="24" cy="10" rx="24" ry="8" fill="#3b2412"/>
      <rect x="0" y="10" width="48" height="16" fill="url(#la-grounds)"/>
      <ellipse cx="24" cy="26" rx="24" ry="8" fill="#2b190b"/>
      <ellipse cx="24" cy="10" rx="24" ry="8" fill="#5a3a20"/>
    </g>`);

  const basket = () => wrap(240, 160, "Precision filter basket", `
    <g filter="url(#la-shadow)">
      <ellipse cx="120" cy="46" rx="80" ry="18" fill="url(#la-steel-v)"/>
      <ellipse cx="120" cy="46" rx="68" ry="13" fill="#6f777e"/>
      <path d="M52 46 L64 116 Q120 136 176 116 L188 46 Q120 64 52 46 Z" fill="url(#la-steel)"/>
      <ellipse cx="120" cy="116" rx="56" ry="14" fill="url(#la-holes)" stroke="#5d646a"/>
      <path d="M52 46 Q120 64 188 46" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>
    </g>`);

  const spray = () => wrap(240, 160, "Spray bottle for RDT", `
    <g filter="url(#la-shadow)">
      <rect x="92" y="62" width="56" height="78" rx="12" fill="url(#la-glass)" stroke="#8fb0bb"/>
      <rect x="96" y="92" width="48" height="44" rx="9" fill="#bfe1ee" opacity=".7"/>
      <rect x="104" y="44" width="32" height="20" rx="4" fill="url(#la-black)"/>
      <path d="M110 44 L110 30 L150 30 L154 36 L136 36 L136 44 Z" fill="url(#la-black)"/>
      <path d="M100 70 L102 130" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/>
    </g>
    <g fill="#9cc7d6" opacity=".8"><circle cx="166" cy="30" r="2"/><circle cx="176" cy="26" r="1.6"/><circle cx="174" cy="36" r="1.8"/><circle cx="186" cy="31" r="1.4"/><circle cx="184" cy="22" r="1.2"/></g>`);

  const thermometer = () => wrap(240, 160, "Milk thermometer", `
    <g filter="url(#la-shadow)">
      <rect x="116" y="58" width="8" height="84" rx="4" fill="url(#la-chrome)"/>
      <circle cx="120" cy="46" r="34" fill="url(#la-steel-v)"/>
      <circle cx="120" cy="46" r="28" fill="#fdfbf6" stroke="#9aa2a9"/>
      <path d="M100 58 A24 24 0 0 1 120 22" fill="none" stroke="#6fa8dc" stroke-width="5"/>
      <path d="M120 22 A24 24 0 0 1 138 34" fill="none" stroke="#2f5d3a" stroke-width="5"/>
      <path d="M138 34 A24 24 0 0 1 142 58" fill="none" stroke="#a3241b" stroke-width="5"/>
      <line x1="120" y1="46" x2="134" y2="30" stroke="#1b1a17" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="120" cy="46" r="3" fill="#1b1a17"/>
    </g>`);

  const cleaning = () => wrap(240, 160, "Cleaning kit", `
    <g filter="url(#la-shadow)">
      <ellipse cx="80" cy="96" rx="46" ry="12" fill="url(#la-steel-v)"/>
      <path d="M36 96 L42 124 Q80 136 118 124 L124 96 Q80 110 36 96 Z" fill="url(#la-steel)"/>
      <ellipse cx="80" cy="96" rx="38" ry="8" fill="#9aa2a9"/>
      <rect x="140" y="36" width="16" height="70" rx="6" fill="url(#la-black)" transform="rotate(20 148 70)"/>
      <g transform="rotate(20 148 70)"><rect x="132" y="104" width="32" height="24" rx="4" fill="#d8c29a"/>
        <g stroke="#7a6a4d" stroke-width="1.5">${[136, 141, 146, 151, 156, 161].map((x) => `<line x1="${x}" y1="108" x2="${x}" y2="126"/>`).join("")}</g></g>
      <rect x="170" y="90" width="36" height="46" rx="5" fill="#2f5d3a"/>
      <rect x="174" y="100" width="28" height="18" rx="2" fill="#fbf7ee"/>
      <rect x="176" y="82" width="24" height="10" rx="3" fill="#1f3f27"/>
    </g>`);

  const TOOL_ART = { "Dosing cup or funnel": dosingCup, "Knock box": knockBox, "Precision basket": basket, "Spray bottle (RDT)": spray, "Milk thermometer": thermometer, "Cleaning kit": cleaning };

  /* ---------- portafilter cross section ---------- */
  const portafilter = () => `<svg viewBox="0 0 600 300" class="lg-art lg-art-wide" role="img" aria-label="Cross section of the group head, puck and basket">
    <rect width="600" height="300" fill="#f7f2e8"/>
    <g transform="translate(130,0)">
    <path d="M40 18 L270 18 L262 58 L48 58 Z" fill="url(#la-chrome)"/>
    <rect x="58" y="58" width="194" height="8" fill="#2b2e31"/>
    <text x="155" y="43" text-anchor="middle" font-size="15" font-weight="700" fill="#1b1a17">Group head</text>
    <g fill="#6fb4d6" opacity=".85">${[80, 104, 128, 152, 176, 200, 224].map((x) => `<path d="M${x} 66 q3 6 0 10 q-3 -4 0 -10" />`).join("")}</g>
    <rect x="62" y="78" width="186" height="6" fill="url(#la-holes)"/>
    <path d="M58 90 L252 90 L242 176 Q155 190 68 176 Z" fill="url(#la-steel)"/>
    <path d="M66 96 L244 96 L236 170 Q155 182 74 170 Z" fill="url(#la-grounds)"/>
    <rect x="66" y="94" width="178" height="6" rx="2" fill="#a8b0b6"/>
    <path d="M74 170 Q155 182 236 170" fill="none" stroke="#2a2e31" stroke-width="3" stroke-dasharray="2 3"/>
    <path d="M44 88 L266 88 L256 196 Q155 214 54 196 Z" fill="none" stroke="url(#la-chrome)" stroke-width="8"/>
    <path d="M44 120 L-110 156" stroke="url(#la-black)" stroke-width="22" stroke-linecap="round"/>
    <path d="M44 120 L0 130" stroke="url(#la-chrome)" stroke-width="16" stroke-linecap="round"/>
    <text x="-70" y="190" text-anchor="middle" font-size="14" fill="#1b1a17">Handle</text>
    <path d="M140 204 L170 204 L164 220 L146 220 Z" fill="url(#la-chrome)"/>
    <path d="M150 220 q4 30 -2 62" stroke="url(#la-espresso)" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M160 220 q-2 30 4 62" stroke="url(#la-espresso)" stroke-width="6" fill="none" stroke-linecap="round"/>
    <g font-size="14" fill="#1b1a17">
      ${[["Water from the boiler", 232, 71, 30], ["Shower screen", 246, 81, 70], ["Puck screen (optional)", 242, 97, 110], ["Coffee puck", 236, 134, 150], ["Basket holes", 230, 176, 190], ["Espresso", 168, 250, 250]]
        .map(([t, px, py, ly]) => `<line x1="${px}" y1="${py}" x2="296" y2="${ly}" stroke="#1b1a17" stroke-width="1"/><circle cx="${px}" cy="${py}" r="2.5" fill="#a3241b"/><text x="302" y="${ly + 5}">${t}</text>`).join("")}
    </g>
    </g>
  </svg>`;

  /* ---------- steaming pitcher (stretch / texture) ---------- */
  const pitcher = (texture) => {
    const surf = texture ? 104 : 112;
    const tipX = texture ? 150 : 140, tipY = texture ? surf + 22 : surf + 5;
    return `<svg viewBox="0 0 280 260" class="lg-art" role="img" aria-label="${texture ? "Texturing: tip deeper, milk spinning" : "Stretching: tip just under the surface"}">
      <rect width="280" height="260" fill="#f7f2e8"/>
      <ellipse cx="130" cy="240" rx="86" ry="9" fill="#000" opacity=".15" filter="url(#la-soft)"/>
      <!-- milk inside (cutaway) -->
      <path d="M58 ${surf} L202 ${surf} L194 232 L66 232 Z" fill="url(#la-milk-body)"/>
      <ellipse cx="130" cy="${surf}" rx="72" ry="10" fill="url(#la-milk)"/>
      ${texture
        ? `<ellipse cx="128" cy="170" rx="46" ry="20" fill="none" stroke="#2f5d3a" stroke-width="3" stroke-dasharray="10 7" opacity=".85"/>
           <path d="M170 160 l8 9 l-12 3" fill="none" stroke="#2f5d3a" stroke-width="3"/>
           <path d="M86 ${surf} q44 -8 88 0" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>`
        : `<g fill="#fff" stroke="#d9ccb4" stroke-width=".8">${[[118, 4, 5], [128, -3, 4], [134, 3, 3.5], [146, -2, 5], [108, -1, 3]].map(([x, dy, r]) => `<circle cx="${x}" cy="${surf + dy}" r="${r}"/>`).join("")}</g>
           <path d="M110 ${surf - 12} q6 -10 0 -18 M150 ${surf - 14} q-6 -10 0 -18" stroke="#c9c1b3" stroke-width="2" fill="none" opacity=".7"/>`}
      <!-- pitcher walls (stainless, cut open) -->
      <path d="M50 70 L210 70 L200 236 L60 236 Z" fill="none" stroke="url(#la-steel)" stroke-width="10" stroke-linejoin="round"/>
      <path d="M50 70 L210 70 L236 58" fill="none" stroke="url(#la-steel)" stroke-width="10" stroke-linecap="round"/>
      <path d="M212 104 q40 10 36 50 q-2 30 -40 40" fill="none" stroke="url(#la-steel)" stroke-width="12" stroke-linecap="round"/>
      <text x="44" y="${surf + 4}" text-anchor="end" font-size="11" fill="#6b5a3f">milk line</text>
      <!-- steam wand -->
      <path d="M${tipX + 44} 0 L${tipX} ${tipY}" stroke="url(#la-chrome)" stroke-width="10" stroke-linecap="round"/>
      <circle cx="${tipX}" cy="${tipY}" r="6.5" fill="#a3241b" stroke="#fff" stroke-width="1.5"/>
    </svg>`;
  };

  /* ---------- cups: flat white, latte, cappuccino (cutaway) ---------- */
  const cup = (kind) => {
    const spec = { flat: { w: 118, h: 70, foam: 5 }, latte: { w: 142, h: 96, foam: 9 }, capp: { w: 124, h: 76, foam: 22 } }[kind];
    const cx = 110, top = 150 - spec.h - 20, bot = 150 - 20;
    const half = spec.w / 2, inset = 14;
    const espTop = bot - spec.h * 0.38;
    return `<svg viewBox="0 0 230 170" class="lg-art" role="img" aria-hidden="true">
      <rect width="230" height="170" fill="#f7f2e8"/>
      <ellipse cx="${cx}" cy="${bot + 12}" rx="${half + 30}" ry="10" fill="url(#la-ceramic)" stroke="#cfcac1"/>
      <ellipse cx="${cx}" cy="${bot + 12}" rx="${half + 30}" ry="10" fill="#000" opacity=".06"/>
      <path d="M${cx - half} ${top} L${cx + half} ${top} Q${cx + half - 6} ${bot} ${cx + half - inset} ${bot + 2} L${cx - half + inset} ${bot + 2} Q${cx - half + 6} ${bot} ${cx - half} ${top} Z" fill="url(#la-ceramic)" stroke="#bdb8ae"/>
      <path d="M${cx + half - 2} ${top + 12} q34 4 26 30 q-6 16 -30 14" fill="none" stroke="url(#la-ceramic)" stroke-width="9"/>
      <!-- cutaway contents -->
      <clipPath id="la-cup-${kind}"><path d="M${cx - half + 5} ${top + 4} L${cx + half - 5} ${top + 4} Q${cx + half - 10} ${bot - 4} ${cx + half - inset - 2} ${bot - 2} L${cx - half + inset + 2} ${bot - 2} Q${cx - half + 10} ${bot - 4} ${cx - half + 5} ${top + 4} Z"/></clipPath>
      <g clip-path="url(#la-cup-${kind})">
        <rect x="${cx - half}" y="${top}" width="${spec.w}" height="${spec.h + 4}" fill="url(#la-latte)"/>
        <rect x="${cx - half}" y="${espTop}" width="${spec.w}" height="${bot - espTop + 2}" fill="url(#la-espresso)"/>
        <rect x="${cx - half}" y="${top + 4}" width="${spec.w}" height="${spec.foam}" fill="url(#la-milk)"/>
        <path d="M${cx - half} ${top + 4 + spec.foam} q${spec.w / 4} 3 ${spec.w / 2} 0 t${spec.w / 2} 0" fill="none" stroke="#e8dcc4" stroke-width="2"/>
      </g>
      <ellipse cx="${cx}" cy="${top + 1}" rx="${half}" ry="7" fill="#fbf7ee" stroke="#bdb8ae"/>
      <ellipse cx="${cx}" cy="${top + 2}" rx="${half - 5}" ry="5" fill="url(#la-crema)" opacity=".35"/>
      <path d="M${cx - 10} ${top + 1} q10 -6 20 0 q-10 6 -20 0" fill="#fffaf0"/>
    </svg>`;
  };

  /* ---------- puck prep step icons (64 x 64) ---------- */
  const stepIcon = (n) => {
    const icons = {
      grind: `<rect x="22" y="6" width="20" height="14" rx="3" fill="url(#la-black)"/><path d="M18 20 L46 20 L42 44 L22 44 Z" fill="url(#la-steel)"/><path d="M26 44 L38 44 L36 54 L28 54 Z" fill="#3b2412"/>`,
      dose: `<ellipse cx="32" cy="22" rx="22" ry="6" fill="#8e969c"/><path d="M10 22 L16 50 Q32 56 48 50 L54 22 Q32 30 10 22 Z" fill="url(#la-steel)"/><ellipse cx="32" cy="22" rx="18" ry="4" fill="url(#la-grounds)"/>`,
      wdt: `<rect x="26" y="4" width="12" height="22" rx="5" fill="url(#la-wood)"/>${[28, 31, 34, 37].map((x) => `<line x1="${x}" y1="26" x2="${x}" y2="54" stroke="#9aa2a9" stroke-width="1.2"/>`).join("")}<ellipse cx="32" cy="52" rx="20" ry="5" fill="url(#la-grounds)"/>`,
      tamp: `<rect x="27" y="4" width="10" height="24" rx="5" fill="url(#la-black)"/><rect x="14" y="28" width="36" height="10" rx="2" fill="url(#la-steel)"/><rect x="12" y="44" width="40" height="10" fill="url(#la-grounds)"/>`,
      screen: `<ellipse cx="32" cy="34" rx="24" ry="9" fill="url(#la-holes)" stroke="#6f777e"/><ellipse cx="32" cy="46" rx="24" ry="7" fill="url(#la-grounds)"/>`,
      brew: `<path d="M16 26 L48 26 L44 54 L20 54 Z" fill="url(#la-glass)" stroke="#8fb0bb"/><path d="M19 40 L45 40 L44 54 L20 54 Z" fill="url(#la-espresso)"/><ellipse cx="32" cy="40" rx="13" ry="2.5" fill="url(#la-crema)"/><path d="M30 6 q3 10 0 18 M34 6 q-2 10 1 18" stroke="#6e3f1c" stroke-width="2.5" fill="none"/>`,
    };
    return `<svg viewBox="0 0 64 64" class="lg-step-art" aria-hidden="true">${icons[n]}</svg>`;
  };

  window.LG_ART = { DEFS, TOOL_ART, portafilter, pitcher, cup, stepIcon };
})();
