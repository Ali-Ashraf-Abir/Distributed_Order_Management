import { io } from "../server.js";

export function emitJobUpdate(payload) {
  io.emit("job:update", payload);
}

export function emitWorkerHeartbeat(payload) {
  io.emit("worker:heartbeat", payload);
}
