/**
 * Script to fetch all possible terms from ExerciseDB API
 * Run with: npx ts-node scripts/fetch-all-exercise-terms.ts
 */

const EXERCISEDB_BASE = "https://oss.exercisedb.dev";

interface ApiExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles?: string[];
}

async function fetchAllExercises(): Promise<ApiExercise[]> {
  const allExercises: ApiExercise[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${EXERCISEDB_BASE}/api/v1/exercises?offset=${offset}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`Error fetching exercises at offset ${offset}: ${response.status}`);
        break;
      }

      const result = await response.json();
      const exercises = result.data || [];
      
      if (exercises.length === 0) {
        hasMore = false;
        break;
      }

      allExercises.push(...exercises);
      offset += limit;

      console.log(`Fetched ${allExercises.length} exercises so far...`);

      // Safety limit
      if (offset > 2000) {
        console.log("Reached safety limit of 2000 exercises");
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error at offset ${offset}:`, error);
      break;
    }
  }

  return allExercises;
}

async function fetchBodyParts(): Promise<string[]> {
  try {
    const url = `${EXERCISEDB_BASE}/api/v1/bodyparts`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const result = await response.json();
    return (result.data || []).map((item: { name: string }) => item.name);
  } catch (error) {
    console.error("Error fetching body parts:", error);
    return [];
  }
}

async function fetchEquipments(): Promise<string[]> {
  try {
    const url = `${EXERCISEDB_BASE}/api/v1/equipments`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const result = await response.json();
    return (result.data || []).map((item: { name: string }) => item.name);
  } catch (error) {
    console.error("Error fetching equipments:", error);
    return [];
  }
}

async function main() {
  console.log("Fetching all terms from ExerciseDB API...\n");

  // Fetch all data
  const [exercises, bodyParts, equipments] = await Promise.all([
    fetchAllExercises(),
    fetchBodyParts(),
    fetchEquipments(),
  ]);

  // Extract unique values
  const uniqueBodyParts = new Set<string>();
  const uniqueEquipments = new Set<string>();
  const uniqueTargetMuscles = new Set<string>();
  const uniqueSecondaryMuscles = new Set<string>();
  const uniqueExerciseNames = new Set<string>();

  exercises.forEach((exercise) => {
    // Exercise names
    uniqueExerciseNames.add(exercise.name);

    // Body parts
    exercise.bodyParts?.forEach((bp) => uniqueBodyParts.add(bp));

    // Equipments
    exercise.equipments?.forEach((eq) => uniqueEquipments.add(eq));

    // Target muscles
    exercise.targetMuscles?.forEach((tm) => uniqueTargetMuscles.add(tm));

    // Secondary muscles
    exercise.secondaryMuscles?.forEach((sm) => uniqueSecondaryMuscles.add(sm));
  });

  // Also add from API endpoints
  bodyParts.forEach((bp) => uniqueBodyParts.add(bp));
  equipments.forEach((eq) => uniqueEquipments.add(eq));

  // Convert to sorted arrays
  const sortedBodyParts = Array.from(uniqueBodyParts).sort();
  const sortedEquipments = Array.from(uniqueEquipments).sort();
  const sortedTargetMuscles = Array.from(uniqueTargetMuscles).sort();
  const sortedSecondaryMuscles = Array.from(uniqueSecondaryMuscles).sort();
  const sortedExerciseNames = Array.from(uniqueExerciseNames).sort();

  // Output results
  console.log("\n=== RESULTS ===\n");
  console.log(`Total exercises: ${exercises.length}`);
  console.log(`Unique body parts: ${sortedBodyParts.length}`);
  console.log(`Unique equipments: ${sortedEquipments.length}`);
  console.log(`Unique target muscles: ${sortedTargetMuscles.length}`);
  console.log(`Unique secondary muscles: ${sortedSecondaryMuscles.length}`);
  console.log(`Unique exercise names: ${sortedExerciseNames.length}\n`);

  console.log("=== BODY PARTS ===");
  console.log(JSON.stringify(sortedBodyParts, null, 2));
  console.log("\n=== EQUIPMENTS ===");
  console.log(JSON.stringify(sortedEquipments, null, 2));
  console.log("\n=== TARGET MUSCLES ===");
  console.log(JSON.stringify(sortedTargetMuscles, null, 2));
  console.log("\n=== SECONDARY MUSCLES ===");
  console.log(JSON.stringify(sortedSecondaryMuscles, null, 2));
  console.log("\n=== EXERCISE NAMES (first 50) ===");
  console.log(JSON.stringify(sortedExerciseNames.slice(0, 50), null, 2));

  // Save to file
  const fs = require("fs");
  const output = {
    bodyParts: sortedBodyParts,
    equipments: sortedEquipments,
    targetMuscles: sortedTargetMuscles,
    secondaryMuscles: sortedSecondaryMuscles,
    exerciseNames: sortedExerciseNames,
    totalExercises: exercises.length,
  };

  fs.writeFileSync(
    "scripts/exercise-terms.json",
    JSON.stringify(output, null, 2)
  );
  console.log("\n✅ Saved all terms to scripts/exercise-terms.json");
}

main().catch(console.error);
