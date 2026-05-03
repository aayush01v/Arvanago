import { db } from '../api/utils/firebaseAdmin.js';

const productFixes = [
  {
    keyword: 'Redmi Pad',
    data: {
      name: 'Redmi Pad Pro 5G',
      description: "Experience the ultimate study and entertainment companion with the Redmi Pad Pro 5G. Featuring a massive 12.1-inch 2.5K display with a 120Hz refresh rate, this tablet brings your online classes, PDFs, and video lectures to life with stunning clarity and zero lag. \n\nPowered by the Snapdragon 7s Gen 4 processor and backed by a massive 10,000mAh battery, you can leave the charger at home and power through all-day study sessions. The eye-care certified display reduces blue light, ensuring your vision stays protected during those late-night revisions.",
      features: [
        '12.1-inch 2.5K (2560x1600) display at 120Hz',
        'Snapdragon 7s Gen 4 Octa-Core Processor',
        'Massive 10,000mAh Battery with 33W Fast Charging',
        'Dolby Atmos Quad Speakers',
        'TÜV Rheinland Eye Comfort Certification'
      ],
      specs: [
        { name: 'Display', value: '12.1" IPS LCD, 2.5K Resolution, 120Hz' },
        { name: 'Processor', value: 'Qualcomm Snapdragon 7s Gen 4' },
        { name: 'RAM', value: '8GB LPDDR4X' },
        { name: 'Storage', value: '256GB UFS 2.2 (Expandable)' },
        { name: 'Battery', value: '10,000mAh with 33W Charging' },
        { name: 'Cameras', value: '8MP Rear / 8MP Front' },
        { name: 'OS', value: 'Xiaomi HyperOS 2.0 (Android 15)' }
      ]
    }
  },
  {
    keyword: 'JBL',
    data: {
      name: 'JBL Live 660NC Wireless Over-Ear Headphones',
      description: "Block out the distractions of the dorm or library with the JBL Live 660NC. Featuring Adaptive Noise Cancelling (ANC), these over-ear headphones ensure you stay completely focused on your work or online classes. \n\nEquipped with massive 40mm drivers, you'll experience the signature JBL bass when it's time to take a break. With up to 50 hours of battery life and quick charging (4 hours of playtime from just a 10-minute charge), they are always ready when you are. The built-in mics provide crystal clear voice quality for all your Zoom classes and team meetings.",
      features: [
        'Adaptive Noise Cancelling (ANC) with Ambient Aware',
        'Up to 50 hours of battery life (40 hours with ANC)',
        '40mm dynamic drivers for JBL Signature Sound',
        'Multipoint connection to switch between devices easily',
        'Auto Play/Pause when you take them off'
      ],
      specs: [
        { name: 'Type', value: 'Over-Ear Wireless' },
        { name: 'Noise Cancelling', value: 'Adaptive Noise Cancelling (ANC)' },
        { name: 'Battery Life', value: 'Up to 50 Hours (BT on / ANC off)' },
        { name: 'Charging', value: 'Fast Charge (10 mins = 4 hours)' },
        { name: 'Drivers', value: '40mm Dynamic' },
        { name: 'Bluetooth', value: 'Version 5.0 with Multipoint' },
        { name: 'Weight', value: '268g' }
      ]
    }
  },
  {
    keyword: 'iQOO',
    data: {
      name: 'iQOO 12 5G (Legend Edition)',
      description: "Meet the ultimate performance beast. The iQOO 12 is powered by the latest Snapdragon 8 Gen 3 chipset and a dedicated Q1 gaming chip, making it the perfect smartphone for power users and mobile gamers who demand zero compromises. \n\nThe stunning 6.78-inch 144Hz LTPO AMOLED display delivers incredibly fluid visuals, whether you're taking notes, multitasking, or dominating in BGMI. With 120W FlashCharge, the 5,000mAh battery goes from zero to full in just minutes, ensuring you're never tethered to a wall outlet for long. Capture your best moments with the flagship 50MP triple-camera setup featuring a 3x optical periscope lens.",
      features: [
        'Snapdragon 8 Gen 3 (4nm) + Supercomputing Chip Q1',
        '6.78" 1.5K LTPO AMOLED with 144Hz Refresh Rate',
        '120W FlashCharge (0-100% in ~26 mins)',
        '50MP Main (OIS) + 50MP Ultrawide + 64MP Periscope Telephoto',
        'Massive 6010mm² Vapor Cooling Chamber'
      ],
      specs: [
        { name: 'Processor', value: 'Snapdragon 8 Gen 3 (4nm)' },
        { name: 'RAM', value: '12GB / 16GB LPDDR5X' },
        { name: 'Storage', value: '256GB / 512GB UFS 4.0' },
        { name: 'Display', value: '6.78" LTPO AMOLED, 1.5K, 144Hz, 3000 nits' },
        { name: 'Battery', value: '5,000mAh with 120W Fast Charging' },
        { name: 'Cooling', value: '6010mm² Vapor Chamber' },
        { name: 'OS', value: 'Funtouch OS 14 (Android 14)' }
      ]
    }
  }
];

async function run() {
  console.log('Fetching products to apply fixes...');
  const snapshot = await db.collection('products').get();
  let updatedCount = 0;

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const product = doc.data();
    
    for (const fix of productFixes) {
      // Simple case-insensitive matching
      if (product.name?.toLowerCase().includes(fix.keyword.toLowerCase())) {
        console.log(`Matched "${fix.keyword}" with product ID: ${doc.id} (${product.name})`);
        
        // Update the document with our real, high-quality data
        batch.update(doc.ref, {
          name: fix.data.name,
          description: fix.data.description,
          features: fix.data.features,
          specs: fix.data.specs
        });
        
        updatedCount++;
        break; // Move to the next document
      }
    }
  });

  if (updatedCount > 0) {
    console.log(`Committing updates for ${updatedCount} products...`);
    await batch.commit();
    console.log('Successfully updated product data!');
  } else {
    console.log('No matching products found to fix.');
  }
}

run().catch(console.error);
