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

const ISSUE_TAGS = [
  { id: "bitter", label: "Bitter", tip: "Grind coarser and/or shorten the brew time — bitterness usually means over-extraction. Also check your water isn't too hot (aim ~195–205°F) and that the shot isn't running too slow." },
  { id: "sour", label: "Sour", tip: "Grind finer and/or let the shot run a bit longer — sourness usually means under-extraction. Also check the dose is high enough and the grounds are evenly distributed before tamping." },
  { id: "weak", label: "Weak / watery", tip: "Increase your dose or use a tighter (lower) ratio so less water passes through the same coffee. A finer grind can also add body and concentration." },
  { id: "harsh", label: "Harsh / astringent", tip: "Grind slightly coarser to avoid over-extracting fines, and double-check your tamp is level — uneven tamping causes harsh, gritty extraction." },
  { id: "muddy", label: "Muddy / unclear", tip: "Distribute the grounds more thoroughly before tamping (a WDT tool helps a lot) and make sure the grind isn't too fine, which can muddy flavor clarity." },
  { id: "channeling", label: "Channeling / uneven flow", tip: "Redistribute and tamp level and firm. A bottomless portafilter helps you see channeling directly; a puck screen or finer, more even grind can also reduce it." },
  { id: "too_fast", label: "Shot ran too fast", tip: "Grind finer to slow the flow down and land closer to your target time and yield." },
  { id: "too_slow", label: "Shot ran too slow", tip: "Grind coarser to speed the flow up. Also check your dose isn't too high or your tamp too firm for the basket." },
  { id: "thin", label: "Thin body", tip: "Try a slightly finer grind and/or a lower (more concentrated) ratio to build more body into the shot." },
  { id: "too_hot", label: "Tastes burnt / too hot", tip: "Lower your brew temperature a few degrees if your machine allows it, and check the beans aren't a darker roast than your usual — darker roasts extract bitterness faster." }
];

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
  // Product photos are the manufacturer's own images, loaded from their
  // sites (not copied into this repo). If one ever stops loading, the
  // card falls back to an icon. Updated Sept 2026.

  // ---- Espresso Machines ----
  { id: "m1", category: "Machine", type: "Semi-automatic", name: "Breville Bambino", tier: "Budget", price: "$299–$350", notes: "Compact, fast heat-up (3 sec), ThermoJet heating. Excellent entry point for consistent shots.", link: "https://www.breville.com/us/en/products/espresso/bes450.html", image: "https://assets.breville.com/cdn-cgi/image/width=600,format=auto/BES450/BES450BSS1BUS1/pdp.png", imageCredit: "Breville" },
  { id: "m2", category: "Machine", type: "Semi-automatic", name: "Breville Bambino Plus", tier: "Budget/Mid", price: "$450–$500", notes: "Adds automatic milk texturing to the Bambino platform. Great step-up beginner machine.", link: "https://www.breville.com/us/en/products/espresso/bes500.html", image: "https://assets.breville.com/cdn-cgi/image/width=600,format=auto/BES500/BES500BSS1BUS1/pdp_1300px.png", imageCredit: "Breville" },
  { id: "m3", category: "Machine", type: "Single boiler, PID", name: "Lelit Anna PL41TEM", tier: "Mid", price: "$400–$500", notes: "Single boiler with PID temperature control and a sturdy metal build. Popular value pick that punches above its price.", link: "https://www.lelit.com/product/anna-pl41tem/", image: "https://www.lelit.com/wp-content/uploads/2024/03/MAIN-e1741266073723.png", imageCredit: "Lelit" },
  { id: "m4", category: "Machine", type: "Single boiler", name: "Rancilio Silvia", tier: "Mid", price: "$700–$800", notes: "Commercial grade steam wand and build quality; a long running home barista classic.", link: "https://www.ranciliogroup.com/rancilio/silvia/", image: "https://www.ranciliogroup.com/app/uploads/2019/09/rancilio-group-rancilio-homeline-semiautomatic-silvia-front-1024x1024-1.webp", imageCredit: "Rancilio" },
  { id: "m5", category: "Machine", type: "Dual boiler", name: "Profitec Pro 300", tier: "High-end", price: "$1,500–$2,200", notes: "Dual boiler with PID temperature control, so you can brew and steam at the same time. Fast heat up in a compact body.", link: "https://www.profitec-espresso.com/en/products/pro300", image: "https://www.profitec-espresso.com/media/pages/produkte/pro300/74803bf3bd-1767956163/pro_300-frontal.jpg", imageCredit: "Profitec" },
  { id: "m6", category: "Machine", type: "Dual boiler / prosumer", name: "La Marzocco Linea Mini", tier: "Premium", price: "$4,000+", notes: "Reference standard home dual boiler; the mini version of La Marzocco's commercial machines.", link: "https://lamarzoccousa.com/home-products/espresso-machines/linea-mini/", image: "https://lamarzoccousa.com/wp-content/uploads/2024/02/Linea-Mini-Silver-mat-front-1.png", imageCredit: "La Marzocco" },
  { id: "m7", category: "Machine", type: "Semi-automatic, built-in grinder", name: "Breville Barista Express", tier: "Mid", price: "$700", notes: "Built-in grinder, all-in-one workflow. Good if you want one box that goes from beans to shot.", link: "https://www.breville.com/us/en/products/espresso/bes870.html", image: "https://assets.breville.com/cdn-cgi/image/width=600,format=auto/Dynamic_Bundle/US/BES870XL_Transparent_1300x1300.png", imageCredit: "Breville" },

  // ---- Grinders ----
  { id: "g1", category: "Grinder", type: "Conical burr", name: "Baratza Encore ESP", tier: "Budget", price: "$200", notes: "Entry level espresso capable grinder; consistent grind for the price, easy to service.", link: "https://www.baratza.com/en-us/product/encoretm-esp-zcg495?sku=ZCG495BLK1AUC1A", image: "https://assets.breville.com/cdn-cgi/image/width=600,format=auto/ZCG495/ZCG495BLK1AUC1A.png", imageCredit: "Baratza" },
  { id: "g2", category: "Grinder", type: "Conical burr, built-in scale", name: "Baratza Sette 270Wi", tier: "Mid/High", price: "$500–$600", notes: "270 grind settings, integrated weight based dosing. Removes a lot of guesswork.", link: "https://www.baratza.com/en-us/product/settetm-270wi-zcg1279?sku=ZCG1279BLK1BUC1A", image: "https://assets.breville.com/cdn-cgi/image/width=600,format=auto/ZCG1279/ZCG1279BLK1BUC1A.png", imageCredit: "Baratza" },
  { id: "g3", category: "Grinder", type: "Flat burr, stepless", name: "DF64 Gen 2", tier: "Mid", price: "$400–$450", notes: "64mm flat steel burrs, stepless adjustment, low retention single dosing. Strong value in the enthusiast tier.", link: "https://df64coffee.com/products/df64-gen-2-single-dose-coffee-grinder", image: "https://df64coffee.com/cdn/shop/files/64_GEN_2.png?v=1750929704&width=600", imageCredit: "DF64" },
  { id: "g4", category: "Grinder", type: "Flat burr", name: "Eureka Mignon Specialita", tier: "Mid/High", price: "$500–$600", notes: "Popular Italian made grinder with fast dosing and reliable consistency.", link: "https://www.eureka.co.it/en/products/eureka+1920/mignon+grinders/silent+range/20/", image: "https://www.eureka.co.it/public/catalogo/20-1.jpg", imageCredit: "Eureka" },
  { id: "g5", category: "Grinder", type: "Single dose conical burr", name: "Niche Zero", tier: "High-end", price: "$700+", notes: "Low retention single dose grinder; a favorite in the home barista community.", link: "https://www.nichecoffee.co.uk/products/niche-zero", image: "https://www.nichecoffee.co.uk/cdn/shop/files/Black-63C-dark-grey-bkg-1000px.jpg?v=1727943140&width=600", imageCredit: "Niche Coffee" },

  // ---- Tools & Accessories ----
  { id: "t1", category: "Tool", type: "Scale", name: "Acaia Pearl", tier: "Mid/High", price: "$150–$200", notes: "Precision brewing scale with timer, 0.1g resolution. The standard for dialing in ratios.", link: "https://acaia.co/products/pearl", image: "https://acaia.co/cdn/shop/files/Pearl_PitchBlack_withLED.jpg?v=1740983808&width=600", imageCredit: "Acaia" },
  { id: "t2", category: "Tool", type: "Tamper", name: "Normcore Spring Loaded Tamper V4 (58.5mm)", tier: "Budget", price: "$47", notes: "Spring loaded, calibrated tamper that applies the same pressure shot to shot.", link: "https://www.normcorewares.com/products/normcore-spring-loaded-tamper-v4", image: "https://cdn.shopify.com/s/files/1/0510/5670/5732/products/normcore-wares--normcore-spring-loaded-tamper-upgraded-v4-37536261308664.jpg?v=1655649120&width=600", imageCredit: "Normcore" },
  { id: "t3", category: "Tool", type: "Distribution tool (WDT)", name: "Normcore WDT Tool V4", tier: "Budget", price: "$50", notes: "Fine needle tool used to break up clumps before tamping for even extraction. Needles retract for storage.", link: "https://www.normcorewares.com/products/normcore-wdt-tool-v4-retractable-espresso-distribution-tool", image: "https://cdn.shopify.com/s/files/1/0510/5670/5732/files/normcore-wares-distribution-tools-black-normcore-wdt-tool-v4-retractable-espresso-distribution-tool-1251620042.jpg?v=1785443707&width=600", imageCredit: "Normcore" },
  { id: "t4", category: "Tool", type: "Milk pitcher", name: "Normcore Milk Pitcher", tier: "Budget", price: "$30–$33", notes: "Stainless steaming pitcher with a sharp spout for latte art and milk texturing.", link: "https://www.normcorewares.com/products/normcore-milk-pitcher", image: "https://cdn.shopify.com/s/files/1/0510/5670/5732/files/normcore-wares--sharp-spout-600ml-20-3oz-black-normcore-milk-pitcher-39668480868600.jpg?v=1700038274&width=600", imageCredit: "Normcore" },
  { id: "t5", category: "Tool", type: "Puck screen", name: "Normcore Puck Screen (58.5mm)", tier: "Budget", price: "$14–$20", notes: "Sits above the puck to reduce channeling and keep the shower screen clean.", link: "https://www.normcorewares.com/products/normcore-espresso-puck-screen-316-stainless-steel", image: "https://cdn.shopify.com/s/files/1/0510/5670/5732/products/normcore-wares-normcore-lower-shower-screen-puck-screen-contact-screen-stainless-steel-29678774354116.jpg?v=1649661079&width=600", imageCredit: "Normcore" },
  { id: "t6", category: "Tool", type: "Bottomless portafilter", name: "Normcore Bottomless Portafilter", tier: "Budget", price: "$60–$90", notes: "Lets you see the extraction stream directly, a great way to spot channeling. Comes in 51, 54, and 58mm to fit most machines.", link: "https://www.normcorewares.com/products/normcore-naked-bottomless-portafilter-with-handle", image: "https://cdn.shopify.com/s/files/1/0510/5670/5732/files/normcore-wares-portafilters-black-58mm-fits-gaggia-normcore-bottomless-portafilter-with-handle-1247360954.jpg?v=1783190588&width=600", imageCredit: "Normcore" },
  { id: "t7", category: "Tool", type: "Refractometer", name: "Atago PAL-COFFEE Refractometer", tier: "High-end", price: "$360", notes: "Measures TDS to calculate extraction yield, for dialing in with real numbers, not just taste.", link: "https://www.atago.net/en/atagodirect-index.php?key=CGD50756", image: "https://www.atago.net/images/products/img_l/pal-coffee-bx_tds_l.jpg", imageCredit: "Atago" }
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
