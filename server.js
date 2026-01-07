// server.js
import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./db/db.js";
import { Server } from "socket.io";
import { ensureIndexes } from "./db/index.js";

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});

// Store current config in memory
export let currentConfig = {
  failureRate: 0.5,
  processingDelay: 0,
};

// Socket lifecycle
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Handle config updates from frontend
  socket.on("config:update", (newConfig) => {
    currentConfig = { ...currentConfig, ...newConfig };
    console.log("📝 Config updated from frontend:", currentConfig);
    
    // Broadcast to all connected clients
    io.emit("config:updated", currentConfig);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  await ensureIndexes();
  server.listen(PORT, () => {
    console.log(`🚀 API + Socket running on port ${PORT}`);
  });
}

start();