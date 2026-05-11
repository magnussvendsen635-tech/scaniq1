// Maps recipes to royalty-free Unsplash food photos.
// We pick a stable photo ID based on keywords in the recipe name/ingredients.
// All URLs use Unsplash's images.unsplash.com CDN with sizing params.

type Entry = { keys: string[]; id: string };

// High-quality, realistic food photography (Unsplash).
const PHOTOS: Entry[] = [
  { keys: ["havregrød", "grød", "oats", "oatmeal"], id: "photo-1517673400267-0251440c45dc" },
  { keys: ["skyr", "yoghurt", "yogurt", "parfait", "cottage"], id: "photo-1488477181946-6428a0291777" },
  { keys: ["omelet", "æg", "røræg", "æggehvide", "bagte æg"], id: "photo-1525351484163-7529414344d8" },
  { keys: ["rugbrød", "madder", "hytteostmadder", "smørrebrød"], id: "photo-1509440159596-0249088772ff" },
  { keys: ["smoothie", "shake"], id: "photo-1502741224143-90386d7f8c7e" },
  { keys: ["wrap", "tortilla", "burrito"], id: "photo-1626700051175-6818013e1d4f" },
  { keys: ["chia", "pudding"], id: "photo-1542691457-cbe4df041eb2" },
  { keys: ["pandekager", "pancake"], id: "photo-1528207776546-365bb710ee93" },
  { keys: ["avocadotoast", "avocado", "toast"], id: "photo-1541519227354-08fa5d50c44d" },
  { keys: ["müsli", "granola"], id: "photo-1565958011703-44f9829ba187" },
  { keys: ["bacon"], id: "photo-1528607929212-2636ec44253e" },
  { keys: ["protein", "proteinpandekager"], id: "photo-1607532941433-304659e8198a" },
  { keys: ["shakshuka"], id: "photo-1590412200988-a436970781fa" },
  { keys: ["frugt", "frugtsalat", "bær", "banan"], id: "photo-1490474504059-bf2db5ab2348" },
  { keys: ["salat", "kyllingesalat", "tunsalat", "avocadosalat", "bønnesalat"], id: "photo-1512621776951-a57141f2eefd" },
  { keys: ["caesar"], id: "photo-1550304943-4f24f54ddde9" },
  { keys: ["quinoa", "bowl", "buddha"], id: "photo-1546069901-ba9599a7e63c" },
  { keys: ["falafel", "hummus", "pita"], id: "photo-1540420773420-3366772f4999" },
  { keys: ["tomatsuppe", "suppe", "linsesuppe"], id: "photo-1547592180-85f173990554" },
  { keys: ["sushi", "laks", "fisk"], id: "photo-1579871494447-9811cf80d66c" },
  { keys: ["carbonara", "pasta", "pesto", "spaghetti"], id: "photo-1551183053-bf91a1d81141" },
  { keys: ["kylling", "chicken"], id: "photo-1532550907401-a500c9a57435" },
  { keys: ["bøf", "steak", "oksekød"], id: "photo-1546964124-0cce460f38ef" },
  { keys: ["burger"], id: "photo-1568901346375-23c9450c58cd" },
  { keys: ["pizza"], id: "photo-1565299624946-b28f40a0ae38" },
  { keys: ["taco"], id: "photo-1565299585323-38d6b0865b47" },
  { keys: ["ris", "risotto"], id: "photo-1604908176997-125f25cc6f3d" },
  { keys: ["nudler", "noodle", "ramen"], id: "photo-1569718212165-3a8278d5f624" },
  { keys: ["curry"], id: "photo-1565557623262-b51c2513a641" },
  { keys: ["kartoffel", "potato"], id: "photo-1518977676601-b53f82aba655" },
  { keys: ["fisk", "torsk", "ørred"], id: "photo-1467003909585-2f8a72700288" },
  { keys: ["æble", "snack", "nødder", "bar"], id: "photo-1606312619070-d48b4c652a52" },
  { keys: ["chokolade", "kage", "dessert"], id: "photo-1551024601-bec78aea704b" },
  { keys: ["grøntsager", "veggie", "vegetar"], id: "photo-1540420773420-3366772f4999" },
];

const FALLBACK = "photo-1546069901-ba9599a7e63c";

export function recipeImage(name: string, w = 600): string {
  const n = name.toLowerCase();
  for (const p of PHOTOS) {
    if (p.keys.some((k) => n.includes(k))) {
      return `https://images.unsplash.com/${p.id}?auto=format&fit=crop&w=${w}&q=80`;
    }
  }
  return `https://images.unsplash.com/${FALLBACK}?auto=format&fit=crop&w=${w}&q=80`;
}
