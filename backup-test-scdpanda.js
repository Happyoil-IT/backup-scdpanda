const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-scd-panda-c601f-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();

const paths = [
  "banks",
  "company",
  "companypayment",
  "customers",
  "deductibleincome",
  "depot",
  "employee",
  "expenseitems",
  "inspection",
  "invoice",
  "order",
  "positions",
  "products",
  "quotation"
];

async function backup() {
  const result = {};

  for (const p of paths) {
    const snapshot = await db.ref(p).once("value");
    result[p] = snapshot.val() || {};
  }

  const today = new Date();
  const dateString = today.toISOString().split("T")[0];

  const dir = "backups";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const filePath = path.join(dir, `backup-${dateString}.json`);

  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

  console.log("✅ Backup created:", filePath);

  // 🔥 ลบไฟล์เกิน 30 วัน
  const files = fs.readdirSync(dir);
  const now = Date.now();

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

    if (ageDays > 30) {
      fs.unlinkSync(fullPath);
      console.log("🗑 Deleted old backup:", file);
    }
  });
}

backup();
