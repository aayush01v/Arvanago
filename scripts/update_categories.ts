import { db } from '../api/utils/firebaseAdmin.js';

const categoryMap: Record<string, string> = {
  'Laptops': 'Student Laptops',
  'Tablets': 'Study Tablets',
  'Smartphones': 'Gaming Phones',
  'Accessories': 'Accessories',
  'Headphones': 'Accessories',
  'Monitors': 'Study Tablets',
};

async function run() {
  console.log('Fetching products...');
  const snapshot = await db.collection('products').get();
  let count = 0;

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.category && categoryMap[data.category]) {
      batch.update(doc.ref, { category: categoryMap[data.category] });
      count++;
    }
  });

  if (count > 0) {
    console.log(`Updating ${count} products...`);
    await batch.commit();
    console.log('Successfully updated categories!');
  } else {
    console.log('No products needed category updates.');
  }
}

run().catch(console.error);
