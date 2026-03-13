/**
 * Fetches all ExerciseDB exercises and adds French translations to locale files.
 * Run: node scripts/fetch-exercisedb-translations.mjs
 * Or:  bun scripts/fetch-exercisedb-translations.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FR_PATH = join(ROOT, "src/locales/fr.json");
const EN_PATH = join(ROOT, "src/locales/en.json");

// Use Vercel mirror (same data, often better availability than oss.exercisedb.dev)
const EXERCISEDB_BASE = "https://exercisedb-api.vercel.app";
const LIMIT = 100;

// Word-level EN -> FR for compound names (lowercase keys)
const WORD_MAP = {
  // equipment
  barbell: "barre",
  dumbbell: "haltère",
  dumbbells: "haltères",
  cable: "poulie",
  kettlebell: "kettlebell",
  kettlebells: "kettlebells",
  band: "bande",
  "resistance band": "bande élastique",
  "body weight": "poids du corps",
  "bodyweight": "poids du corps",
  machine: "machine",
  "smith machine": "machine smith",
  "leverage machine": "machine à levier",
  "leverage": "levier",
  rope: "corde",
  ez: "ez",
  "ez barbell": "barre ez",
  "trap bar": "barre trap",
  "medicine ball": "médecine-ball",
  "stability ball": "ballon de stabilité",
  "swiss ball": "ballon suisse",
  "bosu ball": "ballon bosu",
  roller: "rouleau",
  sled: "traîneau",
  tire: "pneu",
  hammer: "marteau",
  assisted: "assisté",
  weighted: "lesté",
  // movements
  row: "tirage",
  rows: "tirages",
  "upright row": "rowing debout",
  "bent-over row": "rowing penché",
  "bent over row": "rowing penché",
  "seated row": "rowing assis",
  "inverted row": "traction inversée",
  "incline row": "tirage incliné",
  "decline row": "tirage décliné",
  "narrow row": "tirage serré",
  "wide row": "tirage large",
  "single-arm row": "tirage un bras",
  "single arm row": "tirage un bras",
  "one-arm row": "tirage un bras",
  "one arm row": "tirage un bras",
  "reverse grip row": "tirage prise inversée",
  "vertical row": "tirage vertical",
  "horizontal row": "tirage horizontal",
  "close grip row": "tirage prise serrée",
  "close-grip row": "tirage prise serrée",
  press: "développé",
  "bench press": "développé couché",
  "incline press": "développé incliné",
  "decline press": "développé décliné",
  "shoulder press": "développé épaules",
  "overhead press": "développé militaire",
  "military press": "développé militaire",
  "push press": "développé push",
  "close-grip press": "développé prise serrée",
  "close grip press": "développé prise serrée",
  "narrow press": "développé serré",
  curl: "curl",
  curls: "curls",
  "bicep curl": "curl biceps",
  "bicep curls": "curls biceps",
  "hammer curl": "curl marteau",
  "preacher curl": "curl pupitre",
  "concentration curl": "curl concentration",
  "spider curl": "curl araignée",
  "incline curl": "curl incliné",
  "reverse curl": "curl prise inversée",
  extension: "extension",
  extensions: "extensions",
  "tricep extension": "extension triceps",
  "tricep extensions": "extensions triceps",
  "leg extension": "extension de jambes",
  "leg extensions": "extensions de jambes",
  "overhead extension": "extension au-dessus de la tête",
  "skull crusher": "extension triceps couché",
  "skull crushers": "extensions triceps couché",
  raise: "élévation",
  raises: "élévations",
  "lateral raise": "élévation latérale",
  "lateral raises": "élévations latérales",
  "front raise": "élévation frontale",
  "front raises": "élévations frontales",
  "calf raise": "relevé de mollets",
  "calf raises": "relevés de mollets",
  "leg raise": "relevé de jambes",
  "leg raises": "relevés de jambes",
  "hanging leg raise": "relevé de jambes suspendu",
  squat: "squat",
  squats: "squats",
  "front squat": "squat avant",
  "back squat": "squat arrière",
  "goblet squat": "squat gobelet",
  "split squat": "squat fendu",
  "bulgarian split squat": "squat bulgare",
  "pistol squat": "squat pistol",
  "jump squat": "squat sauté",
  "box squat": "squat sur box",
  deadlift: "soulevé de terre",
  deadlifts: "soulevés de terre",
  "romanian deadlift": "soulevé de terre roumain",
  "sumo deadlift": "soulevé de terre sumo",
  "stiff leg deadlift": "soulevé de terre jambes tendues",
  "stiff-leg deadlift": "soulevé de terre jambes tendues",
  pulldown: "tirage vertical",
  "lat pulldown": "tirage vertical",
  "pull-down": "tirage vertical",
  "pull down": "tirage vertical",
  pushdown: "extension",
  "push-down": "extension",
  "push down": "extension",
  fly: "écarté",
  "flye": "écarté",
  "flyes": "écartés",
  "chest fly": "écarté couché",
  "cable fly": "écarté à la poulie",
  "rear delt fly": "écarté postérieur",
  "incline fly": "écarté incliné",
  "decline fly": "écarté décliné",
  crossover: "croisé",
  "cable crossover": "écarté à la poulie",
  dip: "dip",
  dips: "dips",
  "tricep dip": "dip triceps",
  "bench dip": "dip sur banc",
  "pull-up": "traction",
  "pull up": "traction",
  "pull-ups": "tractions",
  "pull ups": "tractions",
  "chin-up": "traction prise supination",
  "chin up": "traction prise supination",
  "push-up": "pompe",
  "push up": "pompe",
  "push-ups": "pompes",
  "push ups": "pompes",
  "wide push-up": "pompe large",
  "diamond push-up": "pompe diamant",
  "incline push-up": "pompe inclinée",
  "decline push-up": "pompe déclinée",
  "pike push-up": "pompe pike",
  "leg press": "presse à cuisses",
  "chest press": "développé couché",
  "leg curl": "curl de jambes",
  "leg curls": "curls de jambes",
  "lying leg curl": "curl de jambes allongé",
  "seated leg curl": "curl de jambes assis",
  "standing leg curl": "curl de jambes debout",
  shrug: "haussement",
  shrugs: "haussements",
  "face pull": "tirage visage",
  "face pulls": "tirages visage",
  lunge: "fente",
  lunges: "fentes",
  "walking lunge": "fente marchée",
  "reverse lunge": "fente arrière",
  "step-up": "montée sur banc",
  "step up": "montée sur banc",
  "step-ups": "montées sur banc",
  "hip thrust": "hip thrust",
  "hip thrusts": "hip thrusts",
  "glute bridge": "pont fessier",
  "hip abduction": "abduction de hanche",
  "hip adduction": "adduction de hanche",
  crunch: "crunch",
  crunches: "crunches",
  "bicycle crunch": "crunch vélo",
  "reverse crunch": "crunch inversé",
  plank: "planche",
  "side plank": "planche latérale",
  "ab wheel": "roue abdominale",
  "good morning": "good morning",
  "wall sit": "chaise contre le mur",
  "box jump": "saut sur box",
  "jumping jack": "saut en étoile",
  "jumping jacks": "sauts en étoile",
  burpee: "burpee",
  burpees: "burpees",
  "mountain climber": "mountain climber",
  "russian twist": "rotation russe",
  swing: "swing",
  "kettlebell swing": "swing kettlebell",
  "windmill": "moulin",
  snatch: "arraché",
  "clean and jerk": "épaulé-jeté",
  thruster: "thruster",
  thrusters: "thrusters",
  "renegade row": "rowing renegade",
  "bear crawl": "marche de l'ours",
  "crab walk": "marche du crabe",
  "farmer's walk": "marche du fermier",
  "farmer walk": "marche du fermier",
  "suitcase carry": "port de valise",
  "waiter's walk": "marche du serveur",
  "waiter walk": "marche du serveur",
  narrow: "serré",
  wide: "large",
  incline: "incliné",
  decline: "décliné",
  seated: "assis",
  standing: "debout",
  lying: "allongé",
  "one-arm": "un bras",
  "one arm": "un bras",
  "single-arm": "un bras",
  "single arm": "un bras",
  "alternating": "alterné",
  reverse: "inversé",
  "reverse grip": "prise inversée",
  "close grip": "prise serrée",
  "close-grip": "prise serrée",
  bent: "penché",
  knees: "genoux",
  straight: "tendu",
  "vertical": "vertical",
  horizontal: "horizontal",
  lever: "levier",
  "neutral grip": "prise neutre",
  "underhand": "supination",
  overhand: "pronation",
  "neutral": "neutre",
  grip: "prise",
  bench: "couché",
  "flat bench": "banc plat",
  "flat": "plat",
  "low cable": "poulie basse",
  "high cable": "poulie haute",
  "cable low": "poulie basse",
  "cable high": "poulie haute",
  "t-bar": "t-bar",
  "t bar": "t-bar",
  "landmine": "landmine",
  "stability": "stabilité",
  "ball": "ballon",
  "on ball": "sur ballon",
  "with band": "avec bande",
  "with rope": "à la corde",
  "rope attachment": "corde",
  "v-bar": "barre en v",
  "straight bar": "barre droite",
  "ez-bar": "barre ez",
  "w bar": "barre w",
  "triangle": "triangle",
  "parallel": "parallèle",
  "dip station": "dips",
  "pull-up bar": "barre de traction",
  "hanging": "suspendu",
  "toe": "orteil",
  "heel": "talon",
  "single leg": "une jambe",
  "single-leg": "une jambe",
  "one leg": "une jambe",
  "one-leg": "une jambe",
  "double": "double",
  "alternate": "alterné",
  "twist": "rotation",
  "rotation": "rotation",
  "carry": "port",
  "walk": "marche",
  "push": "poussée",
  "pull": "tirage",
  "drag": "traction",
  "flip": "retournement",
  "slam": "slam",
  "throw": "lancer",
  "hold": "tenue",
  "get-up": "get-up",
  "get up": "get-up",
  "turkish get-up": "turkish get-up",
  "muscle-up": "muscle-up",
  "muscle up": "muscle-up",
  "l-sit": "l-sit",
  "front lever": "lever avant",
  "back lever": "lever arrière",
  "human flag": "drapeau humain",
  "archer": "archer",
  "typewriter": "machine à écrire",
  "commando": "commando",
  "negative": "négatif",
  "band pull-apart": "écarté avec bande",
  "pull-apart": "écarté",
  "wall ball": "wall ball",
  "battle ropes": "cordes de combat",
  "rope climb": "grimper à la corde",
  "tire flip": "retournement de pneu",
  "sled push": "poussée de traîneau",
  "sled pull": "tirage de traîneau",
  "prowler push": "poussée prowler",
  "yoke walk": "marche avec joug",
  "log press": "développé avec bûche",
  "atlas stone": "pierre d'atlas",
  "sandbag": "sac de sable",
  "zercher": "zercher",
  "rack": "rack",
  "frame": "cadre",
  "loaded": "chargé",
  "heavy": "lourd",
  "stretch": "étirement",
  "stretching": "étirement",
  "warm": "échauffement",
  "cool": "récupération",
  "isometric": "isométrique",
  "concentric": "concentrique",
  "eccentric": "excentrique",
  "explosive": "explosif",
  "pause": "pause",
  "paused": "avec pause",
  "tempo": "tempo",
  "drop set": "drop set",
  "super set": "super set",
  "giant set": "giant set",
  "circuit": "circuit",
  "bent knees": "genoux fléchis",
  "straight legs": "jambes tendues",
  "on knees": "sur les genoux",
  "kneeling": "à genoux",
  "half": "demi",
  "full": "complet",
  "quarter": "quart",
  "partial": "partiel",
  "full range": "amplitude complète",
  "short range": "amplitude courte",
  "behind": "derrière",
  "behind the back": "derrière le dos",
  "front": "avant",
  "back": "dos",
  "side": "latéral",
  "lateral": "latéral",
  "unilateral": "unilatéral",
  "bilateral": "bilatéral",
  "cross": "croisé",
  "cross-body": "croisé",
  "cross body": "croisé",
  "bear hug": "câlin d'ours",
  "overhead": "au-dessus de la tête",
  "around": "autour",
  "world": "monde",
  "around the world": "autour du monde",
  "concentration": "concentration",
  "spider": "araignée",
  "preacher": "pupitre",
  "pike": "pike",
  "diamond": "diamant",
  "wide grip": "prise large",
  "narrow grip": "prise serrée",
  "underhand grip": "prise supination",
  "overhand grip": "prise pronation",
  "mixed grip": "prise mixte",
  "hook grip": "prise hook",
  "sumo": "sumo",
  "conventional": "conventionnel",
  "romanian": "roumain",
  "bulgarian": "bulgare",
  "goblet": "gobelet",
  "hack": "hack",
  "hack squat": "squat hack",
  "sissy": "sissy",
  "sissy squat": "squat sissy",
  "zercher squat": "squat zercher",
  "safety bar": "barre de sécurité",
  "safety squat": "squat barre de sécurité",
  "rear delt": "deltoïde postérieur",
  "rear delts": "deltoïdes postérieurs",
  "side lateral": "latéral",
  "bent over": "penché",
  "stiff leg": "jambes tendues",
  "stiff-leg": "jambes tendues",
  "walking": "marché",
  "curtsy": "révérence",
  "curtsy lunge": "fente révérence",
  "step back": "pas arrière",
  "step back lunge": "fente pas arrière",
  "step forward": "pas avant",
  "lateral lunge": "fente latérale",
  "side lunge": "fente latérale",
  "pulse": "pulsation",
  "isometric hold": "maintien isométrique",
  "wall": "mur",
  "against wall": "contre le mur",
  "with wall": "avec mur",
  "balance": "équilibre",
  "bosu": "bosu",
  "trx": "trx",
  "suspension": "suspension",
  "ring": "anneau",
  "rings": "anneaux",
  "gymnastic": "gymnique",
  "olympic": "olympique",
  "power": "puissance",
  "strength": "force",
  "hypertrophy": "hypertrophie",
  "cardio": "cardio",
  "plyometric": "plyométrique",
  "plyometrics": "plyométrie",
  "jump": "saut",
  "jumps": "sauts",
  "box": "box",
  "step": "marche",
  "platform": "plateforme",
  "incline bench": "banc incliné",
  "decline bench": "banc décliné",
  "adjustable": "réglable",
  "fixed": "fixe",
  "angled": "incliné",
  "low": "bas",
  "high": "haut",
  "middle": "milieu",
  "upper": "haut",
  "lower": "bas",
  "inner": "interne",
  "outer": "externe",
  "left": "gauche",
  "right": "droit",
  "arm": "bras",
  "arms": "bras",
  "leg": "jambe",
  "legs": "jambes",
  "hand": "main",
  "hands": "mains",
  "foot": "pied",
  "feet": "pieds",
  "head": "tête",
  "chest": "poitrine",
  "shoulder": "épaule",
  "shoulders": "épaules",
  "hip": "hanche",
  "hips": "hanches",
  "knee": "genou",
  "ankle": "cheville",
  "wrist": "poignet",
  "elbow": "coude",
  "neck": "cou",
  "spine": "colonne",
  "core": "gainage",
  "abs": "abdominaux",
  "glutes": "fessiers",
  "quads": "quadriceps",
  "hamstrings": "ischio-jambiers",
  "calves": "mollets",
  "biceps": "biceps",
  "triceps": "triceps",
  "forearms": "avant-bras",
  "lats": "dorsaux",
  "traps": "trapèzes",
  "rear": "arrière",
  "medial": "médial",
  "anterior": "antérieur",
  "posterior": "postérieur",
  "superior": "supérieur",
  "inferior": "inférieur",
  "external": "externe",
  "internal": "interne",
  "single": "simple",
  "one": "un",
  "two": "deux",
  "simultaneous": "simultané",
};

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(?:^|\s|[-'])\w/g, (c) => c.toUpperCase())
    .trim();
}

function translateToFrench(name) {
  const lower = name.toLowerCase().trim();
  // Exact phrase match
  if (WORD_MAP[lower]) return titleCase(WORD_MAP[lower]);
  // Word-by-word
  const words = lower.split(/\s+/);
  const translated = words.map((w) => WORD_MAP[w] || w);
  return titleCase(translated.join(" "));
}

const DELAY_MS = 4000; // 4s between requests to avoid 429

async function fetchUrl(url) {
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        const wait = Math.min(60000, attempt * 8000);
        console.log(`Rate limited (429), waiting ${wait / 1000}s before retry ${attempt}/5...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    } catch (e) {
      lastErr = e;
      if (attempt < 5) await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }
  throw lastErr;
}

async function fetchAllExerciseNames() {
  const names = new Set();

  // Paginate main endpoint to get full 1500 exercises (Vercel mirror supports this)
  console.log("Fetching exercises (paginated)...");
  let offset = 0;
  let page = 0;
  while (true) {
    page++;
    const data = await fetchUrl(
      `${EXERCISEDB_BASE}/api/v1/exercises?offset=${offset}&limit=${LIMIT}`
    );
    const list = data.data || [];
    list.forEach((ex) => {
      if (ex.name && typeof ex.name === "string") names.add(ex.name.trim());
    });
    if (page % 5 === 0 || list.length < LIMIT) {
      console.log(`  Page ${page}: ${names.size} names so far`);
    }
    if (list.length < LIMIT) break;
    offset += LIMIT;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, "en"));
}

function main() {
  console.log("Fetching all exercises from ExerciseDB...");
  return fetchAllExerciseNames()
    .then((names) => {
      console.log(`Found ${names.length} unique exercise names.`);

      const fr = JSON.parse(readFileSync(FR_PATH, "utf8"));
      const en = JSON.parse(readFileSync(EN_PATH, "utf8"));

      if (!fr.api) fr.api = {};
      if (!en.api) en.api = {};

      let added = 0;
      for (const name of names) {
        const key = name.toLowerCase().trim();
        if (!key) continue;
        if (fr.api[key] !== undefined) continue; // already present
        en.api[key] = titleCase(name);
        fr.api[key] = translateToFrench(name);
        added++;
      }

      console.log(`Added ${added} new entries to api.`);

      // Sort api keys for consistent diffs
      const sortObj = (o) => {
        const sorted = {};
        for (const k of Object.keys(o).sort((a, b) => a.localeCompare(b, "en"))) {
          sorted[k] = o[k];
        }
        return sorted;
      };
      fr.api = sortObj(fr.api);
      en.api = sortObj(en.api);

      writeFileSync(FR_PATH, JSON.stringify(fr, null, 2) + "\n", "utf8");
      writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + "\n", "utf8");

      console.log("Updated src/locales/fr.json and src/locales/en.json");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

main();
