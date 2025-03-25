require("dotenv").config();
const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Sample products data
const products = [
  {
    name: "Laptop Gaming",
    price: 15999000,
    material: "Metal",
    date: new Date().toISOString(),
    image: "/img/Laptop.jpg",
    description: "Laptop gaming performa tinggi",
    stock: 10,
    category: "electronics",
  },
  {
    name: "PC Gaming",
    price: 55999000,
    material: "Metal",
    date: new Date().toISOString(),
    image: "/img/PC Gaming.jpg",
    description: "PC Gaming custom build",
    stock: 3,
    category: "electronics",
  },
  {
    name: "Headphone",
    price: 18000000,
    material: "Plastic",
    date: new Date().toISOString(),
    image: "/img/Handphone.jpg",
    description: "Headphone gaming premium",
    stock: 8,
    category: "electronics",
  },
];

async function initializeProducts() {
  try {
    // Delete existing products
    const snapshot = await db.collection("products").get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("Existing products deleted");

    // Add new products
    const newBatch = db.batch();
    products.forEach((product) => {
      const docRef = db.collection("products").doc();
      newBatch.set(docRef, product);
    });
    await newBatch.commit();

    console.log("Products initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing products:", error);
    process.exit(1);
  }
}

// Run initialization
initializeProducts();
