/* ===========================================================
   Espresso Tracker — Auth helpers
   Depends on: js/supabase-config.js, Supabase SDK, js/supabase-client.js, js/app.js
   =========================================================== */

/**
 * Renders the page shell (nav + auth status) and, for pages that require
 * a signed-in user, redirects to setup.html (if Supabase isn't configured
 * yet) or login.html (if nobody's signed in).
 *
 * @param {string} activePage - e.g. "brew-log.html"
 * @param {boolean} requireLogin - true for personal-data pages
 * @returns {Promise<object|null>} the Supabase session, or null if the
 *          caller should stop (a redirect is already underway)
 */
async function initAuthUI(activePage, requireLogin) {
  if (!isSupabaseConfigured()) {
    if (requireLogin) {
      window.location.href = "setup.html";
      return null;
    }
    renderShell(activePage);
    return null;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (requireLogin && !session) {
    window.location.href = "login.html?redirect=" + encodeURIComponent(activePage);
    return null;
  }

  const authSlotHtml = session
    ? `<div class="auth-status">
         <span>${escapeHtml(session.user.email)}</span>
         <button class="btn btn-sm btn-outline" id="sign-out-btn">Sign out</button>
       </div>`
    : `<a href="login.html" class="btn btn-sm btn-accent">Sign in</a>`;

  renderShell(activePage, { authSlotHtml });

  const signOutBtn = document.getElementById("sign-out-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  }

  return session;
}

async function getCurrentUser() {
  if (!supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}
