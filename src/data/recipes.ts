// Auto-generated Danish recipe catalogue (~2000 items)
export type RecipeCategory = "breakfast" | "lunch" | "dinner" | "snack";
export type RecipeTag = "high-protein" | "low-carb" | "vegetarian" | "quick" | "low-cal";

export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  category: RecipeCategory;
  tags: RecipeTag[];
  minutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
};

type Base = {
  name: string;
  emoji: string;
  minutes: number;
  cal: number; p: number; c: number; f: number;
  ingredients: string[];
  steps: string[];
  tags: RecipeTag[];
};

type Variant = {
  suffix: string;
  ing: string[];
  cal: number; p: number; c: number; f: number;
  tags: RecipeTag[];
};

// 25 grundret pr. kategori × 20 varianter = 500 pr. kategori → 2000 i alt.
const breakfastBase: Base[] = [
  { name: "Havregrød", emoji: "🥣", minutes: 8, cal: 320, p: 12, c: 50, f: 7, ingredients: ["60g havregryn", "250ml mælk", "Kanel", "Honning"], steps: ["Kog havregryn med mælk 4 min.", "Smag til med kanel og honning."], tags: ["quick"] },
  { name: "Skyr-bowl", emoji: "🍶", minutes: 4, cal: 260, p: 24, c: 28, f: 3, ingredients: ["200g skyr", "30g granola", "100g bær"], steps: ["Hæld skyr i skål.", "Top med granola og bær."], tags: ["high-protein", "quick"] },
  { name: "Omelet", emoji: "🍳", minutes: 8, cal: 320, p: 24, c: 4, f: 22, ingredients: ["3 æg", "Spinat", "Tomat", "Olivenolie"], steps: ["Pisk æg.", "Sauter grønt.", "Hæld æg over og fold."], tags: ["high-protein", "low-carb", "quick"] },
  { name: "Rugbrødsmadder", emoji: "🥪", minutes: 5, cal: 380, p: 18, c: 38, f: 14, ingredients: ["2 skiver rugbrød", "Smør", "Pålæg", "Agurk"], steps: ["Smør brød.", "Læg pålæg på.", "Pynt med agurk."], tags: ["quick"] },
  { name: "Smoothie", emoji: "🥤", minutes: 3, cal: 290, p: 22, c: 38, f: 5, ingredients: ["1 scoop proteinpulver", "Banan", "Bær", "250ml mandelmælk"], steps: ["Blend alt i 30 sek."], tags: ["high-protein", "quick"] },
  { name: "Æggewrap", emoji: "🌯", minutes: 7, cal: 360, p: 22, c: 28, f: 16, ingredients: ["2 æg", "Tortilla", "Avocado", "Salsa"], steps: ["Steg røræg.", "Læg på tortilla.", "Rul med avocado."], tags: ["quick"] },
  { name: "Chia-pudding", emoji: "🍮", minutes: 5, cal: 240, p: 12, c: 24, f: 11, ingredients: ["3 spsk chiafrø", "200ml mælk", "Vanilje", "Bær"], steps: ["Bland chia + mælk.", "Stil i køleskab natten over.", "Top med bær."], tags: ["vegetarian"] },
  { name: "Pandekager", emoji: "🥞", minutes: 12, cal: 420, p: 18, c: 55, f: 12, ingredients: ["100g mel", "2 æg", "250ml mælk", "Smør"], steps: ["Pisk dej.", "Steg på pande.", "Server med topping."], tags: [] },
  { name: "Avocadotoast", emoji: "🥑", minutes: 6, cal: 340, p: 12, c: 32, f: 18, ingredients: ["2 skiver fuldkornsbrød", "1 avocado", "Citron", "Chiliflager"], steps: ["Rist brød.", "Mos avocado.", "Top med citron og chili."], tags: ["vegetarian", "quick"] },
  { name: "Müsli", emoji: "🥥", minutes: 3, cal: 350, p: 10, c: 55, f: 9, ingredients: ["60g müsli", "200ml mælk", "Frugt"], steps: ["Hæld i skål.", "Tilsæt mælk og frugt."], tags: ["quick", "vegetarian"] },
  { name: "Bagte æg", emoji: "🍳", minutes: 15, cal: 290, p: 20, c: 6, f: 20, ingredients: ["3 æg", "Tomat", "Fløde", "Krydderier"], steps: ["Knæk æg i form.", "Bag 10 min ved 200°C."], tags: ["high-protein", "low-carb"] },
  { name: "Proteinpandekager", emoji: "🥞", minutes: 10, cal: 380, p: 32, c: 32, f: 11, ingredients: ["1 banan", "2 æg", "30g proteinpulver", "Havregryn"], steps: ["Blend alt.", "Steg som pandekager."], tags: ["high-protein", "quick"] },
  { name: "Grød med æble", emoji: "🍎", minutes: 8, cal: 330, p: 11, c: 56, f: 6, ingredients: ["60g havregryn", "Mælk", "Æble", "Kanel"], steps: ["Kog grød.", "Top med æble og kanel."], tags: ["quick", "vegetarian"] },
  { name: "Cottage cheese-skål", emoji: "🥛", minutes: 3, cal: 230, p: 26, c: 12, f: 7, ingredients: ["200g cottage cheese", "Bær", "Honning"], steps: ["Bland og spis."], tags: ["high-protein", "quick", "low-cal"] },
  { name: "Bacon & æg", emoji: "🥓", minutes: 10, cal: 470, p: 28, c: 4, f: 38, ingredients: ["3 strimler bacon", "3 æg"], steps: ["Steg bacon.", "Steg æg i fedtet."], tags: ["high-protein", "low-carb"] },
  { name: "Croissant-toast", emoji: "🥐", minutes: 5, cal: 410, p: 10, c: 38, f: 24, ingredients: ["1 croissant", "Smør", "Marmelade"], steps: ["Rist croissant.", "Smør og topping."], tags: ["quick"] },
  { name: "Banan-grød", emoji: "🍌", minutes: 7, cal: 360, p: 12, c: 60, f: 7, ingredients: ["Havregryn", "Banan", "Mælk", "Honning"], steps: ["Kog grød.", "Mos banan i.", "Drys honning."], tags: ["quick", "vegetarian"] },
  { name: "Æggemuffins", emoji: "🧁", minutes: 25, cal: 260, p: 22, c: 4, f: 18, ingredients: ["6 æg", "Spinat", "Feta"], steps: ["Pisk æg.", "Hæld i muffinform.", "Bag 18 min ved 180°C."], tags: ["high-protein", "low-carb"] },
  { name: "Yoghurtparfait", emoji: "🍨", minutes: 4, cal: 290, p: 18, c: 36, f: 6, ingredients: ["200g græsk yoghurt", "Granola", "Bær"], steps: ["Lag yoghurt, granola og bær."], tags: ["high-protein", "quick"] },
  { name: "Røræg med laks", emoji: "🐟", minutes: 8, cal: 380, p: 30, c: 3, f: 26, ingredients: ["3 æg", "Røget laks", "Purløg"], steps: ["Lav røræg.", "Vend laks i."], tags: ["high-protein", "low-carb", "quick"] },
  { name: "Frugtsalat", emoji: "🍓", minutes: 5, cal: 180, p: 4, c: 38, f: 1, ingredients: ["Æble", "Banan", "Bær", "Appelsin"], steps: ["Skær frugt.", "Bland i skål."], tags: ["low-cal", "quick", "vegetarian"] },
  { name: "Hytteostmadder", emoji: "🍞", minutes: 4, cal: 300, p: 22, c: 30, f: 8, ingredients: ["Rugbrød", "Hytteost", "Radiser"], steps: ["Smør hytteost på brød.", "Top med radiser."], tags: ["high-protein", "quick"] },
  { name: "Æggehvide-omelet", emoji: "🥚", minutes: 6, cal: 180, p: 26, c: 4, f: 5, ingredients: ["6 æggehvider", "Spinat", "Champignon"], steps: ["Sauter grønt.", "Hæld hvider over.", "Fold."], tags: ["high-protein", "low-cal", "low-carb", "quick"] },
  { name: "Banan-toast", emoji: "🍞", minutes: 5, cal: 320, p: 10, c: 48, f: 10, ingredients: ["Toast", "Peanutbutter", "Banan"], steps: ["Rist brød.", "Smør PB.", "Læg banan på."], tags: ["quick", "vegetarian"] },
  { name: "Shakshuka", emoji: "🍳", minutes: 20, cal: 360, p: 20, c: 18, f: 22, ingredients: ["Tomat", "Løg", "Peberfrugt", "3 æg", "Spidskommen"], steps: ["Steg løg og peber.", "Tilsæt tomat.", "Slå æg ud i og lad simre."], tags: ["high-protein", "vegetarian"] },
];

const lunchBase: Base[] = [
  { name: "Kyllingesalat", emoji: "🥗", minutes: 12, cal: 450, p: 38, c: 18, f: 22, ingredients: ["150g kylling", "Salat", "Tomat", "Olivenolie"], steps: ["Steg kylling.", "Bland med salat.", "Dressing på."], tags: ["high-protein", "quick"] },
  { name: "Caesar-wrap", emoji: "🌯", minutes: 10, cal: 510, p: 38, c: 38, f: 22, ingredients: ["Kylling", "Tortilla", "Romaine", "Caesar-dressing", "Parmesan"], steps: ["Grill kylling.", "Vend i salat.", "Rul i tortilla."], tags: ["high-protein", "quick"] },
  { name: "Tunsalat", emoji: "🐟", minutes: 6, cal: 380, p: 32, c: 12, f: 22, ingredients: ["1 dåse tun", "Avocado", "Citron", "Tomat"], steps: ["Dræn tun.", "Bland alt."], tags: ["high-protein", "low-carb", "quick"] },
  { name: "Quinoa-bowl", emoji: "🥗", minutes: 18, cal: 480, p: 22, c: 60, f: 16, ingredients: ["100g quinoa", "Kikærter", "Agurk", "Feta"], steps: ["Kog quinoa.", "Bland alt.", "Drys tahindressing."], tags: ["high-protein", "vegetarian"] },
  { name: "Falafel-bowl", emoji: "🧆", minutes: 15, cal: 520, p: 20, c: 56, f: 24, ingredients: ["Falafel", "Hummus", "Salat", "Pita"], steps: ["Varm falafel.", "Anret i skål."], tags: ["vegetarian"] },
  { name: "Tomatsuppe", emoji: "🍅", minutes: 20, cal: 280, p: 8, c: 30, f: 12, ingredients: ["Tomat", "Løg", "Hvidløg", "Fløde"], steps: ["Sauter løg.", "Tilsæt tomat.", "Blend og smag til."], tags: ["vegetarian", "low-cal"] },
  { name: "Linsesuppe", emoji: "🍲", minutes: 30, cal: 360, p: 22, c: 50, f: 6, ingredients: ["Røde linser", "Gulerod", "Løg", "Bouillon"], steps: ["Sauter grønt.", "Tilsæt linser + væske.", "Kog 20 min."], tags: ["high-protein", "vegetarian"] },
  { name: "Sushi-bowl", emoji: "🍣", minutes: 15, cal: 480, p: 26, c: 60, f: 14, ingredients: ["Sushi-ris", "Laks", "Avocado", "Edamame"], steps: ["Kog ris.", "Anret med tern.", "Drys sesam."], tags: ["high-protein"] },
  { name: "Carbonara", emoji: "🍝", minutes: 18, cal: 620, p: 28, c: 70, f: 22, ingredients: ["Pasta", "Bacon", "Æg", "Parmesan"], steps: ["Kog pasta.", "Steg bacon.", "Vend med æg og ost."], tags: [] },
  { name: "Pesto-pasta", emoji: "🌿", minutes: 12, cal: 540, p: 18, c: 70, f: 20, ingredients: ["Pasta", "Pesto", "Cherrytomat", "Parmesan"], steps: ["Kog pasta.", "Vend med pesto."], tags: ["vegetarian", "quick"] },
  { name: "Pita med kylling", emoji: "🌮", minutes: 12, cal: 510, p: 36, c: 48, f: 16, ingredients: ["Pita", "Kylling", "Salat", "Tzatziki"], steps: ["Steg kylling.", "Fyld pita."], tags: ["high-protein", "quick"] },
  { name: "Avocadosalat", emoji: "🥑", minutes: 8, cal: 360, p: 10, c: 18, f: 28, ingredients: ["Avocado", "Tomat", "Mozzarella", "Basilikum"], steps: ["Skær alt.", "Drys olie og salt."], tags: ["vegetarian", "low-carb", "quick"] },
  { name: "Bønnesalat", emoji: "🫘", minutes: 8, cal: 340, p: 18, c: 44, f: 8, ingredients: ["Kidneybønner", "Majs", "Peberfrugt", "Koriander"], steps: ["Skyl bønner.", "Bland alt.", "Limedressing."], tags: ["vegetarian", "high-protein", "quick"] },
  { name: "Æggesalat-sandwich", emoji: "🥚", minutes: 8, cal: 420, p: 22, c: 30, f: 22, ingredients: ["Æg", "Mayo", "Karse", "Brød"], steps: ["Hak æg.", "Bland med mayo.", "Smør på brød."], tags: ["high-protein", "quick"] },
  { name: "Burrito-bowl", emoji: "🌯", minutes: 15, cal: 580, p: 32, c: 60, f: 22, ingredients: ["Ris", "Sorte bønner", "Kylling", "Salsa"], steps: ["Kog ris.", "Anret med fyld."], tags: ["high-protein"] },
  { name: "Frittata", emoji: "🍳", minutes: 20, cal: 380, p: 26, c: 8, f: 26, ingredients: ["6 æg", "Kartoffel", "Spinat", "Feta"], steps: ["Sauter grønt.", "Hæld æg i.", "Bag færdig."], tags: ["high-protein", "low-carb"] },
  { name: "Pokebowl", emoji: "🍱", minutes: 15, cal: 520, p: 30, c: 58, f: 16, ingredients: ["Ris", "Tun", "Edamame", "Mango", "Sesam"], steps: ["Kog ris.", "Anret tern.", "Drys sesam."], tags: ["high-protein"] },
  { name: "Couscous-salat", emoji: "🥗", minutes: 12, cal: 440, p: 16, c: 60, f: 14, ingredients: ["Couscous", "Agurk", "Tomat", "Feta", "Mynte"], steps: ["Hæld kogende vand på couscous.", "Bland alt."], tags: ["vegetarian", "quick"] },
  { name: "Kalkun-sandwich", emoji: "🦃", minutes: 6, cal: 420, p: 32, c: 38, f: 14, ingredients: ["Fuldkornsbrød", "Kalkun", "Avocado", "Salat"], steps: ["Saml sandwich."], tags: ["high-protein", "quick"] },
  { name: "Klassisk salat", emoji: "🥬", minutes: 10, cal: 320, p: 14, c: 18, f: 22, ingredients: ["Blandet salat", "Æg", "Bacon", "Croutoner"], steps: ["Bland alt.", "Drys dressing."], tags: ["low-cal", "quick"] },
  { name: "Laksesandwich", emoji: "🐟", minutes: 6, cal: 460, p: 28, c: 36, f: 22, ingredients: ["Rugbrød", "Laks", "Flødeost", "Dild"], steps: ["Smør flødeost.", "Læg laks og dild på."], tags: ["high-protein", "quick"] },
  { name: "Vegetarchili", emoji: "🌶️", minutes: 30, cal: 380, p: 18, c: 56, f: 8, ingredients: ["Bønner", "Tomat", "Løg", "Krydderier"], steps: ["Sauter løg.", "Tilsæt bønner og tomat.", "Simr 20 min."], tags: ["vegetarian", "high-protein"] },
  { name: "Grøntsagssuppe", emoji: "🥕", minutes: 25, cal: 220, p: 8, c: 30, f: 6, ingredients: ["Gulerod", "Selleri", "Løg", "Bouillon"], steps: ["Sauter.", "Tilsæt væske.", "Kog 20 min."], tags: ["low-cal", "vegetarian"] },
  { name: "Mexicansk bowl", emoji: "🌶️", minutes: 15, cal: 520, p: 28, c: 56, f: 20, ingredients: ["Ris", "Hakkekød", "Majs", "Salsa"], steps: ["Steg kød.", "Anret med ris og majs."], tags: ["high-protein"] },
  { name: "Græsk salat", emoji: "🇬🇷", minutes: 8, cal: 360, p: 12, c: 18, f: 26, ingredients: ["Tomat", "Agurk", "Oliven", "Feta", "Rødløg"], steps: ["Skær alt.", "Bland med olie og oregano."], tags: ["vegetarian", "low-carb", "quick"] },
];

const dinnerBase: Base[] = [
  { name: "Laks med asparges", emoji: "🐟", minutes: 18, cal: 520, p: 40, c: 8, f: 32, ingredients: ["180g laks", "Asparges", "Citron", "Olivenolie"], steps: ["Bag laks 12 min ved 200°C.", "Sauter asparges."], tags: ["high-protein", "low-carb"] },
  { name: "Kylling med ris", emoji: "🍗", minutes: 25, cal: 560, p: 42, c: 60, f: 14, ingredients: ["150g kyllingebryst", "Ris", "Broccoli", "Soja"], steps: ["Kog ris.", "Steg kylling.", "Damp broccoli."], tags: ["high-protein"] },
  { name: "Bøf med kartofler", emoji: "🥩", minutes: 25, cal: 620, p: 40, c: 45, f: 28, ingredients: ["200g oksebøf", "Kartoffel", "Smør", "Salat"], steps: ["Bag kartofler.", "Pandestegt bøf."], tags: ["high-protein"] },
  { name: "Spaghetti bolognese", emoji: "🍝", minutes: 30, cal: 600, p: 32, c: 65, f: 22, ingredients: ["Pasta", "Hakkekød", "Tomat", "Løg"], steps: ["Steg kød.", "Tilsæt sovs.", "Server med pasta."], tags: ["high-protein"] },
  { name: "Kalkungryde", emoji: "🦃", minutes: 25, cal: 460, p: 38, c: 32, f: 18, ingredients: ["300g kalkunfars", "Peberfrugt", "Broccoli", "Soja", "Ris"], steps: ["Brun kalkun.", "Tilsæt grønt og soja.", "Server over ris."], tags: ["high-protein", "quick"] },
  { name: "Oksekød & søde kartofler", emoji: "🥩", minutes: 30, cal: 580, p: 42, c: 45, f: 22, ingredients: ["Magert oksekød", "Sød kartoffel", "Broccoli"], steps: ["Bag søde kartofler.", "Pandestegt oksekød."], tags: ["high-protein"] },
  { name: "Vegetarchili", emoji: "🌶️", minutes: 35, cal: 380, p: 18, c: 55, f: 9, ingredients: ["Sorte bønner", "Kidneybønner", "Tomat", "Løg"], steps: ["Sauter løg.", "Tilsæt bønner og tomat.", "Simr 25 min."], tags: ["vegetarian", "high-protein"] },
  { name: "Rejer med zoodler", emoji: "🍤", minutes: 12, cal: 320, p: 32, c: 14, f: 14, ingredients: ["150g rejer", "Squash-zoodler", "Hvidløg", "Chili"], steps: ["Sauter hvidløg + chili.", "Tilsæt rejer.", "Vend zoodler i."], tags: ["high-protein", "low-carb", "low-cal"] },
  { name: "Kylling-curry", emoji: "🍛", minutes: 25, cal: 540, p: 38, c: 40, f: 22, ingredients: ["Kylling", "Karry", "Kokosmælk", "Ris"], steps: ["Brun kylling.", "Tilsæt karry og kokosmælk.", "Simr 15 min."], tags: ["high-protein"] },
  { name: "Lasagne", emoji: "🧀", minutes: 60, cal: 640, p: 34, c: 56, f: 28, ingredients: ["Lasagneplader", "Hakkekød", "Tomat", "Bechamel", "Ost"], steps: ["Lav kødsovs.", "Lag i form.", "Bag 35 min ved 200°C."], tags: ["high-protein"] },
  { name: "Pizza Margherita", emoji: "🍕", minutes: 25, cal: 580, p: 24, c: 70, f: 20, ingredients: ["Pizzabund", "Tomatsovs", "Mozzarella", "Basilikum"], steps: ["Pynt bund.", "Bag 12 min ved 230°C."], tags: ["vegetarian"] },
  { name: "Risotto", emoji: "🍚", minutes: 30, cal: 520, p: 14, c: 70, f: 18, ingredients: ["Risottoris", "Bouillon", "Parmesan", "Smør"], steps: ["Sauter løg.", "Tilsæt ris og bouillon gradvist.", "Rør parmesan i."], tags: ["vegetarian"] },
  { name: "Burger", emoji: "🍔", minutes: 20, cal: 680, p: 38, c: 50, f: 32, ingredients: ["Bolle", "Bøf 150g", "Salat", "Tomat", "Ost"], steps: ["Steg bøf.", "Saml burger."], tags: ["high-protein"] },
  { name: "Fiskefilet i ovn", emoji: "🐟", minutes: 20, cal: 380, p: 36, c: 6, f: 18, ingredients: ["180g fiskefilet", "Citron", "Persille", "Smør"], steps: ["Læg fisk i form.", "Bag 12 min ved 200°C."], tags: ["high-protein", "low-carb"] },
  { name: "Tortilla-tærte", emoji: "🌮", minutes: 35, cal: 520, p: 32, c: 45, f: 22, ingredients: ["Tortillas", "Hakkekød", "Bønner", "Ost"], steps: ["Lag i form.", "Bag 25 min."], tags: ["high-protein"] },
  { name: "Ovnbagte grøntsager", emoji: "🥕", minutes: 35, cal: 320, p: 8, c: 40, f: 14, ingredients: ["Gulerod", "Squash", "Peber", "Olivenolie"], steps: ["Skær grønt.", "Bag 25 min ved 200°C."], tags: ["vegetarian", "low-cal"] },
  { name: "Andebryst", emoji: "🦆", minutes: 30, cal: 560, p: 36, c: 20, f: 32, ingredients: ["Andebryst", "Kartofler", "Rødkål"], steps: ["Pandestegt andebryst.", "Bag kartofler.", "Server med rødkål."], tags: ["high-protein"] },
  { name: "Lammekoteletter", emoji: "🍖", minutes: 20, cal: 580, p: 38, c: 12, f: 38, ingredients: ["Lammekoteletter", "Rosmarin", "Hvidløg", "Grønt"], steps: ["Krydr koteletter.", "Pandestegt 3 min pr. side."], tags: ["high-protein", "low-carb"] },
  { name: "Vegetar-lasagne", emoji: "🥬", minutes: 50, cal: 480, p: 22, c: 56, f: 18, ingredients: ["Plader", "Spinat", "Ricotta", "Tomat"], steps: ["Lag i form.", "Bag 30 min."], tags: ["vegetarian", "high-protein"] },
  { name: "Wok med tofu", emoji: "🥢", minutes: 18, cal: 420, p: 24, c: 36, f: 18, ingredients: ["Tofu", "Wokgrønt", "Soja", "Ingefær"], steps: ["Brun tofu.", "Wok grønt.", "Sojadressing."], tags: ["vegetarian", "high-protein", "quick"] },
  { name: "Mexicansk gryde", emoji: "🌮", minutes: 30, cal: 540, p: 32, c: 56, f: 18, ingredients: ["Hakkekød", "Bønner", "Majs", "Tomat", "Krydderier"], steps: ["Brun kød.", "Tilsæt resten.", "Simr 20 min."], tags: ["high-protein"] },
  { name: "Kyllingelår i ovn", emoji: "🍗", minutes: 45, cal: 520, p: 36, c: 30, f: 24, ingredients: ["Kyllingelår", "Kartofler", "Citron", "Timian"], steps: ["Læg i bradepande.", "Bag 40 min ved 200°C."], tags: ["high-protein"] },
  { name: "Pad Thai", emoji: "🍜", minutes: 20, cal: 580, p: 28, c: 70, f: 18, ingredients: ["Risnudler", "Æg", "Rejer", "Bønnespirer", "Peanuts"], steps: ["Kog nudler.", "Wok æg + rejer.", "Bland alt med sauce."], tags: ["high-protein"] },
  { name: "Tærte med spinat", emoji: "🥧", minutes: 50, cal: 460, p: 20, c: 32, f: 26, ingredients: ["Tærtedej", "Spinat", "Feta", "Æg"], steps: ["Beklæd form.", "Fyld i.", "Bag 35 min ved 190°C."], tags: ["vegetarian"] },
  { name: "Boller i karry", emoji: "🍛", minutes: 30, cal: 540, p: 30, c: 56, f: 18, ingredients: ["Hakket kalvekød", "Karry", "Løg", "Ris"], steps: ["Form boller, kog.", "Lav karrysovs.", "Server over ris."], tags: ["high-protein"] },
];

const snackBase: Base[] = [
  { name: "Hytteost med ananas", emoji: "🍍", minutes: 2, cal: 180, p: 22, c: 14, f: 3, ingredients: ["200g hytteost", "Ananas-tern"], steps: ["Bland og nyd."], tags: ["high-protein", "quick", "low-cal"] },
  { name: "Proteinshake", emoji: "🥤", minutes: 2, cal: 220, p: 30, c: 12, f: 4, ingredients: ["1 scoop proteinpulver", "300ml mælk"], steps: ["Ryst sammen i shaker."], tags: ["high-protein", "quick"] },
  { name: "Hummus med grønt", emoji: "🥕", minutes: 3, cal: 220, p: 8, c: 22, f: 12, ingredients: ["Hummus", "Gulerod", "Agurk", "Peberfrugt"], steps: ["Skær grønt.", "Dyp i hummus."], tags: ["vegetarian", "quick", "low-cal"] },
  { name: "Æbleskiver med PB", emoji: "🍏", minutes: 3, cal: 200, p: 6, c: 24, f: 9, ingredients: ["Æble", "Peanutbutter"], steps: ["Skær æble.", "Dyp i PB."], tags: ["vegetarian", "quick"] },
  { name: "Nøddeblanding", emoji: "🥜", minutes: 1, cal: 280, p: 9, c: 12, f: 22, ingredients: ["30g blandede nødder"], steps: ["Spis."], tags: ["vegetarian", "quick", "low-carb"] },
  { name: "Bærskål", emoji: "🍓", minutes: 2, cal: 90, p: 2, c: 18, f: 1, ingredients: ["150g blandede bær"], steps: ["Skyl og spis."], tags: ["low-cal", "vegetarian", "quick"] },
  { name: "Skyr med honning", emoji: "🍯", minutes: 2, cal: 180, p: 22, c: 16, f: 1, ingredients: ["200g skyr", "1 tsk honning"], steps: ["Rør sammen."], tags: ["high-protein", "low-cal", "quick"] },
  { name: "Edamame", emoji: "🫛", minutes: 5, cal: 180, p: 16, c: 14, f: 8, ingredients: ["150g edamame", "Salt"], steps: ["Kog 4 min.", "Drys salt."], tags: ["vegetarian", "high-protein", "quick", "low-cal"] },
  { name: "Riskager med skinke", emoji: "🍘", minutes: 3, cal: 180, p: 12, c: 24, f: 4, ingredients: ["2 riskager", "Skinke", "Frisk ost"], steps: ["Smør ost på.", "Læg skinke på."], tags: ["high-protein", "low-cal", "quick"] },
  { name: "Mørk chokolade", emoji: "🍫", minutes: 1, cal: 170, p: 2, c: 16, f: 12, ingredients: ["30g 70% chokolade"], steps: ["Nyd."], tags: ["vegetarian", "quick"] },
  { name: "Popcorn", emoji: "🍿", minutes: 6, cal: 150, p: 4, c: 22, f: 6, ingredients: ["30g popcorn", "Salt"], steps: ["Pop på pande.", "Drys salt."], tags: ["vegetarian", "low-cal"] },
  { name: "Hårdkogt æg", emoji: "🥚", minutes: 10, cal: 140, p: 12, c: 1, f: 10, ingredients: ["2 æg"], steps: ["Kog 9 min.", "Skræl."], tags: ["high-protein", "low-carb", "low-cal"] },
  { name: "Avocado med citron", emoji: "🥑", minutes: 2, cal: 220, p: 3, c: 12, f: 20, ingredients: ["1 avocado", "Citron", "Salt"], steps: ["Halver avocado.", "Drys citron og salt."], tags: ["vegetarian", "low-carb", "quick"] },
  { name: "Protein-bar", emoji: "🍫", minutes: 1, cal: 220, p: 20, c: 22, f: 6, ingredients: ["1 protein-bar"], steps: ["Spis."], tags: ["high-protein", "quick"] },
  { name: "Mandler", emoji: "🌰", minutes: 1, cal: 200, p: 7, c: 7, f: 17, ingredients: ["30g mandler"], steps: ["Spis."], tags: ["vegetarian", "quick", "low-carb"] },
  { name: "Smoothie-bowl", emoji: "🥣", minutes: 5, cal: 280, p: 14, c: 42, f: 5, ingredients: ["Banan", "Bær", "Yoghurt", "Granola"], steps: ["Blend frugt og yoghurt.", "Top med granola."], tags: ["vegetarian", "quick"] },
  { name: "Tun-knækbrød", emoji: "🐟", minutes: 4, cal: 220, p: 22, c: 18, f: 6, ingredients: ["Knækbrød", "Tun", "Citron"], steps: ["Læg tun på knækbrød."], tags: ["high-protein", "low-cal", "quick"] },
  { name: "Banan med PB", emoji: "🍌", minutes: 2, cal: 240, p: 7, c: 30, f: 11, ingredients: ["1 banan", "1 spsk peanutbutter"], steps: ["Skær banan.", "Drys PB."], tags: ["vegetarian", "quick"] },
  { name: "Olivenmix", emoji: "🫒", minutes: 1, cal: 150, p: 2, c: 6, f: 14, ingredients: ["50g oliven", "Fetatern"], steps: ["Bland og servér."], tags: ["vegetarian", "low-carb", "quick"] },
  { name: "Mini-pizza", emoji: "🍕", minutes: 10, cal: 280, p: 14, c: 28, f: 12, ingredients: ["Pita", "Tomatsovs", "Ost"], steps: ["Pynt pita.", "Bag 8 min."], tags: ["vegetarian", "quick"] },
  { name: "Energibold", emoji: "⚡", minutes: 5, cal: 180, p: 6, c: 22, f: 8, ingredients: ["Havregryn", "Dadler", "Kakao", "Peanutbutter"], steps: ["Blend alt.", "Rul til boller."], tags: ["vegetarian", "quick"] },
  { name: "Cheddar med æble", emoji: "🧀", minutes: 2, cal: 220, p: 12, c: 14, f: 14, ingredients: ["30g cheddar", "1 æble"], steps: ["Skær begge.", "Server sammen."], tags: ["vegetarian", "quick"] },
  { name: "Tzatziki med gulerod", emoji: "🥒", minutes: 3, cal: 160, p: 6, c: 14, f: 8, ingredients: ["Tzatziki", "Gulerod"], steps: ["Skær gulerod.", "Dyp i tzatziki."], tags: ["vegetarian", "low-cal", "quick"] },
  { name: "Proteinpudding", emoji: "🍮", minutes: 5, cal: 220, p: 28, c: 18, f: 4, ingredients: ["Skyr", "Proteinpulver", "Kakao"], steps: ["Rør alt sammen.", "Stil koldt."], tags: ["high-protein", "quick", "low-cal"] },
  { name: "Frosne druer", emoji: "🍇", minutes: 1, cal: 120, p: 1, c: 28, f: 0, ingredients: ["150g frosne druer"], steps: ["Spis direkte fra fryser."], tags: ["vegetarian", "low-cal", "quick"] },
];

// 20 varianter pr. grundret — påvirker navn, ingredienser, makroer og tags.
const variants: Variant[] = [
  { suffix: "", ing: [], cal: 0, p: 0, c: 0, f: 0, tags: [] },
  { suffix: "med kylling", ing: ["100g kylling"], cal: 110, p: 22, c: 0, f: 2, tags: ["high-protein"] },
  { suffix: "med laks", ing: ["80g laks"], cal: 160, p: 18, c: 0, f: 10, tags: ["high-protein"] },
  { suffix: "med tun", ing: ["1 dåse tun"], cal: 100, p: 22, c: 0, f: 2, tags: ["high-protein"] },
  { suffix: "med rejer", ing: ["100g rejer"], cal: 90, p: 20, c: 1, f: 1, tags: ["high-protein", "low-carb"] },
  { suffix: "med tofu", ing: ["120g tofu"], cal: 140, p: 14, c: 4, f: 8, tags: ["vegetarian", "high-protein"] },
  { suffix: "med avocado", ing: ["1/2 avocado"], cal: 120, p: 1, c: 6, f: 11, tags: [] },
  { suffix: "med feta", ing: ["30g feta"], cal: 80, p: 4, c: 1, f: 6, tags: ["vegetarian"] },
  { suffix: "med kikærter", ing: ["100g kikærter"], cal: 160, p: 8, c: 27, f: 3, tags: ["vegetarian", "high-protein"] },
  { suffix: "low-carb", ing: [], cal: -120, p: 0, c: -30, f: 4, tags: ["low-carb"] },
  { suffix: "high-protein", ing: ["1 scoop proteinpulver"], cal: 120, p: 24, c: 2, f: 1, tags: ["high-protein"] },
  { suffix: "vegetar", ing: ["Ekstra grøntsager"], cal: -40, p: -6, c: 4, f: 0, tags: ["vegetarian"] },
  { suffix: "spicy", ing: ["Chili", "Hvidløg"], cal: 10, p: 0, c: 1, f: 0, tags: [] },
  { suffix: "med spinat", ing: ["50g spinat"], cal: 20, p: 2, c: 2, f: 0, tags: ["low-cal"] },
  { suffix: "med æg", ing: ["1 æg"], cal: 70, p: 6, c: 0, f: 5, tags: ["high-protein"] },
  { suffix: "med bacon", ing: ["2 strimler bacon"], cal: 120, p: 8, c: 0, f: 10, tags: [] },
  { suffix: "let", ing: [], cal: -150, p: 0, c: -15, f: -8, tags: ["low-cal"] },
  { suffix: "ekstra protein", ing: ["50g kalkun"], cal: 80, p: 16, c: 0, f: 1, tags: ["high-protein"] },
  { suffix: "asiatisk stil", ing: ["Soja", "Ingefær", "Sesam"], cal: 50, p: 2, c: 4, f: 3, tags: [] },
  { suffix: "middelhavsstil", ing: ["Oliven", "Tomat", "Oregano"], cal: 60, p: 2, c: 4, f: 4, tags: [] },
];

function buildCategory(base: Base[], category: RecipeCategory, prefix: string): Recipe[] {
  const out: Recipe[] = [];
  base.forEach((b, bi) => {
    variants.forEach((v, vi) => {
      const name = v.suffix ? `${b.name} ${v.suffix}` : b.name;
      const tags = Array.from(new Set([...b.tags, ...v.tags]));
      const cal = Math.max(80, b.cal + v.cal);
      const p = Math.max(2, b.p + v.p);
      const c = Math.max(0, b.c + v.c);
      const f = Math.max(0, b.f + v.f);
      if (cal < 500 && !tags.includes("low-cal") && cal <= 320) tags.push("low-cal");
      if (b.minutes <= 10 && !tags.includes("quick")) tags.push("quick");
      out.push({
        id: `${prefix}-${bi}-${vi}`,
        name,
        emoji: b.emoji,
        category,
        tags,
        minutes: b.minutes,
        servings: 1,
        calories: cal,
        protein: p,
        carbs: c,
        fat: f,
        ingredients: [...b.ingredients, ...v.ing],
        steps: b.steps,
      });
    });
  });
  return out;
}

export const RECIPES: Recipe[] = [
  ...buildCategory(breakfastBase, "breakfast", "b"),
  ...buildCategory(lunchBase, "lunch", "l"),
  ...buildCategory(dinnerBase, "dinner", "d"),
  ...buildCategory(snackBase, "snack", "s"),
];
