export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  tags: ("high-protein" | "low-carb" | "vegetarian" | "quick" | "low-cal")[];
  minutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
};

export const RECIPES: Recipe[] = [
  {
    id: "r1", name: "Protein Oats Bowl", emoji: "🥣", category: "breakfast",
    tags: ["high-protein", "quick"], minutes: 7, servings: 1,
    calories: 420, protein: 35, carbs: 50, fat: 9,
    ingredients: ["60g oats", "250ml milk", "1 scoop whey", "1 tbsp peanut butter", "Banana"],
    steps: ["Cook oats with milk 3 min.", "Stir in whey off heat.", "Top with PB + banana."],
  },
  {
    id: "r2", name: "Greek Yogurt Berry Parfait", emoji: "🍓", category: "breakfast",
    tags: ["high-protein", "low-cal", "vegetarian", "quick"], minutes: 4, servings: 1,
    calories: 260, protein: 22, carbs: 28, fat: 5,
    ingredients: ["200g Greek yogurt 0%", "100g mixed berries", "20g granola", "Honey"],
    steps: ["Layer yogurt + berries + granola.", "Drizzle honey."],
  },
  {
    id: "r3", name: "Veggie Omelette", emoji: "🍳", category: "breakfast",
    tags: ["high-protein", "low-carb", "vegetarian", "quick"], minutes: 8, servings: 1,
    calories: 320, protein: 24, carbs: 6, fat: 22,
    ingredients: ["3 eggs", "Spinach", "Cherry tomatoes", "Feta", "Olive oil"],
    steps: ["Whisk eggs.", "Sauté veg.", "Pour eggs, add feta, fold."],
  },
  {
    id: "r4", name: "Chicken Caesar Wrap", emoji: "🌯", category: "lunch",
    tags: ["high-protein", "quick"], minutes: 10, servings: 1,
    calories: 510, protein: 42, carbs: 38, fat: 20,
    ingredients: ["150g chicken breast", "Tortilla", "Romaine", "Caesar dressing", "Parmesan"],
    steps: ["Grill chicken.", "Toss with lettuce + dressing.", "Roll in tortilla."],
  },
  {
    id: "r5", name: "Tuna Avocado Bowl", emoji: "🥑", category: "lunch",
    tags: ["high-protein", "low-carb", "quick"], minutes: 6, servings: 1,
    calories: 430, protein: 35, carbs: 12, fat: 26,
    ingredients: ["1 can tuna", "1/2 avocado", "Cherry tomatoes", "Lemon", "Olive oil"],
    steps: ["Drain tuna.", "Mash avo with lemon.", "Mix everything."],
  },
  {
    id: "r6", name: "Quinoa Power Bowl", emoji: "🥗", category: "lunch",
    tags: ["high-protein", "vegetarian"], minutes: 20, servings: 2,
    calories: 480, protein: 22, carbs: 60, fat: 16,
    ingredients: ["100g quinoa", "Chickpeas", "Cucumber", "Feta", "Tahini dressing"],
    steps: ["Cook quinoa.", "Combine all.", "Drizzle tahini."],
  },
  {
    id: "r7", name: "Salmon & Asparagus", emoji: "🐟", category: "dinner",
    tags: ["high-protein", "low-carb"], minutes: 18, servings: 1,
    calories: 520, protein: 40, carbs: 8, fat: 32,
    ingredients: ["180g salmon fillet", "Asparagus", "Lemon", "Olive oil", "Garlic"],
    steps: ["Roast salmon 12 min @200°C.", "Sauté asparagus.", "Squeeze lemon."],
  },
  {
    id: "r8", name: "Turkey Stir-Fry", emoji: "🥢", category: "dinner",
    tags: ["high-protein", "quick"], minutes: 15, servings: 2,
    calories: 460, protein: 38, carbs: 32, fat: 18,
    ingredients: ["300g turkey mince", "Bell pepper", "Broccoli", "Soy sauce", "Rice"],
    steps: ["Brown turkey.", "Add veg + soy.", "Serve over rice."],
  },
  {
    id: "r9", name: "Beef & Sweet Potato", emoji: "🥩", category: "dinner",
    tags: ["high-protein"], minutes: 30, servings: 2,
    calories: 580, protein: 42, carbs: 45, fat: 22,
    ingredients: ["300g lean beef", "Sweet potato", "Broccoli", "Olive oil", "Spices"],
    steps: ["Roast sweet potato 25 min.", "Pan-sear beef.", "Steam broccoli."],
  },
  {
    id: "r10", name: "Veggie Chili", emoji: "🌶️", category: "dinner",
    tags: ["vegetarian", "high-protein"], minutes: 35, servings: 4,
    calories: 380, protein: 18, carbs: 55, fat: 9,
    ingredients: ["Black beans", "Kidney beans", "Tomatoes", "Onion", "Chili spices"],
    steps: ["Sauté onion.", "Add beans + tomato.", "Simmer 25 min."],
  },
  {
    id: "r11", name: "Cottage Cheese & Pineapple", emoji: "🍍", category: "snack",
    tags: ["high-protein", "low-cal", "vegetarian", "quick"], minutes: 2, servings: 1,
    calories: 180, protein: 22, carbs: 14, fat: 3,
    ingredients: ["200g cottage cheese", "Pineapple chunks"],
    steps: ["Combine and enjoy."],
  },
  {
    id: "r12", name: "Protein Smoothie", emoji: "🥤", category: "snack",
    tags: ["high-protein", "quick"], minutes: 3, servings: 1,
    calories: 290, protein: 32, carbs: 28, fat: 5,
    ingredients: ["1 scoop whey", "Banana", "Berries", "250ml almond milk"],
    steps: ["Blend everything 30s."],
  },
  {
    id: "r13", name: "Hummus & Veg", emoji: "🥕", category: "snack",
    tags: ["vegetarian", "low-cal", "quick"], minutes: 3, servings: 1,
    calories: 220, protein: 8, carbs: 22, fat: 12,
    ingredients: ["100g hummus", "Carrots", "Cucumber", "Bell pepper"],
    steps: ["Slice veg.", "Dip in hummus."],
  },
  {
    id: "r14", name: "Egg White Scramble", emoji: "🥚", category: "breakfast",
    tags: ["high-protein", "low-cal", "low-carb", "quick"], minutes: 5, servings: 1,
    calories: 180, protein: 28, carbs: 4, fat: 5,
    ingredients: ["6 egg whites", "Spinach", "Mushrooms", "Salt + pepper"],
    steps: ["Sauté veg.", "Pour whites, scramble."],
  },
  {
    id: "r15", name: "Shrimp Zoodles", emoji: "🍤", category: "dinner",
    tags: ["high-protein", "low-carb", "low-cal"], minutes: 12, servings: 1,
    calories: 320, protein: 32, carbs: 14, fat: 14,
    ingredients: ["150g shrimp", "Zucchini noodles", "Garlic", "Olive oil", "Chili"],
    steps: ["Sauté garlic + chili.", "Add shrimp 3 min.", "Toss zoodles 2 min."],
  },
];
