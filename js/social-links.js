/* =============================================================
   Social links: adds Follow @thejkespresso links (TikTok,
   Instagram, YouTube) to the Home "More" sheet and the desktop
   sidebar, right above "Take the tour". Each new link copies the
   class of the tour link so it matches the existing menu style.
   ============================================================= */
(function () {
  "use strict";

  const HANDLE = "thejkespresso";
  const LINKS = [
    { label: "TikTok", icon: "🎵", url: "https://www.tiktok.com/@" + HANDLE },
    { label: "Instagram", icon: "📸", url: "https://www.instagram.com/" + HANDLE + "/" },
    { label: "YouTube", icon: "▶️", url: "https://www.youtube.com/@" + HANDLE },
  ];

  function addLinks() {
    document.querySelectorAll("[data-tour-start]").forEach((tour) => {
      const parent = tour.parentElement;
      if (!parent || parent.querySelector("[data-social-link]")) return;
      LINKS.forEach((l) => {
        // Clone the tour link so the new one has the same markup and style.
        const a = tour.cloneNode(true);
        a.removeAttribute("data-tour-start");
        a.removeAttribute("id");
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("data-social-link", l.label.toLowerCase());
        a.setAttribute("aria-label", "Follow @" + HANDLE + " on " + l.label);
        a.classList.remove("active");
        // Swap the compass icon and the "Take the tour" words, wherever they sit.
        const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
        const texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);
        let done = false;
        texts.forEach((t) => {
          if (t.nodeValue.includes("🧭")) t.nodeValue = t.nodeValue.replace("🧭", l.icon);
          if (/take the tour/i.test(t.nodeValue)) { t.nodeValue = t.nodeValue.replace(/take the tour/i, l.label); done = true; }
        });
        if (!done) a.textContent = l.icon + " " + l.label;
        parent.insertBefore(a, tour);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addLinks);
  else addLinks();
})();
