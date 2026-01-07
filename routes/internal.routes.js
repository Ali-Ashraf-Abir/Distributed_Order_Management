import express from "express";
import { emitJobUpdate, emitWorkerHeartbeat } from "../events/socket.js";

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

export default router;
