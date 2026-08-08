/* ===========================================================
   Espresso Tracker — Cloud data layer (Supabase)
   All functions here are async and operate on the signed-in
   user's own rows only (enforced both by our queries and by the
   Row Level Security policies in supabase/schema.sql).
   Depends on: js/supabase-config.js, Supabase SDK, js/supabase-client.js
   =========================================================== */

// ---------- Beans ----------

function beanFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    roaster: row.roaster || "",
    roastType: row.roast_type || "",
    source: row.source || "",
    process: row.process || "",
    price: row.price || "",
    history: row.history || "",
    notes: row.notes || "",
    dateAdded: row.date_added
  };
}

function beanToRow(bean, userId) {
  return {
    user_id: userId,
    name: bean.name,
    roaster: bean.roaster || null,
    roast_type: bean.roastType || null,
    source: bean.source || null,
    process: bean.process || null,
    price: bean.price || null,
    history: bean.history || null,
    notes: bean.notes || null,
    date_added: bean.dateAdded || null
  };
}

async function getBeans() {
  const { data, error } = await supabaseClient
    .from("beans")
    .select("*")
    .order("date_added", { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(beanFromRow);
}

async function getBean(id) {
  const { data, error } = await supabaseClient.from("beans").select("*").eq("id", id).single();
  if (error) return null;
  return beanFromRow(data);
}

async function saveBean(bean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be signed in to save a bean.");
  const row = beanToRow(bean, user.id);

  if (bean.id) {
    const { data, error } = await supabaseClient.from("beans").update(row).eq("id", bean.id).select().single();
    if (error) throw error;
    return beanFromRow(data);
  }
  row.date_added = row.date_added || todayStr();
  const { data, error } = await supabaseClient.from("beans").insert(row).select().single();
  if (error) throw error;
  return beanFromRow(data);
}

async function deleteBean(id) {
  const { error } = await supabaseClient.from("beans").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Brews ----------

function brewFromRow(row) {
  return {
    id: row.id,
    beanId: row.bean_id,
    beanName: row.bean_name || "",
    machineType: row.machine_type || "",
    grinderType: row.grinder_type || "",
    grindSize: row.grind_size || "",
    toolsUsed: row.tools_used || "",
    date: row.brew_date,
    time: row.brew_time_of_day ? row.brew_time_of_day.slice(0, 5) : "",
    doseWeight: row.dose_weight ?? "",
    yieldWeight: row.yield_weight ?? "",
    brewTime: row.brew_time_seconds ?? "",
    waterTemp: row.water_temp ?? "",
    rating: row.rating || 0,
    feedback: row.feedback || "",
    recommendation: row.recommendation || "",
    photoShotPath: row.photo_shot_path || "",
    photoPuckPath: row.photo_puck_path || "",
    photoPackagingPath: row.photo_packaging_path || ""
  };
}

function brewToRow(brew, userId) {
  return {
    user_id: userId,
    bean_id: brew.beanId || null,
    bean_name: brew.beanName || null,
    machine_type: brew.machineType || null,
    grinder_type: brew.grinderType || null,
    grind_size: brew.grindSize || null,
    tools_used: brew.toolsUsed || null,
    brew_date: brew.date || null,
    brew_time_of_day: brew.time || null,
    dose_weight: brew.doseWeight !== "" && brew.doseWeight != null ? Number(brew.doseWeight) : null,
    yield_weight: brew.yieldWeight !== "" && brew.yieldWeight != null ? Number(brew.yieldWeight) : null,
    brew_time_seconds: brew.brewTime !== "" && brew.brewTime != null ? Number(brew.brewTime) : null,
    water_temp: brew.waterTemp !== "" && brew.waterTemp != null ? Number(brew.waterTemp) : null,
    rating: brew.rating || null,
    feedback: brew.feedback || null,
    recommendation: brew.recommendation || null,
    photo_shot_path: brew.photoShotPath || null,
    photo_puck_path: brew.photoPuckPath || null,
    photo_packaging_path: brew.photoPackagingPath || null
  };
}

async function getBrews() {
  const { data, error } = await supabaseClient
    .from("brews")
    .select("*")
    .order("brew_date", { ascending: false })
    .order("brew_time_of_day", { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(brewFromRow);
}

async function getBrew(id) {
  const { data, error } = await supabaseClient.from("brews").select("*").eq("id", id).single();
  if (error) return null;
  return brewFromRow(data);
}

async function saveBrew(brew) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be signed in to save a brew.");
  const row = brewToRow(brew, user.id);

  if (brew.id) {
    const { data, error } = await supabaseClient.from("brews").update(row).eq("id", brew.id).select().single();
    if (error) throw error;
    return brewFromRow(data);
  }
  const { data, error } = await supabaseClient.from("brews").insert(row).select().single();
  if (error) throw error;
  return brewFromRow(data);
}

async function deleteBrew(id) {
  const { error } = await supabaseClient.from("brews").delete().eq("id", id);
  if (error) throw error;
}

// Partial update used after uploading/removing photos, so we never touch
// (and never accidentally null out) any of the brew's other fields.
async function updateBrewPhotoPaths(brewId, fields) {
  const row = {};
  if ("photoShotPath" in fields) row.photo_shot_path = fields.photoShotPath || null;
  if ("photoPuckPath" in fields) row.photo_puck_path = fields.photoPuckPath || null;
  if ("photoPackagingPath" in fields) row.photo_packaging_path = fields.photoPackagingPath || null;
  if (Object.keys(row).length === 0) return null;
  const { data, error } = await supabaseClient.from("brews").update(row).eq("id", brewId).select().single();
  if (error) throw error;
  return brewFromRow(data);
}

// ---------- Brew photos ----------
// Files are stored at "<user_id>/<brew_id>/<slot>-<timestamp>.<ext>" in the
// private "brew-photos" bucket. We store the storage *path* on the brew row
// and generate a short-lived signed URL whenever we need to display it.

const PHOTO_SLOTS = ["shot", "puck", "packaging"];

async function uploadBrewPhoto(brewId, slot, file) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be signed in to upload a photo.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${brewId}/${slot}-${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage.from("brew-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

async function deleteBrewPhoto(path) {
  if (!path) return;
  const { error } = await supabaseClient.storage.from("brew-photos").remove([path]);
  if (error) console.error(error);
}

async function getSignedPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabaseClient.storage.from("brew-photos").createSignedUrl(path, 3600);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

// ---------- Recipes (custom; starter recipes are static in data.js) ----------

function recipeFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    style: row.style || "Custom",
    ratio: row.ratio || "",
    dose: row.dose || "",
    time: row.time || "",
    instructions: row.instructions || "",
    tags: row.tags || [],
    custom: true
  };
}

function recipeToRow(recipe, userId) {
  return {
    user_id: userId,
    name: recipe.name,
    style: recipe.style || "Custom",
    ratio: recipe.ratio || null,
    dose: recipe.dose || null,
    time: recipe.time || null,
    instructions: recipe.instructions || null,
    tags: recipe.tags && recipe.tags.length ? recipe.tags : null
  };
}

async function getRecipes() {
  let custom = [];
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data, error } = await supabaseClient.from("recipes").select("*").order("created_at", { ascending: false });
      if (!error) custom = data.map(recipeFromRow);
    }
  }
  return [...STARTER_RECIPES, ...custom];
}

async function saveRecipe(recipe) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to be signed in to save a recipe.");
  const row = recipeToRow(recipe, user.id);
  const { data, error } = await supabaseClient.from("recipes").insert(row).select().single();
  if (error) throw error;
  return recipeFromRow(data);
}

async function deleteRecipe(id) {
  const { error } = await supabaseClient.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Derived stats ----------

async function computeStats() {
  const [brews, beans] = await Promise.all([getBrews(), getBeans()]);
  const ratings = brews.filter(b => b.rating).map(b => b.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
  const thisWeek = brews.filter(b => isWithinDays(b.date, 7)).length;
  return {
    totalBrews: brews.length,
    totalBeans: beans.length,
    avgRating,
    brewsThisWeek: thisWeek,
    lastBrew: brews[0] || null
  };
}

function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}
