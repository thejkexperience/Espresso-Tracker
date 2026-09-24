/* ===========================================================
   Espresso Tracker — Sign in / Sign up page
   =========================================================== */

let authMode = "signin"; // or "signup"
let pendingEmail = "";     // email waiting on verification

// Where the verification link sends people: this same login page,
// wherever the app is hosted (GitHub Pages folder, localhost, etc.).
function getConfirmRedirectUrl() {
  return new URL("login.html?confirmed=1", window.location.href).href;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!isSupabaseConfigured()) {
    window.location.href = "setup.html";
    return;
  }

  // already signed in? bounce straight to the intended page
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = getRedirectTarget();
    return;
  }

  buildVerifyUI();
  buildSocialButtons();

  const params = new URLSearchParams(window.location.search);
  if (params.get("confirmed") === "1") {
    showBanner("Your email is verified. Sign in below to get started.");
  }

  document.getElementById("tab-signin").addEventListener("click", () => setMode("signin"));
  document.getElementById("tab-signup").addEventListener("click", () => setMode("signup"));
  document.getElementById("auth-form").addEventListener("submit", onSubmit);
});

function getRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  return params.get("redirect") || "index.html";
}

function setMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  document.getElementById("tab-signin").className = isSignup ? "btn btn-outline" : "btn btn-primary";
  document.getElementById("tab-signup").className = isSignup ? "btn btn-primary" : "btn btn-outline";
  document.getElementById("auth-title").textContent = isSignup ? "Create your account" : "Sign in";
  document.getElementById("auth-subtitle").textContent = isSignup
    ? "Set a password to start syncing your brew log across devices."
    : "Access your brew log, beans, and recipes from any device.";
  document.getElementById("auth-submit").textContent = isSignup ? "Create account" : "Sign in";
  const firstNameField = document.getElementById("field-firstname");
  const firstNameInput = document.getElementById("auth-firstname");
  firstNameField.style.display = isSignup ? "block" : "none";
  firstNameInput.required = isSignup;
  hideMessages();
}

async function onSubmit(e) {
  e.preventDefault();
  hideMessages();
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const firstName = document.getElementById("auth-firstname").value.trim();
  const submitBtn = document.getElementById("auth-submit");
  submitBtn.disabled = true;

  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName },
          emailRedirectTo: getConfirmRedirectUrl()
        }
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = getRedirectTarget();
      } else {
        showInboxPanel(email);
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        if (/not confirmed/i.test(error.message || "")) {
          throw new Error("Your email isn't verified yet. Check your inbox for the verification link, then sign in.");
        }
        throw error;
      }
      window.location.href = getRedirectTarget();
    }
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
  }
}

/* ---------- "Continue with Google" button ---------- */

function buildSocialButtons() {
  const form = document.getElementById("auth-form");

  const wrap = document.createElement("div");
  wrap.id = "social-auth";
  wrap.innerHTML = `
    <button type="button" id="google-btn" class="btn btn-outline"
      style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1f1f1f;border:1px solid #dadce0;">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span>Continue with Google</span>
    </button>
    <div style="display:flex;align-items:center;gap:10px;margin:16px 0;" class="muted">
      <span style="flex:1;height:1px;background:currentColor;opacity:.3;"></span>
      <span>or use email</span>
      <span style="flex:1;height:1px;background:currentColor;opacity:.3;"></span>
    </div>`;
  form.parentNode.insertBefore(wrap, form);

  document.getElementById("google-btn").addEventListener("click", async () => {
    hideMessages();
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: new URL(getRedirectTarget(), window.location.href).href }
    });
    if (error) showError(error.message || "Couldn't start Google sign in. Please try again.");
  });
}

/* ---------- "Check your inbox" card + verified banner ---------- */

function buildVerifyUI() {
  const card = document.getElementById("auth-form").closest(".card");
  card.id = card.id || "auth-card";

  const banner = document.createElement("div");
  banner.id = "auth-banner";
  banner.style.cssText = "display:none;background:#E9F2E8;color:#2F5E2D;border:1px solid #4C7A4A;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:14px;";
  card.parentNode.insertBefore(banner, card);

  const panel = document.createElement("div");
  panel.className = "card";
  panel.id = "inbox-panel";
  panel.style.cssText = "display:none;text-align:center;";
  panel.innerHTML = `
    <div style="font-size:44px;line-height:1;margin-bottom:8px;">&#x1F4EC;</div>
    <h2>Check your inbox</h2>
    <p class="muted">We sent a verification link to<br><strong id="inbox-email" style="word-break:break-all;"></strong></p>
    <ol class="muted" style="text-align:left;margin:14px 0;padding-left:20px;">
      <li style="margin-bottom:6px;">Open the email we just sent you.</li>
      <li style="margin-bottom:6px;">Click the link to verify your account.</li>
      <li>Come back here and sign in.</li>
    </ol>
    <p class="muted">Don't see it within a few minutes? Check your spam or promotions folder.</p>
    <p class="muted" id="inbox-status" style="display:none;"></p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
      <button type="button" class="btn btn-outline" id="resend-btn">Resend verification email</button>
      <button type="button" class="btn btn-primary" id="back-to-signin">Back to sign in</button>
    </div>`;
  card.parentNode.insertBefore(panel, card.nextSibling);

  document.getElementById("resend-btn").addEventListener("click", onResend);
  document.getElementById("back-to-signin").addEventListener("click", () => {
    panel.style.display = "none";
    card.style.display = "";
    setMode("signin");
    document.getElementById("auth-email").value = pendingEmail;
    document.getElementById("auth-password").focus();
  });
}

function showInboxPanel(email) {
  pendingEmail = email;
  document.getElementById("inbox-email").textContent = email;
  document.getElementById("inbox-status").style.display = "none";
  document.getElementById("auth-form").closest(".card").style.display = "none";
  document.getElementById("auth-banner").style.display = "none";
  document.getElementById("inbox-panel").style.display = "";
  document.getElementById("auth-password").value = "";
  window.scrollTo(0, 0);
}

async function onResend() {
  const btn = document.getElementById("resend-btn");
  const status = document.getElementById("inbox-status");
  btn.disabled = true;
  try {
    const { error } = await supabaseClient.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: getConfirmRedirectUrl() }
    });
    if (error) throw error;
    status.style.color = "#2F5E2D";
    status.textContent = "Sent! Give it a minute and check your inbox again.";
  } catch (err) {
    status.style.color = "#B3432B";
    status.textContent = err.message || "Couldn't resend right now. Please try again in a minute.";
  } finally {
    status.style.display = "block";
    setTimeout(() => { btn.disabled = false; }, 30000);
  }
}

function showBanner(msg) {
  const el = document.getElementById("auth-banner");
  el.textContent = msg;
  el.style.display = "block";
}

function showError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.style.display = "block";
}

function showSuccess(msg) {
  const el = document.getElementById("auth-success");
  el.textContent = msg;
  el.style.display = "block";
}

function hideMessages() {
  document.getElementById("auth-error").style.display = "none";
  document.getElementById("auth-success").style.display = "none";
}
