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
 *   caller should stop (a redirect is already underway)
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

  let authSlotHtml;
  if (session) {
    const firstName = (session.user.user_metadata && session.user.user_metadata.first_name) || "";
    const displayName = firstName || session.user.email.split("@")[0];
    authSlotHtml = `<div class="account-menu" id="account-menu">
      <button type="button" class="account-toggle" id="account-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="account-dropdown">
        <span class="account-name">${escapeHtml(displayName)}</span>
        <span class="account-caret">▾</span>
      </button>
      <div class="account-dropdown" id="account-dropdown">
        <div class="account-email">${escapeHtml(session.user.email)}</div>
        <div class="account-edit-name" id="account-edit-name" style="display:none;">
          <input type="text" id="account-name-input" placeholder="First name" value="${escapeHtml(firstName)}" />
          <div class="account-edit-error" id="account-edit-error"></div>
          <div class="account-edit-actions">
            <button type="button" class="btn btn-sm btn-primary" id="save-name-btn">Save</button>
            <button type="button" class="btn btn-sm btn-outline" id="cancel-name-btn">Cancel</button>
          </div>
        </div>
        <button type="button" class="account-dropdown-item" id="edit-name-btn">${firstName ? "Edit name" : "Add your name"}</button>
        <button type="button" class="account-dropdown-item" id="sign-out-btn">Sign out</button>
      </div>
    </div>`;
  } else {
    authSlotHtml = `<a href="login.html" class="btn btn-sm btn-accent">Sign in</a>`;
  }

  renderShell(activePage, { authSlotHtml });

  if (session) {
    setupAccountMenu(session);
  }

  return session;
}

function setupAccountMenu(session) {
  const menu = document.getElementById("account-menu");
  const toggle = document.getElementById("account-toggle");
  const dropdown = document.getElementById("account-dropdown");
  const editNameBtn = document.getElementById("edit-name-btn");
  const editNameBox = document.getElementById("account-edit-name");
  const nameInput = document.getElementById("account-name-input");
  const errorEl = document.getElementById("account-edit-error");
  const saveNameBtn = document.getElementById("save-name-btn");
  const cancelNameBtn = document.getElementById("cancel-name-btn");
  const signOutBtn = document.getElementById("sign-out-btn");

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
      const nameSpan = document.querySelector("#account-toggle .account-name");
      if (nameSpan) nameSpan.textContent = newName;
      editNameBtn.textContent = "Edit name";
      editNameBox.style.display = "none";
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

async function getCurrentUser() {
  if (!supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}
