// Maps recipes to high-quality, dish-specific Unsplash food photos.
// Strategy:
//   1. Match the recipe name against an ordered list of keyword groups.
//      Earlier (more specific) groups win over generic ones.
//   2. Each group has a POOL of distinct photos. We pick one
//      deterministically based on a hash of the recipe name, so two
//      similar recipes (e.g. "Kylling Caesar-salat" and "Kylling-pesto-wrap")
//      land on different photos but the SAME recipe always gets the same image.

type Group = { keys: string[]; pool: string[] };

const G = (keys: string[], pool: string[]): Group => ({ keys, pool });

// Order matters: most specific FIRST.
const GROUPS: Group[] = [
  // ---- World Cuisine specifics (must come BEFORE generic chicken/curry/etc.) ----
  G(["butter chicken"], ["photo-1603894584373-5ac82b2ae398", "photo-1565557623262-b51c2513a641"]),
  G(["chana masala"], ["photo-1631452180519-c014fe946bc7"]),
  G(["palak paneer"], ["photo-1601050690597-df0568f70950"]),
  G(["tandoori"], ["photo-1599487488170-d11ec9c172f0"]),
  G(["aloo gobi"], ["photo-1604908554049-2c43e35a0f95"]),
  G(["rogan josh"], ["photo-1574484284002-952d92456975"]),
  G(["dosa"], ["photo-1668236543090-82eba5ee5976"]),
  G(["risotto"], ["photo-1476124369491-e7addf5db371"]),
  G(["margherita", "neapolitan"], ["photo-1604068549290-dea0e4a305ca", "photo-1574071318508-1cdbab80d002"]),
  G(["osso buco"], ["photo-1432139509613-5c4255815697"]),
  G(["caprese", "burrata"], ["photo-1592417817098-8fd3d9eb14a5", "photo-1608032077018-c9aad9565d29"]),
  G(["trofie", "pesto trofie"], ["photo-1473093226795-af9932fe5856"]),
  G(["tonkotsu", "ramen"], ["photo-1591814468924-caf88d1232e1", "photo-1569718212165-3a8278d5f624"]),
  G(["teriyaki-laks", "teriyaki laks"], ["photo-1467003909585-2f8a72700288"]),
  G(["katsu"], ["photo-1610452725030-5e2c5e2c5e2c", "photo-1604908176997-125f25cc6f3d"]),
  G(["onigiri"], ["photo-1607301405390-d831c242d9d2"]),
  G(["yakitori"], ["photo-1606756790138-261d2b21cd75"]),
  G(["carnitas"], ["photo-1565299585323-38d6b0865b47"]),
  G(["enchilada"], ["photo-1582169296194-e4d644c48063"]),
  G(["elote"], ["photo-1626700051175-6818013e1d4f"]),
  G(["camarones"], ["photo-1565680018434-b513d5e5fd47"]),
  G(["chilaquiles"], ["photo-1551504734-5ee1c4a1479b"]),
  G(["pad thai"], ["photo-1559314809-0d155014e29e"]),
  G(["grøn karry", "green curry"], ["photo-1455619452474-d2be8b1e70cd"]),
  G(["tom kha", "tom yum"], ["photo-1547592180-85f173990554"]),
  G(["massaman"], ["photo-1574484284002-952d92456975"]),
  G(["larb"], ["photo-1606756790138-261d2b21cd75"]),
  G(["mango sticky"], ["photo-1568571780765-9276ac8b75a2"]),
  G(["bibimbap"], ["photo-1583224994076-ae3e1c81c1e0"]),
  G(["korean fried"], ["photo-1567620832903-9fc6debc209f"]),
  G(["bulgogi"], ["photo-1590301157890-4810ed352733"]),
  G(["kimchi"], ["photo-1583224994076-ae3e1c81c1e0"]),
  G(["japchae"], ["photo-1569718212165-3a8278d5f624"]),
  G(["tteokbokki"], ["photo-1635363638580-c2809d049eee"]),
  G(["smash burger", "smash"], ["photo-1568901346375-23c9450c58cd", "photo-1550547660-d9450f859349"]),
  G(["pulled pork"], ["photo-1606755456206-b25949b94ba6"]),
  G(["buffalo wing"], ["photo-1567620832903-9fc6debc209f"]),
  G(["mac and cheese", "mac & cheese"], ["photo-1543339308-43e59d6b73a6"]),
  G(["beef chili", "cheesy beef"], ["photo-1547592180-85f173990554"]),
  G(["souvlaki"], ["photo-1529006557810-274b9b2fc783"]),
  G(["moussaka"], ["photo-1574894709920-11b28e7367e3"]),
  G(["græsk salat"], ["photo-1540189549336-e6e99c3679fe"]),
  G(["spanakopita"], ["photo-1610614091890-0a92e2ed5e90"]),
  G(["gyros"], ["photo-1529006557810-274b9b2fc783"]),
  G(["bagt fetapasta", "fetapasta"], ["photo-1473093226795-af9932fe5856"]),

  // ---- Breakfast ----
  G(["overnight oats", "bircher"], ["photo-1517673400267-0251440c45dc", "photo-1502747275317-2c4d2b269c41", "photo-1571197119282-7c4e2c2a3b50"]),
  G(["havregrød", "grød", "porridge", "oatmeal"], ["photo-1517673400267-0251440c45dc", "photo-1571197119282-7c4e2c2a3b50", "photo-1547592180-85f173990554"]),
  G(["chiapudding", "chia"], ["photo-1542691457-cbe4df041eb2", "photo-1490474418585-ba9bad8fd0ea"]),
  G(["proteinpandekager", "fluffy pandekager", "amerikanske pandekager", "pancake"], ["photo-1528207776546-365bb710ee93", "photo-1567620905732-2d1ec7ab7445", "photo-1554520735-0a6b8b6ce8b7"]),
  G(["pandekager"], ["photo-1528207776546-365bb710ee93", "photo-1567620905732-2d1ec7ab7445"]),
  G(["vafler", "waffle"], ["photo-1562376552-0d160a2f238d", "photo-1542838687-3c6c80fe9da3"]),
  G(["fransk toast", "french toast"], ["photo-1484723091739-30a097e8f929"]),
  G(["avocadotoast", "avocado-toast", "avocado toast"], ["photo-1541519227354-08fa5d50c44d", "photo-1603046891744-76e6300f82ef"]),
  G(["shakshuka"], ["photo-1590412200988-a436970781fa", "photo-1604153546123-642c9b6d2bd9"]),
  G(["røræg", "scrambled"], ["photo-1525351484163-7529414344d8", "photo-1608039829572-78524f79c4c7"]),
  G(["omelet", "frittata", "tortilla española"], ["photo-1510693206972-df098062cb71", "photo-1612203985729-70726954388c", "photo-1608039755401-742074f0548d"]),
  G(["æggemuffins", "egg muffin"], ["photo-1547592180-85f173990554"]),
  G(["bagte æg", "huevos"], ["photo-1590412200988-a436970781fa"]),
  G(["bacon"], ["photo-1528607929212-2636ec44253e", "photo-1623653387945-2fd25214f8fc"]),
  G(["english breakfast", "engelsk fuld breakfast", "fuld breakfast"], ["photo-1533089860892-a9b9ac6cd6a4"]),
  G(["breakfast hash", "hash"], ["photo-1551782450-a2132b4ba21d"]),
  G(["smoothie-bowl", "smoothie bowl", "acai"], ["photo-1490474418585-ba9bad8fd0ea", "photo-1502741224143-90386d7f8c7e", "photo-1623428187969-5da2dcea5ebf"]),
  G(["protein smoothie", "protein-shake", "proteinshake"], ["photo-1622484212850-eb596d769edc", "photo-1553530666-ba11a7da3888"]),
  G(["smoothie", "shake"], ["photo-1502741224143-90386d7f8c7e", "photo-1623428187969-5da2dcea5ebf", "photo-1553530666-ba11a7da3888", "photo-1638176066666-ffb2f013c7dd"]),
  G(["müsli", "musli", "granola"], ["photo-1517686469429-8bdb88b9f907", "photo-1565958011703-44f9829ba187"]),
  G(["yoghurtparfait", "parfait"], ["photo-1488477181946-6428a0291777"]),
  G(["skyr", "yoghurt", "yogurt", "cottage"], ["photo-1488477181946-6428a0291777", "photo-1571212515416-fef01fc43637"]),
  G(["bananbrød", "banana bread"], ["photo-1606101206348-fce2db4cc2d4"]),
  G(["kanelsnegl", "cinnamon roll", "kanel-rouletter"], ["photo-1583527976767-e4ee2d2e1cf4"]),
  G(["rugbrødsmadder", "smørrebrød", "hytteostmadder"], ["photo-1509440159596-0249088772ff"]),
  G(["wrap", "tortilla", "burrito", "quesadilla"], ["photo-1626700051175-6818013e1d4f", "photo-1565299585323-38d6b0865b47", "photo-1551504734-5ee1c4a1479b"]),
  G(["toast", "ricotta-toast", "hummustoast", "hytteost-toast"], ["photo-1525351484163-7529414344d8", "photo-1484723091739-30a097e8f929"]),

  // ---- Salads / Bowls ----
  G(["caesar"], ["photo-1550304943-4f24f54ddde9", "photo-1551248429-40975aa4de74"]),
  G(["niçoise", "nicoise"], ["photo-1505253758473-96b7015fcd40"]),
  G(["cobb"], ["photo-1546069901-ba9599a7e63c"]),
  G(["poké", "poke bowl", "poké bowl"], ["photo-1546069901-ba9599a7e63c", "photo-1604908176997-125f25cc6f3d"]),
  G(["buddha bowl", "grain bowl", "quinoa-bowl", "burrito bowl"], ["photo-1543339308-43e59d6b73a6", "photo-1512621776951-a57141f2eefd"]),
  G(["falafel"], ["photo-1593001872095-7d5b3868fb1d", "photo-1540420773420-3366772f4999"]),
  G(["hummus"], ["photo-1540713434306-58505cf1b6fc"]),
  G(["tunsalat", "tun-salat", "tun "], ["photo-1604908176997-125f25cc6f3d"]),
  G(["kyllingesalat", "kylling-salat", "kylling caesar"], ["photo-1551248429-40975aa4de74"]),
  G(["græsk salat", "græsk-salat"], ["photo-1540189549336-e6e99c3679fe"]),
  G(["salat", "salad"], ["photo-1512621776951-a57141f2eefd", "photo-1540189549336-e6e99c3679fe", "photo-1490645935967-10de6ba17061"]),

  // ---- Soups ----
  G(["ramen"], ["photo-1569718212165-3a8278d5f624", "photo-1591814468924-caf88d1232e1"]),
  G(["pho"], ["photo-1576577445504-6af96477db52"]),
  G(["misosuppe", "miso"], ["photo-1607301405390-d831c242d9d2"]),
  G(["tomatsuppe", "tomato soup"], ["photo-1547592180-85f173990554"]),
  G(["linsesuppe", "lentil soup"], ["photo-1583608205776-bfd35f0d9f83"]),
  G(["suppe", "soup", "chili"], ["photo-1547592180-85f173990554", "photo-1583608205776-bfd35f0d9f83"]),

  // ---- Pasta ----
  G(["lasagne", "lasagna"], ["photo-1574894709920-11b28e7367e3"]),
  G(["carbonara"], ["photo-1612874742237-6526221588e3"]),
  G(["bolognese", "ragu"], ["photo-1551892589-865f69869476"]),
  G(["pesto-pasta", "pestopasta", "pesto pasta"], ["photo-1473093226795-af9932fe5856"]),
  G(["mac and cheese", "mac & cheese", "macaroni"], ["photo-1543339308-43e59d6b73a6"]),
  G(["zoodle", "zoodles"], ["photo-1473093226795-af9932fe5856"]),
  G(["pasta", "spaghetti", "penne", "tagliatelle", "fettuccine", "rigatoni"], ["photo-1551183053-bf91a1d81141", "photo-1473093226795-af9932fe5856", "photo-1612874742237-6526221588e3", "photo-1551892589-865f69869476"]),

  // ---- Pizza / burgers / tacos ----
  G(["pizza"], ["photo-1565299624946-b28f40a0ae38", "photo-1513104890138-7c749659a591", "photo-1574071318508-1cdbab80d002"]),
  G(["burger", "smash"], ["photo-1568901346375-23c9450c58cd", "photo-1550547660-d9450f859349", "photo-1572802419224-296b0aeee0d9"]),
  G(["taco"], ["photo-1565299585323-38d6b0865b47", "photo-1599974579688-8dbdd335c77f"]),
  G(["quesadilla"], ["photo-1551504734-5ee1c4a1479b"]),
  G(["nachos"], ["photo-1582169296194-e4d644c48063"]),

  // ---- Asian ----
  G(["sushi"], ["photo-1579871494447-9811cf80d66c", "photo-1553621042-f6e147245754"]),
  G(["nigiri", "sashimi", "maki"], ["photo-1579871494447-9811cf80d66c"]),
  G(["pad thai"], ["photo-1559314809-0d155014e29e"]),
  G(["dumpling", "gyoza", "potsticker"], ["photo-1496116218417-1a781b1c416c"]),
  G(["bao"], ["photo-1626804475297-41608ea09aeb"]),
  G(["bibimbap"], ["photo-1583224994076-ae3e1c81c1e0"]),
  G(["teriyaki"], ["photo-1604908176997-125f25cc6f3d"]),
  G(["satay", "saté"], ["photo-1606756790138-261d2b21cd75"]),
  G(["tikka", "tandoori"], ["photo-1565557623262-b51c2513a641"]),
  G(["curry", "korma", "vindaloo", "massaman"], ["photo-1565557623262-b51c2513a641", "photo-1574484284002-952d92456975"]),
  G(["nudler", "noodle", "lo mein", "chow mein", "udon", "soba"], ["photo-1569718212165-3a8278d5f624", "photo-1583608205776-bfd35f0d9f83", "photo-1591814468924-caf88d1232e1"]),
  G(["wok", "stir fry", "stirfry"], ["photo-1604908176997-125f25cc6f3d"]),
  G(["ris", "risotto", "fried rice", "jasminris"], ["photo-1604908176997-125f25cc6f3d", "photo-1623428187969-5da2dcea5ebf", "photo-1546069901-ba9599a7e63c"]),

  // ---- Proteins ----
  G(["laks", "salmon"], ["photo-1467003909585-2f8a72700288", "photo-1519708227418-c8fd9a32b7a2"]),
  G(["tun", "tuna"], ["photo-1604908176997-125f25cc6f3d"]),
  G(["torsk", "cod"], ["photo-1535399831218-d4db1f8b6dca"]),
  G(["rejer", "shrimp", "scampi"], ["photo-1565680018434-b513d5e5fd47"]),
  G(["fisk", "fish"], ["photo-1535399831218-d4db1f8b6dca", "photo-1467003909585-2f8a72700288"]),
  G(["bøf", "steak", "ribeye", "tenderloin", "oksefilet"], ["photo-1546964124-0cce460f38ef", "photo-1600891964092-4316c288032e", "photo-1432139509613-5c4255815697"]),
  G(["oksekød", "hakket okse", "hakkebøf"], ["photo-1546964124-0cce460f38ef"]),
  G(["pulled pork", "pulled-pork"], ["photo-1606755456206-b25949b94ba6"]),
  G(["svinekød", "pork", "ribs", "spareribs"], ["photo-1432139509613-5c4255815697", "photo-1606755456206-b25949b94ba6"]),
  G(["kalkun", "turkey"], ["photo-1574484284002-952d92456975"]),
  G(["kyllingewings", "wings"], ["photo-1567620832903-9fc6debc209f"]),
  G(["kyllingelår", "drumstick"], ["photo-1532550907401-a500c9a57435"]),
  G(["kylling", "chicken"], ["photo-1532550907401-a500c9a57435", "photo-1604908554049-2c43e35a0f95", "photo-1598103442097-8b74394b95c6"]),

  // ---- Sides / veg ----
  G(["sød kartoffel", "sweet potato"], ["photo-1518977676601-b53f82aba655"]),
  G(["pommes", "fries"], ["photo-1573080496219-bb080dd4f877"]),
  G(["kartoffelmos", "mashed potato"], ["photo-1518977676601-b53f82aba655"]),
  G(["kartoffel", "potato"], ["photo-1518977676601-b53f82aba655"]),
  G(["broccoli"], ["photo-1583608205776-bfd35f0d9f83"]),
  G(["asparges", "asparagus"], ["photo-1530916547-04a6ab2e0fae"]),
  G(["bønner", "bean"], ["photo-1543339531-13ba1d52f069"]),

  // ---- Snacks ----
  G(["energibar", "proteinbar", "granolabar", "bar "], ["photo-1606312619070-d48b4c652a52", "photo-1626078436895-9f54d3d6e7b9"]),
  G(["nødder", "trail mix", "nuts"], ["photo-1599598425947-5202519df6c1"]),
  G(["æblestykker", "æble", "apple"], ["photo-1568702846914-96b305d2aaeb"]),
  G(["popcorn"], ["photo-1505686994434-e3cc5abf1330"]),
  G(["edamame"], ["photo-1532597326055-7ee6f8c1e8f7"]),
  G(["dip", "guacamole"], ["photo-1604152135912-04a022e23696"]),

  // ---- Desserts ----
  G(["proteindessert", "proteinpudding", "protein-pudding", "protein dessert"], ["photo-1488477181946-6428a0291777", "photo-1571212515416-fef01fc43637"]),
  G(["cheesecake"], ["photo-1567327613485-fbc7bf196198"]),
  G(["tiramisu"], ["photo-1571877227200-a0d98ea607e9"]),
  G(["brownie"], ["photo-1606313564200-e75d5e30476c"]),
  G(["cookie", "småkage"], ["photo-1499636136210-6f4ee915583e"]),
  G(["muffin"], ["photo-1607958996333-41aef7caefaa"]),
  G(["donut", "doughnut"], ["photo-1551024601-bec78aea704b"]),
  G(["isvaffel", "is ", "ice cream", "icecream", "nicecream"], ["photo-1488900128323-21503983a07e", "photo-1501443762994-82bd5dace89a"]),
  G(["mousse"], ["photo-1488477181946-6428a0291777"]),
  G(["chokoladekage", "chokolade-kage", "chocolate cake"], ["photo-1606313564200-e75d5e30476c"]),
  G(["kage", "cake"], ["photo-1551024601-bec78aea704b", "photo-1606313564200-e75d5e30476c"]),
  G(["dessert", "sweet"], ["photo-1488477181946-6428a0291777", "photo-1606313564200-e75d5e30476c", "photo-1551024601-bec78aea704b"]),

  // ---- Drinks ----
  G(["matcha"], ["photo-1545558014-8692077e9b5c"]),
  G(["chai latte", "chai"], ["photo-1517256673644-36ad11246d21"]),
  G(["latte", "cappuccino", "kaffe"], ["photo-1495474472287-4d71bcdd2085"]),
  G(["iced coffee", "cold brew"], ["photo-1461023058943-07fcbe16d735"]),
  G(["lemonade", "limonade"], ["photo-1556679343-c7306c1976bc"]),
  G(["iste", "iced tea"], ["photo-1556679343-c7306c1976bc"]),
  G(["te ", "tea "], ["photo-1517256673644-36ad11246d21"]),
  G(["mocktail", "kombucha"], ["photo-1551024506-0bccd828d307"]),
  G(["juice"], ["photo-1622597467836-f3285f2131b8"]),
  G(["vand med", "infused water"], ["photo-1502740479091-635887520276"]),

  // ---- Generic last-resorts ----
  G(["frugt", "bær", "fruit"], ["photo-1490474504059-bf2db5ab2348"]),
  G(["grøntsager", "veggie", "vegetar", "vegan"], ["photo-1540420773420-3366772f4999", "photo-1543339308-43e59d6b73a6"]),
  G(["bowl"], ["photo-1546069901-ba9599a7e63c", "photo-1543339308-43e59d6b73a6"]),
];

// Diverse fallback pool used only when nothing matches.
const FALLBACK_POOL = [
  "photo-1546069901-ba9599a7e63c",
  "photo-1490645935967-10de6ba17061",
  "photo-1543339308-43e59d6b73a6",
  "photo-1551183053-bf91a1d81141",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickFromPool(pool: string[], seed: string): string {
  return pool[hash(seed) % pool.length];
}

function url(id: string, w: number): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export function recipeImage(name: string, w = 600): string {
  const n = name.toLowerCase();
  for (const g of GROUPS) {
    if (g.keys.some((k) => n.includes(k))) {
      return url(pickFromPool(g.pool, name), w);
    }
  }
  return url(pickFromPool(FALLBACK_POOL, name), w);
}
