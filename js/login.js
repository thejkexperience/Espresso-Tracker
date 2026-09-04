/* ===========================================================
   Espresso Tracker — Sign in / Sign up page
   =========================================================== */

let authMode = "signin"; // or "signup"

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
        options: { data: { first_name: firstName } }
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = getRedirectTarget();
      } else {
        showSuccess("Account created! Please check your email for email verification, then come back and sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = getRedirectTarget();
    }
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
  }
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
