/* ===========================================================
   Espresso Tracker — Static reference data
   Beans, brews, and custom recipes are personal data and now live
   in Supabase (see js/cloud-data.js). This file only holds
   reference/catalog content that ships with the app itself and
   needs no account or network access.
   =========================================================== */

// ===========================================================
// STARTER / REFERENCE DATA
// Seeded once so the app is useful immediately. Roaster and
// gear listings reflect real, currently operating businesses
// and products (researched Aug 2026) — prices/availability can
// change, so always confirm on the retailer's site.
// ===========================================================

const STARTER_RECIPES = [
  {
    id: "recipe_classic_espresso",
    name: "Classic Double Espresso",
    style: "Espresso",
    ratio: "1:2",
    dose: "18g in, 36g out",
    time: "25–30 sec",
    instructions: "Dose 18g of fresh, evenly ground coffee into the portafilter. Distribute and tamp level with firm, even pressure. Lock in and start the shot immediately. Target 36g of liquid espresso in 25–30 seconds. If it runs faster, grind finer; if slower, grind coarser.",
    tags: ["espresso", "classic", "no milk"],
    custom: false
  },
  {
    id: "recipe_ristretto",
    name: "Ristretto",
    style: "Espresso",
    ratio: "1:1",
    dose: "18g in, 18–20g out",
    time: "20–25 sec",
    instructions: "Same dose as a standard espresso but pull the shot short — stop the extraction once you reach roughly 1:1 output. Expect a thicker, syrupy, sweeter shot with less bitterness. Grind slightly finer than your normal espresso setting to hit time in a shorter yield.",
    tags: ["espresso", "concentrated", "no milk"],
    custom: false
  },
  {
    id: "recipe_lungo",
    name: "Lungo",
    style: "Espresso",
    ratio: "1:3 to 1:4",
    dose: "18g in, 54–72g out",
    time: "35–45 sec",
    instructions: "Use your normal dose but let the shot run long, pulling 3–4x the coffee weight in liquid. Grind slightly coarser than standard espresso to avoid over-extracting and turning bitter as the shot runs longer.",
    tags: ["espresso", "no milk"],
    custom: false
  },
  {
    id: "recipe_americano",
    name: "Americano",
    style: "Espresso + Water",
    ratio: "1 part espresso : 2 parts hot water",
    dose: "Double shot (36g) into ~150–180ml hot water",
    time: "n/a",
    instructions: "Pull a normal double espresso, then pour it over hot water (or add hot water to the shot) at roughly a 1:2 ratio. Adjust water to taste — more water for a lighter, more diluted cup closer to drip coffee.",
    tags: ["no milk", "long"],
    custom: false
  },
  {
    id: "recipe_cappuccino",
    name: "Cappuccino",
    style: "Milk-based",
    ratio: "1:1:1 espresso : steamed milk : foam",
    dose: "Single or double shot",
    time: "n/a",
    instructions: "Pull your shot into a cup. Steam milk to a thick, velvety microfoam (aim ~140–150°F). Pour so the drink lands in roughly equal thirds of espresso, steamed milk, and foam — you should be able to see a distinct foam cap.",
    tags: ["milk", "foam cap"],
    custom: false
  },
  {
    id: "recipe_latte",
    name: "Latte",
    style: "Milk-based",
    ratio: "1 part espresso : 3 parts steamed milk",
    dose: "Single or double shot",
    time: "n/a",
    instructions: "Pull your shot into a larger cup. Steam milk to a silky microfoam with less air than a cappuccino. Pour slowly to integrate, leaving just a thin layer of foam on top. Great canvas for latte art.",
    tags: ["milk", "microfoam"],
    custom: false
  },
  {
    id: "recipe_cortado",
    name: "Cortado",
    style: "Milk-based",
    ratio: "1:1 espresso : steamed milk",
    dose: "Single or double shot",
    time: "n/a",
    instructions: "Pull a shot into a small (4–5oz) glass. Steam milk with minimal foam and pour an equal amount into the espresso. Balanced and espresso-forward — a step between a macchiato and a flat white.",
    tags: ["milk", "balanced"],
    custom: false
  },
  {
    id: "recipe_macchiato",
    name: "Espresso Macchiato",
    style: "Milk-based",
    ratio: "Espresso + a dollop of foam",
    dose: "Single or double shot",
    time: "n/a",
    instructions: "Pull your shot into a small cup. Add just a spoonful of milk foam on top ('macchiato' means 'stained' in Italian) — mostly espresso flavor with a touch of milky sweetness.",
    tags: ["milk", "espresso-forward"],
    custom: false
  },
  {
    id: "recipe_flatwhite",
    name: "Flat White",
    style: "Milk-based",
    ratio: "1 part espresso (often ristretto) : ~2 parts steamed milk",
    dose: "Double ristretto shot",
    time: "n/a",
    instructions: "Pull a double ristretto for a concentrated, syrupy base. Steam milk to a very fine, glossy microfoam with minimal air. Pour into a smaller cup than a latte for a stronger coffee-to-milk ratio with a thin, velvety texture.",
    tags: ["milk", "microfoam", "espresso-forward"],
    custom: false
  },
  {
    id: "recipe_v60",
    name: "V60 Pour-Over (non-espresso)",
    style: "Filter",
    ratio: "1:16",
    dose: "20g coffee : 320g water",
    time: "~2:30–3:00",
    instructions: "Rinse the filter and preheat the dripper. Add 20g medium-fine grounds. Bloom with 40g water for 30–45 sec. Pour in slow circular pulses up to 320g total, finishing around 2:30–3:00. Great way to taste a bean before dialing it in on espresso.",
    tags: ["filter", "no milk", "single origin"],
    custom: false
  }
];

const GEAR_CATALOG = [
  // ---- Espresso Machines ----
  { id: "m1", category: "Machine", type: "Semi-automatic", name: "Breville Bambino", tier: "Budget", price: "$299–$350", notes: "Compact, fast heat-up (3 sec), ThermoJet heating. Excellent entry point for consistent shots.", link: "https://www.breville.com/us/en/products/espresso/bes450.html" },
  { id: "m2", category: "Machine", type: "Semi-automatic", name: "Breville Bambino Plus", tier: "Budget/Mid", price: "$450–$500", notes: "Adds automatic milk texturing to the Bambino platform. Great step-up beginner machine.", link: "https://www.breville.com/us/en/products/espresso/bes500.html" },
  { id: "m3", category: "Machine", type: "Semi-automatic", name: "Lelit Anna", tier: "Mid", price: "$400–$500", notes: "Single boiler, PID-friendly, all-metal build. Popular value pick that punches above its price.", link: "https://lelit.com/" },
  { id: "m4", category: "Machine", type: "Dual boiler", name: "Rancilio Silvia", tier: "Mid", price: "$700–$800", notes: "Commercial-grade steam wam and build quality; a long-running home-barista classic.", link: "https://www.ranciliogroup.com/" },
  { id: "m5", category: "Machine", type: "Dual boiler / prosumer", name: "Profitec Pro 300 / 500", tier: "High-end", price: "$1,500–$2,200", notes: "E61 group head, PID temp control, dual boiler — brew and steam simultaneously.", link: "https://www.profitec-coffee.com/" },
  { id: "m6", category: "Machine", type: "Prosumer", name: "La Marzocco Linea Mini", tier: "Premium", price: "$4,000+", notes: "Reference-standard home dual boiler; the mini version of La Marzocco's commercial machines.", link: "https://home.lamarzocco.com/" },
  { id: "m7", category: "Machine", type: "Super-automatic", name: "Breville Barista Express", tier: "Mid", price: "$700", notes: "Built-in grinder, all-in-one workflow — good if you want one box that does dose-to-shot.", link: "https://www.breville.com/us/en/products/espresso/bes870.html" },

  // ---- Grinders ----
  { id: "g1", category: "Grinder", type: "Flat burr", name: "Baratza Encore ESP", tier: "Budget", price: "$200", notes: "Entry-level espresso-capable grinder; consistent grind for the price, easy to service.", link: "https://baratza.com/grinder/encore-esp/" },
  { id: "g2", category: "Grinder", type: "Conical burr, built-in scale", name: "Baratza Sette 270Wi", tier: "Mid/High", price: "$500–$600", notes: "270 grind settings, integrated weight-based dosing — removes a lot of guesswork.", link: "https://baratza.com/grinder/sette-270wi/" },
  { id: "g3", category: "Grinder", type: "Flat burr, stepless", name: "DF64 II", tier: "Mid", price: "$400–$500", notes: "64mm flat steel burrs, stepless adjustment, strong value in the enthusiast tier.", link: "https://df64coffee.com/" },
  { id: "g4", category: "Grinder", type: "Flat burr", name: "Eureka Mignon Specialita", tier: "Mid/High", price: "$500–$600", notes: "Popular Italian-made grinder with fast dosing and reliable consistency.", link: "https://eureka.co.it/en/" },
  { id: "g5", category: "Grinder", type: "Single dose flat burr", name: "Niche Zero", tier: "High-end", price: "$700+", notes: "Low retention single-dose grinder; a favorite in the home-barista community.", link: "https://www.nichecoffee.co.uk/" },

  // ---- Tools & Accessories ----
  { id: "t1", category: "Tool", type: "Scale", name: "Acaia Pearl / Lunar", tier: "Mid/High", price: "$150–$200", notes: "Precision brewing scale with timer, 0.1g resolution — the standard for dialing in ratios.", link: "https://acaia.co/" },
  { id: "t2", category: "Tool", type: "Tamper", name: "Calibrated 58mm tamper", tier: "Budget", price: "$30–$60", notes: "Spring-loaded, calibrated tampers help apply consistent pressure shot to shot.", link: "" },
  { id: "t3", category: "Tool", type: "Distribution tool (WDT)", name: "WDT tool / distributor", tier: "Budget", price: "$15–$30", notes: "Fine-needle tool used to break up clumps before tamping for even extraction.", link: "" },
  { id: "t4", category: "Tool", type: "Milk pitcher", name: "Stainless steel steaming pitcher", tier: "Budget", price: "$15–$40", notes: "12oz/20oz pitchers for latte art and milk texturing.", link: "" },
  { id: "t5", category: "Tool", type: "Puck screen", name: "58mm puck screen", tier: "Budget", price: "$10–$20", notes: "Sits above the puck to reduce channeling and keep the shower screen clean.", link: "" },
  { id: "t6", category: "Tool", type: "Bottomless portafilter", name: "Bottomless (naked) portafilter", tier: "Budget", price: "$40–$80", notes: "Lets you see the extraction stream directly — useful diagnostic tool for spotting channeling.", link: "" },
  { id: "t7", category: "Tool", type: "Refractometer", name: "VST / Atago coffee refractometer", tier: "High-end", price: "$200–$400", notes: "Measures TDS to calculate extraction yield — for dialing in with real numbers, not just taste.", link: "" }
];

const ROASTER_DIRECTORY = [
  { id: "r1", name: "Onyx Coffee Lab", location: "Arkansas (multiple cafes) — ships nationwide", specialty: "Seasonal single origins from Colombia, Peru, Ecuador & more", site: "https://onyxcoffeelab.com" },
  { id: "r2", name: "Counter Culture Coffee", location: "Durham, NC — ships nationwide", specialty: "Long-running specialty roaster, subscriptions & limited releases", site: "https://counterculturecoffee.com" },
  { id: "r3", name: "Tandem Coffee Roasters", location: "Portland, ME", specialty: "Single-origin coffees from Ethiopia, Kenya, Mexico & more", site: "https://tandemcoffee.com" },
  { id: "r4", name: "Bandit Coffee Co.", location: "St. Petersburg, FL", specialty: "Single-origin & blend specialty coffee, local cafe presence", site: "https://banditcoffee.com" },
  { id: "r5", name: "Press Coffee Roasters", location: "Phoenix, AZ", specialty: "Small-batch specialty coffee, direct trade relationships", site: "https://presscoffee.com" },
  { id: "r6", name: "Toby's Estate Coffee Roasters", location: "Australia-founded, international cafes", specialty: "Sustainable, ethically sourced coffee since 1997", site: "https://tobysestate.com" }
];

const COMMUNITY_LINKS = [
  { id: "c1", name: "Home-Barista.com Forums", type: "Forum", desc: "The most established home-espresso community — brewing guides, equipment reviews, troubleshooting threads.", link: "https://www.home-barista.com/forums/" },
  { id: "c2", name: "CoffeeGeek", type: "Forum & reviews", desc: "Long-running resource with forums plus independent gear reviews and buying guides.", link: "https://coffeegeek.com" },
  { id: "c3", name: "Home Grounds", type: "Blog", desc: "Home-barista-focused blog with gear reviews and brewing tutorials.", link: "https://www.homegrounds.co" },
  { id: "c4", name: "Coffee Review", type: "Blog / reviews", desc: "Serious, scored reviews of coffee beans and roasters across the world.", link: "https://www.coffeereview.com" },
  { id: "c5", name: "Barista Institute", type: "Education", desc: "Free structured courses on coffee and barista skills, founded by a World Barista Champion.", link: "https://www.baristainstitute.com" },
  { id: "c6", name: "r/espresso", type: "Community", desc: "Active Reddit community for espresso dial-in help, gear talk, and shot photos.", link: "https://www.reddit.com/r/espresso/" },
  { id: "c7", name: "r/coffee", type: "Community", desc: "General coffee subreddit covering all brew methods, beans, and roasters.", link: "https://www.reddit.com/r/Coffee/" }
];

const COFFEE_HISTORY_TIMELINE = [
  { year: "c. 850 CE", text: "Legend holds an Ethiopian goatherd named Kaldi noticed his goats becoming energetic after eating berries from a wild coffee bush in the Kaffa region — often cited as coffee's origin story." },
  { year: "15th century", text: "Coffee cultivation and trade take root in Yemen; Sufi monks reportedly brew coffee to stay alert through nighttime prayers, formalizing it as a beverage." },
  { year: "16th–17th century", text: "Coffee spreads through the Ottoman Empire and into Europe via trade routes, with coffee houses opening in cities like Venice, London, and Vienna." },
  { year: "1901", text: "Luigi Bezzera patents the first espresso machine in Italy, using steam pressure to brew coffee rapidly — the birth of 'espresso' (Italian for 'expressed' or 'made fast')." },
  { year: "1940s–1950s", text: "Achille Gaggia refines the espresso machine with a spring-piston lever system, producing the pressurized crema that defines modern espresso." },
  { year: "1980s–1990s", text: "The 'second wave' of coffee brings espresso-based drinks (lattes, cappuccinos) into mainstream American culture via chains like Starbucks." },
  { year: "2000s–present", text: "The 'third wave' specialty coffee movement emphasizes single-origin beans, direct trade, light roasting, and precision brewing — treating coffee like wine, with an emphasis on origin and craft." }
];

const COFFEE_STYLES = [
  { name: "Espresso", family: "Straight shot", desc: "Concentrated coffee brewed by forcing hot water through finely-ground, tamped coffee under ~9 bars of pressure. The base for nearly every espresso drink.", howTo: "18g in, ~36g out, 25–30 sec extraction. Use the Classic Espresso recipe as a starting point." },
  { name: "Ristretto", family: "Straight shot", desc: "A 'restricted' shot — same dose as espresso but a shorter yield, giving a thicker, sweeter, less bitter result.", howTo: "18g in, 18–20g out, ~20–25 sec. Grind slightly finer than standard espresso." },
  { name: "Lungo", family: "Straight shot", desc: "A 'long' shot pulled with more water passing through the same dose, yielding a larger, less intense cup.", howTo: "18g in, 54–72g out, ~35–45 sec. Grind slightly coarser to avoid bitterness." },
  { name: "Americano", family: "Espresso + water", desc: "Espresso diluted with hot water, approximating drip coffee strength while keeping espresso's flavor character.", howTo: "Pull a double shot, add hot water at roughly 1:2 (espresso:water), adjust to taste." },
  { name: "Macchiato", family: "Espresso-forward milk", desc: "Espresso 'stained' with a small amount of milk foam — mostly coffee flavor with a touch of milk.", howTo: "Pull a shot, top with a spoonful of milk foam. No steaming required beyond the foam." },
  { name: "Cortado", family: "Espresso-forward milk", desc: "Equal parts espresso and steamed milk, served in a small glass. Balanced, not too milky, not too sharp.", howTo: "Pull a shot into a 4–5oz glass, add an equal volume of lightly steamed milk with minimal foam." },
  { name: "Flat White", family: "Microfoam milk", desc: "A concentrated espresso base (often ristretto) with a thin layer of velvety steamed milk — stronger and less foamy than a latte.", howTo: "Pull a double ristretto, steam milk to a fine glossy microfoam, pour into a smaller cup than a latte." },
  { name: "Latte", family: "Microfoam milk", desc: "Espresso with a larger volume of steamed milk and a thin foam cap — the mildest, most approachable milk drink.", howTo: "Pull a shot, steam milk with light foam, pour at roughly 1:3 espresso to milk." },
  { name: "Cappuccino", family: "Foam-cap milk", desc: "Equal thirds espresso, steamed milk, and thick milk foam — traditionally served smaller than a latte with a distinct foam cap.", howTo: "Pull a shot, steam milk to a thick microfoam, pour in roughly equal thirds." },
  { name: "V60 Pour-Over", family: "Filter (non-espresso)", desc: "A manual drip method using a conical dripper and paper filter, prized for clarity and highlighting single-origin character.", howTo: "20g coffee to 320g water (1:16), bloom 30–45 sec, then pour in slow pulses over ~2:30–3:00 total." }
];
