/* ===========================================================
   Espresso Tracker — Supabase client bootstrap
   Depends on: js/supabase-config.js and the Supabase SDK
   (loaded via CDN in each page's <head>/<body> before this file).
   =========================================================== */

function isSupabaseConfigured() {
  return (
    typeof SUPABASE_URL === "string" &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_URL.trim() !== "" &&
    SUPABASE_ANON_KEY.trim() !== "" &&
    SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_PUBLIC_KEY"
  );
}

const supabaseClient = (typeof supabase !== "undefined" && isSupabaseConfigured())
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
