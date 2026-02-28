import i18n from "./i18n";

/**
 * Translate exercise-related terms from API
 */
export function translateExerciseTerm(
  term: string,
  category: "bodyParts" | "equipment" | "targetMuscles" | "secondaryMuscles" = "bodyParts"
): string {
  if (!term) return term;

  const normalizedTerm = term.toLowerCase().trim();
  
  // For secondaryMuscles, try targetMuscles first (they often overlap)
  let translationKey = `exerciseTerms.${category}.${normalizedTerm}`;
  if (category === "secondaryMuscles") {
    const targetMuscleKey = `exerciseTerms.targetMuscles.${normalizedTerm}`;
    const targetTranslated = i18n.t(targetMuscleKey);
    if (targetTranslated && targetTranslated !== targetMuscleKey) {
      return targetTranslated;
    }
  }

  // Try to get translation
  const translated = i18n.t(translationKey);

  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey) {
    return translated;
  }

  // Fallback: capitalize first letter of original term
  return term.charAt(0).toUpperCase() + term.slice(1);
}

/**
 * Translate exercise name (for common exercises)
 * You can expand this dictionary as needed
 */
const EXERCISE_NAME_TRANSLATIONS: Record<
  string,
  { en: string; fr: string }
> = {
  "bench press": { en: "Bench Press", fr: "Développé couché" },
  "squat": { en: "Squat", fr: "Squat" },
  "deadlift": { en: "Deadlift", fr: "Soulevé de terre" },
  "shoulder press": { en: "Shoulder Press", fr: "Développé épaules" },
  "barbell curl": { en: "Barbell Curl", fr: "Curl barre" },
  "tricep dip": { en: "Tricep Dip", fr: "Pompes triceps" },
  "pull-up": { en: "Pull-up", fr: "Traction" },
  "push-up": { en: "Push-up", fr: "Pompe" },
  "dumbbell press": { en: "Dumbbell Press", fr: "Développé haltères" },
  "lateral raise": { en: "Lateral Raise", fr: "Élévation latérale" },
  "bicep curl": { en: "Bicep Curl", fr: "Curl biceps" },
  "tricep extension": { en: "Tricep Extension", fr: "Extension triceps" },
  "leg press": { en: "Leg Press", fr: "Presse à cuisses" },
  "leg curl": { en: "Leg Curl", fr: "Curl de jambes" },
  "leg extension": { en: "Leg Extension", fr: "Extension de jambes" },
  "calf raise": { en: "Calf Raise", fr: "Relevé de mollets" },
  "crunch": { en: "Crunch", fr: "Crunch" },
  "plank": { en: "Plank", fr: "Planche" },
  "sit-up": { en: "Sit-up", fr: "Relevé de buste" },
  "row": { en: "Row", fr: "Tirage" },
  "lat pulldown": { en: "Lat Pulldown", fr: "Tirage vertical" },
  "chest fly": { en: "Chest Fly", fr: "Écarté couché" },
  "overhead press": { en: "Overhead Press", fr: "Développé militaire" },
  "front raise": { en: "Front Raise", fr: "Élévation frontale" },
  "rear delt fly": { en: "Rear Delt Fly", fr: "Écarté postérieur" },
  "hammer curl": { en: "Hammer Curl", fr: "Curl marteau" },
  "preacher curl": { en: "Preacher Curl", fr: "Curl pupitre" },
  "cable crossover": { en: "Cable Crossover", fr: "Écarté à la poulie" },
  "incline bench press": {
    en: "Incline Bench Press",
    fr: "Développé incliné",
  },
  "decline bench press": {
    en: "Decline Bench Press",
    fr: "Développé décliné",
  },
  "romanian deadlift": {
    en: "Romanian Deadlift",
    fr: "Soulevé de terre roumain",
  },
  "sumo deadlift": { en: "Sumo Deadlift", fr: "Soulevé de terre sumo" },
  "bulgarian split squat": {
    en: "Bulgarian Split Squat",
    fr: "Squat bulgare",
  },
  "lunges": { en: "Lunges", fr: "Fentes" },
  "step-up": { en: "Step-up", fr: "Montée sur banc" },
  "hip thrust": { en: "Hip Thrust", fr: "Hip thrust" },
  "glute bridge": { en: "Glute Bridge", fr: "Pont fessier" },
  "russian twist": { en: "Russian Twist", fr: "Rotation russe" },
  "mountain climber": { en: "Mountain Climber", fr: "Mountain climber" },
  "burpee": { en: "Burpee", fr: "Burpee" },
  "jumping jack": { en: "Jumping Jack", fr: "Saut en étoile" },
  "dips": { en: "Dips", fr: "Dips" },
  "chin-up": { en: "Chin-up", fr: "Traction prise supination" },
  "cable fly": { en: "Cable Fly", fr: "Écarté à la poulie" },
  "face pull": { en: "Face Pull", fr: "Tirage visage" },
  "shrug": { en: "Shrug", fr: "Haussement d'épaules" },
  "upright row": { en: "Upright Row", fr: "Rowing debout" },
  "bent-over row": { en: "Bent-over Row", fr: "Rowing penché" },
  "t-bar row": { en: "T-Bar Row", fr: "Rowing T-bar" },
  "seated row": { en: "Seated Row", fr: "Rowing assis" },
  "close-grip bench press": {
    en: "Close-Grip Bench Press",
    fr: "Développé couché prise serrée",
  },
  "skull crusher": { en: "Skull Crusher", fr: "Extension triceps couché" },
  "overhead tricep extension": {
    en: "Overhead Tricep Extension",
    fr: "Extension triceps debout",
  },
  "cable curl": { en: "Cable Curl", fr: "Curl à la poulie" },
  "concentration curl": {
    en: "Concentration Curl",
    fr: "Curl concentration",
  },
  "spider curl": { en: "Spider Curl", fr: "Curl araignée" },
  "leg raise": { en: "Leg Raise", fr: "Relevé de jambes" },
  "hanging leg raise": {
    en: "Hanging Leg Raise",
    fr: "Relevé de jambes suspendu",
  },
  "ab wheel": { en: "Ab Wheel", fr: "Roue abdominale" },
  "side plank": { en: "Side Plank", fr: "Planche latérale" },
  "reverse crunch": { en: "Reverse Crunch", fr: "Crunch inversé" },
  "bicycle crunch": { en: "Bicycle Crunch", fr: "Crunch vélo" },
  "good morning": { en: "Good Morning", fr: "Good morning" },
  "hip abduction": { en: "Hip Abduction", fr: "Abduction de hanche" },
  "hip adduction": { en: "Hip Adduction", fr: "Adduction de hanche" },
  "wall sit": { en: "Wall Sit", fr: "Chaise contre le mur" },
  "pistol squat": { en: "Pistol Squat", fr: "Squat pistol" },
  "jump squat": { en: "Jump Squat", fr: "Squat sauté" },
  "box jump": { en: "Box Jump", fr: "Saut sur box" },
  "farmer's walk": { en: "Farmer's Walk", fr: "Marche du fermier" },
  "kettlebell swing": {
    en: "Kettlebell Swing",
    fr: "Swing kettlebell",
  },
  "goblet squat": { en: "Goblet Squat", fr: "Squat gobelet" },
  "kettlebell goblet squat": {
    en: "Kettlebell Goblet Squat",
    fr: "Squat gobelet kettlebell",
  },
  "turkish get-up": { en: "Turkish Get-up", fr: "Turkish get-up" },
  "windmill": { en: "Windmill", fr: "Moulin" },
  "snatch": { en: "Snatch", fr: "Arraché" },
  "clean and jerk": { en: "Clean and Jerk", fr: "Épaulé-jeté" },
  "thruster": { en: "Thruster", fr: "Thruster" },
  "man makers": { en: "Man Makers", fr: "Man makers" },
  "renegade row": { en: "Renegade Row", fr: "Rowing renegade" },
  "bear crawl": { en: "Bear Crawl", fr: "Marche de l'ours" },
  "crab walk": { en: "Crab Walk", fr: "Marche du crabe" },
  "duck walk": { en: "Duck Walk", fr: "Marche du canard" },
  "inchworm": { en: "Inchworm", fr: "Chenille" },
  "spiderman crawl": { en: "Spiderman Crawl", fr: "Marche Spiderman" },
  "plank to pike": { en: "Plank to Pike", fr: "Planche à pike" },
  "pike push-up": { en: "Pike Push-up", fr: "Pompe pike" },
  "diamond push-up": {
    en: "Diamond Push-up",
    fr: "Pompe diamant",
  },
  "wide push-up": { en: "Wide Push-up", fr: "Pompe large" },
  "decline push-up": {
    en: "Decline Push-up",
    fr: "Pompe déclinée",
  },
  "incline push-up": {
    en: "Incline Push-up",
    fr: "Pompe inclinée",
  },
  "handstand push-up": {
    en: "Handstand Push-up",
    fr: "Pompe en équilibre",
  },
  "muscle-up": { en: "Muscle-up", fr: "Muscle-up" },
  "l-sit": { en: "L-Sit", fr: "L-sit" },
  "human flag": { en: "Human Flag", fr: "Drapeau humain" },
  "front lever": { en: "Front Lever", fr: "Lever avant" },
  "back lever": { en: "Back Lever", fr: "Lever arrière" },
  "planche": { en: "Planche", fr: "Planche" },
  "one-arm pull-up": { en: "One-Arm Pull-up", fr: "Traction à un bras" },
  "archer pull-up": { en: "Archer Pull-up", fr: "Traction archer" },
  "typewriter pull-up": {
    en: "Typewriter Pull-up",
    fr: "Traction machine à écrire",
  },
  "commando pull-up": {
    en: "Commando Pull-up",
    fr: "Traction commando",
  },
  "around the world": {
    en: "Around the World",
    fr: "Autour du monde",
  },
  "negative pull-up": {
    en: "Negative Pull-up",
    fr: "Traction négative",
  },
  "assisted pull-up": {
    en: "Assisted Pull-up",
    fr: "Traction assistée",
  },
  "band pull-apart": { en: "Band Pull-apart", fr: "Écarté avec bande" },
  "face pull": { en: "Face Pull", fr: "Tirage visage" },
  "wall ball": { en: "Wall Ball", fr: "Wall ball" },
  "medicine ball slam": {
    en: "Medicine Ball Slam",
    fr: "Slam médecine-ball",
  },
  "medicine ball throw": {
    en: "Medicine Ball Throw",
    fr: "Lancer médecine-ball",
  },
  "battle ropes": { en: "Battle Ropes", fr: "Cordes de combat" },
  "rope climb": { en: "Rope Climb", fr: "Grimper à la corde" },
  "tire flip": { en: "Tire Flip", fr: "Retournement de pneu" },
  "sled push": { en: "Sled Push", fr: "Poussée de traîneau" },
  "sled pull": { en: "Sled Pull", fr: "Tirage de traîneau" },
  "prowler push": { en: "Prowler Push", fr: "Poussée prowler" },
  "yoke walk": { en: "Yoke Walk", fr: "Marche avec joug" },
  "log press": { en: "Log Press", fr: "Développé avec bûche" },
  "atlas stone": { en: "Atlas Stone", fr: "Pierre d'Atlas" },
  "sandbag carry": { en: "Sandbag Carry", fr: "Port de sac de sable" },
  "waiter's walk": { en: "Waiter's Walk", fr: "Marche du serveur" },
  "suitcase carry": { en: "Suitcase Carry", fr: "Port de valise" },
  "overhead carry": { en: "Overhead Carry", fr: "Port au-dessus de la tête" },
  "zercher carry": { en: "Zercher Carry", fr: "Port Zercher" },
  "rack carry": { en: "Rack Carry", fr: "Port en rack" },
  "bear hug carry": { en: "Bear Hug Carry", fr: "Port en câlin d'ours" },
  "single-arm carry": {
    en: "Single-Arm Carry",
    fr: "Port à un bras",
  },
  "cross-body carry": {
    en: "Cross-Body Carry",
    fr: "Port croisé",
  },
  "waiter walk": { en: "Waiter Walk", fr: "Marche du serveur" },
  "suitcase walk": { en: "Suitcase Walk", fr: "Marche avec valise" },
  "overhead walk": { en: "Overhead Walk", fr: "Marche au-dessus de la tête" },
  "zercher walk": { en: "Zercher Walk", fr: "Marche Zercher" },
  "rack walk": { en: "Rack Walk", fr: "Marche en rack" },
  "bear hug walk": { en: "Bear Hug Walk", fr: "Marche en câlin d'ours" },
  "single-arm walk": { en: "Single-Arm Walk", fr: "Marche à un bras" },
  "cross-body walk": { en: "Cross-Body Walk", fr: "Marche croisée" },
  "loaded carry": { en: "Loaded Carry", fr: "Port chargé" },
  "loaded walk": { en: "Loaded Walk", fr: "Marche chargée" },
  "weighted carry": { en: "Weighted Carry", fr: "Port lesté" },
  "weighted walk": { en: "Weighted Walk", fr: "Marche lestée" },
  "heavy carry": { en: "Heavy Carry", fr: "Port lourd" },
  "heavy walk": { en: "Heavy Walk", fr: "Marche lourde" },
  "strongman carry": {
    en: "Strongman Carry",
    fr: "Port strongman",
  },
  "strongman walk": {
    en: "Strongman Walk",
    fr: "Marche strongman",
  },
  "yoke carry": { en: "Yoke Carry", fr: "Port avec joug" },
  "yoke walk": { en: "Yoke Walk", fr: "Marche avec joug" },
  "frame carry": { en: "Frame Carry", fr: "Port avec cadre" },
  "frame walk": { en: "Frame Walk", fr: "Marche avec cadre" },
  "hussafel carry": { en: "Hussafel Carry", fr: "Port Hussafel" },
  "hussafel walk": { en: "Hussafel Walk", fr: "Marche Hussafel" },
  "conan's wheel": { en: "Conan's Wheel", fr: "Roue de Conan" },
  "hercules hold": { en: "Hercules Hold", fr: "Tenue d'Hercule" },
  "fingal's fingers": { en: "Fingal's Fingers", fr: "Doigts de Fingal" },
  "natural stone": { en: "Natural Stone", fr: "Pierre naturelle" },
  "stone to shoulder": {
    en: "Stone to Shoulder",
    fr: "Pierre à l'épaule",
  },
  "stone over bar": { en: "Stone Over Bar", fr: "Pierre par-dessus la barre" },
  "stone run": { en: "Stone Run", fr: "Course de pierres" },
  "stone load": { en: "Stone Load", fr: "Chargement de pierre" },
  "stone carry": { en: "Stone Carry", fr: "Port de pierre" },
  "stone walk": { en: "Stone Walk", fr: "Marche avec pierre" },
  "stone lift": { en: "Stone Lift", fr: "Soulèvement de pierre" },
  "stone press": { en: "Stone Press", fr: "Développé avec pierre" },
  "stone throw": { en: "Stone Throw", fr: "Lancer de pierre" },
  "stone slam": { en: "Stone Slam", fr: "Slam de pierre" },
  "stone flip": { en: "Stone Flip", fr: "Retournement de pierre" },
  "stone drag": { en: "Stone Drag", fr: "Traction de pierre" },
  "stone push": { en: "Stone Push", fr: "Poussée de pierre" },
  "stone pull": { en: "Stone Pull", fr: "Tirage de pierre" },
  "stone carry and load": {
    en: "Stone Carry and Load",
    fr: "Port et chargement de pierre",
  },
  "stone to shoulder and press": {
    en: "Stone to Shoulder and Press",
    fr: "Pierre à l'épaule et développé",
  },
  "stone over bar and load": {
    en: "Stone Over Bar and Load",
    fr: "Pierre par-dessus la barre et chargement",
  },
  "stone run and load": {
    en: "Stone Run and Load",
    fr: "Course et chargement de pierres",
  },
  "stone load and press": {
    en: "Stone Load and Press",
    fr: "Chargement et développé de pierre",
  },
  "stone carry and press": {
    en: "Stone Carry and Press",
    fr: "Port et développé de pierre",
  },
  "stone walk and press": {
    en: "Stone Walk and Press",
    fr: "Marche et développé avec pierre",
  },
  "stone lift and press": {
    en: "Stone Lift and Press",
    fr: "Soulèvement et développé de pierre",
  },
  "stone press and load": {
    en: "Stone Press and Load",
    fr: "Développé et chargement de pierre",
  },
  "stone throw and load": {
    en: "Stone Throw and Load",
    fr: "Lancer et chargement de pierre",
  },
  "stone slam and load": {
    en: "Stone Slam and Load",
    fr: "Slam et chargement de pierre",
  },
  "stone flip and load": {
    en: "Stone Flip and Load",
    fr: "Retournement et chargement de pierre",
  },
  "stone drag and load": {
    en: "Stone Drag and Load",
    fr: "Traction et chargement de pierre",
  },
  "stone push and load": {
    en: "Stone Push and Load",
    fr: "Poussée et chargement de pierre",
  },
  "stone pull and load": {
    en: "Stone Pull and Load",
    fr: "Tirage et chargement de pierre",
  },
};

export function translateExerciseName(name: string): string {
  if (!name) return name;

  const normalizedName = name.toLowerCase().trim();
  const translation = EXERCISE_NAME_TRANSLATIONS[normalizedName];

  if (translation) {
    const currentLang = i18n.language;
    return currentLang === "fr" ? translation.fr : translation.en;
  }

  // If no translation found, return original
  return name;
}

/**
 * Translate routine names (for common routine names)
 */
export function translateRoutineName(name: string): string {
  if (!name) return name;

  const normalizedName = name.toLowerCase().trim();
  const translationKey = `exerciseTerms.routineNames.${normalizedName}`;

  // Try to get translation
  const translated = i18n.t(translationKey);

  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey) {
    return translated;
  }

  // Try partial matches for patterns like "Push Day - Strength"
  const parts = normalizedName.split(" - ");
  if (parts.length > 1) {
    const baseName = parts[0].trim();
    const suffix = parts.slice(1).join(" - ");
    const baseTranslationKey = `exerciseTerms.routineNames.${baseName}`;
    const baseTranslated = i18n.t(baseTranslationKey);
    
    if (baseTranslated && baseTranslated !== baseTranslationKey) {
      // Translate suffix if possible
      const suffixTranslations: Record<string, { en: string; fr: string }> = {
        "strength": { en: "Strength", fr: "Force" },
        "hypertrophy": { en: "Hypertrophy", fr: "Hypertrophie" },
        "volume": { en: "Volume", fr: "Volume" },
        "power": { en: "Power", fr: "Puissance" },
        "endurance": { en: "Endurance", fr: "Endurance" },
        "beginner": { en: "Beginner", fr: "Débutant" },
        "intermediate": { en: "Intermediate", fr: "Intermédiaire" },
        "advanced": { en: "Advanced", fr: "Avancé" },
      };
      
      const suffixLower = suffix.toLowerCase().trim();
      const suffixTranslation = suffixTranslations[suffixLower];
      
      if (suffixTranslation) {
        const currentLang = i18n.language;
        return `${baseTranslated} - ${currentLang === "fr" ? suffixTranslation.fr : suffixTranslation.en}`;
      }
      
      return `${baseTranslated} - ${suffix}`;
    }
  }

  // If no translation found, return original
  return name;
}

/**
 * Translate routine category
 */
export function translateRoutineCategory(category: string): string {
  if (!category) return category;

  const normalizedCategory = category.toLowerCase().trim();
  const translationKey = `exerciseTerms.routineCategories.${normalizedCategory}`;

  // Try to get translation
  const translated = i18n.t(translationKey);

  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey) {
    return translated;
  }

  // If no translation found, return original
  return category;
}
