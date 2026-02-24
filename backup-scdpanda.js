
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// var serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://test-scd-panda-c601f-default-rtdb.asia-southeast1.firebasedatabase.app"
// });

// 🔥 ตรวจสอบว่ามี Secret หรือไม่
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT not found in environment variables");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 🔥 ใส่ URL Realtime Database ของคุณให้ถูกต้อง
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scd-panda-1bc5a-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// 🔥 path ที่ต้องการ backup
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
  "quotation",
  "report",
  "tickets",
  "transfermoney",
  "trip",
  "truck"
];

// 🔥 ฟังก์ชันสร้างวันที่ตามเวลาไทย
function getThaiDateString() {
  const now = new Date();
  const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return thaiTime.toISOString().split("T")[0];
}

async function backup() {
  try {
    const result = {};

    console.log("🚀 Starting backup...");

    // ดึงข้อมูลแต่ละ path
    for (const p of paths) {
      const snapshot = await db.ref(p).once("value");
      result[p] = snapshot.val() || {};
      console.log(`✅ Fetched: ${p}`);
    }

    const dateString = getThaiDateString();

    const dir = "backups";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, `backup-${dateString}.json`);

    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

    console.log("📦 Backup created:", filePath);

    // 🔥 ลบไฟล์เกิน 30 วัน (เฉพาะ .json)
    const files = fs.readdirSync(dir);
    const now = Date.now();

    files.forEach(file => {
      if (!file.endsWith(".json")) return;

      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

      if (ageDays > 30) {
        fs.unlinkSync(fullPath);
        console.log("🗑 Deleted old backup:", file);
      }
    });

    console.log("🎉 Backup completed successfully.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
}

backup();
