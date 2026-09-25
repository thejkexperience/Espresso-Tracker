/* ===========================================================
   Espresso Tracker — Community forum page
   Views: username setup, topic list, single topic (#post=<id>)
   =========================================================== */

const forumState = {
  me: null,          // auth user
  profile: null,     // espresso_profiles row
  blocked: new Set(),
  category: "",
  unanswered: false,
  pendingBrew: null, // brew snapshot waiting to be attached to a new question
  newPostPhoto: null,
  replyPhoto: null,
  currentPost: null
};

document.addEventListener("DOMContentLoaded", async () => {
  const session = await initAuthUI("forum.html", true);
  if (!session) return;
  forumState.me = session.user;

  buildCategoryControls();
  wireStaticControls();

  forumState.profile = await getMyProfile();
  await maybeAutoClaimUsername();

  if (!forumState.profile || !forumState.profile.accepted_rules_at) {
    showSetup();
    return;
  }
  await enterForum();
});

/* ---------- Username + community rules setup ---------- */

// If someone picked a username at sign up, claim it for them automatically.
async function maybeAutoClaimUsername() {
  if (forumState.profile) return;
  const wanted = forumState.me.user_metadata && forumState.me.user_metadata.username;
  if (!wanted || !USERNAME_RULE.test(wanted)) return;
  try {
    forumState.profile = await saveMyUsername(wanted, false);
  } catch (e) {
    // Taken in the meantime; they'll pick another on the setup screen.
  }
}

function showSetup() {
  document.getElementById("forum-main").style.display = "none";
  document.getElementById("forum-setup").style.display = "";
  const input = document.getElementById("setup-username");
  input.value = (forumState.profile && forumState.profile.username) ||
    (forumState.me.user_metadata && forumState.me.user_metadata.username) || "";
  if (forumState.profile && forumState.profile.username) {
    document.getElementById("setup-title").textContent = "One last step";
    document.getElementById("setup-intro").textContent = "Please read and agree to the community rules before joining the conversation.";
  }
}

async function onSetupSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("setup-username").value.trim();
  const agreed = document.getElementById("setup-agree").checked;
  const err = document.getElementById("setup-error");
  err.style.display = "none";
  if (!agreed) {
    err.textContent = "Please agree to the community rules to continue.";
    err.style.display = "block";
    return;
  }
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    if (!forumState.profile || forumState.profile.username !== username) {
      forumState.profile = await saveMyUsername(username, true);
    }
    if (!forumState.profile.accepted_rules_at) {
      forumState.profile = await acceptForumRules();
    }
    document.getElementById("forum-setup").style.display = "none";
    await enterForum();
  } catch (ex) {
    err.textContent = ex.message || "Couldn't save that. Please try again.";
    err.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

async function enterForum() {
  document.getElementById("forum-main").style.display = "";
  document.getElementById("my-username").textContent = "@" + forumState.profile.username;
  document.getElementById("mod-tools").style.display = forumState.profile.is_moderator ? "" : "none";
  forumState.blocked = await getBlockedIds();

  // Coming from the brew log with a shot to ask about?
  const params = new URLSearchParams(location.search);
  const brewId = params.get("brew");
  if (brewId) {
    const brew = await getBrew(brewId);
    if (brew) {
      forumState.pendingBrew = brewToSnapshot(brew);
      openNewPostModal();
    }
    history.replaceState(null, "", "forum.html" + location.hash);
  }

  window.addEventListener("hashchange", route);
  await route();
  if (forumState.profile.is_moderator) refreshReportCount();
}

/* ---------- Routing ---------- */

async function route() {
  const m = location.hash.match(/^#post=([0-9a-f-]{36})$/i);
  if (m) {
    document.getElementById("forum-list-view").style.display = "none";
    document.getElementById("forum-post-view").style.display = "";
    await renderPost(m[1]);
  } else {
    document.getElementById("forum-post-view").style.display = "none";
    document.getElementById("forum-list-view").style.display = "";
    forumState.currentPost = null;
    await renderList();
  }
  window.scrollTo(0, 0);
}

/* ---------- Topic list ---------- */

function buildCategoryControls() {
  const bar = document.getElementById("category-bar");
  const all = [{ id: "", label: "All", icon: "" }].concat(FORUM_CATEGORIES);
  bar.innerHTML = all.map(c =>
    `<button type="button" data-cat="${c.id}" class="${c.id === "" ? "selected" : ""}">${c.icon ? c.icon + " " : ""}${escapeHtml(c.label)}</button>`
  ).join("") + `<button type="button" id="unanswered-toggle">❓ Unanswered</button>`;
  bar.querySelectorAll("button[data-cat]").forEach(b => b.addEventListener("click", () => {
    forumState.category = b.dataset.cat;
    bar.querySelectorAll("button[data-cat]").forEach(x => x.classList.toggle("selected", x === b));
    renderList();
  }));
  document.getElementById("unanswered-toggle").addEventListener("click", (e) => {
    forumState.unanswered = !forumState.unanswered;
    e.currentTarget.classList.toggle("selected", forumState.unanswered);
    renderList();
  });

  const sel = document.getElementById("np-category");
  sel.innerHTML = FORUM_CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.label)}</option>`).join("");
}

async function renderList() {
  const el = document.getElementById("topic-list");
  el.innerHTML = `<div class="muted">Loading conversations…</div>`;
  const posts = (await listForumPosts({
    category: forumState.category,
    search: document.getElementById("forum-search").value.trim(),
    unansweredOnly: forumState.unanswered
  })).filter(p => !forumState.blocked.has(p.user_id));

  if (!posts.length) {
    el.innerHTML = `<div class="empty-state card"><div class="icon">💬</div><p>No questions here yet. Be the first to ask!</p></div>`;
    return;
  }
  const [names, photos] = await Promise.all([
    getUsernames(posts.map(p => p.user_id)),
    getForumPhotoUrls(posts.map(p => p.photo_path))
  ]);

  el.innerHTML = posts.map(p => {
    const cat = forumCategory(p.category);
    const author = names[p.user_id] ? names[p.user_id].username : "member";
    const thumb = p.photo_path && photos[p.photo_path]
      ? `<img class="topic-thumb" src="${photos[p.photo_path]}" alt="" loading="lazy" />` : "";
    return `
    <a class="topic-card card" href="#post=${p.id}">
      <div class="topic-main">
        <div class="topic-meta">
          <span class="chip">${cat.icon} ${escapeHtml(cat.label)}</span>
          ${p.accepted_reply_id ? `<span class="chip success">✔ Answered</span>` : ""}
          ${p.is_removed ? `<span class="chip accent">Removed</span>` : ""}
        </div>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="muted topic-snippet">${escapeHtml(truncateText(p.body, 140))}</p>
        <div class="topic-foot muted">@${escapeHtml(author)} · ${timeAgo(p.created_at)} · 💬 ${p.reply_count} ${p.reply_count === 1 ? "reply" : "replies"}</div>
      </div>
      ${thumb}
    </a>`;
  }).join("");
}

/* ---------- Single topic ---------- */

async function renderPost(postId) {
  const el = document.getElementById("post-detail");
  el.innerHTML = `<div class="muted">Loading…</div>`;
  const post = await getForumPost(postId);
  if (!post) {
    el.innerHTML = `<div class="empty-state card"><p>This conversation isn't available.</p></div>`;
    document.getElementById("reply-list").innerHTML = "";
    document.getElementById("reply-form-wrap").style.display = "none";
    return;
  }
  forumState.currentPost = post;
  const replies = (await listForumReplies(postId));
  const names = await getUsernames([post.user_id].concat(replies.map(r => r.user_id)));
  const photos = await getForumPhotoUrls([post.photo_path].concat(replies.map(r => r.photo_path)));

  const isMine = post.user_id === forumState.me.id;
  const isMod = !!forumState.profile.is_moderator;
  const cat = forumCategory(post.category);
  const authorName = names[post.user_id] ? names[post.user_id].username : "member";
  const authorBlocked = forumState.blocked.has(post.user_id);

  el.innerHTML = `
    <article class="card post-card">
      <div class="topic-meta">
        <span class="chip">${cat.icon} ${escapeHtml(cat.label)}</span>
        ${post.accepted_reply_id ? `<span class="chip success">✔ Answered</span>` : ""}
        ${post.is_removed ? `<span class="chip accent">Removed by a moderator</span>` : ""}
      </div>
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      <div class="muted post-byline">${authorLabel(authorName, names[post.user_id])} · ${timeAgo(post.created_at)}${post.updated_at && post.updated_at !== post.created_at && new Date(post.updated_at) - new Date(post.created_at) > 60000 ? " · edited" : ""}</div>
      ${authorBlocked ? blockedNotice(post.user_id) : `
        <div class="post-body">${formatBody(post.body)}</div>
        ${post.brew_snapshot ? renderSnapshot(post.brew_snapshot) : ""}
        ${post.photo_path && photos[post.photo_path] ? `<a href="${photos[post.photo_path]}" target="_blank" rel="noopener"><img class="post-photo" src="${photos[post.photo_path]}" alt="Photo attached to this question" /></a>` : ""}`}
      <div class="post-actions">
        ${isMine ? `<button type="button" class="btn btn-sm btn-outline" data-act="edit-post">Edit</button>
                    <button type="button" class="btn btn-sm btn-danger" data-act="delete-post">Delete</button>` : `
                    <button type="button" class="btn btn-sm btn-outline" data-act="report-post">🚩 Report</button>
                    ${authorBlocked ? "" : `<button type="button" class="btn btn-sm btn-outline" data-act="block" data-user="${post.user_id}">Block @${escapeHtml(authorName)}</button>`}`}
        ${isMod && !isMine ? `<button type="button" class="btn btn-sm btn-danger" data-act="mod-post">${post.is_removed ? "Restore" : "Remove"} (moderator)</button>` : ""}
      </div>
    </article>`;

  const list = document.getElementById("reply-list");
  document.getElementById("reply-heading").textContent = replies.length
    ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "No replies yet";

  // Accepted answer floats to the top.
  replies.sort((a, b) => (b.id === post.accepted_reply_id) - (a.id === post.accepted_reply_id));
  list.innerHTML = replies.map(r => {
    const mine = r.user_id === forumState.me.id;
    const name = names[r.user_id] ? names[r.user_id].username : "member";
    const accepted = r.id === post.accepted_reply_id;
    if (forumState.blocked.has(r.user_id)) {
      return `<div class="card reply-card">${blockedNotice(r.user_id)}</div>`;
    }
    return `
    <div class="card reply-card ${accepted ? "accepted" : ""}" data-reply="${r.id}">
      ${accepted ? `<div class="accepted-label">✔ Best answer</div>` : ""}
      <div class="muted post-byline">${authorLabel(name, names[r.user_id])} · ${timeAgo(r.created_at)}${r.is_removed ? " · removed by a moderator" : ""}</div>
      <div class="post-body">${formatBody(r.body)}</div>
      ${r.photo_path && photos[r.photo_path] ? `<a href="${photos[r.photo_path]}" target="_blank" rel="noopener"><img class="post-photo" src="${photos[r.photo_path]}" alt="Photo attached to this reply" /></a>` : ""}
      <div class="post-actions">
        ${isMine && !mine ? `<button type="button" class="btn btn-sm btn-outline" data-act="accept" data-reply="${r.id}">${accepted ? "Unmark best answer" : "✔ Mark as best answer"}</button>` : ""}
        ${mine ? `<button type="button" class="btn btn-sm btn-danger" data-act="delete-reply" data-reply="${r.id}">Delete</button>` : `
          <button type="button" class="btn btn-sm btn-outline" data-act="report-reply" data-reply="${r.id}">🚩 Report</button>
          <button type="button" class="btn btn-sm btn-outline" data-act="block" data-user="${r.user_id}">Block @${escapeHtml(name)}</button>`}
        ${isMod && !mine ? `<button type="button" class="btn btn-sm btn-danger" data-act="mod-reply" data-reply="${r.id}">${r.is_removed ? "Restore" : "Remove"} (moderator)</button>` : ""}
      </div>
    </div>`;
  }).join("");

  document.getElementById("reply-form-wrap").style.display = post.is_removed ? "none" : "";
  wirePostActions(post, replies);
}

function authorLabel(name, profile) {
  return `<strong>@${escapeHtml(name)}</strong>${profile && profile.is_moderator ? ` <span class="chip accent mod-chip">Moderator</span>` : ""}`;
}

function blockedNotice(userId) {
  return `<div class="muted blocked-note">Hidden because you blocked this member. <button type="button" class="link-btn" data-act="unblock" data-user="${userId}">Unblock</button></div>`;
}

function renderSnapshot(s) {
  const rows = [
    ["Bean", s.bean], ["Dose", s.dose && s.dose + " g"], ["Yield", s.yield && s.yield + " g"],
    ["Ratio", s.ratio && "1:" + s.ratio], ["Time", s.time && s.time + " s"], ["Grind", s.grind],
    ["Grinder", s.grinder], ["Machine", s.machine], ["Water temp", s.temp && s.temp + "°"],
    ["Rating", s.rating && starString(s.rating)]
  ].filter(r => r[1]);
  if (!rows.length && !s.tasteNotes) return "";
  return `
    <div class="brew-snapshot">
      <div class="snapshot-title">☕ Shot details</div>
      <div class="snapshot-grid">${rows.map(r => `<div><span class="muted">${r[0]}</span><strong>${escapeHtml(String(r[1]))}</strong></div>`).join("")}</div>
      ${s.tasteNotes ? `<div class="snapshot-notes"><span class="muted">Taste notes:</span> ${escapeHtml(s.tasteNotes)}</div>` : ""}
    </div>`;
}

function formatBody(text) {
  return escapeHtml(text).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

function truncateText(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function wirePostActions(post, replies) {
  const root = document.getElementById("forum-post-view");
  root.querySelectorAll("[data-act]").forEach(btn => {
    btn.onclick = async () => {
      const act = btn.dataset.act;
      const replyId = btn.dataset.reply;
      const reply = replyId ? replies.find(r => r.id === replyId) : null;
      try {
        if (act === "edit-post") return openNewPostModal(post);
        if (act === "delete-post") {
          if (!confirm("Delete your question and all of its replies?")) return;
          await deleteForumPost(post);
          location.hash = "";
          return;
        }
        if (act === "delete-reply") {
          if (!confirm("Delete your reply?")) return;
          await deleteForumReply(reply);
        }
        if (act === "accept") {
          await updateForumPost(post.id, { accepted_reply_id: post.accepted_reply_id === replyId ? null : replyId });
        }
        if (act === "report-post") return openReportModal({ postId: post.id });
        if (act === "report-reply") return openReportModal({ replyId });
        if (act === "block") {
          if (!confirm("Block this member? You won't see their questions or replies anymore. You can unblock them any time.")) return;
          await blockUser(btn.dataset.user);
          forumState.blocked.add(btn.dataset.user);
        }
        if (act === "unblock") {
          await unblockUser(btn.dataset.user);
          forumState.blocked.delete(btn.dataset.user);
        }
        if (act === "mod-post") await updateForumPost(post.id, { is_removed: !post.is_removed });
        if (act === "mod-reply") await updateForumReply(replyId, { is_removed: !reply.is_removed });
        await renderPost(post.id);
      } catch (err) {
        alert(err.message || "Something went wrong. Please try again.");
      }
    };
  });
}

/* ---------- Replying ---------- */

async function onReplySubmit(e) {
  e.preventDefault();
  const post = forumState.currentPost;
  const body = document.getElementById("reply-body").value.trim();
  if (!post || !body) return;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const reply = await createForumReply(post.id, body);
    if (forumState.replyPhoto) {
      try {
        const small = await shrinkForumImage(forumState.replyPhoto);
        const path = await uploadForumPhoto(post.id, small);
        await updateForumReply(reply.id, { photo_path: path });
      } catch (photoErr) {
        alert("Your reply posted, but the photo couldn't upload: " + (photoErr.message || photoErr));
      }
    }
    e.target.reset();
    forumState.replyPhoto = null;
    setPhotoPreview("reply-photo-preview", null);
    await renderPost(post.id);
  } catch (err) {
    alert("Couldn't post your reply: " + (err.message || err));
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Asking / editing a question ---------- */

function openNewPostModal(existing) {
  const form = document.getElementById("new-post-form");
  form.reset();
  forumState.newPostPhoto = null;
  setPhotoPreview("np-photo-preview", null);
  form.dataset.editId = existing ? existing.id : "";
  document.getElementById("np-heading").textContent = existing ? "Edit your question" : "Ask the community";
  document.getElementById("np-photo-field").style.display = existing ? "none" : "";
  if (existing) {
    document.getElementById("np-category").value = existing.category;
    document.getElementById("np-title").value = existing.title;
    document.getElementById("np-body").value = existing.body;
  }
  const snap = document.getElementById("np-snapshot");
  if (!existing && forumState.pendingBrew) {
    snap.innerHTML = renderSnapshot(forumState.pendingBrew) +
      `<button type="button" class="link-btn" id="np-remove-snapshot">Don't attach these shot details</button>`;
    snap.style.display = "";
    document.getElementById("np-category").value = "dialing-in";
    document.getElementById("np-remove-snapshot").onclick = () => { forumState.pendingBrew = null; snap.style.display = "none"; };
  } else {
    snap.style.display = "none";
  }
  toggleModal("new-post-modal", true);
}

async function onNewPostSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fields = {
    category: document.getElementById("np-category").value,
    title: document.getElementById("np-title").value.trim(),
    body: document.getElementById("np-body").value.trim()
  };
  if (fields.title.length < 3 || !fields.body) {
    alert("Please add a title (at least 3 characters) and some details.");
    return;
  }
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    if (form.dataset.editId) {
      await updateForumPost(form.dataset.editId, fields);
      toggleModal("new-post-modal", false);
      await renderPost(form.dataset.editId);
      return;
    }
    const post = await createForumPost({ ...fields, brewSnapshot: forumState.pendingBrew });
    if (forumState.newPostPhoto) {
      try {
        const small = await shrinkForumImage(forumState.newPostPhoto);
        const path = await uploadForumPhoto(post.id, small);
        await updateForumPost(post.id, { photo_path: path });
      } catch (photoErr) {
        alert("Your question posted, but the photo couldn't upload: " + (photoErr.message || photoErr));
      }
    }
    forumState.pendingBrew = null;
    toggleModal("new-post-modal", false);
    location.hash = "post=" + post.id;
  } catch (err) {
    alert("Couldn't post your question: " + (err.message || err));
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Reporting ---------- */

function openReportModal(target) {
  const form = document.getElementById("report-form");
  form.reset();
  form.dataset.postId = target.postId || "";
  form.dataset.replyId = target.replyId || "";
  toggleModal("report-modal", true);
}

async function onReportSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const choice = form.querySelector("input[name=report-reason]:checked");
  const extra = document.getElementById("report-details").value.trim();
  if (!choice) { alert("Please pick a reason."); return; }
  try {
    await reportForumContent({
      postId: form.dataset.postId || null,
      replyId: form.dataset.replyId || null,
      reason: choice.value + (extra ? ": " + extra : "")
    });
    toggleModal("report-modal", false);
    alert("Thanks. A moderator will take a look.");
  } catch (err) {
    alert("Couldn't send that report: " + (err.message || err));
  }
}

/* ---------- Moderator tools ---------- */

async function refreshReportCount() {
  const reports = await listOpenReports();
  document.getElementById("report-count").textContent = reports.length;
}

async function openModPanel() {
  const el = document.getElementById("mod-report-list");
  el.innerHTML = `<div class="muted">Loading reports…</div>`;
  toggleModal("mod-modal", true);
  const reports = await listOpenReports();
  if (!reports.length) {
    el.innerHTML = `<p class="muted">No open reports. 🎉</p>`;
    return;
  }
  // Look up the post each report belongs to so we can link to it.
  const replyIds = reports.filter(r => r.reply_id).map(r => r.reply_id);
  let replyPost = {};
  if (replyIds.length) {
    const { data } = await supabaseClient.from("forum_replies").select("id, post_id, body").in("id", replyIds);
    (data || []).forEach(r => { replyPost[r.id] = r; });
  }
  const names = await getUsernames(reports.map(r => r.reporter_id));
  el.innerHTML = reports.map(r => {
    const postId = r.post_id || (replyPost[r.reply_id] && replyPost[r.reply_id].post_id);
    const what = r.reply_id ? "a reply" : "a question";
    return `
      <div class="mod-report">
        <div><strong>${escapeHtml(r.reason)}</strong></div>
        <div class="muted">Reported ${what} · by @${escapeHtml(names[r.reporter_id] ? names[r.reporter_id].username : "member")} · ${timeAgo(r.created_at)}</div>
        ${r.reply_id && replyPost[r.reply_id] ? `<div class="muted">“${escapeHtml(truncateText(replyPost[r.reply_id].body, 120))}”</div>` : ""}
        <div class="post-actions">
          ${postId ? `<a class="btn btn-sm btn-outline" href="#post=${postId}" data-close-mod>Open</a>` : ""}
          <button type="button" class="btn btn-sm btn-outline" data-resolve="${r.id}">Mark handled</button>
        </div>
      </div>`;
  }).join("");
  el.querySelectorAll("[data-close-mod]").forEach(a => a.addEventListener("click", () => toggleModal("mod-modal", false)));
  el.querySelectorAll("[data-resolve]").forEach(b => b.addEventListener("click", async () => {
    await resolveReport(b.dataset.resolve);
    await openModPanel();
    refreshReportCount();
  }));
}

/* ---------- Change username ---------- */

async function onUsernameSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("change-username").value.trim();
  const err = document.getElementById("change-username-error");
  err.style.display = "none";
  try {
    forumState.profile = await saveMyUsername(name, false);
    document.getElementById("my-username").textContent = "@" + forumState.profile.username;
    toggleModal("username-modal", false);
    await route();
  } catch (ex) {
    err.textContent = ex.message || "Couldn't change your username.";
    err.style.display = "block";
  }
}

/* ---------- Shared bits ---------- */

function toggleModal(id, open) {
  document.getElementById(id).classList.toggle("open", !!open);
}

function setPhotoPreview(id, url, onRemove) {
  const el = document.getElementById(id);
  if (!url) { el.innerHTML = `<span>No photo</span>`; el.classList.add("empty"); return; }
  el.classList.remove("empty");
  el.innerHTML = `<img src="${url}" alt="Photo preview" /><button type="button" class="remove-photo" aria-label="Remove photo">✕</button>`;
  el.querySelector(".remove-photo").onclick = onRemove;
}

function wirePhotoInput(inputId, previewId, key) {
  const input = document.getElementById(inputId);
  setPhotoPreview(previewId, null);
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    forumState[key] = file;
    setPhotoPreview(previewId, URL.createObjectURL(file), () => {
      forumState[key] = null;
      input.value = "";
      setPhotoPreview(previewId, null);
    });
  });
}

function wireStaticControls() {
  document.getElementById("forum-setup").addEventListener("submit", onSetupSubmit);
  document.getElementById("setup-username").addEventListener("input", debounce(checkSetupUsername, 350));

  document.getElementById("ask-btn").addEventListener("click", () => openNewPostModal());
  document.getElementById("forum-search").addEventListener("input", debounce(renderList, 250));
  document.getElementById("new-post-form").addEventListener("submit", onNewPostSubmit);
  document.getElementById("reply-form").addEventListener("submit", onReplySubmit);
  document.getElementById("report-form").addEventListener("submit", onReportSubmit);
  document.getElementById("username-form").addEventListener("submit", onUsernameSubmit);
  document.getElementById("back-to-list").addEventListener("click", (e) => { e.preventDefault(); location.hash = ""; });
  document.getElementById("change-username-btn").addEventListener("click", () => {
    document.getElementById("change-username").value = forumState.profile ? forumState.profile.username : "";
    document.getElementById("change-username-error").style.display = "none";
    toggleModal("username-modal", true);
  });
  document.getElementById("mod-btn").addEventListener("click", openModPanel);
  document.getElementById("show-rules-btn").addEventListener("click", () => toggleModal("rules-modal", true));

  document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => toggleModal(b.dataset.close, false)));
  document.querySelectorAll(".modal-backdrop").forEach(m => m.addEventListener("click", (e) => { if (e.target === m) m.classList.remove("open"); }));

  wirePhotoInput("np-photo", "np-photo-preview", "newPostPhoto");
  wirePhotoInput("reply-photo", "reply-photo-preview", "replyPhoto");
}

async function checkSetupUsername() {
  const name = document.getElementById("setup-username").value.trim();
  const hint = document.getElementById("setup-username-hint");
  if (!name) { hint.textContent = "3 to 20 letters, numbers, or underscores."; hint.style.color = ""; return; }
  if (!USERNAME_RULE.test(name)) { hint.textContent = "Use 3 to 20 letters, numbers, or underscores (no spaces)."; hint.style.color = "var(--color-danger)"; return; }
  if (forumState.profile && forumState.profile.username.toLowerCase() === name.toLowerCase()) { hint.textContent = "That's your username."; hint.style.color = "var(--color-success)"; return; }
  const ok = await isUsernameAvailable(name);
  hint.textContent = ok ? "✔ Available" : "That username is taken. Try another one.";
  hint.style.color = ok ? "var(--color-success)" : "var(--color-danger)";
}
