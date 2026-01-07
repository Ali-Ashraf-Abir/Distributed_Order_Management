import express from "express";
import { emitJobUpdate, emitWorkerHeartbeat } from "../events/socket.js";
import { currentConfig } from "../server.js";
import { db } from "../db/db.js";

const router = express.Router();

// Job lifecycle events
router.post("/job-event", (req, res) => {
  emitJobUpdate(req.body);
  res.sendStatus(200);
});

// Worker heartbeat
router.post("/worker-heartbeat", (req, res) => {
  emitWorkerHeartbeat(req.body);
  res.sendStatus(200);
});

// Workers poll this to get current config
router.get("/config", (req, res) => {
  res.json(currentConfig);
});

// Delete all worker heartbeats
router.delete("/workers", async (req, res) => {
  const result = await db.collection("worker_heartbeats").deleteMany({});
  res.json({
    deletedWorkers: result.deletedCount,
  });
});

export default router;