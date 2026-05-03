import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// The script expects a serviceAccountKey.json in the project root
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
  console.error("❌ Error: Could not load serviceAccountKey.json.");
  console.error("Please ensure you have generated a service account key from the Firebase Console and saved it as 'serviceAccountKey.json' in the root folder.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixDescriptions() {
  console.log('Fetching products...');
  const snapshot = await db.collection('products').get();
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    let updated = false;
    let newDesc = data.description || '';
    
    // Fix Redmi Pad 2 Pro 5G specifically as noted in store.txt
    if (data.name?.includes('Redmi Pad 2 Pro')) {
      newDesc = "Experience lightning-fast performance and an immersive display with the Redmi Pad 2 Pro 5G. Designed for both intense gaming sessions and productive online learning, it features a 144Hz refresh rate, an ultra-fast Snapdragon processor, and all-day battery life. Whether you're taking notes, attending virtual classes, or dominating the leaderboard, this premium tablet is your perfect companion.";
      updated = true;
    } else if (newDesc.trim().endsWith('...')) {
      // Fix generic cut-off descriptions
      newDesc = newDesc.replace('...', '.') + " Engineered for top-tier performance, reliability, and an exceptional user experience.";
      updated = true;
    }

    if (updated) {
      batch.update(doc.ref, { description: newDesc });
      count++;
      console.log(`Prepared update for: ${data.name}`);
    }
  });

  if (count > 0) {
    console.log(`Committing ${count} updates to Firestore...`);
    await batch.commit();
    console.log(`✅ Successfully updated ${count} products.`);
  } else {
    console.log('No products needed updating.');
  }
}

fixDescriptions().catch(console.error);
