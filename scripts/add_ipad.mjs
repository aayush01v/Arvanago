import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const keyPath = path.resolve(__dirname, "serviceKey.json");
    const serviceAccount = require(keyPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();

    const product = {
      name: "iPad 10th Gen & Apple Pencil (USB-C) Combo",
      description: "The ultimate student companion. Includes the iPad 10th Generation (64GB, Wi-Fi) and the Apple Pencil (USB-C). Perfect for note-taking, drawing, and studying. Limited Time Summer Sale.",
      price: 42800,
      originalPrice: 48800,
      stock: 50,
      isPublished: true,
      category: "Tablets",
      type: "physical",
      images: ["https://i.imgur.com/Q3YiHXt.jpeg"], // Reusing the banner image for now
      ratingAvg: 4.9,
      reviewCount: 342,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      features: [
        "A14 Bionic chip for ultimate performance",
        "10.9-inch Liquid Retina display",
        "Includes Apple Pencil (USB-C)",
        "Perfect for EduSimulate courses and note-taking"
      ]
    };

    const productId = "ipad_10th_gen_combo";
    await db.collection("products").doc(productId).set(product);
    
    console.log("Successfully added iPad Combo product!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding product:", error);
    process.exit(1);
  }
}

main();
