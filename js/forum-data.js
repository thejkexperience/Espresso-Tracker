/* ===========================================================
   Espresso Tracker — Community forum data layer (Supabase)
   Usernames live in espresso_profiles. Posts, replies, reports
   and blocks are protected by Row Level Security in Supabase.
   Depends on: js/supabase-client.js, js/auth.js
   =========================================================== */

const FORUM_CATEGORIES = [
  { id: "dialing-in", label: "Dialing in", icon: "🎯" },
  { id: "gear", label: "Gear", icon: "⚙️" },
  { id: "beans", label: "Beans", icon: "🌱" },
  { id: "milk", label: "Milk & latte art", icon: "🥛" },
  { id: "general", label: "General", icon: "💬" }
];

const USERNAME_RULE = /^[A-Za-z0-9_]{3,20}$/;

function forumCategory(id) {
  return FORUM_CATEGORIES.find(c => c.id === id) || { id, label: id, icon: "💬" };
}

// ---------- Profiles / usernames ----------

async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabaseClient.from("espresso_profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}

async function isUsernameAvailable(name) {
  if (!USERNAME_RULE.test(name || "")) return false;
  const { data, error } = await supabaseClient.rpc("espresso_username_available", { name });
  if (error) { console.error(error); return true; } // don't block sign up on a network hiccup
  return !!data;
}

// Creates or renames the signed in user's forum profile.
async function saveMyUsername(username, acceptRules) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be signed in.");
  if (!USERNAME_RULE.test(username)) throw new Error("Usernames are 3 to 20 letters, numbers, or underscores.");
  const existing = await getMyProfile();
  let result;
  if (existing) {
    const row = { username };
    if (acceptRules && !existing.accepted_rules_at) row.accepted_rules_at = new Date().toISOString();
    result = await supabaseClient.from("espresso_profiles").update(row).eq("id", user.id).select().single();
  } else {
    result = await supabaseClient.from("espresso_profiles").insert({
      id: user.id,
      username,
      accepted_rules_at: acceptRules ? new Date().toISOString() : null
    }).select().single();
  }
  if (result.error) {
    if (result.error.code === "23505") throw new Error("That username is already taken. Try another one.");
    throw result.error;
  }
  // Keep a copy on the account too, so it follows the user everywhere.
  supabaseClient.auth.updateUser({ data: { username } }).catch(() => {});
  return result.data;
}

async function acceptForumRules() {
  const user = await getCurrentUser();
  const { data, error } = await supabaseClient.from("espresso_profiles")
    .update({ accepted_rules_at: new Date().toISOString() }).eq("id", user.id).select().single();
  if (error) throw error;
  return data;
}

async function getUsernames(ids) {
  const map = {};
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return map;
  const { data, error } = await supabaseClient.from("espresso_profiles")
    .select("id, username, is_moderator").in("id", unique);
  if (error) { console.error(error); return map; }
  data.forEach(p => { map[p.id] = p; });
  return map;
}

// ---------- Blocks ----------

async function getBlockedIds() {
  const { data, error } = await supabaseClient.from("forum_blocks").select("blocked_id");
  if (error) { console.error(error); return new Set(); }
  return new Set(data.map(r => r.blocked_id));
}

async function blockUser(userId) {
  const me = await getCurrentUser();
  const { error } = await supabaseClient.from("forum_blocks").insert({ blocker_id: me.id, blocked_id: userId });
  if (error && error.code !== "23505") throw error;
}

async function unblockUser(userId) {
  const me = await getCurrentUser();
  const { error } = await supabaseClient.from("forum_blocks").delete().eq("blocker_id", me.id).eq("blocked_id", userId);
  if (error) throw error;
}

// ---------- Posts ----------

async function listForumPosts({ category, search, unansweredOnly, limit } = {}) {
  let q = supabaseClient.from("forum_posts")
    .select("id, user_id, category, title, body, photo_path, accepted_reply_id, reply_count, last_activity_at, is_removed, created_at")
    .order("last_activity_at", { ascending: false })
    .limit(limit || 100);
  if (category) q = q.eq("category", category);
  if (unansweredOnly) q = q.eq("reply_count", 0);
  if (search) {
    const s = search.replace(/[%,()]/g, " ").trim();
    if (s) q = q.or(`title.ilike.%${s}%,body.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data;
}

async function getForumPost(id) {
  const { data, error } = await supabaseClient.from("forum_posts").select("*").eq("id", id).maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}

async function createForumPost(post) {
  const me = await getCurrentUser();
  const { data, error } = await supabaseClient.from("forum_posts").insert({
    user_id: me.id,
    category: post.category,
    title: post.title,
    body: post.body,
    brew_snapshot: post.brewSnapshot || null
  }).select().single();
  if (error) throw error;
  return data;
}

async function updateForumPost(id, fields) {
  const { data, error } = await supabaseClient.from("forum_posts").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function deleteForumPost(post) {
  const { error } = await supabaseClient.from("forum_posts").delete().eq("id", post.id);
  if (error) throw error;
  if (post.photo_path) deleteForumPhoto(post.photo_path);
}

// ---------- Replies ----------

async function listForumReplies(postId) {
  const { data, error } = await supabaseClient.from("forum_replies")
    .select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

async function createForumReply(postId, body) {
  const me = await getCurrentUser();
  const { data, error } = await supabaseClient.from("forum_replies")
    .insert({ post_id: postId, user_id: me.id, body }).select().single();
  if (error) throw error;
  return data;
}

async function updateForumReply(id, fields) {
  const { data, error } = await supabaseClient.from("forum_replies").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function deleteForumReply(reply) {
  const { error } = await supabaseClient.from("forum_replies").delete().eq("id", reply.id);
  if (error) throw error;
  if (reply.photo_path) deleteForumPhoto(reply.photo_path);
}

// ---------- Reports (moderation) ----------

async function reportForumContent({ postId, replyId, reason }) {
  const me = await getCurrentUser();
  const { error } = await supabaseClient.from("forum_reports").insert({
    reporter_id: me.id, post_id: postId || null, reply_id: replyId || null, reason
  });
  if (error) throw error;
}

async function listOpenReports() {
  const { data, error } = await supabaseClient.from("forum_reports")
    .select("*").eq("resolved", false).order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

async function resolveReport(id) {
  const { error } = await supabaseClient.from("forum_reports").update({ resolved: true }).eq("id", id);
  if (error) throw error;
}

// ---------- Photos ----------
// Stored at "<user_id>/<post_id>/<name>" in the private "forum-photos" bucket.
// Any signed in user can view them through short lived signed links.

async function uploadForumPhoto(postId, file) {
  const me = await getCurrentUser();
  const ext = ((file.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${me.id}/${postId}/${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage.from("forum-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

async function deleteForumPhoto(path) {
  if (!path) return;
  const { error } = await supabaseClient.storage.from("forum-photos").remove([path]);
  if (error) console.error(error);
}

async function getForumPhotoUrls(paths) {
  const map = {};
  const unique = [...new Set((paths || []).filter(Boolean))];
  if (!unique.length) return map;
  const { data, error } = await supabaseClient.storage.from("forum-photos").createSignedUrls(unique, 3600);
  if (error) { console.error(error); return map; }
  (data || []).forEach(d => { if (d.signedUrl) map[d.path] = d.signedUrl; });
  return map;
}

// Scale big phone photos down before upload.
function shrinkForumImage(file, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, (maxSize || 1400) / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 900000) { URL.revokeObjectURL(url); resolve(file); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file);
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ---------- Helpers ----------

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Turns a saved brew into the small summary shared with a question.
function brewToSnapshot(brew) {
  const ratio = brew.doseWeight && brew.yieldWeight ? (brew.yieldWeight / brew.doseWeight).toFixed(1) : "";
  return {
    bean: brew.beanName || "",
    dose: brew.doseWeight || "",
    yield: brew.yieldWeight || "",
    ratio,
    time: brew.brewTime || "",
    grind: brew.grindSize || "",
    grinder: brew.grinderType || "",
    machine: brew.machineType || "",
    temp: brew.waterTemp || "",
    rating: brew.rating || "",
    tasteNotes: brew.feedback || ""
  };
}
