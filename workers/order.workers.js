import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import client, { orders, payments, db } from "../db/db.js";
import { emitJobEvent, emitWorkerHeartbeat } from "./event.client.js";

const connection = new IORedis({ maxRetriesPerRequest: null });
const workerId = `worker-${process.pid}`;
let shuttingDown = false;

const worker = new Worker(
  "orderQueue",
  async (job) => {
    if (shuttingDown) return;

    const { orderId } = job.data;
    const session = client.startSession();

    // 🔔 PROCESSING event
    await emitJobEvent({
      id: orderId,
      status: "PROCESSING",
      attempts: job.attemptsMade,
      timestamp: new Date(),
    });

    try {
      await session.withTransaction(async () => {
        // Idempotency (DB-enforced)
        await payments.insertOne({ orderId }, { session });

        // Simulated failure
        if (Math.random() < 0.5) {
          throw new Error("Payment failure");
        }

        await orders.updateOne(
          { _id: orderId },
          { $set: { status: "PAID" } },
          { session }
        );
      });

      // ✅ SUCCESS event (AFTER commit)
      await emitJobEvent({
        id: orderId,
        status: "PAID",
        attempts: job.attemptsMade,
        timestamp: new Date(),
      });

    } catch (err) {
      // 🔑 Idempotency duplicate (safe skip)
      if (err.code === 11000) {
        console.log(`⚠️ Order ${orderId} already processed`);
        return;
      }

      const willRetry = job.attemptsMade + 1 < job.opts.attempts;

      if (willRetry) {

        await emitJobEvent({
          id: orderId,
          status: "RETRYING",
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          error: err.message,
          timestamp: new Date(),
        });
      } else {
        await emitJobEvent({
          id: orderId,
          status: "FAILED",
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          error: err.message,
          timestamp: new Date(),
        });
      }

      throw err;

    } finally {
      await session.endSession();
    }
  },
  { connection }
);

const heartbeat = setInterval(async () => {
  await db.collection("worker_heartbeats").updateOne(
    { workerId },
    { $set: { lastSeenAt: new Date() } },
    { upsert: true }
  );
  emitWorkerHeartbeat({
    workerId,
    lastSeenAt: new Date(),
  });

}, 5000);

// 🛑 Graceful shutdown
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("🛑 Shutting down worker...");
  clearInterval(heartbeat);
  await worker.pause(true);
  await worker.close();
  await client.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
