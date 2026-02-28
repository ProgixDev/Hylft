/**
 * Script to fetch all terms from ExerciseDB API
 * Run with: node scripts/fetch-exercise-terms.js
 */

const https = require('https');

const EXERCISEDB_BASE = 'oss.exercisedb.dev';

function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://${EXERCISEDB_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching terms from ExerciseDB API...\n');

  try {
    // Fetch body parts
    console.log('Fetching body parts...');
    const bodyPartsRes = await fetchJSON('/api/v1/bodyparts');
    const bodyParts = (bodyPartsRes.data || []).map(item => item.name);

    // Fetch equipments
    console.log('Fetching equipments...');
    const equipmentsRes = await fetchJSON('/api/v1/equipments');
    const equipments = (equipmentsRes.data || []).map(item => item.name);

    // Fetch sample exercises to get target muscles
    console.log('Fetching sample exercises...');
    let exercises = [];
    let offset = 0;
    const limit = 100;
    
    // Fetch multiple pages
    for (let i = 0; i < 5; i++) {
      try {
        const exercisesRes = await fetchJSON(`/api/v1/exercises?offset=${offset}&limit=${limit}`);
        const pageExercises = exercisesRes.data || [];
        if (pageExercises.length === 0) break;
        exercises = exercises.concat(pageExercises);
        offset += limit;
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
      } catch (e) {
        console.error(`Error fetching page ${i}:`, e.message);
        break;
      }
    }

    // Extract unique values
    const targetMuscles = new Set();
    const secondaryMuscles = new Set();
    const exerciseNames = new Set();

    exercises.forEach(ex => {
      exerciseNames.add(ex.name);
      (ex.targetMuscles || []).forEach(tm => targetMuscles.add(tm));
      (ex.secondaryMuscles || []).forEach(sm => secondaryMuscles.add(sm));
    });

    // Output results
    const output = {
      bodyParts: bodyParts.sort(),
      equipments: equipments.sort(),
      targetMuscles: Array.from(targetMuscles).sort(),
      secondaryMuscles: Array.from(secondaryMuscles).sort(),
      exerciseNames: Array.from(exerciseNames).sort(),
      totalExercises: exercises.length
    };

    const fs = require('fs');
    fs.writeFileSync('scripts/exercise-terms.json', JSON.stringify(output, null, 2));
    
    console.log('\n✅ Results:');
    console.log(`- Body parts: ${bodyParts.length}`);
    console.log(`- Equipments: ${equipments.length}`);
    console.log(`- Target muscles: ${targetMuscles.size}`);
    console.log(`- Secondary muscles: ${secondaryMuscles.size}`);
    console.log(`- Exercise names: ${exerciseNames.size}`);
    console.log(`- Total exercises sampled: ${exercises.length}`);
    console.log('\n✅ Saved to scripts/exercise-terms.json');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
