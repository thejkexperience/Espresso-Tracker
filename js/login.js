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
