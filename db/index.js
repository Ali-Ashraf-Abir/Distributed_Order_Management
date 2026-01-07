import { orders } from "./db.js";

export async function ensureIndexes() {
  // TTL index: auto-delete orders after 24 hours
  await orders.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 } // 24 hours
  );

  console.log("✅ MongoDB indexes ensured");
}
