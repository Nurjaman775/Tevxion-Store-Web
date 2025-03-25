require("dotenv").config(); // Ubah ini untuk membaca .env dari folder yang sama
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Tambahkan validasi env di awal
const requiredEnvVars = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_PROJECT_ID",
  "JWT_SECRET",
  "COOKIE_SECRET",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(
      `Error: Environment variable ${varName} is required but not set`
    );
    process.exit(1);
  }
});

console.log("Mencoba membaca konfigurasi Firebase...");
console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

// Dapatkan konfigurasi Firebase dengan aman
const getFirebaseConfig = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (!privateKey) {
    console.error(
      "Kunci pribadi Firebase tidak ditemukan! Periksa file .env Anda."
    );
    process.exit(1);
  }

  return {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
};

// Ubah inisialisasi Firebase
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Log untuk debugging
  console.log("Konfigurasi Firebase yang terbaca:");
  console.log("Project ID:", serviceAccount.project_id);
  console.log("Client Email:", serviceAccount.client_email);
  console.log("Private Key exists:", Boolean(serviceAccount.private_key));

  if (
    !serviceAccount.project_id ||
    !serviceAccount.private_key ||
    !serviceAccount.client_email
  ) {
    throw new Error("Konfigurasi Firebase tidak lengkap!");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin berhasil diinisialisasi");
} catch (error) {
  console.error("Kesalahan inisialisasi Firebase:", error.message);
  process.exit(1);
}

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true,
  })
);
app.use(express.json());

// Gunakan helmet untuk keamanan HTTP headers
const helmet = require("helmet");
app.use(helmet());

// Batasi rate requests
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // limit setiap IP ke 100 requests per windowMs
});
app.use(limiter);

// Serve static files dengan path yang benar
app.use("/", express.static(path.join(__dirname, "../")));
app.use("/img", express.static(path.join(__dirname, "../web/img"))); // Perbaikan path gambar
app.use(
  "/toko-belanja",
  express.static(path.join(__dirname, "../toko-belanja"))
);

// Update static file serving
app.use(express.static(path.join(__dirname, "../")));
app.use("/web/img", express.static(path.join(__dirname, "../web/img")));

// Add specific route for images
app.get("/web/img/:imageName", (req, res) => {
  const imagePath = path.join(__dirname, "../web/img", req.params.imageName);
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error(
        `Kesalahan saat mengirim gambar ${req.params.imageName}:`,
        err
      );
      res.status(404).send("Gambar tidak ditemukan");
    }
  });
});

// Add route to handle image requests
app.get("/img/:imageName", (req, res) => {
  const imagePath = path.join(__dirname, "../web/img", req.params.imageName);
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error(
        `Kesalahan saat mengirim gambar ${req.params.imageName}:`,
        err
      );
      res.status(404).send("Gambar tidak ditemukan");
    }
  });
});

// Homepage route
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Tevxion Store API</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 40px auto; 
            padding: 0 20px;
            line-height: 1.6;
          }
          code { 
            background: #f4f4f4; 
            padding: 2px 6px; 
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>Selamat Datang di API Tevxion Store</h1>
        <p>Daftar endpoint yang tersedia:</p>
        <ul>
          <li><code>GET /api/products</code> - Mendapatkan daftar semua produk</li>
          <li><code>POST /api/orders</code> - Membuat pesanan baru (perlu login)</li>
          <li><code>GET /api/transactions</code> - Melihat riwayat transaksi</li>
        </ul>
        <p>Silakan hubungi admin untuk informasi lebih lanjut.</p>
      </body>
    </html>
  `);
});

// Middleware autentikasi
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) throw new Error("Token tidak tersedia");

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Tidak memiliki akses" });
  }
};

// Add middleware to verify Google token
const verifyGoogleToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) throw new Error("Token tidak tersedia");

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token tidak valid" });
  }
};

// Routes
app.get("/api/products", async (req, res) => {
  try {
    const productsRef = admin.firestore().collection("products");
    const snapshot = await productsRef.get();

    const products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk menambah produk
app.post("/api/products", async (req, res) => {
  try {
    const product = {
      name: req.body.name,
      price: Number(req.body.price),
      material: req.body.material,
      date: new Date().toISOString(),
      image: req.body.image,
      description: req.body.description,
      stock: Number(req.body.stock),
      category: req.body.category,
    };

    const productRef = await admin
      .firestore()
      .collection("products")
      .add(product);
    res.status(201).json({ id: productRef.id, ...product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk update stock produk
app.post("/api/products/stock", async (req, res) => {
  const db = admin.firestore();
  const batch = db.batch();

  try {
    const { items } = req.body;

    // Validasi input
    if (!items || !Array.isArray(items)) {
      throw new Error("Data items tidak valid");
    }

    // Dapatkan semua produk dalam satu query
    const productRefs = items.map((item) =>
      db.collection("products").doc(item.id)
    );
    const productDocs = await db.getAll(...productRefs);

    // Validasi stok dan persiapkan update
    for (let i = 0; i < items.length; i++) {
      const doc = productDocs[i];
      const item = items[i];

      if (!doc.exists) {
        throw new Error(`Produk ${item.id} tidak ditemukan`);
      }

      const currentStock = doc.data().stock;
      const newStock = currentStock - item.quantity;

      if (newStock < 0) {
        throw new Error(
          `Stok tidak mencukupi untuk ${
            doc.data().name
          }. Tersedia: ${currentStock}`
        );
      }

      batch.update(productRefs[i], { stock: newStock });
    }

    // Eksekusi batch update
    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Stok berhasil diperbarui",
    });
  } catch (error) {
    console.error("Kesalahan saat memperbarui stok:", error);
    // Rollback tidak diperlukan karena batch.commit() bersifat atomic
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Protected route example
app.post("/api/orders", authenticateUser, async (req, res) => {
  try {
    const { items, total } = req.body;
    const order = {
      userId: req.user.uid,
      items,
      total,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const orderRef = await admin.firestore().collection("orders").add(order);
    res.status(201).json({ orderId: orderRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected route with Google authentication
app.post("/api/auth/google", verifyGoogleToken, async (req, res) => {
  try {
    const { sub, email, name } = req.user;

    // Create or update user in Firestore
    const userRef = admin.firestore().collection("users").doc(sub);
    await userRef.set(
      {
        email,
        displayName: name,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ userId: sub });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transactions endpoint to handle Firebase
app.post("/api/transactions", async (req, res) => {
  try {
    const { items, total, customerInfo } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Data items tidak valid");
    }

    // Get Firestore reference
    const db = admin.firestore();

    // Create transaction document
    const transaction = {
      items,
      total,
      customerInfo,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed",
    };

    // Add transaction to Firestore
    const transactionRef = await db.collection("transactions").add(transaction);

    // Update product stock in batch
    const batch = db.batch();

    for (const item of items) {
      const productRef = db.collection("products").doc(item.id);
      batch.update(productRef, {
        stock: admin.firestore.FieldValue.increment(-item.quantity),
      });
    }

    await batch.commit();

    res.status(201).json({
      success: true,
      transactionId: transactionRef.id,
      transaction,
    });
  } catch (error) {
    console.error("Kesalahan transaksi:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Add endpoint to fetch transaction history
app.get("/api/transactions", async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db
      .collection("transactions")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const transactions = [];
    snapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk membuat transaksi baru
app.post("/api/transactions/create", async (req, res) => {
  try {
    const { items, total, customerInfo } = req.body;

    // Validasi input
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Data items tidak valid");
    }

    const db = admin.firestore();
    const batch = db.batch();

    // Buat dokumen transaksi
    const transaction = {
      items,
      total,
      customerInfo,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed",
    };

    // Simpan transaksi
    const transactionRef = await db.collection("transactions").add(transaction);

    // Update stok produk
    for (const item of items) {
      const productRef = db.collection("products").doc(item.id);
      batch.update(productRef, {
        stock: admin.firestore.FieldValue.increment(-item.quantity),
      });
    }

    // Eksekusi batch update
    await batch.commit();

    res.status(201).json({
      success: true,
      transactionId: transactionRef.id,
      transaction,
    });
  } catch (error) {
    console.error("Kesalahan transaksi:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Tidak ditemukan" });
});

// Replace all port handling code with this simplified version
const PORT = process.env.PORT || 3000;
app
  .listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} sudah digunakan. Mencoba port lain...`);
      app.listen(0, () => {
        console.log(
          `Server berjalan di http://localhost:${app.address().port}`
        );
      });
    } else {
      console.error("Error starting server:", err);
      process.exit(1);
    }
  });

// Basic Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Server sedang berjalan" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Terjadi kesalahan:", err.stack);
  res.status(500).json({
    error: "Terjadi kesalahan pada server, silakan coba lagi nanti.",
  });
});
