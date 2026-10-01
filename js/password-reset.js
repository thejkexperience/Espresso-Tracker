/* =============================================================
   Forgot password, on the sign in page (login.html).
   Adds a "Forgot password?" link under the password field. It opens
   a small panel that emails a reset link. The link opens
   reset-password.html, where the user sets a new password.
   login.html?forgot=1 opens the panel directly.
   ============================================================= */
(function () {
  "use strict";

  function resetRedirectUrl() {
    return new URL("reset-password.html", window.location.href).href;
  }

  function init() {
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;
    const form = document.getElementById("auth-form");
    const pw = document.getElementById("auth-password");
    if (!form || !pw || document.getElementById("forgot-link")) return;
    const card = form.closest(".card");

    // Link under the password field (sign in mode only)
    const row = document.createElement("div");
    row.id = "forgot-row";
    row.style.cssText = "text-align:right;margin-top:6px;";
    row.innerHTML = `<a href="#" id="forgot-link" style="font-size:13px;color:var(--color-primary,#a3241b);font-weight:600;">Forgot password?</a>`;
    pw.closest(".field").appendChild(row);

    const signinTab = document.getElementById("tab-signin");
    const signupTab = document.getElementById("tab-signup");
    if (signinTab) signinTab.addEventListener("click", () => { row.style.display = ""; });
    if (signupTab) signupTab.addEventListener("click", () => { row.style.display = "none"; });

    // Reset panel
    const panel = document.createElement("div");
    panel.className = "card";
    panel.id = "forgot-panel";
    panel.style.display = "none";
    panel.innerHTML = `
      <div style="font-size:40px;line-height:1;margin-bottom:8px;text-align:center;">🔑</div>
      <h2 style="text-align:center;">Reset your password</h2>
      <p class="muted" style="text-align:center;">Enter the email you signed up with and we'll send you a link to set a new password.</p>
      <form id="forgot-form" novalidate>
        <div class="field">
          <label for="forgot-email">Email</label>
          <input type="text" inputmode="email" autocapitalize="off" spellcheck="false" id="forgot-email" required autocomplete="email" />
        </div>
        <p class="muted" id="forgot-status" style="display:none;font-size:14px;"></p>
        <button type="submit" class="btn btn-primary" id="forgot-send" style="width:100%;margin-top:8px;">Send reset link</button>
      </form>
      <button type="button" class="btn btn-outline" id="forgot-back" style="width:100%;margin-top:8px;">Back to sign in</button>
      <p class="muted" style="font-size:13px;margin-top:12px;text-align:center;">Signed up with Google? You can keep using Continue with Google, no password needed.</p>`;
    card.parentNode.insertBefore(panel, card.nextSibling);

    const emailIn = panel.querySelector("#forgot-email");
    const status = panel.querySelector("#forgot-status");
    const sendBtn = panel.querySelector("#forgot-send");
    let cooldown = null;

    function setStatus(msg, ok) {
      status.textContent = msg;
      status.style.color = ok ? "var(--color-success,#2F5E2D)" : "var(--color-danger,#B3432B)";
      status.style.display = "block";
    }

    function open() {
      const typed = document.getElementById("auth-email").value.trim();
      if (typed) emailIn.value = typed;
      status.style.display = "none";
      card.style.display = "none";
      const banner = document.getElementById("auth-banner");
      if (banner) banner.style.display = "none";
      panel.style.display = "";
      window.scrollTo(0, 0);
      setTimeout(() => emailIn.focus(), 50);
    }

    function close() {
      panel.style.display = "none";
      card.style.display = "";
      if (emailIn.value.trim()) document.getElementById("auth-email").value = emailIn.value.trim();
      document.getElementById("auth-password").focus();
    }

    document.getElementById("forgot-link").addEventListener("click", (e) => { e.preventDefault(); open(); });
    panel.querySelector("#forgot-back").addEventListener("click", close);

    panel.querySelector("#forgot-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailIn.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("Please enter a valid email address.", false);
        return;
      }
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending...";
      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl() });
        if (error) throw error;
        setStatus("If there's an account for " + email + ", a reset link is on its way. Check your inbox, and your spam folder if you don't see it in a few minutes.", true);
        let left = 60;
        sendBtn.textContent = "Resend in " + left + "s";
        clearInterval(cooldown);
        cooldown = setInterval(() => {
          left -= 1;
          if (left <= 0) {
            clearInterval(cooldown);
            sendBtn.disabled = false;
            sendBtn.textContent = "Resend link";
          } else {
            sendBtn.textContent = "Resend in " + left + "s";
          }
        }, 1000);
      } catch (err) {
        const msg = (err && err.message) || "";
        setStatus(/rate|seconds|too many/i.test(msg)
          ? "Too many requests. Please wait a minute and try again."
          : (msg || "Couldn't send the email right now. Please try again."), false);
        sendBtn.disabled = false;
        sendBtn.textContent = "Send reset link";
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get("forgot") === "1") open();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
