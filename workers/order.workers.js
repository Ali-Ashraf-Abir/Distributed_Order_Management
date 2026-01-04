import { Worker } from "bullmq";
import IORedis from "ioredis";
import db from "../db/db.js";

const connection = new IORedis({
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "orderQueue",
  async (job) => {
    const { orderId } = job.data;

    console.log(`checking idempotency for order: ${orderId}`);

    // 1️⃣ Idempotency check
    const alreadyPaid = db
      .prepare(`SELECT 1 FROM payments WHERE order_id = ?`)
      .get(orderId);

    if (alreadyPaid) {
      console.log(`⚠️ Order ${orderId} already processed — skipping`);
      return;
    }

    // 2️⃣ Simulate payment failure
    if (Math.random() < 0.5) {
      throw new Error(" Payment service temporarily unavailable");
    }

    // 3️⃣ Transaction (IMPORTANT)
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO payments (order_id)
        VALUES (?)
      `).run(orderId);

      db.prepare(`
        UPDATE orders
        SET status = 'PAID'
        WHERE id = ?
      `).run(orderId);
    });

    tx();

    console.log(`✅ Order ${orderId} marked as PAID`);
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.log(
    `Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`
  );
});

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});
