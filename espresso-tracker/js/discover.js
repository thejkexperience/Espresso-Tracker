/* ===========================================================
   Espresso Tracker — Discover page (roasters + community)
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderShell("discover.html");
  renderRoasters();
  renderCommunity();

  document.getElementById("find-nearby-btn").addEventListener("click", findNearbyRoasters);
});

function renderRoasters() {
  const el = document.getElementById("roaster-grid");
  el.innerHTML = ROASTER_DIRECTORY.map(r => `
    <div class="catalog-card">
      <h3>${escapeHtml(r.name)}</h3>
      <div class="muted">${escapeHtml(r.location)}</div>
      <p>${escapeHtml(r.specialty)}</p>
      <a href="${escapeHtml(r.site)}" target="_blank" rel="noopener">Visit site ↗</a>
    </div>
  `).join("");
}

function renderCommunity() {
  const el = document.getElementById("community-grid");
  el.innerHTML = COMMUNITY_LINKS.map(c => `
    <div class="catalog-card">
      <div class="flex-between">
        <h3>${escapeHtml(c.name)}</h3>
        <span class="badge badge-light">${escapeHtml(c.type)}</span>
      </div>
      <p>${escapeHtml(c.desc)}</p>
      <a href="${escapeHtml(c.link)}" target="_blank" rel="noopener">Open ↗</a>
    </div>
  `).join("");
}

// ---------- Live "near me" search via OpenStreetMap Overpass API ----------
// No API key or account required. We query OSM for nodes tagged as coffee
// shops/roasters within ~20km of the user's location, then sort by distance.

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];
const NEARBY_RADIUS_METERS = 20000; // ~12.4 miles

function findNearbyRoasters() {
  if (!navigator.geolocation) {
    showNearbyStatus("Your browser doesn't support location lookup. Try the Discover directory above instead, or search your maps app directly for 'coffee roaster near me'.", true);
    return;
  }

  showNearbyStatus("Getting your location…");
  document.getElementById("nearby-results").innerHTML = "";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      showNearbyStatus("Searching OpenStreetMap for nearby roasters and coffee shops…");
      try {
        const places = await queryOverpassForCoffee(latitude, longitude);
        renderNearbyResults(places, latitude, longitude);
      } catch (err) {
        console.error(err);
        showNearbyStatus(
          `Couldn't reach the map search right now. You can try again, or `
          + `<a href="https://www.google.com/maps/search/specialty+coffee+roaster/@${latitude},${longitude},13z" target="_blank" rel="noopener">open a Google Maps search instead ↗</a>.`,
          true
        );
      }
    },
    (err) => {
      showNearbyStatus(
        "Location access was denied or unavailable, so I can't search near you automatically. "
        + `You can <a href="https://www.google.com/maps/search/specialty+coffee+roaster+near+me" target="_blank" rel="noopener">open a Google Maps search</a> instead.`,
        true
      );
    },
    { timeout: 10000, maximumAge: 300000 }
  );
}

async function queryOverpassForCoffee(lat, lng) {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="coffee"](around:${NEARBY_RADIUS_METERS},${lat},${lng});
      node["shop"="roastery"](around:${NEARBY_RADIUS_METERS},${lat},${lng});
      node["craft"="coffee_roaster"](around:${NEARBY_RADIUS_METERS},${lat},${lng});
      node["cuisine"="coffee_shop"](around:${NEARBY_RADIUS_METERS},${lat},${lng});
    );
    out center 40;
  `;

  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query)
      });
      if (!res.ok) throw new Error("Overpass responded with " + res.status);
      const json = await res.json();
      return dedupeByName(json.elements || []);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All Overpass endpoints failed");
}

function dedupeByName(elements) {
  const seen = new Set();
  const out = [];
  for (const el of elements) {
    const name = (el.tags && el.tags.name) || null;
    if (!name) continue; // skip unnamed nodes, not useful to show
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(el);
  }
  return out;
}

function renderNearbyResults(places, userLat, userLng) {
  if (!places.length) {
    showNearbyStatus(
      "No named coffee shops or roasters turned up on OpenStreetMap within about 12 miles. "
      + `Coverage varies by area — try <a href="https://www.google.com/maps/search/specialty+coffee+roaster/@${userLat},${userLng},13z" target="_blank" rel="noopener">Google Maps</a> for a second opinion.`,
      true
    );
    return;
  }

  const withDistance = places.map(p => ({
    ...p,
    distanceMiles: haversineMiles(userLat, userLng, p.lat, p.lon)
  })).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 15);

  showNearbyStatus(`Found ${withDistance.length} nearby, closest first. Data from OpenStreetMap contributors.`);

  const el = document.getElementById("nearby-results");
  el.innerHTML = withDistance.map(p => {
    const tags = p.tags || {};
    const address = buildAddress(tags);
    const kind = tags.shop === "roastery" || tags.craft === "coffee_roaster" ? "Roaster" : "Coffee shop";
    const osmLink = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`;
    const gmapsLink = `https://www.google.com/maps/search/${encodeURIComponent(tags.name + (address ? " " + address : ""))}`;
    return `
      <div class="catalog-card">
        <div class="flex-between">
          <h3>${escapeHtml(tags.name)}</h3>
          <span class="badge badge-light">${kind}</span>
        </div>
        <div class="muted">${p.distanceMiles.toFixed(1)} mi away${address ? " · " + escapeHtml(address) : ""}</div>
        ${tags.website ? `<a href="${escapeHtml(normalizeUrl(tags.website))}" target="_blank" rel="noopener">Website ↗</a>` : ""}
        <div class="flex gap-8 mt-16">
          <a class="btn btn-outline btn-sm" href="${osmLink}" target="_blank" rel="noopener">View on map</a>
          <a class="btn btn-outline btn-sm" href="${gmapsLink}" target="_blank" rel="noopener">Google Maps</a>
        </div>
      </div>`;
  }).join("");
}

function buildAddress(tags) {
  const parts = [];
  if (tags["addr:housenumber"] || tags["addr:street"]) {
    parts.push([tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "));
  }
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  return parts.join(", ");
}

function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function showNearbyStatus(html, isWarning) {
  const el = document.getElementById("nearby-status");
  el.style.display = "block";
  el.style.color = isWarning ? "var(--color-danger)" : "var(--color-muted)";
  el.innerHTML = html;
}
