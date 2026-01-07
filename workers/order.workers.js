import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import client, { orders, payments, db } from "../db/db.js";
import { emitJobEvent, emitWorkerHeartbeat, onConfigUpdate } from "./event.client.js";

const connection = new IORedis({ maxRetriesPerRequest: null });
const workerId = `worker-${process.pid}`;
let shuttingDown = false;

// Configuration state (updated from server)
let workerConfig = {
  failureRate: 0.5,
  processingDelay: 0,
};

// Listen for config updates from server
onConfigUpdate((newConfig) => {
  workerConfig = { ...workerConfig, ...newConfig };
  console.log("📝 Config updated:", workerConfig);
});

const worker = new Worker(
  "orderQueue",
  async (job) => {
    if (shuttingDown) return;

    const { orderId } = job.data;
    const session = client.startSession();

    await emitJobEvent({
      id: orderId,
      status: "PROCESSING",
      attempts: job.attemptsMade,
      timestamp: new Date(),
    });

    try {
      if (workerConfig.processingDelay > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, workerConfig.processingDelay)
        );
      }

      await session.withTransaction(async () => {
        await payments.insertOne({ orderId }, { session });

        if (Math.random() < workerConfig.failureRate) {
          throw new Error("Payment failure (simulated)");
        }

        await orders.updateOne(
          { _id: orderId },
          { $set: { status: "PAID" } },
          { session }
        );
      });

      await emitJobEvent({
        id: orderId,
        status: "PAID",
        attempts: job.attemptsMade,
        timestamp: new Date(),
      });

    } catch (err) {
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
        
        await orders.updateOne(
          { _id: orderId },
          { $set: { status: "FAILED" } }
        );
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