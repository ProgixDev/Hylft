export interface FallbackFood {
  id: string;
  nameEn: string;
  nameFr: string;
  aliases: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const FOOD_CATALOG: FallbackFood[] = [
  { id: 'fallback-chicken-breast', nameEn: 'Chicken breast', nameFr: 'Blanc de poulet', aliases: ['chicken', 'poulet', 'chicken breast', 'blanc de poulet', 'chicken meal'], calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'fallback-turkey-breast', nameEn: 'Turkey breast', nameFr: 'Blanc de dinde', aliases: ['turkey', 'dinde', 'turkey breast', 'blanc de dinde'], calories: 135, protein: 29, carbs: 0, fat: 1.6 },
  { id: 'fallback-beef-lean', nameEn: 'Lean beef', nameFr: 'Boeuf maigre', aliases: ['beef', 'boeuf', 'steak', 'lean beef', 'boeuf maigre'], calories: 217, protein: 26, carbs: 0, fat: 12 },
  { id: 'fallback-salmon', nameEn: 'Salmon', nameFr: 'Saumon', aliases: ['salmon', 'saumon', 'fish', 'poisson'], calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'fallback-tuna', nameEn: 'Tuna', nameFr: 'Thon', aliases: ['tuna', 'thon'], calories: 132, protein: 29, carbs: 0, fat: 1 },
  { id: 'fallback-egg', nameEn: 'Egg', nameFr: 'Oeuf', aliases: ['egg', 'eggs', 'oeuf', 'oeufs'], calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: 'fallback-greek-yogurt', nameEn: 'Greek yogurt', nameFr: 'Yaourt grec', aliases: ['greek yogurt', 'yaourt grec', 'yogurt', 'yaourt'], calories: 97, protein: 10, carbs: 3.9, fat: 5 },
  { id: 'fallback-cottage-cheese', nameEn: 'Cottage cheese', nameFr: 'Fromage cottage', aliases: ['cottage cheese', 'fromage cottage', 'fresh cheese', 'fromage frais'], calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { id: 'fallback-cheddar', nameEn: 'Cheddar cheese', nameFr: 'Cheddar', aliases: ['cheese', 'fromage', 'cheddar'], calories: 403, protein: 25, carbs: 1.3, fat: 33 },
  { id: 'fallback-milk', nameEn: 'Milk', nameFr: 'Lait', aliases: ['milk', 'lait'], calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 'fallback-oats', nameEn: 'Oats', nameFr: 'Flocons d avoine', aliases: ['oats', 'oatmeal', 'avoine', 'flocons d avoine'], calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  { id: 'fallback-cereal', nameEn: 'Breakfast cereal', nameFr: 'Cereales petit dejeuner', aliases: ['cereal', 'cereals', 'breakfast cereal', 'cereales', 'cereales petit dejeuner'], calories: 379, protein: 8, carbs: 84, fat: 1.8 },
  { id: 'fallback-bread', nameEn: 'Whole wheat bread', nameFr: 'Pain complet', aliases: ['bread', 'pain', 'whole wheat bread', 'pain complet'], calories: 247, protein: 13, carbs: 41, fat: 4.2 },
  { id: 'fallback-rice', nameEn: 'Rice cooked', nameFr: 'Riz cuit', aliases: ['rice', 'riz', 'rice cooked', 'riz cuit'], calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'fallback-pasta', nameEn: 'Pasta cooked', nameFr: 'Pates cuites', aliases: ['pasta', 'pates', 'spaghetti', 'pasta cooked', 'pates cuites'], calories: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  { id: 'fallback-quinoa', nameEn: 'Quinoa cooked', nameFr: 'Quinoa cuit', aliases: ['quinoa', 'quinoa cooked', 'quinoa cuit'], calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
  { id: 'fallback-couscous', nameEn: 'Couscous cooked', nameFr: 'Couscous cuit', aliases: ['couscous', 'couscous cooked', 'couscous cuit'], calories: 112, protein: 3.8, carbs: 23.2, fat: 0.2 },
  { id: 'fallback-potato', nameEn: 'Potato', nameFr: 'Pomme de terre', aliases: ['potato', 'potatoes', 'pomme de terre', 'pommes de terre'], calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: 'fallback-sweet-potato', nameEn: 'Sweet potato', nameFr: 'Patate douce', aliases: ['sweet potato', 'patate douce'], calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1 },
  { id: 'fallback-lentils', nameEn: 'Lentils cooked', nameFr: 'Lentilles cuites', aliases: ['lentils', 'lentilles', 'lentils cooked', 'lentilles cuites'], calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: 'fallback-chickpeas', nameEn: 'Chickpeas cooked', nameFr: 'Pois chiches cuits', aliases: ['chickpeas', 'pois chiches', 'chickpeas cooked', 'pois chiches cuits'], calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6 },
  { id: 'fallback-black-beans', nameEn: 'Black beans cooked', nameFr: 'Haricots noirs cuits', aliases: ['beans', 'black beans', 'haricots', 'haricots noirs'], calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5 },
  { id: 'fallback-broccoli', nameEn: 'Broccoli', nameFr: 'Brocoli', aliases: ['broccoli', 'brocoli', 'vegetable', 'legume'], calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
  { id: 'fallback-carrot', nameEn: 'Carrot', nameFr: 'Carotte', aliases: ['carrot', 'carotte'], calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  { id: 'fallback-avocado', nameEn: 'Avocado', nameFr: 'Avocat', aliases: ['avocado', 'avocat'], calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { id: 'fallback-olive-oil', nameEn: 'Olive oil', nameFr: 'Huile d olive', aliases: ['olive oil', 'huile d olive', 'oil', 'huile'], calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'fallback-banana', nameEn: 'Banana', nameFr: 'Banane', aliases: ['banana', 'banane'], calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { id: 'fallback-apple', nameEn: 'Apple', nameFr: 'Pomme', aliases: ['apple', 'pomme'], calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
  { id: 'fallback-orange', nameEn: 'Orange', nameFr: 'Orange', aliases: ['orange', 'orange fruit'], calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1 },
  { id: 'fallback-orange-juice', nameEn: 'Orange juice', nameFr: 'Jus d orange', aliases: ['orange juice', 'jus d orange', 'juice', 'jus'], calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2 },
  { id: 'fallback-almonds', nameEn: 'Almonds', nameFr: 'Amandes', aliases: ['almonds', 'amandes'], calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9 },
  { id: 'fallback-peanut-butter', nameEn: 'Peanut butter', nameFr: 'Beurre de cacahuete', aliases: ['peanut butter', 'beurre de cacahuete', 'peanut', 'cacahuete'], calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'fallback-soup', nameEn: 'Vegetable soup', nameFr: 'Soupe de legumes', aliases: ['soup', 'vegetable soup', 'soupe', 'soupe legumes', 'soupe de legumes'], calories: 43, protein: 1.5, carbs: 7, fat: 1.2 },
  { id: 'fallback-salad', nameEn: 'Mixed salad', nameFr: 'Salade mixte', aliases: ['salad', 'salade', 'mixed salad', 'salade mixte'], calories: 33, protein: 1.7, carbs: 5.7, fat: 0.4 },
  { id: 'fallback-sandwich', nameEn: 'Chicken sandwich', nameFr: 'Sandwich au poulet', aliases: ['sandwich', 'chicken sandwich', 'sandwich poulet', 'sandwich au poulet'], calories: 240, protein: 16, carbs: 24, fat: 8 },
  { id: 'fallback-biscuit', nameEn: 'Fruit biscuit', nameFr: 'Biscuit aux fruits', aliases: ['biscuit', 'cookie', 'fruit biscuit', 'biscuit fruit', 'biscuit aux fruits'], calories: 430, protein: 5, carbs: 72, fat: 13 },
  { id: 'fallback-snack-bar', nameEn: 'Snack bar', nameFr: 'Barre snack', aliases: ['snack bar', 'protein bar', 'barre', 'barre snack'], calories: 390, protein: 10, carbs: 55, fat: 12 },
  { id: 'fallback-pizza', nameEn: 'Pizza', nameFr: 'Pizza', aliases: ['pizza'], calories: 266, protein: 11, carbs: 33, fat: 10 },
  { id: 'fallback-burger', nameEn: 'Beef burger', nameFr: 'Burger boeuf', aliases: ['burger', 'beef burger', 'burger boeuf'], calories: 295, protein: 17, carbs: 30, fat: 12 },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreFood(food: FallbackFood, normalizedQuery: string, tokens: string[]): number {
  const haystack = normalize(
    [food.nameEn, food.nameFr, ...food.aliases].join(' '),
  );

  if (!normalizedQuery) return 0;
  if (haystack.includes(normalizedQuery)) return 1000 - haystack.indexOf(normalizedQuery);

  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (haystack.includes(token)) score += token.length;
  }
  return score;
}

export function searchFallbackFoods(q: string, lang: 'fr' | 'en') {
  const normalizedQuery = normalize(q);
  if (!normalizedQuery) return [];

  const tokens = normalizedQuery.split(' ').filter(Boolean);

  return FOOD_CATALOG
    .map((food) => ({
      score: scoreFood(food, normalizedQuery, tokens),
      food,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ food }) => ({
      id: food.id,
      name: lang === 'fr' ? food.nameFr : food.nameEn,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    }));
}
