import { io } from "../server.js";

export function emitJobUpdate(payload) {
  io.emit("job:update", payload);
}

export function emitWorkerHeartbeat(payload) {
  io.emit("worker:heartbeat", payload);
}

export function emitConfigUpdate(callback) {
  socket.on("config:update", callback);
}